import { Link } from "react-router-dom";
import { FiMoreVertical } from "react-icons/fi";
import { IoIosSettings, IoMdInformationCircle } from "react-icons/io";

import { StyledMenu, MenuButton, MenuItems, MenuItem } from "./Dropdown.style";

const Dropdown = () => {
	return (
		<StyledMenu>
			<MenuButton>
				<FiMoreVertical size={35} color="white"></FiMoreVertical>
				<MenuItems>
					<MenuItem>
						{() => (
							<Link to="/settings">
								<IoIosSettings size={36} />
								<span />
								Settings
							</Link>
						)}
					</MenuItem>
					<MenuItem>
						{() => (
							<Link to="/about">
								<IoMdInformationCircle size={35} />
								<span />
								About
							</Link>
						)}
					</MenuItem>
				</MenuItems>
			</MenuButton>
		</StyledMenu>
	);
};

export default Dropdown;
