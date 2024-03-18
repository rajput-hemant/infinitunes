import { getUser } from "@/lib/auth";

export async function SignedIn({ children }: React.PropsWithChildren) {
  const user = await getUser();

  return user ? <>{children}</> : null;
}

export async function SignedOut({ children }: React.PropsWithChildren) {
  const user = await getUser();

  return user ? null : <>{children}</>;
}
