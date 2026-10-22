/**
 * Runs before each test of every suite, after the framework is installed:
 * a fresh signed-out session and the default tRPC answers, so a test's
 * scripted answers never leak into the next. A failure left on screen is
 * dismissed after each test (its timer would outlive the suite).
 */
import { dismissFailure, failureStore } from "~/lib/failure";

import { signInAs } from "./session-mock";
import { resetProcedures } from "./trpc-mock";

beforeEach(() => {
  signInAs(null);
  resetProcedures();
});

afterEach(() => {
  const failure = failureStore.getState().current;
  if (failure) dismissFailure(failure.id);
});
