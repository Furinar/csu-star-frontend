"use client";

import Reveal from "@/components/effects/Reveal";

const skillGroups = [
  {
    title: "前端",
    subtitle: "Frontend",
    skills: [
      { name: "React / Next.js", icon: "fa-brands fa-react" },
      { name: "TypeScript", icon: "fa-brands fa-js" },
      { name: "Tailwind CSS", icon: "fa-brands fa-css3-alt" },
    ],
  },
  {
    title: "后端",
    subtitle: "Backend",
    skills: [
      { name: "Go / Gin", icon: "fa-brands fa-golang" },
      { name: "Python / Qdrant", icon: "fa-brands fa-python" },
      { name: "PostgreSQL / Redis", icon: "fa-solid fa-database" },
    ],
  },
];

export default function SkillsAccordion() {
  return (
    <section
      className="snap-section flex flex-col justify-start md:justify-center"
      id="skills"
    >
      <div className="container mx-auto px-5 md:px-8 py-10 md:py-0">
        <div className="max-w-5xl mx-auto">
          <Reveal direction="left" delay={0}>
            <div className="mb-6 md:mb-10">
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight text-title leading-[1.1]">
                技术栈
              </h2>
              <span className="text-xs md:text-sm text-text-light mt-1 block tracking-widest uppercase">
                Tech Stack
              </span>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 md:gap-16">
            {skillGroups.map((group, gi) => (
              <Reveal
                key={group.title}
                direction={gi === 0 ? "left" : "right"}
                delay={100 + gi * 150}
              >
                <div>
                  <div className="flex items-baseline gap-3 mb-4 md:mb-6">
                    <span className="text-xs font-bold text-first tracking-[0.2em] uppercase">
                      {group.subtitle}
                    </span>
                    <div className="flex-1 h-px bg-border/60" />
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    {group.skills.map((skill) => (
                      <div
                        key={skill.name}
                        className="group flex items-center gap-3 md:gap-4 py-1.5 md:py-2 cursor-default transition-all duration-300 hover:translate-x-2"
                      >
                        <i
                          className={`${skill.icon} text-first text-base md:text-lg w-5 text-center shrink-0 transition-transform duration-300 group-hover:scale-125`}
                        />
                        <span className="text-lg md:text-2xl lg:text-3xl font-bold text-title tracking-tight transition-colors duration-300 group-hover:text-first">
                          {skill.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
