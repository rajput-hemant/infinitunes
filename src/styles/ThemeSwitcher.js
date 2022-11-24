import { useEffect, useState } from "react";

const useThemeSwitcher = () => {
	const [theme, setTheme] = useState("dark");

	// set theme to machines local storage
	const setMode = (theme) => {
		window.localStorage.setItem("theme", theme);
		setTheme(theme);
	};

	const toggleTheme = () =>
		theme === "dark" ? setMode("light") : setMode("dark");

	// setting the stored theme
	useEffect(() => {
		const localTheme = window.localStorage.getItem("theme");
		localTheme ? setTheme(localTheme) : setMode("dark");
	}, []);

	return [theme, toggleTheme];
};

export default useThemeSwitcher;
