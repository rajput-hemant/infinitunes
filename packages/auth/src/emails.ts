import type { Email } from "./mail";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Plain, accessible reset email: one link, expiry stated, safe to ignore. */
export function resetPasswordEmail(options: {
  url: string;
  expiresInMinutes: number;
}): Pick<Email, "subject" | "html" | "text"> {
  const { url, expiresInMinutes } = options;
  const safeUrl = escapeHtml(url);

  const text = [
    "Reset your Infinitunes password",
    "",
    "We received a request to reset the password for your account.",
    `Open this link to choose a new password (valid for ${expiresInMinutes} minutes, single use):`,
    url,
    "",
    "If you did not request this, you can safely ignore this email; your password will not change.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111;">
    <h1 style="font-size: 20px;">Reset your Infinitunes password</h1>
    <p>We received a request to reset the password for your account.</p>
    <p><a href="${safeUrl}">Choose a new password</a></p>
    <p>This link is valid for ${expiresInMinutes} minutes and can be used once. If the link does not open, copy this address into your browser:</p>
    <p style="word-break: break-all;">${safeUrl}</p>
    <p>If you did not request this, you can safely ignore this email; your password will not change.</p>
  </body>
</html>`;

  return { subject: "Reset your Infinitunes password", html, text };
}

/** Sent to the NEW address; the account's email only changes once it is opened. */
export function changeEmailVerificationEmail(options: {
  url: string;
  newEmail: string;
  expiresInMinutes: number;
}): Pick<Email, "subject" | "html" | "text"> {
  const { url, newEmail, expiresInMinutes } = options;
  const safeUrl = escapeHtml(url);
  const safeEmail = escapeHtml(newEmail);

  const text = [
    "Confirm your new Infinitunes email",
    "",
    `Someone asked to use ${newEmail} as the email for an Infinitunes account.`,
    `Open this link to confirm it (valid for ${expiresInMinutes} minutes):`,
    url,
    "",
    "If you did not request this, ignore this email; nothing will change.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111;">
    <h1 style="font-size: 20px;">Confirm your new Infinitunes email</h1>
    <p>Someone asked to use ${safeEmail} as the email for an Infinitunes account.</p>
    <p><a href="${safeUrl}">Confirm this email</a></p>
    <p>This link is valid for ${expiresInMinutes} minutes. If the link does not open, copy this address into your browser:</p>
    <p style="word-break: break-all;">${safeUrl}</p>
    <p>If you did not request this, ignore this email; nothing will change.</p>
  </body>
</html>`;

  return { subject: "Confirm your new Infinitunes email", html, text };
}
