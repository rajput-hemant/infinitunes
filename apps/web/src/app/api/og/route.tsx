/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const runtime = "edge";

async function fetchImage(url: string) {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  return buffer;
}

async function fetchFonts() {
  const res = await fetch(
    new URL("../../../../public/fonts/CalSans-SemiBold.woff", import.meta.url)
  );

  const buffer = await res.arrayBuffer();

  return buffer;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.slice(0, 100) ?? siteConfig.name;
  const description =
    searchParams.get("description")?.slice(0, 300) ?? siteConfig.description;

  const imageUrl =
    searchParams.get("image") ??
    "https://graph.org/file/16937ebb693470d804f31.png";

  const isSquaredImage = searchParams.get("square") === "true";

  const image = await fetchImage(imageUrl);
  const font = await fetchFonts();

  try {
    return new ImageResponse(
      (
        <div tw="relative flex h-full bg-black text-white">
          <svg
            viewBox="0 0 1024 1024"
            style={{
              transform: "translateX(-50%)",
              maskImage: "radial-gradient(closest-side,white,transparent)",
            }}
            // @ts-expect-error property 'tw' does not exist on type svg
            tw="absolute left-1/2 top-1/2 ml-0 h-[64rem] w-[64rem]"
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
                "mx-8 my-auto w-[56rem] max-w-none rounded-2xl border border-zinc-800 shadow-lg shadow-[#e935c277]",
                isSquaredImage && "w-[32rem]"
              )}
            />
          </div>
        </div>
      ),
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
      }
    );
  } catch (e) {
    console.log((e as Error).message);

    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
