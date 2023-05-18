import { CiSearch } from "react-icons/ci";
import { useNavigate } from "react-router-dom";

import { setSearch } from "@/store/search-slice";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { Input } from "@/components/ui/input";

type SearchInputProps = {
  className?: string;
};

const SearchInput = ({ className }: SearchInputProps) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { query } = useAppSelector((state) => state.search);

  return (
    <Input
      icon={CiSearch}
      placeholder="Search"
      onClick={() => navigate("/search")}
      value={query}
      onChange={(e) => dispatch(setSearch(e.target.value))}
      className={cn(
        "mx-auto w-72 rounded-full transition-all duration-500 focus-within:w-80 lg:w-80 lg:focus-within:w-96",
        className
      )}
    />
  );
};

export default SearchInput;
