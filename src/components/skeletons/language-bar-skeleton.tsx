import { languages } from "@/config/languages";
import { Badge } from "../ui/badge";

export function LanguageBarSkeleton() {
  return (
    <div className="border-b py-2">
      <div className="flex space-x-2 overflow-x-hidden py-1 sm:space-x-6 md:space-x-10 lg:space-x-12">
        {["for_you", ...languages].map((lang) => (
          <Badge
            key={lang}
            className="bg-primary-foreground p-2 text-primary-foreground lg:px-4"
          >
            {lang}
          </Badge>
        ))}
      </div>
    </div>
  );
}
