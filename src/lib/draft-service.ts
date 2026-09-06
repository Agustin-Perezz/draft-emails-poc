import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output } from "ai";
import { z } from "zod";

import { buildSystemPrompt } from "@/lib/candidate-profile";
import { CV_FILENAME, CV_PUBLIC_PATH, LLM_TIMEOUT_MS } from "@/lib/constants";
import { env } from "@/lib/env";
import type { ApiResult, DraftApiRequest, DraftPayload } from "@/lib/types";
import { ApiErrorCode } from "@/lib/types";

const openai = createOpenAI({ apiKey: env.openAiApiKey });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const draftSchema = z.object({
  to: z.string().min(1).regex(EMAIL_REGEX, "recipient email (to)"),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const DRAFT_MODEL_ID = "gpt-4o-mini";
const ABORT_HINT = "abort";
const NO_OUTPUT_GENERATED = "NoOutputGenerated";
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
    const { output: object } = await generateText({
      model: openai(DRAFT_MODEL_ID),
      output: Output.object({ schema: draftSchema }),
      system: buildSystemPrompt(),
      prompt: request.rawPost,
      abortSignal: abortController.signal,
    });

    const validated = draftSchema.safeParse(object);
    if (!validated.success) {
      return errorResult(
        ApiErrorCode.Unprocessable,
        schemaViolationMessage(validated.error),
      );
    }

    const draft: DraftPayload = {
      ...validated.data,
      attachments: [
        { filename: CV_FILENAME, url: `${env.appUrl}${CV_PUBLIC_PATH}` },
      ],
    };

    return { ok: true, data: draft };
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

    if (errorName.includes(NO_OUTPUT_GENERATED)) {
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
