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
    <div className="mx-auto max-w-[42rem] space-y-4 px-4 py-8">
      <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
        Terms of Service
      </h1>

      <p className="rounded-(--r-sm) border border-border bg-fill p-4 text-sm leading-5 text-muted-foreground">
        Draft placeholder for the owner to replace: these terms are not final
        and do not constitute legal advice.
      </p>

      <p className="text-sm leading-5 text-muted-foreground">
        By using Infinitunes you agree to use the service lawfully, to respect
        the rights of artists and rights holders, and to accept that all media
        shown here belongs to its respective owners.
      </p>
    </div>
  );
}
