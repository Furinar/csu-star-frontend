import { service } from "@/lib/request";

interface VerifyRegisterCodePayload {
  code: string;
  email: string;
}

interface VerifyRegisterCodeResponse {
  registration_token?: string;
}

// 刷新 Access Token
const refreshToken = (refresh_token: string) => {
  return service.post('/auth/refresh', {
    refresh_token
  });
}

//登出
const logout = () => {
  return service.post('/auth/logout');
}

// 发送注册验证码
const sendRegisterCode = (email: string) => {
  return service.post('/auth/register/code', {
    email,
  });
}

// 校验注册验证码
const verifyRegisterCode = (payload: VerifyRegisterCodePayload): Promise<VerifyRegisterCodeResponse> => {
  return service.post('/auth/register/verify-code', payload);
}




export {
  refreshToken,
  logout,
  sendRegisterCode,
  verifyRegisterCode,
}