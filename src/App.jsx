import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "styled-components";

import useThemeSwitcher from "./hooks/useThemeSwitcher";

import GlobalStyles, { themes } from "./styles/GlobalStyles";
import Player from "./components/Player/Player";
import Navbar from "./components/Navbar/TopNav";
import Home from "./pages/Home/Home";
import Playlist from "./pages/Playlist/Playlist";
import Charts from "./pages/Charts/Charts";
import Settings from "./pages/Settings/Settings";
import Search from "./pages/Search/Search";
import About from "./pages/About/About";
import Album from "./pages/Album/Album";
import NotFound from "./pages/NotFound/NotFound";

const App = () => {
	const [theme, toggleTheme] = useThemeSwitcher();
	const themeMode = theme === "light" ? themes.light : themes.dark;

	return (
		<Router>
			<ThemeProvider theme={themeMode}>
				<GlobalStyles />
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/playlists" element={<Playlist />} />
					<Route path="/playlist/:id/:title" element={<Playlist />} />
					<Route path="/search" element={<Search />} />
					<Route path="/search/:id/:title" element={<Search />} />
					<Route path="/charts" element={<Charts />} />
					<Route path="/album/:id/:title" element={<Album />} />
					<Route path="/settings" element={<Settings />} />
					<Route path="/about" element={<About />} />
					<Route path="/*" element={<NotFound />} />
				</Routes>
				<Navbar theme={theme} toggleTheme={toggleTheme} />
				<Player />
			</ThemeProvider>
		</Router>
	);
};

export default App;
