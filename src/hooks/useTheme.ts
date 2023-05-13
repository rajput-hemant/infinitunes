import { useLayoutEffect } from "react";

import { useLocalStorage } from ".";

type Theme = "light" | "dark";

const useTheme = () => {
  const [theme, setTheme] = useLocalStorage<Theme>("theme", "dark");

  useLayoutEffect(() => {
    const html = document.querySelector("html");

    html?.classList.add(theme);

    return () => {
      html?.classList.remove(theme);
    };
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return { theme, toggleTheme };
};

export default useTheme;
