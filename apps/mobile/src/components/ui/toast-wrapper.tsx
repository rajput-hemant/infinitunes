import type { ToasterProps } from "sonner-native";

/**
 * Android needs no wrapper: sonner-native's toasts are live regions, which
 * TalkBack speaks (`toast-wrapper.ios.tsx` announces them for VoiceOver).
 */
export const AnnouncingToast: ToasterProps["ToastWrapper"] = undefined;
