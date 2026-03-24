export enum Role {
  Admin = "admin",
  Auditor = "auditor",
  Student = "student",
}

export interface UserProfile {
  /**
   * 头像图片 URL
   */
  avatar_url?: string;
  /**
   * 所属学院 ID
   */
  department_id?: number;
  /**
   * 用户昵称
   */
  nickname: string;
  /**
   * 累计下载次数
   */
  download_count?: number;
  /**
   * 校园邮箱
   */
  email?: null | string;
  /**
   * 邮箱是否已验证
   */
  email_verified?: boolean;
  /**
   * 未绑定邮箱用户的免费下载次数（已绑定邮箱则为 null）
   */
  free_download_count?: number | null;
  /**
   * 入学年份
   */
  grade?: number;
  /**
   * 用户唯一标识
   */
  id: string;
  /**
   * 当前积分余额
   */
  points: number;
  /**
   * 用户角色：student / auditor / admin
   */
  role: Role;
  /**
   * 累计上传资源数
   */
  upload_count?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in?: number;
}


export interface LoginResponse {
  tokens: TokenResponse;
  user: UserProfile;
}

export interface RegisterByEmailRequest {
  avatar_url: string;
  email: string;
  invite_code: string;
  nickname: string;
  // 密码（至少 8 位）
  password: string;
}

export interface LoginByEmailResponse {
  access_token: string;
  refresh_token: string;
  // 默认7200s即2h
  expires_in?: number;
  user: UserProfile;
}

export interface VerifyRegisterCodePayload {
  email: string;
  code: string;
}

export interface VerifyRegisterCodeResponse {
  valid: boolean;
  message?: string;
}

