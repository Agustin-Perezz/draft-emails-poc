import {
  consumeApprovalToken,
  verifyApprovalToken,
} from "@/lib/approval-token";
import { sendEmail } from "@/lib/email-service";
import type { DraftPayload, SendApiRequest } from "@/lib/types";
import { ApiErrorCode } from "@/lib/types";

const HTTP_OK = 200;

function errorResponse(code: ApiErrorCode, message: string): Response {
  return Response.json({ error: { code, message } }, { status: code });
}

function parseSendRequest(body: unknown): { draft: DraftPayload } | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const { draft } = body as Partial<SendApiRequest>;
  const isDraftShapeValid =
    typeof draft === "object" &&
    draft !== null &&
    typeof (draft as DraftPayload).to === "string" &&
    typeof (draft as DraftPayload).subject === "string" &&
    typeof (draft as DraftPayload).body === "string" &&
    Array.isArray((draft as DraftPayload).attachments);

  if (!isDraftShapeValid) {
    return null;
  }

  return { draft };
}

export async function POST(request: Request): Promise<Response> {
  let draft: DraftPayload | null = null;
  let approvalToken: unknown;
  try {
    const body: unknown = await request.json();
    const parsed = parseSendRequest(body);
    if (parsed !== null) {
      draft = parsed.draft;
      approvalToken = (body as { approvalToken?: unknown }).approvalToken;
    }
  } catch {
    draft = null;
  }

  if (draft === null) {
    return errorResponse(
      ApiErrorCode.BadRequest,
      "Request must include a 'draft' object.",
    );
  }

  // A missing token is a forbidden send attempt, not a malformed request:
  // drafts only reach this route after /api/draft minted a token.
  if (typeof approvalToken !== "string" || approvalToken.length === 0) {
    return errorResponse(
      ApiErrorCode.Forbidden,
      "Missing approval token: no send can occur without prior draft approval.",
    );
  }

  const verification = verifyApprovalToken(approvalToken);
  if (!verification.ok) {
    return errorResponse(verification.error.code, verification.error.message);
  }

  // Single-use: consume BEFORE dispatch so a failure cannot be replayed.
  consumeApprovalToken(approvalToken);

  const result = await sendEmail(draft);

  if (!result.ok) {
    return errorResponse(result.error.code, result.error.message);
  }

  return Response.json(
    { messageId: result.data.messageId },
    { status: HTTP_OK },
  );
}
