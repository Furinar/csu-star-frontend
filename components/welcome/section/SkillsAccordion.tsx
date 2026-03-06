"use client";

import { useState } from "react";

const skillGroups = [
  {
    title: "前端开发",
    subtitle: "主要技术栈",
    icon: "uil-brackets-curly",
    skills: [
      { name: "React / Next.js", percentage: 91 },
      { name: "TypeScript", percentage: 91 },
      { name: "HTML / CSS", percentage: 91 },
      { name: "Tailwind CSS", percentage: 91 },
    ],
  },
  {
    title: "后端开发",
    subtitle: "服务端技术",
    icon: "uil-server-network",
    skills: [
      { name: "Go / Gin", percentage: 91 },
      { name: "PostgreSql / Redis", percentage: 91 },
    ],
  },
];

export default function SkillsAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? -1 : i);
  };

  return (
    <div className="container grid gap-y-0">
      <div>
        {skillGroups.map((group, i) => (
          <div
            key={group.title}
            data-state={openIndex === i ? "open" : "closed"}
            className="group"
          >
            <div
              className="flex items-center mb-10 cursor-pointer"
              onClick={() => toggle(i)}
            >
              <i className={`uil ${group.icon} text-3xl text-first mr-3`} />
              <div>
                <h1 className="text-(length:--h3-font-size)">{group.title}</h1>
                <span className="text-(length:--small-font-size) text-text-light">{group.subtitle}</span>
              </div>
              <i className="uil uil-angle-down text-3xl text-first ml-auto transition-transform duration-400 group-data-[state=open]:rotate-180" />
            </div>
            <div className="grid gap-y-6 pl-[2.7rem] transition-all duration-400 h-0 overflow-hidden group-data-[state=open]:h-auto group-data-[state=open]:mb-10">
              {group.skills.map((skill) => (
                <div key={skill.name}>
                  <div className="flex justify-between mb-2">
                    <h3 className="text-(length:--normal-font-size) font-medium">{skill.name}</h3>
                    <span>{skill.percentage}%</span>
                  </div>
                  <div className="h-1.25 rounded bg-first-lighter">
                    <div
                      className="block h-full rounded bg-first"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
