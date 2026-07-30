import type { EntityId } from "@/types/entity";

export interface TeacherShowcaseItem {
  id: EntityId;
  name: string;
  title?: string | null;
  department_name?: string | null;
  avatar_url?: string | null;
  tutor_type?: string | null;
  avg_score?: number | null;
  avg_quality?: number | null;
  avg_grading?: number | null;
  avg_attendance?: number | null;
  good_rate?: number | null;
  eval_count?: number | null;
  favorite_count?: number | null;
}

export interface SiteShowcaseStats {
  user_count: number;
  resource_count: number;
  evaluation_count: number;
  teacher_count: number;
  course_count: number;
}
