import { beforeEach, describe, expect, it, vi } from "vitest";

const TEST_ENV = {
  OPENAI_API_KEY: "test-openai-key",
  RESEND_API_KEY: "test-resend-key",
  RESEND_FROM_EMAIL: "outreach@test.example",
  APPROVAL_TOKEN_SECRET: "test-approval-secret",
};

const DRAFT = {
  to: "antonella.m@develogia.com",
  subject: "Dev FullStack Jr/Ssr - Agustin Perez",
  body: "Hola,\n\nVi la busqueda...",
  attachments: [
    { filename: "Agustin-Perez-CV.pdf", url: "https://example.com/cv" },
  ],
};

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  vi.resetModules();
  sendMock.mockReset();
});

async function importEmailService() {
  return import("@/lib/email-service");
}

describe("sendEmail", () => {
  it("maps attachments to remote path form and sends via Resend", async () => {
    sendMock.mockResolvedValue({ data: { id: "msg-1" }, error: null });
    const { sendEmail } = await importEmailService();

    const result = await sendEmail(DRAFT);

    expect(result).toEqual({ ok: true, data: { messageId: "msg-1" } });
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "outreach@test.example",
        to: "antonella.m@develogia.com",
        subject: DRAFT.subject,
        text: DRAFT.body,
        attachments: [
          { filename: "Agustin-Perez-CV.pdf", path: "https://example.com/cv" },
        ],
      }),
    );
  });

  it("maps a Resend API error to a 500 ApiError", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "rate limited" },
    });
    const { sendEmail } = await importEmailService();

    const result = await sendEmail(DRAFT);

    expect(result).toEqual({
      ok: false,
      error: { code: 500, message: expect.stringContaining("rate limited") },
    });
  });
});
