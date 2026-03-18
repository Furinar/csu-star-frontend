import { service, ApiResponse } from "@/lib/request";
import { LoginByEmailResponse, RegisterByEmailRequest, TokenResponse, VerifyRegisterCodePayload, VerifyRegisterCodeResponse } from "@/types/auth";


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

// 发送注册验证码
const sendRegisterCode = (email: string): Promise<ApiResponse<null>> => {
  return service.post('/auth/register/code', {
    email,
  });
}

// 校验注册验证码
const verifyRegisterCode = (payload: VerifyRegisterCodePayload): Promise<ApiResponse<VerifyRegisterCodeResponse>> => {
  return service.post('/auth/register/verify-code', payload);
}

//校园邮箱注册
const registerByEmail = (payload: RegisterByEmailRequest): Promise<ApiResponse<null>> => {
  return service.post('/auth/register/email', payload);
}

// 校园邮箱登录
const loginByEmail = (payload: { email: string, password: string }): Promise<ApiResponse<LoginByEmailResponse>> => {
  return service.post('/auth/login/email', payload);
}

export {
  refreshToken,
  logout,
  sendRegisterCode,
  verifyRegisterCode,
  registerByEmail
}