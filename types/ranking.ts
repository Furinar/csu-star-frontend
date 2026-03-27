export type ResourceRankType =
  | "comprehensive"
  | "downloads"
  | "likes"
  | "hot_score"
  | "updated_at"
  | "resource_count";

export type CourseRankType =
  | "avg_score"
  | "avg_homework"
  | "avg_gain"
  | "avg_exam_diff"
  | "resource_count"
  | "hot_score";

export type TeacherRankType =
  | "avg_score"
  | "avg_quality"
  | "avg_grading"
  | "avg_attendance"
  | "hot_score"
  | "eval_count";

interface RankQueryBase {
  page?: number;
  size?: number;
  is_increased?: boolean;
}

export interface ResourceRankingQuery extends RankQueryBase {
  rank_type: ResourceRankType;
}

export interface CourseRankingQuery extends RankQueryBase {
  rank_type: CourseRankType;
}

export interface TeacherRankingQuery extends RankQueryBase {
  rank_type: TeacherRankType;
  department_id?: number;
}

export interface PaginatedData<T> {
  total: number;
  items: T[];
  page?: number;
  size?: number;
}

export interface RankingItem {
  rank: number;
  id: number;
  name: string;
  department_name?: string | null;
  score: number;
}

export interface CourseRankingItem extends RankingItem {
  code?: string | null;
  course_type?: string | null;
  credits?: number | null;
  avg_score?: number | null;
  avg_homework?: number | null;
  avg_gain?: number | null;
  avg_exam_diff?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  hot_score?: number | null;
}

export interface TeacherRankingItem extends RankingItem {
  title?: string | null;
  department_id?: number | null;
  avg_score?: number | null;
  avg_quality?: number | null;
  avg_grading?: number | null;
  avg_attendance?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  hot_score?: number | null;
}

export interface ResourcePreviewItem {
  id: number;
  title: string;
  resource_type?: string | null;
  downloads?: number | null;
  likes?: number | null;
  created_at?: string | null;
}

export interface ResourceRankingItem {
  rank: number;
  course_id: number;
  course_name: string;
  course_code?: string | null;
  resource_count?: number | null;
  download_total?: number | null;
  like_total?: number | null;
  hot_score?: number | null;
  updated_at?: string | null;
  score?: number | null;
  resources_preview?: ResourcePreviewItem[];
}
