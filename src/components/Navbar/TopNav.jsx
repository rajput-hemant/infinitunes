import { CiSearch } from "react-icons/ci";
import { BsPersonCircle } from "react-icons/bs";

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
	{ id: "m1", label: "Home", to: "/" },
	{ id: "m2", label: "Podcasts", to: "/playlist" },
];

const Navbar = () => {
	return (
		<MainContainer>
			<Logo src={LogoSrc} alt="Inifitunes Logo" />
			<LeftContainer>
				<LinkContainer>
					{navItems.map(({ id, label, to }) => (
						<StyledLink key={id} to={to}>
							{label}
						</StyledLink>
					))}
				</LinkContainer>
			</LeftContainer>
			<SearchContainer>
				<SearchIconContainer>
					<CiSearch size={20} color="grey" />
				</SearchIconContainer>
				<SearchInput placeholder="Search" required />
			</SearchContainer>
			<RightContainer>
				<IconButton>
					<BsPersonCircle size={30} color="white" />
				</IconButton>
			</RightContainer>
		</MainContainer>
	);
};

export default Navbar;
