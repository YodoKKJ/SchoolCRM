import { useEffect, useState } from "react";

const STORAGE_KEY = "skolyo.theme";

function readInitial() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export default function useTheme() {
  const [theme, setThemeState] = useState(readInitial);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (next) => setThemeState(next === "dark" ? "dark" : "light");
  const toggle = () => setThemeState((t) => (t === "light" ? "dark" : "light"));

  return { theme, setTheme, toggle };
}
