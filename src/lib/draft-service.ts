import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

import { buildSystemPrompt } from "@/lib/candidate-profile";
import { LLM_TIMEOUT_MS } from "@/lib/constants";
import { env } from "@/lib/env";
import type { ApiResult, DraftApiRequest, DraftPayload } from "@/lib/types";
import { ApiErrorCode } from "@/lib/types";

const openai = createOpenAI({ apiKey: env.openAiApiKey });

const draftSchema = z.object({
  to: z.email("recipient email (to)"),
  subject: z.string().min(1),
  body: z.string().min(1),
  attachments: z
    .array(
      z.object({
        filename: z.string().min(1),
        url: z.url(),
      }),
    )
    .min(1),
});

const DRAFT_MODEL_ID = "gpt-4o-mini";
const ABORT_HINT = "abort";
const NO_OBJECT_GENERATED = "NoObjectGenerated";
const ZOD_ISSUE_PATH_SEPARATOR = ".";

function errorResult(
  code: ApiErrorCode,
  message: string,
): ApiResult<DraftPayload> {
  return { ok: false, error: { code, message } };
}

type ZodIssue = { path: Array<string | number> };
type ZodErrorLike = { issues: ZodIssue[] };

function schemaViolationMessage(cause: unknown): string {
  const zodError = (cause as { cause?: unknown })?.cause as
    | ZodErrorLike
    | undefined;
  const issues = zodError?.issues ?? (cause as ZodErrorLike)?.issues ?? [];
  const firstIssue = issues[0];
  if (!firstIssue) {
    return "The generated draft did not match the expected shape.";
  }

  const fieldPath = firstIssue.path.join(ZOD_ISSUE_PATH_SEPARATOR);
  return `The generated draft is invalid at field '${fieldPath}'.`;
}

export async function generateDraft(
  request: DraftApiRequest,
): Promise<ApiResult<DraftPayload>> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), LLM_TIMEOUT_MS);

  try {
    const { object } = await generateObject({
      model: openai(DRAFT_MODEL_ID),
      schema: draftSchema,
      system: buildSystemPrompt(),
      prompt: request.rawPost,
      abortSignal: abortController.signal,
    });

    // Defense in depth: never trust the provider output blindly.
    const validated = draftSchema.safeParse(object);
    if (!validated.success) {
      return errorResult(
        ApiErrorCode.Unprocessable,
        schemaViolationMessage(validated.error),
      );
    }

    return { ok: true, data: validated.data };
  } catch (cause) {
    const errorName =
      cause instanceof Error ? cause.name : (String(cause) as string);
    const message = cause instanceof Error ? cause.message : String(cause);

    if (message.toLowerCase().includes(ABORT_HINT)) {
      return errorResult(
        ApiErrorCode.Timeout,
        "The LLM took too long to respond.",
      );
    }

    if (errorName.includes(NO_OBJECT_GENERATED)) {
      return errorResult(
        ApiErrorCode.Unprocessable,
        schemaViolationMessage(cause),
      );
    }

    return errorResult(
      ApiErrorCode.Internal,
      `Unexpected failure while generating the draft: ${message}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
