export type EmailAttachment = {
  filename: string;
  url: string;
};

export type DraftPayload = {
  to: string;
  subject: string;
  body: string;
  attachments: EmailAttachment[];
};

export type CandidateProfile = {
  name: string;
  title: string;
  yearsOfExperience: string;
  coreStack: readonly string[];
  portfolioUrl: string;
  githubUrl: string;
  cvUrl: string;
};

export type DraftApiRequest = {
  rawPost: string;
};

export type DraftApiResponse = {
  draft: DraftPayload;
  approvalToken: string;
};

export type SendApiRequest = {
  draft: DraftPayload;
  approvalToken: string;
};

export type SendApiResponse = {
  messageId: string;
};

export type TokenPayload = {
  draftId: string;
};

export enum ApiErrorCode {
  BadRequest = 400,
  Forbidden = 403,
  Unprocessable = 422,
  Timeout = 504,
  Internal = 500,
}

export type ApiError = {
  code: ApiErrorCode;
  message: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export enum WorkflowStatus {
  Idle = "idle",
  Drafting = "drafting",
  Reviewing = "reviewing",
  Sending = "sending",
  Done = "done",
  Error = "error",
}