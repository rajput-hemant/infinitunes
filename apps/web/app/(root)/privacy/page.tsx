import { noindexMetadata, pageMetadata } from "~/lib/metadata";

const title = "Privacy Policy";
const description = "How Infinitunes handles your data.";

export const metadata = {
  ...pageMetadata({ title, description, url: "/privacy" }),
  ...noindexMetadata,
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
        Privacy Policy
      </h1>

      <p className="rounded-(--r-sm) border border-border bg-fill p-4 text-sm leading-5 text-muted-foreground">
        The policy is being written and is not available yet.
      </p>
    </div>
  );
}
