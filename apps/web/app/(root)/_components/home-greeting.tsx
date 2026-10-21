"use client";

import { formatGreeting, greetingForHour } from "@infinitunes/core/greeting";
import { Suspense, useSyncExternalStore } from "react";

import { useViewer } from "~/components/viewer-context";

/** Shown on the server and during hydration, before the visitor's clock is known. */
const FALLBACK_GREETING = "Welcome";

const subscribe = () => () => {};
const clientSalutation = () => greetingForHour(new Date().getHours());
const serverSalutation = () => FALLBACK_GREETING;

const headingClassName =
  "font-heading text-[1.75rem] leading-8 font-bold tracking-[-0.025em] md:text-[2rem] md:leading-10";

function useSalutation() {
  return useSyncExternalStore(subscribe, clientSalutation, serverSalutation);
}

function GreetingWithName() {
  const salutation = useSalutation();
  const { user } = useViewer();

  return (
    <h1 className={headingClassName}>
      {formatGreeting(salutation, user?.name)}
    </h1>
  );
}

function NamelessGreeting() {
  const salutation = useSalutation();

  return <h1 className={headingClassName}>{formatGreeting(salutation)}</h1>;
}

/**
 * The only per-visitor part of the home page body. The time of day resolves on
 * the client after hydration; the signed-in name streams in from the layout's
 * viewer promise, so the shell serves the nameless greeting and the body does
 * not depend on the session (and ships no auth client).
 */
export function HomeGreeting() {
  return (
    <Suspense fallback={<NamelessGreeting />}>
      <GreetingWithName />
    </Suspense>
  );
}
