export type RankPeriod = "all" | "month" | "week";

export type ResourceRankType = "downloads" | "semester" | "created_at" | "hot_score";

export type CourseRankType =
  | "avg_score"
  | "avg_homework"
  | "avg_gain"
  | "avg_exam_diff"
  | "resource_count"
  | "hot";

export type TeacherRankType =
  | "avg_score"
  | "avg_quality"
  | "avg_grading"
  | "avg_attendance"
  | "good_rate"
  | "resource_count"
  | "eval_count";

export interface RankQueryBase {
  period?: RankPeriod;
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

export interface CourseDetail {
  id: number;
  code?: string;
  name: string;
  course_type?: string;
  credits?: number;
  avg_score?: number;
  avg_homework?: number;
  avg_gain?: number;
  avg_exam_diff?: number;
  eval_count?: number;
  resource_count?: number;
  hot_score?: number;
  download_total?: number;
}

export interface TeacherDetail {
  id: number;
  name: string;
  title?: string | null;
  department_id?: number;
  avg_score?: number;
  avg_quality?: number;
  avg_grading?: number;
  avg_attendance?: number;
  good_rate?: number;
  eval_count?: number;
  resource_count?: number;
  hot_score?: number;
}

export interface ResourceRankingItem {
  rank: number;
  id: number;
  title: string;
  name?: string;
  score?: number;
  course_id?: number;
  course_name?: string;
  resource_type?: string;
  semester_start?: string | null;
  semester_end?: string | null;
  points_cost?: number;
  downloads?: number;
  views?: number;
  likes?: number;
  hot_score?: number;
  created_at?: string;
}
