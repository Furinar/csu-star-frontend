import {useAuthStore} from '@/store/useAuthStore';
import {feedback} from '@/store/useFeedbackStore';
import {TokenResponse} from '@/types/auth';
import axios, {AxiosError, InternalAxiosRequestConfig} from 'axios';

export type ApiResponse<T> = {
  code: number;
  data: T;
  message?: string;
};

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  'http://localhost:8080';
export const service = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json;charset=utf-8"
  }
})

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

const extractApiErrorMessage = (error: AxiosError) => {
  const payload = error.response?.data;
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  if ('msg' in payload && typeof payload.msg === 'string' && payload.msg.trim()) {
    return payload.msg;
  }

  if ('message' in payload && typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message;
  }

  return '';
}

const extractApiErrorData = (error: AxiosError) => {
  const payload = error.response?.data;
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return null;
  }

  const data = payload.data;
  return data && typeof data === 'object' ? data as Record<string, unknown> : null;
}

const appendRetryAfter = (message: string, error: AxiosError) => {
  const data = extractApiErrorData(error);
  const retryAfter = data?.retry_after;
  if (typeof retryAfter === 'number' && retryAfter > 0) {
    return `${message || '请求过于频繁'}，请在 ${retryAfter} 秒后重试`;
  }
  if (typeof retryAfter === 'string' && retryAfter.trim()) {
    return `${message || '请求过于频繁'}，请在 ${retryAfter} 秒后重试`;
  }
  return message;
}

const buildIllegalPageUrl = (error: AxiosError) => {
  const data = extractApiErrorData(error);
  const params = new URLSearchParams({
    reason: 'banned',
  });

  if (data) {
    if (typeof data.ban_reason === 'string' && data.ban_reason.trim()) {
      params.set('ban_reason', data.ban_reason);
    }
    if (typeof data.ban_until === 'string' && data.ban_until.trim()) {
      params.set('ban_until', data.ban_until);
    }
    if (typeof data.violation_count === 'number') {
      params.set('violation_count', String(data.violation_count));
    }
    if (typeof data.violation_count === 'string' && data.violation_count.trim()) {
      params.set('violation_count', data.violation_count);
    }
    if (typeof data.permanent === 'boolean') {
      params.set('permanent', data.permanent ? '1' : '0');
    }
  }

  return `/login/illegal?${params.toString()}`;
}

const shouldRedirectToIllegalPage = (error: AxiosError) => {
  const status = error.response?.status;
  if (status !== 403) return false;

  const payload = error.response?.data;
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const code = 'code' in payload ? payload.code : null;
  if (code === 1021) return true;

  const data = extractApiErrorData(error);
  return data?.ban_source === 'system' || Boolean(data?.ban_until) || data?.permanent === true;
}


const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({resolve, reject}) => {
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

      if (shouldRedirectToIllegalPage(error)) {
        const message = extractApiErrorMessage(error) || '账号因异常行为已被系统限制';
        feedback.warning({
          title: '账号已被限制',
          description: message,
        });
        useAuthStore.getState().logout();
        window.location.href = buildIllegalPageUrl(error);
        return Promise.reject(error);
      }

      if (error.response?.status !== 401 || originalRequest._retry) {
        let message = extractApiErrorMessage(error);
        if (error.response?.status === 429) {
          message = appendRetryAfter(message, error);
        }
        if (message) {
          error.message = message;
        }
        return Promise.reject(error);
      }

      if (originalRequest.url?.includes('/auth/refresh')) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({resolve, reject});
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
        const {data} = await axios.post<ApiResponse<TokenResponse>>(
            `${BASE_URL}/auth/refresh`,
            {
              refresh_token: refresh_token
            }
        );

        if ((data.code !== 0 && data.code !== 200) || !data.data?.access_token) {
          throw new Error(data.message || 'Refresh token failed');
        }

        const tokenData = data.data;
        useAuthStore
            .getState()
            .setTokens(tokenData.access_token, tokenData.refresh_token ?? refresh_token);
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
