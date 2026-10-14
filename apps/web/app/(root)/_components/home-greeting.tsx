"use client";

import { useSession } from "@infinitunes/auth/client";
import { useSyncExternalStore } from "react";

import { FALLBACK_GREETING, formatGreeting, greetingForHour } from "./greeting";

const subscribe = () => () => {};
const clientSalutation = () => greetingForHour(new Date().getHours());
const serverSalutation = () => FALLBACK_GREETING;

/**
 * The only per-visitor part of the home page body. The time of day and the
 * signed-in name resolve here on the client, after the fallback has been served
 * and hydrated, so the body does not depend on the session.
 */
export function HomeGreeting() {
  const salutation = useSyncExternalStore(
    subscribe,
    clientSalutation,
    serverSalutation,
  );
  const { data } = useSession();

  return (
    <h1 className="font-heading text-[1.75rem] leading-8 font-bold tracking-[-0.025em] md:text-[2rem] md:leading-10">
      {formatGreeting(salutation, data?.user.name)}
    </h1>
  );
}
