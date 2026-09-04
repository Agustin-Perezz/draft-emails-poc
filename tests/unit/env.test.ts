import { beforeEach, describe, expect, it, vi } from "vitest";

type EnvVars = Record<string, string | undefined>;

const COMPLETE_ENV: EnvVars = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
};

async function importEnvModule() {
  vi.resetModules();
  return import("@/lib/env");
}

function setProcessEnv(vars: EnvVars): void {
  const REQUIRED_ENV_KEYS = [
    "OPENAI_API_KEY",
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "APPROVAL_TOKEN_SECRET",
  ] as const;

  for (const key of REQUIRED_ENV_KEYS) {
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("env module", () => {
  it("exports a typed env object when all required vars are set", async () => {
    setProcessEnv(COMPLETE_ENV);

    const { env } = await importEnvModule();

    expect(env).toEqual({
      openAiApiKey: "test-openai-key",
      resendApiKey: "test-resend-key",
      resendFromEmail: "outreach@test.example",
      approvalTokenSecret: "test-approval-secret",
    });
  });

  it.each([
    ["OPENAI_API_KEY"],
    ["RESEND_API_KEY"],
    ["RESEND_FROM_EMAIL"],
    ["APPROVAL_TOKEN_SECRET"],
  ])("throws naming the missing var %s", async (missingKey) => {
    const incompleteEnv: EnvVars = { ...COMPLETE_ENV };
    delete incompleteEnv[missingKey];
    setProcessEnv(incompleteEnv);

    await expect(importEnvModule()).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining(missingKey),
      }),
    );
  });

  it("throws naming ALL missing vars when several are absent", async () => {
    setProcessEnv({ OPENAI_API_KEY: "test-openai-key" });

    await expect(importEnvModule()).rejects.toThrow(
      expect.objectContaining({
        message: expect.stringContaining("RESEND_API_KEY"),
      }),
    );
    // Re-run to assert the same error names every remaining missing var.
    await expect(importEnvModule()).rejects.toThrow(/APPROVAL_TOKEN_SECRET/);
    await expect(importEnvModule()).rejects.toThrow(/RESEND_FROM_EMAIL/);
  });
});