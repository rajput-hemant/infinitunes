import type { ArtistBioSection } from "@infinitunes/types";

type ArtistBioProps = { sections: ArtistBioSection[] };

export function ArtistBio({ sections }: ArtistBioProps) {
  return (
    <div className="flex flex-col gap-8 rounded-md bg-card p-6 ring-1 ring-inset ring-border">
      {sections.map((section, index) => (
        <section
          key={`${index}-${section.title}`}
          className="flex max-w-[70ch] flex-col gap-3"
        >
          {section.title && (
            <h3 className="font-heading text-lg text-foreground">
              {section.title}
            </h3>
          )}

          {section.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-sm leading-7 text-muted-foreground">
              {paragraph}
            </p>
          ))}

          {section.bullets && (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-7 text-muted-foreground marker:text-primary">
              {section.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
