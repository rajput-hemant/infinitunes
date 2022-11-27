import { CiSearch } from "react-icons/ci";
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
				<SearchInput placeholder="Search" required />
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
