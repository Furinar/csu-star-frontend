"use client";

import LogoLoop from "../ui/logoloop";

const colleges = [
  { name: "机电工程学院", icon: "fa-cogs" },
  { name: "能源科学与工程学院", icon: "fa-bolt" },
  { name: "材料科学与工程学院", icon: "fa-cube" },
  { name: "粉末冶金研究院", icon: "fa-microchip" },
  { name: "交通运输工程学院", icon: "fa-train-subway" },
  { name: "土木工程学院", icon: "fa-building-columns" },
  { name: "冶金与环境学院", icon: "fa-recycle" },
  { name: "地球科学与信息物理学院", icon: "fa-earth-asia" },
  { name: "资源与安全工程学院", icon: "fa-shield-halved" },
  { name: "资源加工与生物工程学院", icon: "fa-leaf" },
  { name: "自动化学院", icon: "fa-robot" },
  { name: "计算机学院", icon: "fa-laptop-code" },
  { name: "电子信息学院", icon: "fa-satellite-dish" },
  { name: "国家卓越工程师学院", icon: "fa-graduation-cap" },
  { name: "数学与统计学院", icon: "fa-calculator" },
  { name: "物理学院", icon: "fa-atom" },
  { name: "化学化工学院", icon: "fa-flask-vial" },
  { name: "生命科学学院", icon: "fa-dna" },
  { name: "湘雅基础医学院", icon: "fa-hospital-user" },
  { name: "湘雅公共卫生学院", icon: "fa-medkit" },
  { name: "湘雅护理学院", icon: "fa-hand-holding-heart" },
  { name: "湘雅口腔医学院", icon: "fa-tooth" },
  { name: "湘雅药学院", icon: "fa-pills" },
  { name: "人文学院", icon: "fa-book-open-reader" },
  { name: "外国语学院", icon: "fa-language" },
  { name: "法学院", icon: "fa-gavel" },
  { name: "马克思主义学院", icon: "fa-flag" },
  { name: "商学院", icon: "fa-briefcase" },
  { name: "公共管理学院", icon: "fa-users" },
  { name: "建筑与艺术学院", icon: "fa-palette" },
  { name: "体育教研部", icon: "fa-futbol" },
  { name: "邓迪国际学院", icon: "fa-globe-europe" },
];

const engColleges = [
  { name: "Mechanical and Electrical Engineering", icon: "fa-cogs" },
  { name: "Energy Science and Engineering", icon: "fa-bolt" },
  { name: "Materials Science and Engineering", icon: "fa-cube" },
  { name: "Powder Metallurgy Research Institute", icon: "fa-microchip" },
  { name: "Transportation Engineering", icon: "fa-train-subway" },
  { name: "Civil Engineering", icon: "fa-building-columns" },
  { name: "Metallurgy and Environment", icon: "fa-recycle" },
  {
    name: "Earth Sciences and Information Physics",
    icon: "fa-earth-asia",
  },
  {
    name: "Resources and Safety Engineering",
    icon: "fa-shield-halved",
  },
  {
    name: "Resource Processing and Bioengineering",
    icon: "fa-leaf",
  },
  { name: "Automation", icon: "fa-robot" },
  { name: "Computer Science", icon: "fa-laptop-code" },
  { name: "Electronic Information", icon: "fa-satellite-dish" },
  {
    name: "National College of Excellence Engineers",
    icon: "fa-graduation-cap",
  },
  { name: "Mathematics and Statistics", icon: "fa-calculator" },
  { name: "Physics", icon: "fa-atom" },
  {
    name: "Chemistry and Chemical Engineering",
    icon: "fa-flask-vial",
  },
  { name: "Life Sciences", icon: "fa-dna" },
  {
    name: "Xiangya School of Basic Medical Sciences",
    icon: "fa-hospital-user",
  },
  { name: "Xiangya School of Public Health", icon: "fa-medkit" },
  { name: "Xiangya School of Nursing", icon: "fa-hand-holding-heart" },
  { name: "Xiangya School of Stomatology", icon: "fa-tooth" },
  { name: "Xiangya School of Pharmacy", icon: "fa-pills" },
  { name: "Humanities", icon: "fa-book-open-reader" },
  { name: "Foreign Languages", icon: "fa-language" },
  { name: "Law", icon: "fa-gavel" },
  { name: "Marxism", icon: "fa-flag" },
  { name: "Business School", icon: "fa-briefcase" },
  { name: "Public Administration", icon: "fa-users" },
  { name: "Architecture and Art", icon: "fa-palette" },
  {
    name: "Physical Education Teaching and Research Section",
    icon: "fa-futbol",
  },
  { name: "Dundee International College", icon: "fa-globe-europe" },
];
const logos = colleges.map((c) => ({
  node: (
    <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
      <i className={`fa-solid ${c.icon} text-first-second text-lg`} />
      <span className="text-sm text-foreground">{c.name}</span>
    </div>
  ),
  title: c.name,
}));

const engLogos = engColleges.map((c) => ({
  node: (
    <div className="flex items-center gap-2 px-3 py-1.5 whitespace-nowrap">
      <span className="text-sm text-foreground">{c.name}</span>
      <i className={`fa-solid ${c.icon} text-first-second text-lg`} />
    </div>
  ),
  title: c.name,
}));

export default function CollegeLoop() {
  return (
    <>
      <LogoLoop
        logos={logos}
        speed={50}
        direction="left"
        logoHeight={36}
        gap={16}
        hoverSpeed={0}
        fadeOut
        fadeOutColor="var(--body-color)"
        ariaLabel="学院列表"
      />
      <LogoLoop
        logos={engLogos}
        speed={50}
        direction="right"
        logoHeight={36}
        gap={16}
        hoverSpeed={0}
        fadeOut
        fadeOutColor="var(--body-color)"
        ariaLabel="College List"
      />
    </>
  );
}
