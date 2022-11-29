import { useDispatch } from "react-redux";
import { searchActions } from "../../store/search-slice";
import { useEffect, useState } from "react";
import { CiSearch } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { BsFillMoonFill, BsFillSunFill } from "react-icons/bs";

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
import Dropdown from "../Dropdown/Dropdown";

const navItems = [
	{ label: "Home", to: "/" },
	{ label: "Playlists", to: "/playlists" },
	{ label: "Charts", to: "/charts" },
];

const Navbar = (props) => {
	// for clearing the search state after page change
	// const { pathname } = useLocation(),
	// 	searchRef = useRef();
	// useEffect(() => {
	// 	searchRef.current.value = "";
	// 	setInput("");
	// }, [pathname]);

	const navigate = useNavigate(),
		dispatch = useDispatch(),
		[input, setInput] = useState();

	const searchInputHandler = (event) => {
		setInput(event.target.value);
	};

	const onBlurHandler = (event) => {
		event.target.value = "";
	};

	useEffect(() => {
		dispatch(searchActions.updateSearchInput(input));
	}, [input]);

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
					// ref={searchRef}
					onBlur={onBlurHandler}
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
