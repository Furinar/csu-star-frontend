import { useAuthStore } from '@/store/useAuthStore';
import { TokenResponse } from '@/types/auth';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export type ApiResponse<T> = {
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
    return response.data; // 返回完整的 ApiResponse<T>
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
      const { data } = await axios.post<ApiResponse<TokenResponse>>(
        `${BASE_URL}/auth/refresh`,
        {
          refresh_token: refresh_token
        }
      );

      if (data.code !== 200 || !data.data?.access_token) {
        throw new Error(data.message || 'Refresh token failed');
      }

      const tokenData = data.data;
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
