import { pageMetadata } from "~/lib/metadata";

const title = "Privacy Policy";
const description = "How Infinitunes handles your data.";

export const metadata = pageMetadata({
  title,
  description,
  url: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 py-8">
      <h1 className="font-heading text-2xl dark:drop-shadow-md text-foreground sm:text-3xl md:text-4xl">
        Privacy Policy
      </h1>

      <p className="rounded-md border p-4 text-sm text-muted-foreground">
        Draft placeholder for the owner to replace: this policy is not final and
        does not constitute legal advice.
      </p>

      <p className="text-sm text-muted-foreground">
        Infinitunes stores only what it needs to run your library and account,
        never sells your data, and lets you delete your account and its data at
        any time from settings.
      </p>
    </div>
  );
}
