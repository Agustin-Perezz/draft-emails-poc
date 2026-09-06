import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
  APP_URL: "https://test.example.com",
};

const LLM_OUTPUT = {
  to: "antonella.m@develogia.com",
  subject: "Dev FullStack Jr/Ssr - Agustin Perez",
  body: "Hola,\n\nVi la busqueda...",
};

const EXPECTED_DRAFT = {
  ...LLM_OUTPUT,
  attachments: [
    {
      filename: "Agustin-Perez-CV.pdf",
      url: "https://test.example.com/Agustin-Perez-CV.pdf",
    },
  ],
};

vi.mock("@/lib/candidate-profile", () => ({
  buildSystemPrompt: () => "test system prompt",
}));

const generateTextMock = vi.fn();

vi.mock("ai", () => ({
  generateText: (...args: unknown[]) => generateTextMock(...args),
  Output: {
    object: (opts: Record<string, unknown>) => ({ type: "object", ...opts }),
  },
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => () => "test-model",
}));

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  vi.resetModules();
  generateTextMock.mockReset();
});

async function importDraftService() {
  return import("@/lib/draft-service");
}

describe("generateDraft", () => {
  it("returns ok with the draft (CV injected) when the LLM output is valid", async () => {
    generateTextMock.mockResolvedValue({ output: LLM_OUTPUT });
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result).toEqual({ ok: true, data: EXPECTED_DRAFT });
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "some job post" }),
    );
  });

  it("rejects LLM output that violates the schema with a 422 naming the field", async () => {
    generateTextMock.mockResolvedValue({
      output: { ...LLM_OUTPUT, to: "not-an-email" },
    });
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe(422);
      expect(result.error.message).toContain("to");
    }
  });

  it("maps LLM abort to a 504 ApiError", async () => {
    generateTextMock.mockRejectedValue(new Error("This operation was aborted"));
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result).toEqual({
      ok: false,
      error: { code: 504, message: expect.any(String) },
    });
  });

  it("maps unexpected LLM failures to a 500 ApiError", async () => {
    generateTextMock.mockRejectedValue(new Error("boom"));
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result).toEqual({
      ok: false,
      error: { code: 500, message: expect.any(String) },
    });
  });
});
