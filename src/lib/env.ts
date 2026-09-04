type Env = {
  openAiApiKey: string;
  resendApiKey: string;
  resendFromEmail: string;
  approvalTokenSecret: string;
};

type EnvSource = Record<string, string | undefined>;

const REQUIRED_ENV_KEYS = [
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "APPROVAL_TOKEN_SECRET",
] as const;

function readEnvValue(
  source: EnvSource,
  key: (typeof REQUIRED_ENV_KEYS)[number],
): string {
  const value = source[key];
  if (!value) {
    return "";
  }
  return value;
}

function validateEnv(source: EnvSource): Env {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !source[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingKeys.join(", ")}. ` +
        "The application refuses to start without them (no defaults are provided).",
    );
  }

  return {
    openAiApiKey: readEnvValue(source, "OPENAI_API_KEY"),
    resendApiKey: readEnvValue(source, "RESEND_API_KEY"),
    resendFromEmail: readEnvValue(source, "RESEND_FROM_EMAIL"),
    approvalTokenSecret: readEnvValue(source, "APPROVAL_TOKEN_SECRET"),
  };
}

export const env: Env = validateEnv(process.env);
