import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
  APP_URL: "https://test.example.com",
};

const FORBIDDEN_RESULT = {
  ok: false,
  error: { code: 403, message: expect.any(String) },
};

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(process.env, TEST_ENV);
});

async function importTokenModule() {
  vi.resetModules();
  return import("@/lib/approval-token");
}

describe("approval token", () => {
  it("create→verify round-trip returns ok with the correct draftId", async () => {
    const { createApprovalToken, verifyApprovalToken } =
      await importTokenModule();

    const token = createApprovalToken("draft-123");

    expect(verifyApprovalToken(token)).toEqual({
      ok: true,
      data: { draftId: "draft-123" },
    });
  });

  it("rejects an expired token with a 403 ApiError", async () => {
    const { APPROVAL_TOKEN_TTL_MS } = await import("@/lib/constants");
    const { createApprovalToken, verifyApprovalToken } =
      await importTokenModule();

    const token = createApprovalToken("draft-123");
    vi.advanceTimersByTime(APPROVAL_TOKEN_TTL_MS + 1);

    expect(verifyApprovalToken(token)).toEqual(FORBIDDEN_RESULT);
  });

  it("rejects a consumed token on second verify with a 403 ApiError", async () => {
    const { createApprovalToken, verifyApprovalToken, consumeApprovalToken } =
      await importTokenModule();

    const token = createApprovalToken("draft-123");
    expect(verifyApprovalToken(token).ok).toBe(true);
    consumeApprovalToken(token);

    expect(verifyApprovalToken(token)).toEqual(FORBIDDEN_RESULT);
  });

  it("rejects a tampered token with a 403 ApiError", async () => {
    const { createApprovalToken, verifyApprovalToken } =
      await importTokenModule();

    const token = createApprovalToken("draft-123");
    const tamperedToken = `${token.slice(0, -2)}xy`;

    expect(verifyApprovalToken(tamperedToken)).toEqual(FORBIDDEN_RESULT);
  });

  it("rejects a token signed with a wrong secret with a 403 ApiError", async () => {
    const { createApprovalToken, verifyApprovalToken } =
      await importTokenModule();
    const token = createApprovalToken("draft-123");

    process.env.APPROVAL_TOKEN_SECRET = "other-secret";
    const { createApprovalToken: createForeignToken } =
      await importTokenModule();
    const foreignToken = createForeignToken("draft-123");

    expect(verifyApprovalToken(foreignToken)).toEqual(FORBIDDEN_RESULT);
    expect(verifyApprovalToken(token).ok).toBe(true);
  });
});
