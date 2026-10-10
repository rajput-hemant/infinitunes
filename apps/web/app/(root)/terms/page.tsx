import { pageMetadata } from "~/lib/metadata";

const title = "Terms of Service";
const description = "The terms governing use of Infinitunes.";

export const metadata = pageMetadata({
  title,
  description,
  url: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-8">
      <h1 className="font-heading text-2xl dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        Terms of Service
      </h1>

      <p className="rounded-md border p-4 text-sm text-muted-foreground">
        Draft placeholder for the owner to replace: these terms are not final
        and do not constitute legal advice.
      </p>

      <p className="text-sm text-muted-foreground">
        By using Infinitunes you agree to use the service lawfully, to respect
        the rights of artists and rights holders, and to accept that all media
        shown here belongs to its respective owners.
      </p>
    </div>
  );
}
