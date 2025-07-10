import axios from 'axios';
import { message } from 'antd';

// API基础URL
const API_BASE = 'https://api.toupiao01.top/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加请求时间戳（防止缓存）
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    console.log('API请求:', config.method?.toUpperCase(), config.url, config.data || config.params);
    return config;
  },
  (error) => {
    console.error('请求配置错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API响应:', response.config.url, response.data);
    
    // 检查业务状态码
    if (response.data && response.data.success === false) {
      const errorMsg = response.data.message || '操作失败';
      message.error(errorMsg);
      
      // 如果是认证错误，清除token并跳转到登录页
      if (response.data.code === 'NO_TOKEN' || 
          response.data.code === 'INVALID_TOKEN' || 
          response.data.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('admin_token');
        window.location.href = '#/login';
      }
      
      return Promise.reject(new Error(errorMsg));
    }
    
    return response;
  },
  (error) => {
    console.error('API响应错误:', error);
    
    let errorMessage = '网络错误，请稍后重试';
    
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误';
          break;
        case 401:
          errorMessage = '认证失败，请重新登录';
          localStorage.removeItem('admin_token');
          window.location.href = '#/login';
          break;
        case 403:
          errorMessage = '权限不足';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = data?.message || `请求失败 (${status})`;
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = '请求超时，请检查网络连接';
      } else {
        errorMessage = '网络连接失败，请检查网络设置';
      }
    }
    
    message.error(errorMessage);
    return Promise.reject(error);
  }
);

// API方法封装
const adminAPI = {
  // 认证相关
  auth: {
    // 管理员登录
    login: (credentials) => api.post('/admin/login', credentials),
    
    // 获取管理员信息
    getProfile: () => api.get('/admin/profile'),
    
    // 登出（清除本地token）
    logout: () => {
      localStorage.removeItem('admin_token');
      window.location.href = '#/login';
    }
  },
  
  // 项目管理
  projects: {
    // 获取待审核项目列表
    getPending: (params) => api.get('/admin/projects/pending', { params }),
    
    // 项目审核
    audit: (id, data) => api.post(`/admin/projects/${id}/audit`, data)
  },
  
  // 提现管理
  withdraws: {
    // 获取提现申请列表
    getList: (params) => api.get('/admin/withdraws', { params }),
    
    // 提现审核
    audit: (id, data) => api.post(`/admin/withdraws/${id}/audit`, data)
  },
  
  // 用户管理
  users: {
    // 获取用户列表
    getList: (params) => api.get('/admin/users', { params }),
    
    // 切换用户状态
    toggleStatus: (id, data) => api.put(`/admin/users/${id}/status`, data)
  },
  
  // 系统统计
  stats: {
    // 获取系统统计信息
    get: () => api.get('/admin/stats')
  },
  
  // 超级管理员功能
  superAdmin: {
    // 创建新管理员
    createAdmin: (data) => api.post('/admin/create-admin', data),
    
    // 获取管理员列表
    getAdmins: () => api.get('/admin/admins')
  }
};

// 工具函数
export const utils = {
  // 检查是否已登录
  isLoggedIn: () => {
    const token = localStorage.getItem('admin_token');
    return !!token;
  },
  
  // 获取token
  getToken: () => {
    return localStorage.getItem('admin_token');
  },
  
  // 设置token
  setToken: (token) => {
    localStorage.setItem('admin_token', token);
  },
  
  // 清除token
  clearToken: () => {
    localStorage.removeItem('admin_token');
  },
  
  // 格式化文件大小
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // 格式化数字
  formatNumber: (num) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  },
  
  // 复制到剪贴板
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      message.error('复制失败');
    }
  },
  
  // 下载文件
  downloadFile: (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default adminAPI;