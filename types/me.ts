import type { UserProfile, Role } from "@/types/auth";
import type { EntityId } from "@/types/entity";

export type FavoriteTargetType = "resource" | "course" | "teacher";
export type NotificationType =
  | "liked"
  | "commented"
  | "system";
export type NotificationCategory =
  | "announcement"
  | "report"
  | "correction"
  | "feedback"
  | "supplement"
  | "admin_message"
  | "points"
  | "interaction";
export type NotificationResult = "inform" | "approved" | "rejected";
export type PointsReason =
  | "daily_checkin"
  | "upload_reward"
  | "evaluation_reward"
  | "download_cost"
  | "invite_reward"
  | "invite_signup_reward"
  | "register_bonus"
  | "admin_adjust";
export type FeedbackType = "bug" | "suggestion" | "complaint" | "other";
export type ReportReason = "copyright" | "spam" | "inappropriate" | "other";
export type ReportTargetType =
  | "resource"
  | "course"
  | "teacher_evaluation"
  | "course_evaluation"
  | "teacher_evaluation_reply"
  | "course_evaluation_reply"
  | "comment";
export type CorrectionTargetType = "course" | "teacher";
export type OAuthBindProvider = "qq" | "wechat" | "github" | "google";
export type ResourceType = string;
export type ContributionActionType =
  | "resource_upload"
  | "teacher_evaluation"
  | "course_evaluation"
  | "daily_checkin"
  | "invite_reward";

export interface PaginatedData<T> {
  items: T[];
  total: number;
}

export interface ContributionAction {
  type: ContributionActionType;
  label: string;
  score: number;
}

export interface ContributionCell {
  date: string;
  score: number;
  level: 0 | 1 | 2 | 3 | 4;
  is_future: boolean;
  actions: ContributionAction[];
}

export interface ContributionSummary {
  weeks: ContributionCell[][];
  total_score: number;
  active_days: number;
  current_streak: number;
  max_day_score: number;
}

export interface UserBrief {
  id: string;
  nickname: string;
  avatar_url?: string | null;
  role: Role;
}

export interface Department {
  id: number;
  name: string;
  code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ResourceBrief {
  id: EntityId;
  title: string;
  resource_type: ResourceType;
}

export interface ResourceItem {
  id: EntityId;
  title: string;
  uploader_id?: string;
  course_id: EntityId;
  course?: {
    id: EntityId;
    name: string;
    detail_path?: string | null;
    resource_collection_path?: string | null;
  };
  resource_type: ResourceType;
  downloads?: number;
  views?: number;
  likes?: number;
  hot_score?: number;
  status?: string | null;
  created_at?: string;
  is_liked?: boolean | null;
  is_favorited?: boolean | null;
}

export interface DownloadRecord {
  id: EntityId;
  resource: ResourceBrief;
  created_at: string;
}

export interface TeacherEvaluation {
  id: string;
  user?: UserBrief | null;
  teacher_id: EntityId;
  teacher_name?: string | null;
  mode?: "standalone" | "linked" | null;
  course_id?: string | null;
  course_name?: string | null;
  rating_quality?: number;
  rating_grading?: number;
  rating_attendance?: number;
  rating_homework?: number;
  rating_gain?: number;
  rating_exam_difficulty?: number;
  avg_rating: number;
  comment?: string | null;
  is_anonymous?: boolean;
  likes?: number;
  is_liked?: boolean | null;
  created_at?: string;
}

export interface CourseEvaluation {
  id: string;
  user?: UserBrief | null;
  course_id: EntityId;
  course_name?: string | null;
  mode?: "standalone" | "linked" | null;
  teacher_id?: string | null;
  teacher_name?: string | null;
  rating_homework?: number;
  rating_gain?: number;
  rating_exam_difficulty?: number;
  rating_quality?: number;
  rating_grading?: number;
  rating_attendance?: number;
  avg_rating: number;
  comment?: string | null;
  is_anonymous?: boolean;
  likes?: number;
  is_liked?: boolean | null;
  created_at?: string;
}

export interface FavoriteItem {
  id: EntityId;
  target_type?: FavoriteTargetType;
  target_id?: EntityId;
  title?: string;
  name?: string;
  resource_type?: string;
  course_type?: string;
  title_label?: string;
  avg_score?: number;
  created_at?: string;
}

export interface PointsRecord {
  id: EntityId;
  change_amount: number;
  balance_after: number;
  reason: PointsReason;
  reference_type?: string | null;
  reference_id?: string | null;
  created_at: string;
}

export interface EmailStatus {
  email: string | null;
  email_verified: boolean;
  free_download_count: number | null;
}

export interface InviteCodeInfo {
  invite_code: string;
  used_count: number;
}

export interface CheckinResult {
  points_gained?: number | null;
  balance_after?: number | null;
  already_checked_in: boolean;
}

export interface NotificationItem {
  id: EntityId;
  type: NotificationType;
  category?: NotificationCategory | null;
  result?: NotificationResult | null;
  title: string;
  content?: string;
  source_type?:
  | "resource"
  | "teacher_evaluation"
  | "course_evaluation"
  | "comment"
  | "announcement"
  | null;
  source_id?: EntityId | null;
  related_id?: EntityId | null;
  is_read: boolean;
  is_pinned?: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface HomeNotificationSummary {
  announcements: NotificationItem[];
  interactions: NotificationItem[];
  system_messages: NotificationItem[];
}

export interface NotificationUnreadCount {
  count: number;
}

export interface MyProfileUpdateInput {
  nickname?: string;
  avatar_url?: string;
  department_id?: number;
  grade?: number;
}

export interface EmailBindInput {
  email: string;
  captcha: string;
}

export interface OAuthBindInput {
  provider: OAuthBindProvider;
  code: string;
}

export interface OAuthBindResult {
  provider: OAuthBindProvider;
  bound_at?: string;
}

export interface FeedbackInput {
  type: FeedbackType;
  title: string;
  content: string;
  contact?: string | null;
  screenshots?: string[] | null;
}

export interface ReportInput {
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description?: string | null;
}

export interface CorrectionInput {
  target_type: CorrectionTargetType;
  target_id: string;
  field: string;
  suggested_value: string;
}

export interface MeDashboardData {
  profile: UserProfile;
  emailStatus: EmailStatus;
  departments: Department[];
  unreadCount: number;
  contributions: ContributionSummary;
  resources: PaginatedData<ResourceItem>;
  favorites: PaginatedData<FavoriteItem>;
  teacherEvaluations: PaginatedData<TeacherEvaluation>;
  courseEvaluations: PaginatedData<CourseEvaluation>;
  points: PaginatedData<PointsRecord>;
}

export interface MeActivityData {
  invite: InviteCodeInfo;
  downloads: PaginatedData<DownloadRecord>;
  notifications: PaginatedData<NotificationItem>;
}
