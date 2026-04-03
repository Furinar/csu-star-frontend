export type ResourceRankType =
  | "comprehensive"
  | "downloads"
  | "likes"
  | "favorite_count"
  | "resource_count";

export type CourseRankType =
  | "avg_score"
  | "avg_homework"
  | "avg_gain"
  | "avg_exam_diff"
  | "resource_count"
  | "favorite_count";

export type TeacherRankType =
  | "avg_score"
  | "avg_quality"
  | "avg_grading"
  | "avg_attendance"
  | "favorite_count"
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
  course_type?: "公选课" | "非公选课" | null;
  avg_score?: number | null;
  avg_homework?: number | null;
  avg_gain?: number | null;
  avg_exam_diff?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  favorite_count?: number | null;
  teachers?: Array<{ id: number; name: string; title?: string | null; avatar_url?: string | null }>;
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
  favorite_count?: number | null;
  avatar_url?: string | null;
  courses?: Array<{ id: number; name: string }>;
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
  resource_count?: number | null;
  download_total?: number | null;
  like_total?: number | null;
  favorite_count?: number | null;
  score?: number | null;
  resources_preview?: ResourcePreviewItem[];
}
