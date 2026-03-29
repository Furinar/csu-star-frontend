export interface ShowcaseTeacherBrief {
  id: number;
  name: string;
  title?: string | null;
  avatar_url?: string | null;
}

export interface CourseShowcaseItem {
  id: number;
  name: string;
  course_type?: string | null;
  avg_score?: number | null;
  avg_homework?: number | null;
  avg_gain?: number | null;
  avg_exam_diff?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  teacher_count?: number | null;
  teachers: ShowcaseTeacherBrief[];
}

export interface TeacherShowcaseItem {
  id: number;
  name: string;
  title?: string | null;
  department_name?: string | null;
  avatar_url?: string | null;
  avg_score?: number | null;
  avg_quality?: number | null;
  avg_grading?: number | null;
  avg_attendance?: number | null;
  good_rate?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
}
