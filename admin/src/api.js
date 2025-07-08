import axios from 'axios';

const API_BASE = 'https://api.toupiao01.top'; // 后端API地址

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function getToken() {
  return localStorage.getItem('admin_token');
}

const instance = axios.create({
  baseURL: API_BASE,
  timeout: 10000
});

instance.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = 'Bearer ' + token;
  }
  return config;
});

export default instance;