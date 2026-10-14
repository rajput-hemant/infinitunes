/** Shared with the skeleton so the placeholder header keeps the real height. */
export const catalogHeaderClassName = "space-y-1 pt-2 pb-6";
export const catalogTitleClassName =
  "font-heading text-[1.75rem] leading-8 font-bold tracking-[-0.025em] capitalize md:text-[2rem] md:leading-10";

type CatalogHeaderProps = {
  title: string;
  subtitle?: string;
};

export function CatalogHeader({ title, subtitle }: CatalogHeaderProps) {
  return (
    <header className={catalogHeaderClassName}>
      <h1 className={catalogTitleClassName}>{title}</h1>
      {subtitle && (
        <p className="text-sm leading-5 text-muted-foreground">{subtitle}</p>
      )}
    </header>
  );
}
