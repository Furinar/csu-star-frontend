import { ApiResponse, service } from "@/lib/request";
import { LoginResponse, RegisterByEmailRequest, TokenResponse } from "@/types/auth";

// WIP
//校园邮箱注册
const registerByEmail = (payload: RegisterByEmailRequest): Promise<ApiResponse<null>> => {
  return service.post('/auth/email/register', payload);
}

// WIP
// 发送验证码
const sendCaptcha = (email: string): Promise<ApiResponse<null>> => {
  return service.post('/auth/email/captcha', {
    email,
  });
}

// WIP
//验证邮箱
const verifyEmail = (email: string, captcha: string): Promise<ApiResponse<null>> => {
  return service.post('/auth/email/verify', {
    email,
    captcha,
  })
}


// WIP
// 校园邮箱登录
const loginByEmail = (payload: { email: string, password: string }): Promise<ApiResponse<LoginResponse>> => {
  return service.post('/auth/email/login', payload);
}

// NOTE 目前使用axios实现
// 刷新 Access Token
const refreshToken = (refresh_token: string): Promise<ApiResponse<TokenResponse>> => {
  return service.post('/auth/refresh', {
    refresh_token
  });
}

// WIP
// 第三方OAuth登录
const loginByOAuth = (provider: string, code: string): Promise<ApiResponse<LoginResponse>> => {
  return service.post('/auth/oauth/login', {
    provider,
    code,
  })
}

//登出
const logout = (): Promise<ApiResponse<null>> => {
  return service.post('/auth/logout');
}

// WIP
// 找回密码
const recoverPwd = (payload: { email: string, password: string, captcha: string }): Promise<ApiResponse<null>> => {
  return service.post('/auth/forget', payload);
}

export {
  refreshToken,
  logout,
  sendCaptcha,
  registerByEmail,
  recoverPwd,
  verifyEmail,
  loginByEmail,
  loginByOAuth,
}