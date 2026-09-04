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
const TOKEN_PARTS_COUNT = 3;
const TOKEN_SECRET = env.approvalTokenSecret;

const consumedTokens = new Set<string>();

type TokenParts = {
  draftId: string;
  expiryMs: number;
  signature: Buffer;
};

function forbidden(message: string): { ok: false; error: ApiError } {
  return { ok: false, error: { code: ApiErrorCode.Forbidden, message } };
}

function signDraftId(draftId: string, expiryMs: number): Buffer {
  return createHmac(TOKEN_ALGORITHM, TOKEN_SECRET)
    .update(`${draftId}.${expiryMs}`)
    .digest();
}

function encodeBase64Url(value: Buffer): string {
  return value.toString("base64url");
}

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function parseToken(token: string): TokenParts | null {
  const parts = token.split(".");
  if (parts.length !== TOKEN_PARTS_COUNT) {
    return null;
  }

  const [draftId, expiryPart, signaturePart] = parts;
  const expiryMs = Number.parseInt(expiryPart, 10);
  if (!draftId || Number.isNaN(expiryMs)) {
    return null;
  }

  return {
    draftId,
    expiryMs,
    signature: decodeBase64Url(signaturePart),
  };
}

export function createApprovalToken(draftId: string): string {
  const expiryMs = Date.now() + APPROVAL_TOKEN_TTL_MS;
  const signature = signDraftId(draftId, expiryMs);

  return `${draftId}.${expiryMs}.${encodeBase64Url(signature)}`;
}

export function verifyApprovalToken(token: string): ApiResult<TokenPayload> {
  if (consumedTokens.has(token)) {
    return forbidden("Approval token has already been used.");
  }

  const parts = parseToken(token);
  if (parts === null) {
    return forbidden("Approval token is malformed.");
  }

  const { draftId, expiryMs, signature } = parts;
  const expectedSignature = signDraftId(draftId, expiryMs);
  const signaturesMatch =
    signature.length === expectedSignature.length &&
    timingSafeEqual(signature, expectedSignature);
  if (!signaturesMatch) {
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
