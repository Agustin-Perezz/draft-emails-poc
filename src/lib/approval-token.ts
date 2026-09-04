import { createHmac, timingSafeEqual } from "node:crypto";

import { APPROVAL_TOKEN_TTL_MS } from "@/lib/constants";
import { env } from "@/lib/env";
import {
  type ApiError,
  ApiErrorCode,
  type ApiResult,
  type TokenPayload,
} from "@/lib/types";

const TOKEN_ALGORITHM = "sha256";
const TOKEN_SECRET = env.approvalTokenSecret;

const consumedTokens = new Set<string>();

type TokenParts = [draftId: string, expiryMs: number, signature: Buffer];

function forbidden(message: string): { ok: false; error: ApiError } {
  return { ok: false, error: { code: ApiErrorCode.Forbidden, message } };
}

function signDraftId(draftId: string, expiryMs: number): Buffer {
  return createHmac(TOKEN_ALGORITHM, TOKEN_SECRET)
    .update(`${draftId}.${expiryMs}`)
    .digest();
}

function parseToken(token: string): TokenParts | null {
  const [draftId, expiryPart, signaturePart] = token.split(".");
  const expiryMs = Number.parseInt(expiryPart ?? "", 10);
  const signature = Buffer.from(signaturePart ?? "", "base64url");
  if (!draftId || Number.isNaN(expiryMs)) {
    return null;
  }

  return [draftId, expiryMs, signature];
}

export function createApprovalToken(draftId: string): string {
  const expiryMs = Date.now() + APPROVAL_TOKEN_TTL_MS;
  const signature = signDraftId(draftId, expiryMs);

  return `${draftId}.${expiryMs}.${signature.toString("base64url")}`;
}

export function verifyApprovalToken(token: string): ApiResult<TokenPayload> {
  if (consumedTokens.has(token)) {
    return forbidden("Approval token has already been used.");
  }

  const parts = parseToken(token);
  if (parts === null) {
    return forbidden("Approval token is malformed.");
  }

  const [draftId, expiryMs, signature] = parts;
  const expectedSignature = signDraftId(draftId, expiryMs);
  const lengthsDiffer = signature.length !== expectedSignature.length;
  if (lengthsDiffer || !timingSafeEqual(signature, expectedSignature)) {
    return forbidden("Approval token signature is invalid.");
  }

  if (Date.now() > expiryMs) {
    return forbidden("Approval token has expired.");
  }

  return { ok: true, data: { draftId } };
}

export function consumeApprovalToken(token: string): void {
  consumedTokens.add(token);
}
