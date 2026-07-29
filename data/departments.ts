import type { Department } from "@/types/me";
import { COLLEGES } from "@/data/colleges";

/**
 * 学院列表（id 与后端 departments 表对齐，勿随意改号）
 * 1–32 为历史顺序；33 为官网新增的人工智能学院。
 * 展示名以官网二级学院为准：https://www.csu.edu.cn/xyxk1/ejxy.htm
 */
export const DEPARTMENTS: Department[] = [
  { id: 1, name: "机电工程学院", code: "" },
  { id: 2, name: "能源科学与工程学院", code: "" },
  { id: 3, name: "材料科学与工程学院", code: "" },
  { id: 4, name: "粉末冶金研究院", code: "" },
  { id: 5, name: "交通运输工程学院", code: "" },
  { id: 6, name: "土木工程学院", code: "" },
  { id: 7, name: "冶金与环境学院", code: "" },
  { id: 8, name: "地球科学与信息物理学院", code: "" },
  { id: 9, name: "资源与安全工程学院", code: "" },
  { id: 10, name: "资源加工与生物工程学院", code: "" },
  { id: 11, name: "自动化学院", code: "" },
  { id: 12, name: "计算机学院", code: "" },
  { id: 13, name: "电子信息学院", code: "" },
  { id: 14, name: "国家卓越工程师学院", code: "" },
  { id: 15, name: "数学与统计学院", code: "" },
  { id: 16, name: "物理学院", code: "" },
  { id: 17, name: "化学化工学院", code: "" },
  { id: 18, name: "生命科学学院", code: "" },
  { id: 19, name: "湘雅基础医学院", code: "" },
  { id: 20, name: "湘雅公共卫生学院", code: "" },
  { id: 21, name: "湘雅护理学院", code: "" },
  { id: 22, name: "湘雅口腔医学院", code: "" },
  { id: 23, name: "湘雅药学院", code: "" },
  { id: 24, name: "人文学院", code: "" },
  { id: 25, name: "外国语学院", code: "" },
  { id: 26, name: "法学院", code: "" },
  { id: 27, name: "马克思主义学院", code: "" },
  { id: 28, name: "商学院", code: "" },
  { id: 29, name: "公共管理学院", code: "" },
  { id: 30, name: "建筑与艺术学院", code: "" },
  { id: 31, name: "体育教研部", code: "" },
  { id: 32, name: "邓迪国际学院", code: "" },
  { id: 33, name: "人工智能学院", code: "" },
];

const DEPARTMENT_NAME_MAP = new Map(
  DEPARTMENTS.map((department) => [department.id, department.name]),
);

const DEPARTMENT_ID_BY_NAME = new Map(
  DEPARTMENTS.map((department) => [department.name, department.id]),
);

export function getDepartmentNameById(departmentId?: number | null) {
  if (!departmentId) return null;
  return DEPARTMENT_NAME_MAP.get(departmentId) ?? null;
}

export function getDepartmentIdByName(name?: string | null) {
  if (!name) return null;
  return DEPARTMENT_ID_BY_NAME.get(name.trim()) ?? null;
}

/** 与官网 33 院清单交叉校验（开发期断言用） */
export function listOfficialCollegeNames(): string[] {
  return COLLEGES.map((c) => c.name);
}
