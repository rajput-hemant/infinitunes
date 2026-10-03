import { SearchX } from "lucide-react";
import Image from "next/image";

export function ErrorIllustration() {
  return (
    <>
      <Image
        src="/images/searching-duck.gif"
        width={100}
        height={100}
        alt="Searching Duck"
        className="size-28 object-cover drop-shadow-sm motion-reduce:hidden"
      />

      <span
        aria-hidden
        className="hidden size-28 place-items-center rounded-full bg-muted text-muted-foreground motion-reduce:grid"
      >
        <SearchX className="size-12" />
      </span>
    </>
  );
}
