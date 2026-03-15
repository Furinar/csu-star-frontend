import { useAuthStore } from '@/store/useAuthStore';
import { TokenResponse } from '@/types/auth';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

type ApiResponse<T> = {
  code: number;
  data: T;
  message?: string;
};

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:3001';
export const service = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json;charset=utf-8"
  }
})

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];


const normalizeTokenResponse = (payload: TokenResponse | ApiResponse<TokenResponse>): TokenResponse => {
  if ('code' in payload) {
    if (payload.code !== 200 || !payload.data?.access_token) {
      throw new Error(payload.message || 'Refresh token failed');
    }
    return payload.data;
  }
  if (!payload.access_token) {
    throw new Error('Refresh token failed');
  }
  return payload;
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) {
      resolve(token);
    } else {
      reject(error);
    }
  });
  failedQueue = [];
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().access_token;
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  })

// 响应拦截器
// 401: token过期，尝试刷新token
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code == 200) {
      return res.data;
    } else {
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return service(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    const refresh_token = useAuthStore.getState().refresh_token;

    if (!refresh_token) {
      isRefreshing = false;
      useAuthStore.getState().logout();
      processQueue(error, null);
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post<TokenResponse | ApiResponse<TokenResponse>>(
        `${BASE_URL}/auth/refresh`,
        {
          refresh_token: refresh_token
        }
      );
      const tokenData = normalizeTokenResponse(data);
      useAuthStore.getState().setTokens(tokenData.access_token);
      processQueue(null, tokenData.access_token);
      originalRequest.headers!.Authorization = `Bearer ${tokenData.access_token}`;
      return service(originalRequest);
    } catch (err) {
      processQueue(err, null);
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
)
