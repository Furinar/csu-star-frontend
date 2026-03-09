import axios from 'axios';

export const service = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 3000,
  headers: {
    "Content-Type": "application/json;charset=utf-8"
  }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  })

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code == 200) {
      return res.data;
    } else {
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    const statusCode = error.response?.status;
    const errMsg = error.response?.data?.message || error.message || 'Error';

    switch (statusCode) {
      case 400:
        console.error('Bad Request:', errMsg);
        break;
      case 401:
        console.error('Unauthorized:', errMsg);
        break;
      case 403:
        console.error('Forbidden:', errMsg);
        break;
      case 404:
        console.error('Not Found:', errMsg);
        break;
      case 500:
        console.error('Internal Server Error:', errMsg);
        break;
      default:
        console.error(`Error ${statusCode}:`, errMsg);
    }

    return Promise.reject(error);
  }
)
