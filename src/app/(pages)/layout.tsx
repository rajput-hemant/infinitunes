import SecondaryNavbar from "@/components/navbar/sec-nav";
import SiteHeader from "@/components/navbar/site-header";
import Player from "@/components/player";
import Sidebar from "@/components/sidebar";
import SiteFooter from "@/components/site-footer";
import RouteGuard from "./route-guard";

type Props = {
  children: React.ReactNode;
};

const RoutesLayout = ({ children }: Props) => {
  return (
    <>
      <RouteGuard />

      <SiteHeader />

      <Sidebar className="fixed left-0 top-14 hidden h-full w-1/5 border-r lg:block xl:w-[15%]" />

      <main className="p-4 pb-36 lg:ml-[20%] lg:pb-20 xl:ml-[15%]">
        <SecondaryNavbar />

        {children}

        <SiteFooter />
      </main>

      <Player />
    </>
  );
};

export default RoutesLayout;
