import type { Metadata } from "next";

import { NotFoundBody } from "~/components/not-found";

export const metadata: Metadata = {
  title: "Error 404",
  description: "Page not found, but there are plenty of other great tunes!",
};

export default function NotFound() {
  return <NotFoundBody className="min-h-dvh" />;
}
