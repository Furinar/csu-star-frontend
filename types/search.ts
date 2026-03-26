export type SearchScope = "all" | "resource" | "course" | "teacher";

export interface SearchQuery {
  q: string;
  type?: SearchScope;
  page?: number;
  size?: number;
}

export interface PaginatedData<T> {
  total: number;
  items: T[];
  page?: number;
  size?: number;
}

export interface SearchTeacherBrief {
  id: number;
  name: string;
  title?: string | null;
}

export interface SearchCourseItem {
  id: number;
  name: string;
  course_type?: string | null;
  credits?: number | null;
  avg_score?: number | null;
  avg_homework?: number | null;
  avg_gain?: number | null;
  avg_exam_diff?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  hot_score?: number | null;
  teachers?: SearchTeacherBrief[];
  teacher_count?: number | null;
  download_total?: number | null;
}

export interface SearchTeacherItem {
  id: number;
  name: string;
  department_id?: number | null;
  title?: string | null;
  avatar_url?: string | null;
  avg_score?: number | null;
  avg_quality?: number | null;
  avg_grading?: number | null;
  avg_attendance?: number | null;
  good_rate?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  hot_score?: number | null;
}

export interface SearchResourceHit {
  id: number;
  title: string;
  course_id: number;
  resource_type?: string | null;
  semester_start?: string | null;
  semester_end?: string | null;
  downloads?: number | null;
  views?: number | null;
  likes?: number | null;
  hot_score?: number | null;
  created_at?: string | null;
}

export interface SearchResourceCard {
  id: number;
  course_id: number;
  course_name: string;
  course_type?: string | null;
  credits?: number | null;
  avg_score?: number | null;
  resource_count: number;
  download_total: number;
  matched_resource_count: number;
  matched_resource_types: string[];
  hot_score?: number | null;
}

export interface SearchResponse {
  resources: PaginatedData<SearchResourceCard>;
  courses: PaginatedData<SearchCourseItem>;
  teachers: PaginatedData<SearchTeacherItem>;
}
