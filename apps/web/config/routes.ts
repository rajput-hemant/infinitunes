/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to `DEFAULT_LOGIN_REDIRECT`
 */
export const authRoutes = ["/login", "/signup", "/reset-password"];

/**
 * The default redirect path after a user logs in
 */
export const DEFAULT_LOGIN_REDIRECT = "/";

/**
 * An array of main app routes for the application
 */
export const appRoutes = [
  "/",
  "/album",
  "/artist",
  "/chart",
  "/episode",
  "/label",
  "/mix",
  "/playlist",
  "/radio",
  "/search",
  "/show",
  "/song",
];

/**
 * Routes that require a session before the page renders. Settings stays public
 * with a guest empty state, matching master middleware (no proxy redirect).
 */
export const userRoutes = ["/me"];
