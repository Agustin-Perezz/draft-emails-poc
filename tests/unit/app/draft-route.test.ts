import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
  APP_URL: "https://test.example.com",
};

const VALID_DRAFT = {
  to: "antonella.m@develogia.com",
  subject: "Dev FullStack Jr/Ssr - Agustin Perez",
  body: "Hola,\n\nVi la busqueda...",
  attachments: [
    { filename: "Agustin-Perez-CV.pdf", url: "https://example.com/cv" },
  ],
};

const generateDraftMock = vi.fn();
const createApprovalTokenMock = vi.fn();

vi.mock("@/lib/draft-service", () => ({
  generateDraft: (...args: unknown[]) => generateDraftMock(...args),
}));

vi.mock("@/lib/approval-token", () => ({
  createApprovalToken: (...args: unknown[]) => createApprovalTokenMock(...args),
  consumeApprovalToken: vi.fn(),
  verifyApprovalToken: vi.fn(),
}));

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  vi.resetModules();
  generateDraftMock.mockReset();
  createApprovalTokenMock.mockReset();
  createApprovalTokenMock.mockReturnValue("signed-token");
});

async function importDraftRoute() {
  return import("@/app/api/draft/route");
}

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/draft", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/draft", () => {
  it("returns 200 with draft and approval token on success", async () => {
    generateDraftMock.mockResolvedValue({ ok: true, data: VALID_DRAFT });
    const { POST } = await importDraftRoute();

    const response = await POST(createRequest({ rawPost: "job post" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ draft: VALID_DRAFT, approvalToken: "signed-token" });
    expect(createApprovalTokenMock).toHaveBeenCalledTimes(1);
  });

  it("returns 400 when rawPost is missing", async () => {
    const { POST } = await importDraftRoute();

    const response = await POST(createRequest({}));

    expect(response.status).toBe(400);
  });

  it("returns 400 when rawPost is empty", async () => {
    const { POST } = await importDraftRoute();

    const response = await POST(createRequest({ rawPost: "   " }));

    expect(response.status).toBe(400);
  });

  it("returns 422 when the service cannot produce a valid draft", async () => {
    generateDraftMock.mockResolvedValue({
      ok: false,
      error: { code: 422, message: "missing recipient email (to)" },
    });
    const { POST } = await importDraftRoute();

    const response = await POST(createRequest({ rawPost: "job post" }));

    expect(response.status).toBe(422);
    const json = await response.json();
    expect(json.error.message).toContain("to");
  });

  it("relays the service error code verbatim", async () => {
    generateDraftMock.mockResolvedValue({
      ok: false,
      error: { code: 504, message: "llm timeout" },
    });
    const { POST } = await importDraftRoute();

    const response = await POST(createRequest({ rawPost: "job post" }));

    expect(response.status).toBe(504);
  });
});
