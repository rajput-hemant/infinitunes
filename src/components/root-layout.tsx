import Footer from "./footer";
import Navbar from "./navbar";
import Player from "./player";

type RootLayoutProps = {
  children: React.ReactNode;
};

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container grow py-4">{children}</main>

      <Footer />

      <Player />
    </div>
  );
};

export default RootLayout;
