import type { MyPlaylist } from "@/lib/db/schema";

type UsersPlaylistsProps = {
  playlists: MyPlaylist[];
};

export function UsersPlaylists({ playlists }: UsersPlaylistsProps) {
  return (
    <div>
      <pre>{JSON.stringify(playlists, null, 2)}</pre>
    </div>
  );
}
