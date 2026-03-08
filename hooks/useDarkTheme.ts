"use client";

import { useCallback, useEffect, useState } from "react";

function getStoredDarkTheme() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("dark-theme") === "true";
}

export function useDarkTheme() {
  const [darkTheme, setDarkTheme] = useState(getStoredDarkTheme);

  useEffect(() => {
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
