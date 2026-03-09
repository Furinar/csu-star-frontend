"use client";

import { useCallback, useEffect, useState } from "react";

function getStoredDarkTheme() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem("dark-theme");
  if (stored !== null) return stored === "true";
  return document.documentElement.classList.contains("dark-theme");
}

export function useDarkTheme() {
  const [darkTheme, setDarkTheme] = useState(getStoredDarkTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-theme", darkTheme);
    document.body.classList.toggle("dark-theme", darkTheme);
  }, [darkTheme]);

  const toggleTheme = useCallback(() => {
    setDarkTheme((prev) => {
      const next = !prev;
      localStorage.setItem("dark-theme", String(next));
      return next;
    });
  }, []);

  return { darkTheme, toggleTheme };
}
