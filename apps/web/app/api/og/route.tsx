/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { readFile } from "node:fs/promises";

import { ImageResponse } from "next/og";

import { siteConfig } from "~/config/site";
import { parseAllowedImageUrl } from "~/lib/image-hosts";
import { cn } from "~/lib/utils";

const DEFAULT_IMAGE = "https://graph.org/file/16937ebb693470d804f31.png";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Redirects are refused so an allowlisted host cannot bounce the server to an
// internal address; the body is capped and the request time-boxed.
async function fetchImage(url: URL) {
  const res = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok || !res.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("Image is not available");
  }
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new Error("Image too large");
  return buffer;
}

// Read from disk rather than `fetch()`: on the Node runtime undici refuses
// `file:` URLs, and the bundler rewrites this URL to the emitted asset.
async function fetchFonts() {
  return readFile(
    new URL("../../../public/fonts/CalSans-SemiBold.woff", import.meta.url),
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.slice(0, 100) ?? siteConfig.name;
  const description =
    searchParams.get("description")?.slice(0, 300) ?? siteConfig.description;

  const requestedImage = searchParams.get("image");
  // The default is a trusted constant; anything caller-supplied must be on the
  // image CDN allowlist.
  const imageUrl = requestedImage
    ? parseAllowedImageUrl(requestedImage)
    : new URL(DEFAULT_IMAGE);

  if (!imageUrl) {
    return new Response("Invalid image URL", { status: 400 });
  }

  const isSquaredImage = searchParams.get("square") === "true";

  try {
    const image = await fetchImage(imageUrl);
    const font = await fetchFonts();

    return new ImageResponse(
      <div tw="relative flex h-full bg-black text-white">
        <svg
          viewBox="0 0 1024 1024"
          style={{
            transform: "translateX(-50%)",
            maskImage: "radial-gradient(closest-side,white,transparent)",
          }}
          // @ts-expect-error property 'tw' does not exist on type svg
          tw="absolute left-1/2 top-1/2 ml-0 h-256 w-5xl"
        >
          <circle
            cx="512"
            cy="512"
            r="512"
            fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
            fillOpacity="0.7"
          />
          <defs>
            <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
              <stop stopColor="#7775D6" />
              <stop offset="1" stopColor="#E935C1" />
            </radialGradient>
          </defs>
        </svg>

        <div tw="flex h-full w-1/2 flex-col justify-between px-12 py-24">
          <header tw="flex flex-col">
            <h1 tw="flex items-center text-4xl">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                // @ts-expect-error property 'tw' does not exist on type svg
                tw="mt-1.5 mr-1 h-10 w-10"
              >
                <path
                  fill="CurrentColor"
                  d="M 19.6875 2 L 8.6875 3.5 C 7.6875 3.601563 7 4.5 7 5.5 L 7 15.78125 C 6.539063 15.699219 6.039063 15.699219 5.5 15.8125 C 3.601563 16.3125 2 17.988281 2 19.6875 C 2 21.386719 3.601563 22.40625 5.5 21.90625 C 7.398438 21.40625 9 19.699219 9 18 L 9 9.40625 L 20 7.9375 L 20 14.71875 C 19.539063 14.636719 19.039063 14.671875 18.5 14.8125 C 16.601563 15.3125 15 16.988281 15 18.6875 C 15 20.386719 16.601563 21.40625 18.5 20.90625 C 20.398438 20.40625 22 18.699219 22 17 L 22 4 C 22 2.800781 20.886719 1.898438 19.6875 2 Z"
                />
              </svg>
              {title}
            </h1>

            <p tw="text-3xl font-medium">{description}</p>
          </header>

          <div tw="text-lg font-medium">
            {siteConfig.links.github.replace("https://", "")}
          </div>
        </div>

        <div tw="relative flex h-full w-1/2 overflow-hidden">
          <img
            // @ts-expect-error arrayBuffer is not assignable to string
            src={image}
            tw={cn(
              "mx-8 my-auto w-4xl max-w-none rounded-2xl border border-zinc-800 shadow-lg shadow-[#e935c277]",
              isSquaredImage && "w-lg",
            )}
          />
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "heading",
            data: font,
            style: "normal",
          },
        ],
      },
    );
  } catch (e) {
    console.log((e as Error).message);

    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
