import {
	NotFoundContainer,
	RecommendWrapper,
	StyledLink,
} from "./NotFound.style";
import NotFoundImg from "../../assets/images/404.png";

const recommend = [
	{ label: "Featured Playlists", to: "/playlist" },
	{ label: "Top Charts", to: "/charts" },
];

const NotFound = () => {
	console.log("Not Found");
	return (
		<NotFoundContainer>
			<img src={NotFoundImg} />
			<h3>This page seems to be missing.</h3>
			<h4>But, there are plenty of other great tunes! </h4>
			<h4> Try one of these:</h4>
			<RecommendWrapper>
				{recommend.map((item, index) => {
					return (
						<StyledLink key={index} to={item.to}>
							/ · {item.label} · /
						</StyledLink>
					);
				})}
			</RecommendWrapper>
		</NotFoundContainer>
	);
};

export default NotFound;
