import { service } from "@/lib/request";

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




export {
  refreshToken,
  logout,
  
}