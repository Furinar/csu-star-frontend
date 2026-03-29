export interface PaginatedData<T> {
  total: number;
  items: T[];
  page?: number;
  size?: number;
}

export interface TeacherBrief {
  id: number;
  name: string;
  title?: string | null;
  avatar_url?: string | null;
}

export interface CourseBrief {
  id: number;
  name: string;
}

export interface ResourceBrief {
  id: number;
  title: string;
  resource_type?: string | null;
  downloads?: number | null;
  likes?: number | null;
  created_at?: string | null;
}

export interface UserBrief {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  role?: string | null;
}

export interface EvaluationReply {
  id: number;
  evaluation_id: number;
  user: UserBrief;
  content: string;
  reply_to_user?: UserBrief | null;
  reply_to_reply_id?: number | null;
  created_at: string;
}

export interface EvaluationReplyInput {
  content: string;
  reply_to_reply_id?: number | null;
  reply_to_user_id?: string | null;
}

export interface TeacherEvaluation {
  id: number;
  teacher_id: number;
  course_id?: number | null;
  user?: UserBrief | null;
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

export interface CourseEvaluation {
  id: number;
  course_id: number;
  user?: UserBrief | null;
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

export interface TeacherDetail {
  id: number;
  name: string;
  title?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  avg_score?: number | null;
  avg_quality?: number | null;
  avg_grading?: number | null;
  avg_attendance?: number | null;
  good_rate?: number | null;
  eval_count?: number | null;
  resource_count?: number | null;
  hot_score?: number | null;
  courses?: CourseBrief[];
  latest_evaluations?: TeacherEvaluation[];
}

export interface CourseDetail {
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
  download_total?: number | null;
  teachers?: TeacherBrief[];
  resources_preview?: ResourceBrief[];
  latest_evaluations?: CourseEvaluation[];
}

export interface CourseResourceCollection {
  course: CourseBrief;
  resource_count: number;
  download_total?: number | null;
  like_total?: number | null;
  hot_score?: number | null;
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
  id: number;
  title: string;
  course_id: number;
  course?: CourseBrief | null;
  resource_type?: string | null;
  size_bytes?: number | null;
  downloads?: number | null;
  views?: number | null;
  likes?: number | null;
  hot_score?: number | null;
  created_at?: string | null;
  description?: string | null;
  tags?: string[];
  files?: ResourceFile[];
  course_resource_collection_path?: string | null;
  course_evaluation_anchor?: string | null;
  is_favorited?: boolean | null;
}
