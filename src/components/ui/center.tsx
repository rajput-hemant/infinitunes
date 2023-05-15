import { cn } from "@/lib/utils";

type CenterProps = {
  absolutely?: boolean;
  children: React.ReactNode;
};

const Center = ({ absolutely, children }: CenterProps) => {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center",
        absolutely && "absolute inset-0"
      )}
    >
      {children}
    </div>
  );
};

export default Center;
