export type ResourceType = "ppt" | "pdf" | "notes" | "exam" | "lab" | "other" | "md" | "txt";

export interface ResourceCreateFileInput {
  filename: string;
  size_bytes: number;
  mime?: string | null;
}

export interface ResourceCreateInput {
  title: string;
  description?: string | null;
  course_id: number;
  resource_type: ResourceType;
  files: ResourceCreateFileInput[];
}

export interface ResourceUploadUrlItem {
  file_id: string;
  url: string;
  method: string;
  headers?: Record<string, string> | null;
}

export interface ResourceUploadResponse {
  resource_id: number;
  upload_urls: ResourceUploadUrlItem[];
}

export interface ResourceDownloadResponse {
  url: string;
  expires_in?: number | null;
  remaining_points?: number | null;
  free_download_count?: number | null;
}

export interface CourseSuggestionItem {
  id: number;
  name: string;
  course_type?: "公选课" | "非公选课" | null;
}

export interface TeacherSuggestionItem {
  id: number;
  name: string;
  department?: string | null;
}

export type UploadFileStatus = "queued" | "uploading" | "success" | "failed";

export interface UploadFileItem {
  local_id: string;
  file: File;
  file_id?: string | null;
  upload?: ResourceUploadUrlItem | null;
  progress: number;
  status: UploadFileStatus;
  error?: string | null;
}

export type UploadBatchStatus =
  | "idle"
  | "requesting"
  | "uploading"
  | "success"
  | "partial_failed"
  | "failed";

export interface UploadBatch {
  id: string;
  resource_id?: number | null;
  title: string;
  description: string;
  resource_type: ResourceType;
  course: CourseSuggestionItem;
  files: UploadFileItem[];
  total_size: number;
  progress: number;
  status: UploadBatchStatus;
  created_at: string;
}
