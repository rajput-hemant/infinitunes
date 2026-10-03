export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendEmail = (email: Email) => Promise<void>;

export interface MailConfig {
  /** Resend API key; when absent, emails are logged outside production. */
  apiKey?: string;
  /** Verified sender, e.g. `Infinitunes <no-reply@example.com>`. */
  from?: string;
  nodeEnv?: string;
  fetch?: typeof fetch;
  log?: (message: string) => void;
}

/** Thrown at send time when production has no usable mail configuration. */
export class MailConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailConfigError";
  }
}

const RESEND_URL = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

/**
 * Resend implementation over its REST API, with a console fallback for local
 * development. Production without RESEND_API_KEY/EMAIL_FROM throws a
 * `MailConfigError` instead of logging, so reset links never reach logs.
 */
export function createSendEmail(config: MailConfig = {}): SendEmail {
  const {
    apiKey,
    from,
    nodeEnv,
    fetch: doFetch = fetch,
    log = console.info,
  } = config;

  return async (email) => {
    if (!apiKey) {
      if (nodeEnv === "production") {
        throw new MailConfigError(
          "RESEND_API_KEY is not set; cannot send email in production",
        );
      }
      log(
        `[mail] RESEND_API_KEY not set, logging instead of sending\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`,
      );
      return;
    }
    if (!from) {
      throw new MailConfigError(
        "EMAIL_FROM is required when RESEND_API_KEY is set",
      );
    }

    const response = await doFetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Resend rejected the email (HTTP ${response.status})`);
    }
  };
}
