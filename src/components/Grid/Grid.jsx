import { useNavigate } from "react-router-dom";
import { GridContainer } from "./Grid.style";
import GridItem from "./GridItem.jsx";

const Grid = ({ source }) => {
	const navigate = useNavigate();

	const redirect = (item) => {
		const id = item.id || item.listid,
			type = item.type || item.data_type,
			title = (item.title || item.listname)
				.toLowerCase()
				.replace(/[^\w\s]/gi, "")
				.replaceAll(" ", "+");

		navigate(`/playlist/${id}/${title}`, { state: { id, type } });
	};

	return (
		<GridContainer>
			{source.map((item, index) => (
				<GridItem
					key={index}
					src={item.image}
					title={item.listname || item.title}
					subtitle={
						item.subtitle ||
						`${(item.follower_count / 1000).toFixed(2)}k Followers`
					}
					onNavigate={() => redirect(item)}
					alt={item.listname || item.title}
				/>
			))}
		</GridContainer>
	);
};

export default Grid;
