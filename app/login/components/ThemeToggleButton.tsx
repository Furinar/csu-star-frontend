"use client";

import { useDarkTheme } from "@/hooks/useDarkTheme";
import styles from "./ThemeToggleButton.module.css";

export default function ThemeToggleButton() {
  const { toggleTheme } = useDarkTheme();

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={toggleTheme}
      aria-label="切换主题"
      title="切换主题"
    >
      <i className="uil uil-sun theme-icon-sun" />
      <i className="uil uil-moon theme-icon-moon" />
    </button>
  );
}
