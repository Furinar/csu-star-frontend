import {ApiResponse, service} from "@/lib/request";
import {LoginByEmailResponse, RegisterByEmailRequest, TokenResponse} from "@/types/auth";


//校园邮箱注册
const registerByEmail = (payload: RegisterByEmailRequest): Promise<ApiResponse<null>> => {
  return service.post('/auth/email/email', payload);
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

// 校园邮箱登录
const loginByEmail = (payload: { email: string, password: string }): Promise<ApiResponse<LoginByEmailResponse>> => {
  return service.post('/auth/email/login', payload);
}

// 刷新 Access Token
const refreshToken = (refresh_token: string): Promise<ApiResponse<TokenResponse>> => {
  return service.post('/auth/refresh', {
    refresh_token
  });
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
}