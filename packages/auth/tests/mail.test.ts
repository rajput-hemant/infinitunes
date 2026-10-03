import { describe, expect, it } from "bun:test";

import { resetPasswordEmail } from "../src/emails";
import { createSendEmail, MailConfigError } from "../src/mail";

const email = {
  to: "user@example.com",
  subject: "Subject",
  html: "<p>Hi</p>",
  text: "Hi",
};

describe("createSendEmail", () => {
  it("posts to the Resend REST API with bearer auth and both bodies", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const send = createSendEmail({
      apiKey: "re_test",
      from: "Infinitunes <no-reply@example.com>",
      nodeEnv: "production",
      fetch: (async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return new Response("{}", { status: 200 });
      }) as unknown as typeof fetch,
    });

    await send(email);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.resend.com/emails");
    expect(calls[0]?.init.method).toBe("POST");
    expect(calls[0]?.init.headers).toMatchObject({
      Authorization: "Bearer re_test",
    });
    expect(JSON.parse(calls[0]?.init.body as string)).toEqual({
      from: "Infinitunes <no-reply@example.com>",
      to: ["user@example.com"],
      subject: "Subject",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  });

  it("throws on a non-2xx response without echoing the body", async () => {
    const send = createSendEmail({
      apiKey: "re_test",
      from: "a@example.com",
      fetch: (async () =>
        new Response("secret detail", {
          status: 422,
        })) as unknown as typeof fetch,
    });

    const error = await send(email).catch((e: unknown) => e as Error);
    expect(error.message).toContain("422");
    expect(error.message).not.toContain("secret detail");
  });

  it("requires EMAIL_FROM when a key is set", async () => {
    const send = createSendEmail({ apiKey: "re_test" });
    await expect(send(email)).rejects.toBeInstanceOf(MailConfigError);
  });

  it("logs instead of sending without a key outside production", async () => {
    const logs: string[] = [];
    let fetched = false;
    const send = createSendEmail({
      nodeEnv: "development",
      log: (message) => logs.push(message),
      fetch: (async () => {
        fetched = true;
        return new Response();
      }) as unknown as typeof fetch,
    });

    await send({ ...email, text: "https://app.test/reset?token=abc" });

    expect(fetched).toBe(false);
    expect(logs[0]).toContain("https://app.test/reset?token=abc");
  });

  it("fails closed in production without a key and never logs the body", async () => {
    const logs: string[] = [];
    const send = createSendEmail({
      nodeEnv: "production",
      log: (message) => logs.push(message),
    });

    await expect(send(email)).rejects.toBeInstanceOf(MailConfigError);
    expect(logs).toEqual([]);
  });
});

describe("resetPasswordEmail", () => {
  it("includes the link, expiry and an ignore notice in html and text", () => {
    const url =
      "https://app.test/api/auth/reset-password/tok?callbackURL=%2Fx&a=1";
    const { subject, html, text } = resetPasswordEmail({
      url,
      expiresInMinutes: 60,
    });

    expect(subject).toContain("Reset");
    expect(text).toContain(url);
    expect(text).toContain("60 minutes");
    expect(html).toContain('lang="en"');
    expect(html).toContain("&amp;a=1");
    expect(html).not.toContain("&a=1");
    expect(html).toContain("ignore this email");
  });
});
