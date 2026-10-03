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
