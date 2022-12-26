import { lazy, Suspense } from "react";
import { ThemeProvider } from "styled-components";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import useThemeSwitcher from "./hooks/useThemeSwitcher";

import GlobalStyles, { themes } from "./styles/GlobalStyles";
import Player from "./components/Player/Player";
import Navbar from "./components/Navbar/TopNav";

const Home = lazy(() => import("./pages/Home/Home"));
const About = lazy(() => import("./pages/About/About"));
const Album = lazy(() => import("./pages/Album/Album"));
const Search = lazy(() => import("./pages/Search/Search"));
const Charts = lazy(() => import("./pages/Charts/Charts"));
const Playlist = lazy(() => import("./pages/Playlist/Playlist"));
const Settings = lazy(() => import("./pages/Settings/Settings"));
const NotFound = lazy(() => import("./pages/NotFound/NotFound"));
const Playlists = lazy(() => import("./pages/Playlist/Playlists"));

const App = () => {
	const [theme, toggleTheme] = useThemeSwitcher();
	const themeMode = theme === "light" ? themes.light : themes.dark;

	return (
		<Router>
			<ThemeProvider theme={themeMode}>
				<GlobalStyles />
				<Suspense>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/search" element={<Search />} />
						<Route path="/charts" element={<Charts />} />
						<Route path="/about" element={<About />} />
						<Route path="/settings" element={<Settings />} />
						<Route path="/playlists" element={<Playlists />} />
						<Route path="/album/:id/:title" element={<Album />} />
						<Route path="/playlist/:id/:title" element={<Playlist />} />
						<Route path="/*" element={<NotFound />} />
					</Routes>
					<Navbar theme={theme} toggleTheme={toggleTheme} />
					<Player />
				</Suspense>
			</ThemeProvider>
		</Router>
	);
};

export default App;
