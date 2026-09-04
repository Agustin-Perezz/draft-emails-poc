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
  for (const key of Object.keys(COMPLETE_ENV)) {
    delete process.env[key];
  }
  Object.assign(process.env, vars);
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

  it.each(Object.keys(COMPLETE_ENV))(
    "throws naming the missing var %s",
    async (missingKey) => {
      const incompleteEnv = { ...COMPLETE_ENV };
      delete incompleteEnv[missingKey];
      setProcessEnv(incompleteEnv);

      await expect(importEnvModule()).rejects.toThrow(missingKey);
    },
  );

  it("throws naming ALL missing vars when several are absent", async () => {
    setProcessEnv({ OPENAI_API_KEY: "test-openai-key" });

    let thrownMessage = "";
    try {
      await importEnvModule();
    } catch (error) {
      thrownMessage = (error as Error).message;
    }

    expect(thrownMessage).toContain("RESEND_API_KEY");
    expect(thrownMessage).toContain("RESEND_FROM_EMAIL");
    expect(thrownMessage).toContain("APPROVAL_TOKEN_SECRET");
  });
});
