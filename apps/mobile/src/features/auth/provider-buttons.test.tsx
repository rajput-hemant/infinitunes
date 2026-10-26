import { fireEvent, screen } from "@testing-library/react-native";
import { Platform } from "react-native";

import { appleAuthentication, googleSignIn, passkey } from "~/test/native-auth";
import { renderScreen } from "~/test/render";
import { authClient } from "~/test/session-mock";

import { LoginForm } from "./login-form";
import { SignUpForm } from "./signup-form";

const button = (name: string) => screen.findByRole("button", { name });

function serverOffers(providers: string[]) {
  authClient.$fetch.mockImplementation(async (path: string) => ({
    data: path === "/social-providers" ? providers : {},
    error: null,
  }));
}

afterEach(() => {
  authClient.$fetch.mockReset();
  serverOffers(["google", "github", "apple"]);
});

describe("Sign-in providers", () => {
  it("offers Apple, Google and a passkey above the email form, never GitHub", async () => {
    await renderScreen(<LoginForm />);

    expect(await button("Continue with Apple")).toBeOnTheScreen();
    expect(await button("Continue with Google")).toBeOnTheScreen();
    expect(await button("Sign in with a passkey")).toBeOnTheScreen();
    expect(screen.getByText("or")).toBeOnTheScreen();
    expect(screen.queryByText(/GitHub/)).toBeNull();
  });

  it("hides a provider the server has not configured, and Google without Apple on iOS", async () => {
    serverOffers(["google"]);
    await renderScreen(<LoginForm />);

    expect(await button("Sign in with a passkey")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Continue with Apple" }),
    ).toBeNull();
    // App Store guideline 4.8: Google needs Sign in with Apple beside it.
    expect(
      screen.queryByRole("button", { name: "Continue with Google" }),
    ).toBeNull();
  });

  it("signs in with Apple's ID token and the name Apple shares once", async () => {
    appleAuthentication.signInAsync.mockResolvedValueOnce({
      identityToken: "apple-token",
      fullName: { givenName: "Ada", familyName: "Lovelace" },
    } as never);
    await renderScreen(<LoginForm />);

    await fireEvent.press(await button("Continue with Apple"));

    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "apple",
      idToken: {
        token: "apple-token",
        user: { name: { firstName: "Ada", lastName: "Lovelace" } },
      },
    });
  });

  it("signs in with Google's ID token, configured for the server's client", async () => {
    await renderScreen(<LoginForm />);

    await fireEvent.press(await button("Continue with Google"));

    expect(googleSignIn.GoogleSignin.configure).toHaveBeenCalledWith({
      webClientId: "web.apps.googleusercontent.com",
      iosClientId: "ios.apps.googleusercontent.com",
    });
    expect(authClient.signIn.social).toHaveBeenCalledWith({
      provider: "google",
      idToken: { token: "google-id-token" },
    });
  });

  it("answers the server's passkey challenge and sends the assertion back", async () => {
    const challenge = { challenge: "abc", rpId: "infinitunes.test" };
    authClient.$fetch.mockImplementation(async (path: string) => ({
      data:
        path === "/social-providers"
          ? []
          : path === "/passkey/generate-authenticate-options"
            ? challenge
            : { session: {} },
      error: null,
    }));
    await renderScreen(<LoginForm />);

    await fireEvent.press(await button("Sign in with a passkey"));

    expect(passkey.Passkey.get).toHaveBeenCalledWith(challenge);
    expect(authClient.$fetch).toHaveBeenCalledWith(
      "/passkey/verify-authentication",
      {
        method: "POST",
        body: {
          response: expect.objectContaining({
            id: "credential-id",
            type: "public-key",
          }),
        },
      },
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("says nothing when the listener dismisses a sheet", async () => {
    appleAuthentication.signInAsync.mockRejectedValueOnce(
      Object.assign(new Error("canceled"), { code: "ERR_REQUEST_CANCELED" }),
    );
    googleSignIn.GoogleSignin.signIn.mockResolvedValueOnce({
      type: "cancelled",
      data: null,
    } as never);
    passkey.Passkey.get.mockRejectedValueOnce({
      error: "UserCancelled",
      message: "cancelled",
    });
    await renderScreen(<LoginForm />);

    await fireEvent.press(await button("Continue with Apple"));
    await fireEvent.press(await button("Continue with Google"));
    await fireEvent.press(await button("Sign in with a passkey"));

    expect(authClient.signIn.social).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows the server's refusal under the provider buttons", async () => {
    authClient.signIn.social.mockResolvedValueOnce({
      error: { status: 401, message: "Account not linked" },
    });
    await renderScreen(<LoginForm />);

    await fireEvent.press(await button("Continue with Google"));

    expect(screen.getByRole("alert")).toHaveTextContent("Account not linked");
  });

  it("says so when the device has no passkey for the app", async () => {
    passkey.Passkey.get.mockRejectedValueOnce({
      error: "NoCredentials",
      message: "none",
    });
    await renderScreen(<LoginForm />);

    await fireEvent.press(await button("Sign in with a passkey"));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No Infinitunes passkey was found on this device.",
    );
  });

  it("offers Apple and Google on sign-up, but no passkey", async () => {
    await renderScreen(<SignUpForm />);

    expect(await button("Sign up with Apple")).toBeOnTheScreen();
    expect(await button("Continue with Google")).toBeOnTheScreen();
    expect(
      screen.queryByRole("button", { name: "Sign in with a passkey" }),
    ).toBeNull();
  });

  it("shows no Apple button on Android, and Google without it", async () => {
    const os = Platform.OS;
    Platform.OS = "android";
    try {
      await renderScreen(<LoginForm />);

      expect(await button("Continue with Google")).toBeOnTheScreen();
      expect(
        screen.queryByRole("button", { name: "Continue with Apple" }),
      ).toBeNull();
    } finally {
      Platform.OS = os;
    }
  });
});
