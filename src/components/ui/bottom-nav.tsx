import { BiAlbum } from "react-icons/bi";
import { BsBarChart } from "react-icons/bs";
import { GoHome, GoSearch } from "react-icons/go";
import { TbPlaylist } from "react-icons/tb";
import { Link } from "react-router-dom";

const BottomNav = () => {
  return (
    <footer className="bg-background/90 fixed bottom-0 z-50 h-16 w-full border-t border-zinc-600 backdrop-blur lg:hidden">
      <div className="flex h-14 items-center justify-around">
        <Link to="/">
          <GoHome size={30} />
        </Link>

        <Link to="/album">
          <BiAlbum size={30} />
        </Link>

        <Link to="/chart">
          <BsBarChart size={30} />
        </Link>

        <Link to="/playlist">
          <TbPlaylist size={30} />
        </Link>

        <Link to="/search">
          <GoSearch size={30} />
        </Link>
      </div>
    </footer>
  );
};

export default BottomNav;
