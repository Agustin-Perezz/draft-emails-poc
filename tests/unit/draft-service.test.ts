import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
};

const VALID_DRAFT = {
  to: "antonella.m@develogia.com",
  subject: "Dev FullStack Jr/Ssr - Agustin Perez",
  body: "Hola,\n\nVi la busqueda...",
  attachments: [
    { filename: "Agustin-Perez-CV.pdf", url: "https://example.com/cv" },
  ],
};

vi.mock("@/lib/candidate-profile", () => ({
  buildSystemPrompt: () => "test system prompt",
}));

const generateObjectMock = vi.fn();

vi.mock("ai", () => ({
  generateObject: (...args: unknown[]) => generateObjectMock(...args),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: () => () => "test-model",
}));

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  vi.resetModules();
  generateObjectMock.mockReset();
});

async function importDraftService() {
  return import("@/lib/draft-service");
}

describe("generateDraft", () => {
  it("returns ok with the draft when the LLM output is valid", async () => {
    generateObjectMock.mockResolvedValue({ object: VALID_DRAFT });
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result).toEqual({ ok: true, data: VALID_DRAFT });
    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: "some job post" }),
    );
  });

  it("rejects LLM output that violates the schema with a 422 naming the field", async () => {
    generateObjectMock.mockResolvedValue({
      object: { ...VALID_DRAFT, to: "not-an-email" },
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
    generateObjectMock.mockRejectedValue(
      new Error("This operation was aborted"),
    );
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result).toEqual({
      ok: false,
      error: { code: 504, message: expect.any(String) },
    });
  });

  it("maps unexpected LLM failures to a 500 ApiError", async () => {
    generateObjectMock.mockRejectedValue(new Error("boom"));
    const { generateDraft } = await importDraftService();

    const result = await generateDraft({ rawPost: "some job post" });

    expect(result).toEqual({
      ok: false,
      error: { code: 500, message: expect.any(String) },
    });
  });
});
