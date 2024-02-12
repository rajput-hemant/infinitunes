import SecondaryNavbar from "@/components/navbar/sec-nav";
import SiteHeader from "@/components/navbar/site-header";
import Player from "@/components/player";
import Sidebar from "@/components/sidebar";
import SiteFooter from "@/components/site-footer";
import { getUser } from "@/lib/auth";
import RouteGuard from "./route-guard";

type Props = {
  children: React.ReactNode;
};

const RoutesLayout = async ({ children }: Props) => {
  const user = await getUser();

  return (
    <>
      <RouteGuard />

      <SiteHeader />

      <Sidebar
        user={user}
        className="fixed left-0 top-14 hidden h-full w-1/5 border-r lg:block xl:w-[15%]"
      />

      <main className="p-2 pb-36 sm:p-4 lg:ml-[20%] lg:pb-20 xl:ml-[15%]">
        <SecondaryNavbar />

        {children}

        <SiteFooter />
      </main>

      <Player />
    </>
  );
};

export default RoutesLayout;
