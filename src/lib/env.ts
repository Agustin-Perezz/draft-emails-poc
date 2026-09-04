type EnvSource = Record<string, string | undefined>;

type Env = {
  openAiApiKey: string;
  resendApiKey: string;
  resendFromEmail: string;
  approvalTokenSecret: string;
};

const REQUIRED_ENV_KEYS = [
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "APPROVAL_TOKEN_SECRET",
] as const;

function validateEnv(source: EnvSource): Env {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !source[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(", ")}.`,
    );
  }

  // Casts are safe: the guard above rejected missing or empty values.
  return {
    openAiApiKey: source.OPENAI_API_KEY as string,
    resendApiKey: source.RESEND_API_KEY as string,
    resendFromEmail: source.RESEND_FROM_EMAIL as string,
    approvalTokenSecret: source.APPROVAL_TOKEN_SECRET as string,
  };
}

export const env: Env = validateEnv(process.env);
