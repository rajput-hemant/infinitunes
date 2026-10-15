"use client";

import dynamic from "next/dynamic";

import { ActionCardSkeleton, ProfileCardSkeleton } from "./settings-skeletons";

// The form stack (react-hook-form, zod) and the passkey client are only
// needed once the signed-in sections are on screen, so they stay out of the
// route's first-load JavaScript.
export const ProfileForm = dynamic(
  () => import("./profile-form").then((module) => module.ProfileForm),
  { ssr: false, loading: () => <ProfileCardSkeleton /> },
);

export const PasskeySettings = dynamic(
  () => import("./passkey-settings").then((module) => module.PasskeySettings),
  { ssr: false, loading: () => <ActionCardSkeleton /> },
);
