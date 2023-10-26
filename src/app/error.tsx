"use client";

import { useEffect } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { H1 } from "@/components/ui/topography";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <Image
        src="/images/searching-duck.gif"
        width={100}
        height={100}
        alt="Searching Duck"
        className="h-28 w-28 object-cover"
      />

      <H1>Something went wrong!</H1>

      <Button variant="outline" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
