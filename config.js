// API配置文件
const API_CONFIG = {
    // 开发环境
    development: {
        baseURL: 'http://localhost:3000/api',
        piAPI: 'https://api.minepi.com',
        environment: 'development'
    },
    // 生产环境
    production: {
        baseURL: 'https://houduan.onrender.com/api',
        piAPI: 'https://api.minepi.com',
        environment: 'production'
    }
};

// 自动检测环境
const getEnvironment = () => {
    // 如果是localhost或者127.0.0.1，则为开发环境
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '') {
        return 'development';
    }
    return 'production';
};

// 获取当前环境配置
const getCurrentConfig = () => {
    const env = getEnvironment();
    return API_CONFIG[env];
};

// API请求封装
class APIClient {
    constructor() {
        this.config = getCurrentConfig();
        this.token = localStorage.getItem('authToken');
    }

    // 设置认证令牌
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // 获取请求头
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${this.config.baseURL}${endpoint}`;
        
        const requestOptions = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            console.log(`API请求: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, requestOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API请求失败:', error);
            throw error;
        }
    }

    // GET请求
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // 认证相关API
    async login(piAuthData) {
        return this.post('/auth/login', piAuthData);
    }

    async register(userData) {
        return this.post('/auth/register', userData);
    }

    async getCurrentUser() {
        return this.get('/auth/me');
    }

    async updateProfile(userData) {
        return this.put('/auth/profile', userData);
    }

    async refreshToken() {
        return this.post('/auth/refresh');
    }

    // 项目相关API
    async getProjects(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/projects${queryString ? '?' + queryString : ''}`);
    }

    async createProject(projectData) {
        return this.post('/projects', projectData);
    }

    async getProject(id) {
        return this.get(`/projects/${id}`);
    }

    async updateProject(id, projectData) {
        return this.put(`/projects/${id}`, projectData);
    }

    async deleteProject(id) {
        return this.delete(`/projects/${id}`);
    }

    async getMyProjects() {
        return this.get('/projects/my');
    }

    // 投票相关API
    async vote(voteData) {
        return this.post('/votes', voteData);
    }

    async getProjectVotes(projectId) {
        return this.get(`/votes/project/${projectId}`);
    }

    async getMyVotes() {
        return this.get('/votes/my');
    }

    async cancelVote(voteId) {
        return this.delete(`/votes/${voteId}`);
    }

    async getVoteDetails(projectId) {
        return this.get(`/votes/project/${projectId}/details`);
    }

    // 支付相关API
    async createPayment(paymentData) {
        return this.post('/payments/create', paymentData);
    }

    async submitPayment(paymentData) {
        return this.post('/payments/submit', paymentData);
    }

    async completePayment(paymentData) {
        return this.post('/payments/complete', paymentData);
    }

    async cancelPayment(paymentData) {
        return this.post('/payments/cancel', paymentData);
    }

    async getPaymentStatus(paymentId) {
        return this.get(`/payments/${paymentId}/status`);
    }

    async getMyPayments() {
        return this.get('/payments/my');
    }

    // 统计相关API
    async getOverviewStats() {
        return this.get('/stats/overview');
    }

    async getPopularProjects() {
        return this.get('/stats/popular');
    }

    async getCategoryStats() {
        return this.get('/stats/categories');
    }

    async getMyStats() {
        return this.get('/stats/my');
    }

    async getTimelineStats(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.get(`/stats/timeline${queryString ? '?' + queryString : ''}`);
    }
}

// 创建全局API客户端实例
const apiClient = new APIClient();

// 导出配置和客户端
window.API_CONFIG = API_CONFIG;
window.apiClient = apiClient;
window.getCurrentConfig = getCurrentConfig;

console.log('API配置已加载:', getCurrentConfig());