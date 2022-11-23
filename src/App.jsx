import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import GlobalStyles from "./styles/GlobalStyles";
import Player from "./components/Player/Player";
import Navbar from "./components/Navbar/TopNav";
import Home from "./pages/Home/Home";

const App = () => {
	return (
		<Router>
			<GlobalStyles />
			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/playlist" />
				<Route path="/charts" />
				<Route path="/search" />
			</Routes>
			<Navbar />
			<Player />
		</Router>
	);
};

export default App;
