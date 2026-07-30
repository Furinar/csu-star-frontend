export type GlobalEvaluationEntity = "course" | "teacher";

export type GlobalEvaluationCopy = {
  accent: "course" | "teacher";
  badge: string;
  emptyTitle: string;
  selectedTitle: (name: string) => string;
  selectedDescription: string;
  emptyDescription: string;
  searchPlaceholder: string;
  emptyResultText: string;
  reselectLabel: string;
  evaluationType: "course" | "teacher";
};

/** Pure UI/copy config for the shared global evaluation modal (entity-parameterized). */
export function getGlobalEvaluationCopy(
  entity: GlobalEvaluationEntity,
): GlobalEvaluationCopy {
  if (entity === "course") {
    return {
      accent: "course",
      badge: "课程评价",
      emptyTitle: "写课程评价",
      selectedTitle: (name) => `评价 · ${name}`,
      selectedDescription: "评分与文字会展示在课程详情页。",
      emptyDescription: "搜索并选择一门课程后填写评价。",
      searchPlaceholder: "搜索课程名称",
      emptyResultText: "未找到相关课程",
      reselectLabel: "更换",
      evaluationType: "course",
    };
  }

  return {
    accent: "teacher",
    badge: "教师评价",
    emptyTitle: "写教师评价",
    selectedTitle: (name) => `评价 · ${name}`,
    selectedDescription: "评分与文字会展示在教师详情页。",
    emptyDescription: "搜索并选择一位教师后填写评价。",
    searchPlaceholder: "搜索教师姓名",
    emptyResultText: "未找到相关教师",
    reselectLabel: "更换",
    evaluationType: "teacher",
  };
}

/** Rating module roles — single source of truth for naming clarity. */
export const RATING_MODULE_ROLES = {
  displayOnly: {
    module: "components/ui/StarRating.tsx",
    exportName: "StarRating",
    purpose: "display-only filled-star score visualization",
  },
  interactiveForm: {
    module: "components/ui/RatingStar.tsx",
    exportName: "RatingStar",
    purpose: "interactive 1-5 radio star rating for evaluation forms",
  },
  progressBar: {
    module: "components/ui/RatingBar.tsx",
    exportName: "RatingBar",
    purpose: "dimension score bar under detail/hero cards",
  },
} as const;
