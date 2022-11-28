import { FaPlay } from "react-icons/fa";
import { GridItemCard } from "./GridItem.style";

const GridItem = ({ src, alt, title, subtitle, onNavigate }) => {
	return (
		<GridItemCard>
			<div>
				<img src={src} alt={alt} />
				<button onClick={() => onNavigate()}>
					<FaPlay size={50} color="#74f2ce" />
				</button>
				<h4>{title}</h4>
				<h5>{subtitle}</h5>
			</div>
		</GridItemCard>
	);
};

export default GridItem;
