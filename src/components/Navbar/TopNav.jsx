import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { CiSearch } from "react-icons/ci";
import { BsFillMoonFill, BsFillSunFill } from "react-icons/bs";

import Dropdown from "../Dropdown/Dropdown";
import { searchActions } from "../../store/search-slice";
import LogoSrc from "../../assets/images/infinitunes1500.png";
import {
	MainContainer,
	Logo,
	LinkContainer,
	LeftContainer,
	RightContainer,
	StyledLink,
	SearchContainer,
	SearchInput,
	IconButton,
	SearchIconContainer,
} from "./TopNav.style";

const navItems = [
	{ label: "Home", to: "/" },
	{ label: "Playlists", to: "/playlists" },
	{ label: "Charts", to: "/charts" },
];

const Navbar = (props) => {
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { pathname } = useLocation();
	const searchRef = useRef();
	const [input, setInput] = useState("");
	const query = useSelector((state) => state.search.searchInput);

	// for clearing the search state after page change
	useEffect(() => {
		if (pathname === "/search") searchRef.current.value = query;
		else searchRef.current.value = "";
	}, [pathname, query]);

	const searchInputHandler = (event) => {
		setInput(event.target.value);
	};

	useEffect(() => {
		dispatch(searchActions.updateSearchInput(input));
	}, [input, dispatch]);

	return (
		<MainContainer>
			<Logo src={LogoSrc} alt="Inifitunes Logo" />
			<LeftContainer>
				<LinkContainer>
					{navItems.map(({ label, to }, index) => (
						<StyledLink key={index} to={to}>
							{label}
						</StyledLink>
					))}
				</LinkContainer>
			</LeftContainer>
			<SearchContainer>
				<SearchIconContainer>
					<CiSearch size={20} color="white" />
				</SearchIconContainer>
				<SearchInput
					ref={searchRef}
					placeholder="Search"
					onChange={searchInputHandler}
					onClick={() => navigate("/search")}
				/>
			</SearchContainer>
			<RightContainer>
				<IconButton>
					{props.theme === "light" ? (
						<BsFillMoonFill
							onClick={props.toggleTheme}
							size={30}
							color="white"
						/>
					) : (
						<BsFillSunFill
							onClick={props.toggleTheme}
							size={30}
							color="white"
						/>
					)}
				</IconButton>
				<Dropdown />
			</RightContainer>
		</MainContainer>
	);
};

export default Navbar;
