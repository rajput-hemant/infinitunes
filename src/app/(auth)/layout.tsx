import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import AuthModeToggle from "@/components/auth/auth-mode-toggle";
import { buttonVariants } from "@/components/ui/button";
import { H2 } from "@/components/ui/topography";

type Props = { children: React.ReactNode };

async function AuthLayout({ children }: Props) {
  const user = await getUser();

  if (user) {
    redirect("/");
  }

  const imageUrl = `/images/artists/${+(Math.random() * 10).toFixed()}.png`;

  return (
    <div className="grid h-screen lg:grid-cols-2">
      {/* top sign-in/sign-up link */}
      <AuthModeToggle />

      {/* left half */}
      <div className="hidden h-full flex-col justify-between bg-zinc-900 p-10 text-white dark:border-r lg:flex">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "group w-fit bg-inherit dark:bg-transparent"
          )}
        >
          <ArrowLeft className="mr-1 h-4 w-4 duration-300 group-hover:-translate-x-1" />
          Back
        </Link>

        <Image
          src={imageUrl}
          width={1280}
          height={843}
          alt="Authentication"
          className="animate-in zoom-in-50 mx-auto max-w-md object-cover duration-1000"
        />

        <div className="mb-20 text-center 2xl:mb-32">
          <H2>All Your Music.</H2>
          <em className="text-muted-foreground">Anytime, anywhere.</em>
        </div>
      </div>

      {/* right half */}
      <div className="m-auto flex w-full flex-col justify-center space-y-6 p-8 sm:w-[400px] sm:p-0">
        <Image
          src="/images/logo512.png"
          width={100}
          height={100}
          alt={`${siteConfig.name} Logo`}
          className="mx-auto"
        />

        <H2 className="text-center font-semibold">
          Welcome to <span className="lowercase">{siteConfig.name}</span>.
        </H2>

        {children}
      </div>
    </div>
  );
}

export default AuthLayout;
