/**
 * Runs before each test of every suite, after the framework is installed:
 * a fresh signed-out session and the default tRPC answers, so a test's
 * scripted answers never leak into the next.
 */
import { signInAs } from "./session-mock";
import { resetProcedures } from "./trpc-mock";

beforeEach(() => {
  signInAs(null);
  resetProcedures();
});
