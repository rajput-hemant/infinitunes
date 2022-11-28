import { useEffect, useState } from "react";

import api from "../../api/JioSaavnApi";
import Grid from "../../components/Grid/Grid";

const Charts = () => {
	const [charts, setCharts] = useState([]);

	useEffect(() => {
		const fetchCharts = async () => {
			const response = await api.getCharts();
			setCharts(response);
		};
		try {
			fetchCharts();
		} catch (error) {
			console.log("Unable to fetch Charts: ", error);
		}
	}, [charts.length]);

	return <Grid source={charts} />;
};

export default Charts;
