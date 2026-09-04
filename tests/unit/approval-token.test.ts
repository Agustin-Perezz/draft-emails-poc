import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
};

async function importApprovalTokenModule() {
  vi.resetModules();
  return import("@/lib/approval-token");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetModules();
  Object.assign(process.env, TEST_ENV);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("approval token", () => {
  it("create→verify round-trip returns ok with the correct draftId", async () => {
    const { createApprovalToken, verifyApprovalToken } =
      await importApprovalTokenModule();

    const token = createApprovalToken("draft-123");
    const result = verifyApprovalToken(token);

    expect(result).toEqual({
      ok: true,
      data: { draftId: "draft-123" },
    });
  });

  it("rejects an expired token with a 403 ApiError", async () => {
    const { APPROVAL_TOKEN_TTL_MS } = await import("@/lib/constants");
    const { createApprovalToken, verifyApprovalToken } =
      await importApprovalTokenModule();

    const token = createApprovalToken("draft-123");
    vi.advanceTimersByTime(APPROVAL_TOKEN_TTL_MS + 1);

    const result = verifyApprovalToken(token);

    expect(result).toEqual({
      ok: false,
      error: { code: 403, message: expect.any(String) },
    });
  });

  it("rejects a consumed token on second verify with a 403 ApiError", async () => {
    const { createApprovalToken, verifyApprovalToken, consumeApprovalToken } =
      await importApprovalTokenModule();

    const token = createApprovalToken("draft-123");
    const firstResult = verifyApprovalToken(token);
    expect(firstResult.ok).toBe(true);

    consumeApprovalToken(token);
    const secondResult = verifyApprovalToken(token);

    expect(secondResult).toEqual({
      ok: false,
      error: { code: 403, message: expect.any(String) },
    });
  });

  it("rejects a tampered token with a 403 ApiError", async () => {
    const { createApprovalToken, verifyApprovalToken } =
      await importApprovalTokenModule();

    const token = createApprovalToken("draft-123");
    const tamperedToken = `${token.slice(0, -2)}xy`;
    const result = verifyApprovalToken(tamperedToken);

    expect(result).toEqual({
      ok: false,
      error: { code: 403, message: expect.any(String) },
    });
  });

  it("rejects a token signed with a wrong secret with a 403 ApiError", async () => {
    const { createApprovalToken, verifyApprovalToken } =
      await importApprovalTokenModule();

    const token = createApprovalToken("draft-123");

    // Re-import the module with a different secret to mint a foreign token.
    process.env.APPROVAL_TOKEN_SECRET = "other-secret";
    const foreignModule = await importApprovalTokenModule();
    const foreignToken = foreignModule.createApprovalToken("draft-123");
    expect(verifyApprovalToken(foreignToken).ok).toBe(false);

    // The original verifier still accepts the original token.
    const result = verifyApprovalToken(token);
    expect(result.ok).toBe(true);
  });
});