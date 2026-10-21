import { userMessage } from "@infinitunes/core/user-message";

/**
 * Runs a tRPC mutation and resolves to the message to show when it failed,
 * or `undefined` on success. Server copy for user-caused codes is kept
 * ("Current password is incorrect"); upstream faults become generic copy.
 */
export async function mutationFailure(
  mutation: () => Promise<unknown>,
): Promise<string | undefined> {
  try {
    await mutation();
    return undefined;
  } catch (error) {
    console.error(error);
    return userMessage(error);
  }
}
