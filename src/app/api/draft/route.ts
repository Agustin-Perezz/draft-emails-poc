import { createApprovalToken } from "@/lib/approval-token";
import { generateDraft } from "@/lib/draft-service";
import { env } from "@/lib/env";
import type { DraftApiResponse } from "@/lib/types";
import { ApiErrorCode } from "@/lib/types";

const HTTP_OK = 200;

function errorResponse(code: ApiErrorCode, message: string): Response {
  return Response.json({ error: { code, message } }, { status: code });
}

export async function POST(request: Request): Promise<Response> {
  let rawPost: unknown;
  try {
    const body: unknown = await request.json();
    rawPost = (body as { rawPost?: unknown }).rawPost;
  } catch {
    return errorResponse(
      ApiErrorCode.BadRequest,
      "Request body must be valid JSON.",
    );
  }

  if (typeof rawPost !== "string" || rawPost.trim().length === 0) {
    return errorResponse(
      ApiErrorCode.BadRequest,
      "Field 'rawPost' is required and must be a non-empty string.",
    );
  }

  // env is read to enforce fail-loud behavior even on this route's cold start.
  void env;

  const result = await generateDraft({ rawPost });

  if (!result.ok) {
    return errorResponse(result.error.code, result.error.message);
  }

  const draftId = crypto.randomUUID();
  const approvalToken = createApprovalToken(draftId);
  const payload: DraftApiResponse = { draft: result.data, approvalToken };

  return Response.json(payload, { status: HTTP_OK });
}
