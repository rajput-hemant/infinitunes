import { noindexMetadata, pageMetadata } from "~/lib/metadata";

const title = "Terms of Service";
const description = "The terms governing use of Infinitunes.";

export const metadata = {
  ...pageMetadata({ title, description, url: "/terms" }),
  ...noindexMetadata,
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
        Terms of Service
      </h1>

      <p className="rounded-(--r-sm) border border-border bg-fill p-4 text-sm leading-5 text-muted-foreground">
        The terms are being written and are not available yet.
      </p>
    </div>
  );
}
