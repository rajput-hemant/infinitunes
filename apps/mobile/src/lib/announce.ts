/**
 * Android: TalkBack speaks a control's state change and a toast's live region
 * by itself, so there is nothing to announce (`announce.ios.ts` is the one
 * that speaks).
 */
export function announce(_message: string): void {}
