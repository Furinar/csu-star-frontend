"use client";

import { useCallback, useEffect } from "react";

const THEME_KEY = "dark-theme";

function getStoredDarkTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored !== null) return stored === "true";
  } catch {
  }
  return document.documentElement.classList.contains("dark-theme");
}

function applyTheme(darkTheme: boolean) {
  document.documentElement.classList.toggle("dark-theme", darkTheme);
  document.body?.classList.toggle("dark-theme", darkTheme);
}

export function useDarkTheme() {
  useEffect(() => {
    applyTheme(getStoredDarkTheme());
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark-theme");
    try {
      localStorage.setItem(THEME_KEY, String(next));
    } catch {
    }
    applyTheme(next);
  }, []);

  const darkTheme =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark-theme");

  return { darkTheme, toggleTheme };
}
