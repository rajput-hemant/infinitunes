import { FaPlay } from "react-icons/fa";

import { GridItemCard } from "./GridItem.style";
import { Motion } from "../../styles/Motion";

const GridItem = ({ src, alt, title, subtitle, onNavigate }) => {
	return (
		<GridItemCard>
			<Motion
				initial={{ opacity: 0, scale: 0.7 }}
				whileInView={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, type: "tween" }}
			>
				<img src={src} alt={alt} />
				<button onClick={() => onNavigate()}>
					<FaPlay size={50} color="#74f2ce" />
				</button>
				<h4>{title}</h4>
				<h5>{subtitle}</h5>
			</Motion>
		</GridItemCard>
	);
};

export default GridItem;
