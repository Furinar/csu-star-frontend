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
  avatar_url?: string | null;
}

export interface SearchCourseItem {
  id: number;
  name: string;
  course_type?: "公选课" | "非公选课" | null;
  avg_score?: number | null;
  avg_homework?: number | null;
  avg_gain?: number | null;
  avg_exam_diff?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  hot_score?: number | null;
  teachers?: SearchTeacherBrief[];
  teacher_count?: number | null;
}

export interface SearchTeacherItem {
  id: number;
  name: string;
  department_id?: number | null;
  department_name?: string | null;
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
  courses?: Array<{ id: number; name: string }>;
}

export interface SearchResourcePreview {
  id: number;
  title: string;
  resource_type?: string | null;
}

export interface SearchResourceCard {
  course_id: number;
  course_name: string;
  course_type?: "公选课" | "非公选课" | null;
  avg_score?: number | null;
  resource_count: number;
  download_total?: number | null;
  like_total?: number | null;
  hot_score?: number | null;
  updated_at?: string | null;
  resources_preview?: SearchResourcePreview[];
}

export interface SearchResponse {
  resources: PaginatedData<SearchResourceCard>;
  courses: PaginatedData<SearchCourseItem>;
  teachers: PaginatedData<SearchTeacherItem>;
}
