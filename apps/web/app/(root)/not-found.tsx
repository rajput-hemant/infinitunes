import type { Metadata } from "next";

import { NotFoundBody } from "~/components/not-found";

export const metadata: Metadata = {
  title: "Error 404",
  description: "Page not found, but there are plenty of other great tunes!",
};

export default function RootNotFound() {
  return <NotFoundBody className="min-h-[60dvh]" />;
}
