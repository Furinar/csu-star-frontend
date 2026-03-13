"use client";

import { useDarkTheme } from "@/hooks/useDarkTheme";

export default function ThemeToggle({
  className = "",
}: {
  className?: string;
}) {
  const { darkTheme, toggleTheme } = useDarkTheme();

  return (
    <i
      className={`uil ${darkTheme ? "uil-sun" : "uil-moon"} text-xl text-title cursor-pointer hover:text-first ${className}`}
      onClick={toggleTheme}
    />
  );
}
