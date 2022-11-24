import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import useThemeSwitcher from "./hooks/useThemeSwitcher";

import GlobalStyles, { themes } from "./styles/GlobalStyles";
import Player from "./components/Player/Player";
import Navbar from "./components/Navbar/TopNav";
import Home from "./pages/Home/Home";
import Playlists from "./pages/Playlists/Playlists";
import Charts from "./pages/Charts/Charts";
import Settings from "./pages/Settings/Settings";
import Search from "./pages/Search/Search";
import About from "./pages/About/About";
import { ThemeProvider } from "styled-components";

const App = () => {
	const [theme, toggleTheme] = useThemeSwitcher();
	const themeMode = theme === "light" ? themes.light : themes.dark;

	return (
		<Router>
			<ThemeProvider theme={themeMode} >
				<GlobalStyles />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/playlist" element={<Playlists />} />
					<Route path="/charts" element={<Charts />} />
					<Route path="/search" element={<Search />} />
					<Route path="/settings" element={<Settings />} />
					<Route path="/about" element={<About />} />
				</Routes>
				<Navbar theme={theme} toggleTheme={toggleTheme} />
				<Player />
			</ThemeProvider>
		</Router>
	);
};

export default App;
