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
    <div className="mx-auto max-w-[42rem] space-y-4 px-4 py-8">
      <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
        Privacy Policy
      </h1>

      <p className="rounded-(--r-sm) border border-border bg-fill p-4 text-sm leading-5 text-muted-foreground">
        Draft placeholder for the owner to replace: this policy is not final and
        does not constitute legal advice.
      </p>

      <p className="text-sm leading-5 text-muted-foreground">
        Infinitunes stores only what it needs to run your library and account,
        never sells your data, and lets you delete your account and its data at
        any time from settings.
      </p>
    </div>
  );
}
