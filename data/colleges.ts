/**
 * 中南大学二级学院（与官网一致）
 * 来源：https://www.csu.edu.cn/xyxk1/ejxy.htm （2026-07 核对）
 * 共 33 个；不计入轻合金/航空航天/大数据等挂靠研究院。
 */
export type CollegeVisual = {
  name: string;
  icon: string;
};

/** 官网二级学院顺序 + 首页轮播 / 指北图标 */
export const COLLEGES: readonly CollegeVisual[] = [
  { name: "人文学院", icon: "fa-book-open-reader" },
  { name: "外国语学院", icon: "fa-language" },
  { name: "建筑与艺术学院", icon: "fa-palette" },
  { name: "商学院", icon: "fa-briefcase" },
  { name: "法学院", icon: "fa-gavel" },
  { name: "马克思主义学院", icon: "fa-flag" },
  { name: "公共管理学院", icon: "fa-users" },
  { name: "数学与统计学院", icon: "fa-calculator" },
  { name: "物理学院", icon: "fa-atom" },
  { name: "化学化工学院", icon: "fa-flask-vial" },
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
  { name: "人工智能学院", icon: "fa-brain" },
  { name: "电子信息学院", icon: "fa-satellite-dish" },
  { name: "体育教研部", icon: "fa-futbol" },
  { name: "湘雅基础医学院", icon: "fa-hospital-user" },
  { name: "湘雅公共卫生学院", icon: "fa-medkit" },
  { name: "湘雅护理学院", icon: "fa-hand-holding-heart" },
  { name: "湘雅口腔医学院", icon: "fa-tooth" },
  { name: "湘雅药学院", icon: "fa-pills" },
  { name: "生命科学学院", icon: "fa-dna" },
  { name: "邓迪国际学院", icon: "fa-globe-europe" },
  { name: "国家卓越工程师学院", icon: "fa-graduation-cap" },
] as const;

/** 与首页中文条图标一一对应的英文展示 */
export const ENG_COLLEGES: readonly CollegeVisual[] = [
  { name: "School of Humanities", icon: "fa-book-open-reader" },
  { name: "School of Foreign Languages", icon: "fa-language" },
  { name: "School of Architecture and Art", icon: "fa-palette" },
  { name: "Business School", icon: "fa-briefcase" },
  { name: "Law School", icon: "fa-gavel" },
  { name: "School of Marxism", icon: "fa-flag" },
  { name: "School of Public Administration", icon: "fa-users" },
  { name: "School of Mathematics and Statistics", icon: "fa-calculator" },
  { name: "School of Physics", icon: "fa-atom" },
  { name: "School of Chemistry and Chemical Engineering", icon: "fa-flask-vial" },
  { name: "School of Mechanical and Electrical Engineering", icon: "fa-cogs" },
  { name: "School of Energy Science and Engineering", icon: "fa-bolt" },
  { name: "School of Materials Science and Engineering", icon: "fa-cube" },
  { name: "Powder Metallurgy Research Institute", icon: "fa-microchip" },
  { name: "School of Traffic and Transportation Engineering", icon: "fa-train-subway" },
  { name: "School of Civil Engineering", icon: "fa-building-columns" },
  { name: "School of Metallurgy and Environment", icon: "fa-recycle" },
  { name: "School of Geosciences and Info-Physics", icon: "fa-earth-asia" },
  { name: "School of Resources and Safety Engineering", icon: "fa-shield-halved" },
  { name: "School of Minerals Processing and Bioengineering", icon: "fa-leaf" },
  { name: "School of Automation", icon: "fa-robot" },
  { name: "School of Computer Science and Engineering", icon: "fa-laptop-code" },
  { name: "School of Artificial Intelligence", icon: "fa-brain" },
  { name: "School of Electronic Information", icon: "fa-satellite-dish" },
  { name: "Department of Physical Education", icon: "fa-futbol" },
  { name: "Xiangya School of Basic Medical Sciences", icon: "fa-hospital-user" },
  { name: "Xiangya School of Public Health", icon: "fa-medkit" },
  { name: "Xiangya School of Nursing", icon: "fa-hand-holding-heart" },
  { name: "Xiangya School of Stomatology", icon: "fa-tooth" },
  { name: "Xiangya School of Pharmaceutical Sciences", icon: "fa-pills" },
  { name: "School of Life Sciences", icon: "fa-dna" },
  { name: "Dundee International Institute", icon: "fa-globe-europe" },
  { name: "National College of Excellent Engineers", icon: "fa-graduation-cap" },
] as const;

/**
 * 历史/口语/wiki 旧名 → 官网二级学院名（图标与展示归一）
 * 湘雅医学院：非二级学院列表中的独立项，但是临床医学等常用归属，保留图标映射。
 */
const COLLEGE_NAME_ALIASES: Record<string, string> = {
  物理与电子学院: "物理学院",
  文学与新闻传播学院: "人文学院",
  基础医学院: "湘雅基础医学院",
  湘雅医学院: "湘雅基础医学院",
  粉冶院: "粉末冶金研究院",
  机电学院: "机电工程学院",
  "自动化学院（筹）": "自动化学院",
};

const DEFAULT_COLLEGE_ICON = "fa-graduation-cap";

const iconByName = new Map<string, string>(
  COLLEGES.map((c) => [c.name, c.icon]),
);

/** 按学院名取 FA 图标 class（不含 fa-solid 前缀） */
export function getCollegeIcon(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return DEFAULT_COLLEGE_ICON;

  const direct = iconByName.get(trimmed);
  if (direct) return direct;

  const aliasTarget = COLLEGE_NAME_ALIASES[trimmed];
  if (aliasTarget) {
    const aliased = iconByName.get(aliasTarget);
    if (aliased) return aliased;
  }

  for (const college of COLLEGES) {
    if (trimmed.includes(college.name) || college.name.includes(trimmed)) {
      return college.icon;
    }
  }

  return DEFAULT_COLLEGE_ICON;
}

/** 将可能的旧学院名规范为官网名（无法识别则原样返回） */
export function normalizeCollegeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return trimmed;
  if (iconByName.has(trimmed)) return trimmed;
  const alias = COLLEGE_NAME_ALIASES[trimmed];
  if (alias && iconByName.has(alias)) return alias;
  return trimmed;
}
