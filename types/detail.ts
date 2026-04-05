import type { EntityId } from "@/types/entity";

export interface PaginatedData<T> {
  total: number;
  items: T[];
  page?: number;
  size?: number;
}

export interface TeacherBrief {
  id: EntityId;
  name: string;
  title?: string | null;
  avatar_url?: string | null;
}

export interface CourseBrief {
  id: EntityId;
  name: string;
}

export interface ResourceBrief {
  id: EntityId;
  title: string;
  description?: string | null;
  resource_type?: string | null;
  downloads?: number | null;
  views?: number | null;
  likes?: number | null;
  favorite_count?: number | null;
  created_at?: string | null;
  file_count?: number | null;
  first_file?: {
    filename: string;
    mime?: string | null;
    size_bytes: number;
  } | null;
}

export interface UserBrief {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  role?: string | null;
}

export interface EvaluationReply {
  id: string;
  user?: UserBrief | null;
  content: string;
  is_anonymous?: boolean;
  reply_to_user?: UserBrief | null;
  reply_to_reply_id?: string | null;
  likes?: number | null;
  is_liked?: boolean | null;
  created_at: string;
}

export interface EvaluationReplyInput {
  content: string;
  is_anonymous?: boolean;
  reply_to_reply_id?: string | null;
  reply_to_user_id?: string | null;
}

export interface TeacherEvaluation {
  id: string;
  teacher_id: EntityId;
  mode?: "standalone" | "linked" | null;
  course_id?: EntityId | null;
  course_name?: string | null;
  user?: UserBrief | null;
  rating_quality?: number | null;
  rating_grading?: number | null;
  rating_attendance?: number | null;
  rating_homework?: number | null;
  rating_gain?: number | null;
  rating_exam_difficulty?: number | null;
  avg_rating?: number | null;
  comment?: string | null;
  is_anonymous?: boolean;
  likes?: number | null;
  is_liked?: boolean | null;
  created_at: string;
  reply_count?: number | null;
  replies?: EvaluationReply[];
}

export interface CourseEvaluation {
  id: string;
  course_id: EntityId;
  mode?: "standalone" | "linked" | null;
  teacher_id?: EntityId | null;
  teacher_name?: string | null;
  user?: UserBrief | null;
  rating_homework?: number | null;
  rating_gain?: number | null;
  rating_exam_difficulty?: number | null;
  rating_quality?: number | null;
  rating_grading?: number | null;
  rating_attendance?: number | null;
  avg_rating?: number | null;
  comment?: string | null;
  is_anonymous?: boolean;
  likes?: number | null;
  is_liked?: boolean | null;
  created_at: string;
  reply_count?: number | null;
  replies?: EvaluationReply[];
}

export interface TeacherEvaluationInput {
  course_id?: EntityId | null;
  rating_quality: number;
  rating_grading: number;
  rating_attendance: number;
  rating_homework?: number | null;
  rating_gain?: number | null;
  rating_exam_difficulty?: number | null;
  comment?: string;
  is_anonymous?: boolean;
}

export interface CourseEvaluationInput {
  teacher_id?: EntityId | null;
  rating_homework: number;
  rating_gain: number;
  rating_exam_difficulty: number;
  rating_quality?: number | null;
  rating_grading?: number | null;
  rating_attendance?: number | null;
  comment?: string;
  is_anonymous?: boolean;
}

export interface CourseTeacherRelation {
  course_id: EntityId;
  teacher_id: EntityId;
}

export interface ResourceCommentInput {
  content: string;
  parent_id?: number | null;
  reply_to_comment_id?: number | null;
}

export interface TeacherDetail {
  id: EntityId;
  name: string;
  title?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  metadata?: {
    tutor_type?: string | null;
    homepage_url?: string | null;
  } | null;
  avg_score?: number | null;
  avg_quality?: number | null;
  avg_grading?: number | null;
  avg_attendance?: number | null;
  good_rate?: number | null;
  eval_count?: number | null;
  favorite_count?: number | null;
  courses?: CourseBrief[];
  is_favorited?: boolean | null;
}

export interface CourseDetail {
  id: EntityId;
  name: string;
  course_type?: "公选课" | "非公选课" | null;
  avg_score?: number | null;
  avg_homework?: number | null;
  avg_gain?: number | null;
  avg_exam_diff?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  download_total?: number | null;
  teachers?: TeacherBrief[];
  is_favorited?: boolean | null;
}

export interface CourseResourceCollection {
  course: CourseBrief;
  resource_count: number;
  download_total?: number | null;
  like_total?: number | null;
  favorite_count?: number | null;
  evaluation_anchor?: string | null;
  items: PaginatedData<ResourceBrief>;
}

export interface ResourceFile {
  id: string;
  filename: string;
  mime?: string | null;
  size_bytes: number;
  sort_order?: number | null;
}

export interface ResourceComment {
  id: number;
  user?: UserBrief | null;
  resource_id: number;
  parent_id?: number | null;
  reply_to_user?: UserBrief | null;
  reply_to_comment_id?: number | null;
  content: string;
  likes?: number | null;
  is_liked?: boolean | null;
  children?: ResourceComment[];
  depth?: number | null;
  created_at: string;
}

export interface ResourceDetail {
  id: EntityId;
  title: string;
  uploader_id?: string | null;
  course_id: EntityId;
  course?: CourseBrief | null;
  resource_type?: string | null;
  status?: string | null;
  downloads?: number | null;
  views?: number | null;
  likes?: number | null;
  favorite_count?: number | null;
  is_liked?: boolean | null;
  hot_score?: number | null;
  created_at?: string | null;
  description?: string | null;
  tags?: string[];
  files?: ResourceFile[];
  is_favorited?: boolean | null;
}

export type EvaluationSort = "created_at" | "likes";

export interface ResourceUpdateInput {
  title: string;
  description?: string;
  course_id: EntityId;
  resource_type: string;
}
