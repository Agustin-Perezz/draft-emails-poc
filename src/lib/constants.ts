export const API_ROUTES = {
  DRAFT: "/api/draft",
  SEND: "/api/send",
} as const;

export const LLM_TIMEOUT_MS = 30_000;
export const APPROVAL_TOKEN_TTL_MS = 600_000;

export const CV_FILENAME = "Agustin-Perez-CV.pdf";
export const CV_PLACEHOLDER_URL = "https://example.com/cv/agustin-perez-cv.pdf";
