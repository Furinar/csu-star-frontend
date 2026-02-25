"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navItems = [
  { label: "首页", href: "#home", icon: "uil-estate" },
  { label: "关于", href: "#about", icon: "uil-user" },
  { label: "展示", href: "#portfolio", icon: "uil-scenery" },
  { label: "技术栈", href: "#skills", icon: "uil-file-alt" },
  { label: "联系", href: "#contact", icon: "uil-message" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [darkTheme, setDarkTheme] = useState(
    () =>
      typeof window !== "undefined" &&
      localStorage.getItem("dark-theme") === "true",
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY >= 80);
      const sections = document.querySelectorAll("section[id]");
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        const h = sec.clientHeight;
        const id = sec.getAttribute("id") || "";
        if (
          top <= window.innerHeight / 2 &&
          top + h >= window.innerHeight / 2
        ) {
          setActiveSection(id);
        }
      });
    };
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleTheme = () => {
    const next = !darkTheme;
    setDarkTheme(next);
    document.body.classList.toggle("dark-theme", next);
    localStorage.setItem("dark-theme", String(next));
  };

  return (
    <header
      className={`fixed bottom-0 left-0 w-full z-fixed md:top-0 md:bottom-auto md:px-4 lg:px-4 bg-body ${scrolled ? "shadow-[0_-1px_4px_rgba(0,0,0,0.15)]" : ""}`}
      id="header"
    >
      <nav className="container flex justify-between items-center h-(--header-height) md:h-[calc(var(--header-height)+1.5rem)] md:gap-x-4">
        <Link
          href="/"
          className="uppercase text-title font-medium hover:text-first"
        >
          csu star
        </Link>

        <div
          className={`fixed left-0 w-full bg-body px-6 pt-8 pb-16 shadow-[0_-1px_4px_rgba(0,0,0,0.15)] rounded-t-3xl transition-all duration-300 max-[350px]:px-1 md:static md:w-auto md:bg-transparent md:p-0 md:shadow-none md:rounded-none md:ml-auto ${menuOpen ? "bottom-0" : "-bottom-full md:bottom-auto"}`}
        >
          <ul className="grid grid-cols-5 justify-evenly md:flex md:gap-x-8">
            {navItems.map((item) => (
              <li
                key={item.label}
                className="md:flex md:flex-wrap md:content-center"
              >
                <a
                  href={item.href}
                  className={`flex flex-col items-center text-(length:--small-font-size) text-title font-medium cursor-pointer hover:text-first${activeSection === item.href.slice(1) ? " text-first" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <i className={`uil ${item.icon} text-xl md:hidden`} />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
          <i
            className="uil uil-times text-2xl absolute cursor-pointer md:hidden right-5 bottom-2 text-first hover:text-first-alt"
            onClick={() => setMenuOpen(false)}
          />
        </div>

        <div className="flex items-center">
          <i
            className={`uil ${darkTheme ? "uil-sun" : "uil-moon"} text-xl text-title cursor-pointer hover:text-first mr-4 md:mr-0`}
            onClick={toggleTheme}
          />
          <div
            className="text-title font-medium text-[1.1rem] cursor-pointer hover:text-first md:hidden"
            onClick={() => setMenuOpen(true)}
          >
            <i className="uil uil-apps" />
          </div>
        </div>
      </nav>
    </header>
  );
}
