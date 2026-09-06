import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
  APP_URL: "https://test.example.com",
};

const DRAFT = {
  to: "antonella.m@develogia.com",
  subject: "Dev FullStack Jr/Ssr - Agustin Perez",
  body: "Hola,\n\nVi la busqueda...",
  attachments: [
    { filename: "Agustin-Perez-CV.pdf", url: "https://example.com/cv" },
  ],
};

const verifyApprovalTokenMock = vi.fn();
const consumeApprovalTokenMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock("@/lib/approval-token", () => ({
  createApprovalToken: vi.fn(),
  consumeApprovalToken: consumeApprovalTokenMock,
  verifyApprovalToken: (...args: unknown[]) => verifyApprovalTokenMock(...args),
}));

vi.mock("@/lib/email-service", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  vi.resetModules();
  verifyApprovalTokenMock.mockReset();
  consumeApprovalTokenMock.mockReset();
  sendEmailMock.mockReset();
});

async function importSendRoute() {
  return import("@/app/api/send/route");
}

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/send", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/send", () => {
  it("returns 200 with messageId when token is valid and send succeeds", async () => {
    verifyApprovalTokenMock.mockReturnValue({
      ok: true,
      data: { draftId: "d1" },
    });
    sendEmailMock.mockResolvedValue({ ok: true, data: { messageId: "msg-1" } });
    const { POST } = await importSendRoute();

    const response = await POST(
      createRequest({ draft: DRAFT, approvalToken: "tok" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ messageId: "msg-1" });
    expect(consumeApprovalTokenMock).toHaveBeenCalledWith("tok");
    expect(sendEmailMock).toHaveBeenCalledWith(DRAFT);
  });

  it("consumes the token before dispatching the email", async () => {
    verifyApprovalTokenMock.mockReturnValue({
      ok: true,
      data: { draftId: "d1" },
    });
    sendEmailMock.mockResolvedValue({ ok: true, data: { messageId: "msg-1" } });
    const { POST } = await importSendRoute();

    await POST(createRequest({ draft: DRAFT, approvalToken: "tok" }));

    const consumeOrder = consumeApprovalTokenMock.mock.invocationCallOrder[0];
    const sendOrder = sendEmailMock.mock.invocationCallOrder[0];
    expect(consumeOrder).toBeLessThan(sendOrder);
  });

  it("returns 403 when the token is missing", async () => {
    const { POST } = await importSendRoute();

    const response = await POST(createRequest({ draft: DRAFT }));

    expect(response.status).toBe(403);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("returns 403 when the token is invalid or expired", async () => {
    verifyApprovalTokenMock.mockReturnValue({
      ok: false,
      error: { code: 403, message: "Approval token has expired." },
    });
    const { POST } = await importSendRoute();

    const response = await POST(
      createRequest({ draft: DRAFT, approvalToken: "tok" }),
    );

    expect(response.status).toBe(403);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("keeps the token consumed even when the send fails", async () => {
    verifyApprovalTokenMock.mockReturnValue({
      ok: true,
      data: { draftId: "d1" },
    });
    sendEmailMock.mockResolvedValue({
      ok: false,
      error: { code: 500, message: "resend down" },
    });
    const { POST } = await importSendRoute();

    const response = await POST(
      createRequest({ draft: DRAFT, approvalToken: "tok" }),
    );

    expect(response.status).toBe(500);
    expect(consumeApprovalTokenMock).toHaveBeenCalledWith("tok");
  });

  it("returns 400 when the payload is malformed", async () => {
    const { POST } = await importSendRoute();

    const response = await POST(createRequest({}));

    expect(response.status).toBe(400);
  });
});
