import axios from 'axios';

const API_BASE = 'https://api.toupiao01.top';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

// 可选：自动携带token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

export default api; 