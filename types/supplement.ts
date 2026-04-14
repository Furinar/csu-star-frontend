import type { UserBrief } from "@/types/me";

export type SupplementRequestType = "teacher" | "course";
export type SupplementRequestStatus = "pending" | "approved" | "rejected";
export type SupplementCourseType = "public" | "non_public";

export interface CreateSupplementRequestInput {
  request_type: SupplementRequestType;
  contact: string;
  teacher_name?: string;
  department_id?: number;
  course_name?: string;
  course_type?: SupplementCourseType;
  remark?: string | null;
}

export interface ReviewSupplementRequestInput {
  review_note?: string;
}

export interface SupplementRequestItem {
  id: string;
  user_id: string;
  user?: UserBrief | null;
  request_type: SupplementRequestType;
  status: SupplementRequestStatus;
  contact: string;
  teacher_name?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  course_name?: string | null;
  course_type?: SupplementCourseType | null;
  remark?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  approved_target_type?: SupplementRequestType | null;
  approved_target_id?: string | null;
  created_at?: string;
  updated_at?: string;
}
