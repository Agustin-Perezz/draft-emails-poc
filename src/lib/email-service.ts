import { Resend } from "resend";

import { env } from "@/lib/env";
import type { ApiResult, DraftPayload, SendApiResponse } from "@/lib/types";
import { ApiErrorCode } from "@/lib/types";

const resend = new Resend(env.resendApiKey);

export async function sendEmail(
  draft: DraftPayload,
): Promise<ApiResult<SendApiResponse>> {
  const response = await resend.emails.send({
    from: env.resendFromEmail,
    to: draft.to,
    subject: draft.subject,
    text: draft.body,
    attachments: draft.attachments.map((attachment) => ({
      filename: attachment.filename,
      path: attachment.url,
    })),
  });

  if (response.error) {
    return {
      ok: false,
      error: {
        code: ApiErrorCode.Internal,
        message: `Email provider rejected the send: ${response.error.message}`,
      },
    };
  }

  return { ok: true, data: { messageId: response.data.id } };
}
