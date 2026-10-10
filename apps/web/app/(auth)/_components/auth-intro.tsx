type AuthIntroProps = {
  title: string;
  description: string;
};

export function AuthIntro({ title, description }: AuthIntroProps) {
  return (
    <div className="text-center">
      <h1 className="font-heading text-[1.75rem] font-bold leading-8 tracking-[-0.025em] text-foreground">
        {title}
      </h1>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
