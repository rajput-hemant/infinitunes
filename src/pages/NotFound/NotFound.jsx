import { NotFoundContainer } from "./NotFound.style";
import NotFoundImg from "../../assets/images/404.png";
import { StyledLink } from "../../components/Navbar/TopNav.style";

const NotFound = () => {
	console.log("Not Found");
	return (
		<NotFoundContainer>
			<img src={NotFoundImg} />
			<h3>This page seems to be missing.</h3>
			<h4>But, there are plenty of other great tunes! </h4>
			<h4> Try one of these:</h4>
			<StyledLink to="/playlist">Playlists</StyledLink>
		</NotFoundContainer>
	);
};

export default NotFound;
