import { History } from "lucide-react";

import { LibraryEmpty } from "~/components/library/library-section";

export const metadata = {
  title: "Recently Played",
  description: "Songs you listened to lately.",
};

export default function RecentlyPlayedPage() {
  return (
    <LibraryEmpty
      icon={History}
      title="Recently played is coming soon"
      description="Listening history isn’t tracked yet. Keep listening, and it will appear here once it is."
      action={{ href: "/", label: "Find Something to Play" }}
    />
  );
}
