import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { artistPath, splitArtistSlug } from "~/lib/artist-route";
import { asRoute } from "~/lib/utils";

import { ArtistBio } from "../_components/artist-bio";
import {
  artistBio,
  artistTabMetadata,
  getArtist,
} from "../_components/artist-data";
import { ArtistBioSkeleton } from "../_components/artist-skeleton";

type ArtistBioPageProps = PageProps<"/artist/[name]/[token]/bio">;

async function BioPanel({ params }: Pick<ArtistBioPageProps, "params">) {
  const { name, token } = await params;
  const sections = artistBio(await getArtist(token));

  // The tab is hidden for an artist without a biography; a typed URL goes home.
  if (sections.length === 0) {
    redirect(
      asRoute(artistPath(splitArtistSlug(name).name, token, "overview")),
    );
  }

  return (
    <div className="max-w-3xl">
      <ArtistBio sections={sections} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: ArtistBioPageProps): Promise<Metadata> {
  const { name, token } = await params;

  return artistTabMetadata(await getArtist(token), name, token, "bio");
}

export default function ArtistBioPage({ params }: ArtistBioPageProps) {
  return (
    <Suspense fallback={<ArtistBioSkeleton />}>
      <BioPanel params={params} />
    </Suspense>
  );
}
