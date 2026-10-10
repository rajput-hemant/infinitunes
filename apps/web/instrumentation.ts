export async function register() {
  // The NODE_ENV check lets production builds drop the import entirely.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    const { logLocalDevLogin } = await import("./lib/local-dev-login");
    logLocalDevLogin();
  }
}
