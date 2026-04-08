export type ResourceCategoryKey =
  | "general"
  | "exam"
  | "slides"
  | "notes"
  | "assignment"
  | "lab"
  | "report"
  | "other";

interface ResourceCategoryConfig {
  key: ResourceCategoryKey;
  value: ResourceCategoryKey;
  label: string;
  aliases: string[];
}

export const RESOURCE_CATEGORY_OPTIONS: ResourceCategoryConfig[] = [
  {
    key: "general",
    value: "general",
    label: "综合",
    aliases: ["general", "综合", "合集", "资料包", "汇总", "总复习", "复习资料", "知识点汇总"],
  },
  {
    key: "exam",
    value: "exam",
    label: "试卷",
    aliases: ["exam", "试卷", "真题", "往年题", "期中", "期末", "考试题", "测试题", "模拟题", "题库"],
  },
  {
    key: "slides",
    value: "slides",
    label: "课件",
    aliases: ["slides", "slide", "ppt", "pptx", "pdf", "课件", "讲义"],
  },
  {
    key: "notes",
    value: "notes",
    label: "笔记",
    aliases: ["notes", "note", "笔记", "课堂笔记", "整理笔记"],
  },
  {
    key: "assignment",
    value: "assignment",
    label: "作业",
    aliases: ["assignment", "homework", "作业", "习题", "平时作业"],
  },
  {
    key: "lab",
    value: "lab",
    label: "实验",
    aliases: ["lab", "实验", "实验资料", "实验指导", "实验代码"],
  },
  {
    key: "report",
    value: "report",
    label: "报告",
    aliases: ["report", "报告", "实验报告", "课程报告", "结课报告"],
  },
  {
    key: "other",
    value: "other",
    label: "其他",
    aliases: ["other", "其他", "md", "txt", "markdown", "文本"],
  },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(
  RESOURCE_CATEGORY_OPTIONS.map((item) => [item.key, item.label]),
) as Record<ResourceCategoryKey, string>;

function normalizeRawType(rawType?: string | null) {
  return rawType?.trim().toLowerCase() ?? "";
}

export function normalizeResourceType(rawType?: string | null): ResourceCategoryKey {
  const value = normalizeRawType(rawType);

  if (!value) {
    return "other";
  }

  if (
    value.includes("实验报告") ||
    value.includes("课程报告") ||
    value.includes("结课报告")
  ) {
    return "report";
  }

  if (
    value.includes("试卷") ||
    value.includes("真题") ||
    value.includes("期中") ||
    value.includes("期末") ||
    value.includes("考试题") ||
    value.includes("测试题") ||
    value.includes("模拟题") ||
    value.includes("题库")
  ) {
    return "exam";
  }

  if (value.includes("作业") || value.includes("assignment") || value.includes("homework")) {
    return "assignment";
  }

  for (const category of RESOURCE_CATEGORY_OPTIONS) {
    if (
      category.aliases.some((alias) => value === alias || value.includes(alias))
    ) {
      return category.key;
    }
  }

  return "other";
}

export function getResourceCategoryLabel(type?: string | null) {
  return CATEGORY_LABEL_MAP[normalizeResourceType(type)];
}
