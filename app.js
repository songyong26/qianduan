// 移除了调试面板相关代码

// API 配置
const API_CONFIG = {
    BASE_URL: '', // 生产环境使用相对路径
    ENDPOINTS: {
        AUTH: '/api/auth',
        USERS: '/api/users',
        PROJECTS: '/api/projects',
        VOTES: '/api/votes'
    }
};

// API 请求工具函数
class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('auth_token');
    }

    // 设置认证令牌
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
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
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            console.log(`API请求: ${options.method || 'GET'} ${url}`);
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: '请求失败' }));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log(`API响应:`, data);
            return data;
        } catch (error) {
            console.error(`API请求失败: ${url}`, error);
            throw error;
        }
    }

    // GET 请求
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST 请求
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT 请求
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE 请求
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// 创建API客户端实例
const apiClient = new ApiClient();

// 自定义弹窗函数
function showCustomAlert(message, title = '提示', icon = 'ℹ️') {
    const modal = document.getElementById('customAlertModal');
    const titleElement = document.getElementById('customAlertTitle');
    const messageElement = document.getElementById('customAlertMessage');
    const iconElement = document.querySelector('.custom-alert-icon');
    
    if (titleElement) titleElement.textContent = title;
    if (messageElement) messageElement.textContent = message;
    if (iconElement) iconElement.textContent = icon;
    
    if (modal) {
        modal.style.display = 'block';
    }
}

// 自定义确认弹窗函数
let confirmCallback = null;

function showCustomConfirm(message, title = '确认', icon = '❓') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const titleElement = document.getElementById('customConfirmTitle');
        const messageElement = document.getElementById('customConfirmMessage');
        const iconElement = document.querySelector('.custom-confirm-icon');
        
        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.textContent = message;
        if (iconElement) iconElement.textContent = icon;
        
        confirmCallback = resolve;
        if (modal) {
            modal.style.display = 'block';
        }
    });
}

function closeCustomConfirm(result) {
    const modal = document.getElementById('customConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    if (confirmCallback) {
        confirmCallback(result);
        confirmCallback = null;
    }
}

// Pi Network SDK 初始化
let piSDK = null;
let isPiSDKReady = false;

// 等待Pi SDK加载完成
function waitForPiSDK() {
    console.log('waitForPiSDK 被调用');
    return new Promise((resolve, reject) => {
        console.log('检查 window.Pi:', !!window.Pi);
        if (window.Pi && typeof window.Pi.init === 'function') {
            console.log('Pi SDK 立即可用');
            piSDK = window.Pi;
            isPiSDKReady = true;
            resolve(piSDK);
        } else {
            console.log('Pi SDK 未立即可用，等待加载...');
            let attempts = 0;
            const maxAttempts = 15; // 增加到15次尝试
            const checkInterval = 500; // 每500毫秒检查一次
            
            const checkPiSDK = () => {
                attempts++;
                console.log(`第${attempts}次检查 window.Pi:`, !!window.Pi);
                
                if (window.Pi && typeof window.Pi.init === 'function') {
                    console.log('Pi SDK 加载成功');
                    piSDK = window.Pi;
                    isPiSDKReady = true;
                    resolve(piSDK);
                } else if (attempts >= maxAttempts) {
                    console.warn('Pi SDK 加载超时，应用将在离线模式下运行');
                    // 不再拒绝Promise，而是解析为null，让应用继续运行
                    piSDK = null;
                    isPiSDKReady = false;
                    resolve(null);
                } else {
                    setTimeout(checkPiSDK, checkInterval);
                }
            };
            
            setTimeout(checkPiSDK, checkInterval);
        }
    });
}

// 应用状态管理
class VotingApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.userVotes = [];
        this.userPoints = 0; // 初始积分
        this.frozenPoints = 0; // 冻结积分
        this.pointsHistory = []; // 积分历史记录
        this.hiddenProjects = []; // 用户隐藏的项目列表
        this.isOnline = navigator.onLine; // 网络状态
        this.piSDKReady = false; // Pi SDK状态
        
        // 移除了调试面板初始化
        
        // 开始初始化
        this.init();
    }
    
    // 移除了调试面板初始化方法

    async init() {
        try {
            // 等待并初始化 Pi SDK
            const piSDKResult = await waitForPiSDK();
            if (piSDKResult) {
                console.log('Pi SDK 初始化完成');
                this.piSDKReady = true;
                this.showLoginStatus('Pi SDK 已加载', 'success');
            } else {
                console.log('Pi SDK 未加载，应用将在离线模式下运行');
                this.showLoginStatus('离线模式：Pi SDK 未加载', 'warning');
            }
            
            // 检查网络状态
            this.checkNetworkStatus();
            
            // 加载本地数据
            this.loadLocalData();
            
            // 尝试从后端加载数据
            if (this.isOnline) {
                await this.loadDataFromBackend();
            } else {
                console.log('离线模式：使用本地数据');
                this.showLoginStatus('离线模式：使用本地数据', 'warning');
            }
            
            // 初始化UI
            this.initializeUI();
            
            // 渲染项目列表
            this.renderProjects();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.showLoginStatus('应用初始化失败，使用本地数据', 'error');
            
            // 即使初始化失败，也要尝试加载本地数据和初始化UI
            try {
                this.loadLocalData();
                this.initializeUI();
                this.renderProjects();
            } catch (fallbackError) {
                console.error('备用初始化也失败:', fallbackError);
            }
        }
    }

    // 检查网络状态
    checkNetworkStatus() {
        this.isOnline = navigator.onLine;
        
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showLoginStatus('网络已连接', 'success');
            this.loadDataFromBackend();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showLoginStatus('网络已断开，切换到离线模式', 'warning');
        });
    }

    // 从后端加载数据
    async loadDataFromBackend() {
        try {
            console.log('开始从后端加载数据...');
            
            // 检查是否有保存的认证令牌
            const savedToken = localStorage.getItem('auth_token');
            if (savedToken) {
                apiClient.setToken(savedToken);
                
                try {
                    // 验证令牌并获取用户信息
                    const userInfo = await apiClient.get('/api/auth/me');
                    this.currentUser = userInfo.user;
                    this.userPoints = userInfo.user.points || 0;
                    this.frozenPoints = userInfo.user.frozenPoints || 0;
                    
                    console.log('用户信息加载成功:', this.currentUser);
                    this.updateLoginButton();
                    this.updateUserPointsDisplay();
                } catch (authError) {
                    console.log('认证令牌无效，清除本地认证信息');
                    apiClient.setToken(null);
                    this.currentUser = null;
                    localStorage.removeItem('current_user');
                }
            }
            
            // 加载项目列表
            const projectsResponse = await apiClient.get('/api/projects');
            if (projectsResponse.success && projectsResponse.projects) {
                this.projects = projectsResponse.projects;
                console.log('项目列表加载成功:', this.projects.length, '个项目');
            }
            
            // 如果用户已登录，加载用户相关数据
            if (this.currentUser) {
                try {
                    // 加载用户投票记录
                    const votesResponse = await apiClient.get('/api/votes/my-votes');
                    if (votesResponse.success && votesResponse.votes) {
                        this.userVotes = votesResponse.votes;
                        console.log('用户投票记录加载成功:', this.userVotes.length, '条记录');
                    }
                    
                    // 加载积分历史
                    const historyResponse = await apiClient.get('/api/users/points-history');
                    if (historyResponse.success && historyResponse.history) {
                        this.pointsHistory = historyResponse.history;
                        console.log('积分历史加载成功:', this.pointsHistory.length, '条记录');
                    }
                } catch (userDataError) {
                    console.warn('加载用户数据失败:', userDataError.message);
                }
            }
            
            // 保存到本地存储作为备份
            this.saveLocalData();
            
        } catch (error) {
            console.error('从后端加载数据失败:', error);
            this.showLoginStatus('连接服务器失败，使用本地数据', 'warning');
            // 如果后端加载失败，继续使用本地数据
        }
    }
    
    // 加载用户相关数据（在线模式）
    async loadUserData() {
        try {
            // 获取项目列表
            const projectsResponse = await apiClient.get('/api/projects');
            if (projectsResponse.success) {
                this.projects = projectsResponse.projects || [];
            }
            
            // 获取用户投票记录
            const votesResponse = await apiClient.get('/api/votes/my-votes');
            if (votesResponse.success) {
                this.userVotes = votesResponse.votes || {};
            }
            
            // 获取积分历史
            const historyResponse = await apiClient.get('/api/users/points-history');
            if (historyResponse.success) {
                this.pointsHistory = historyResponse.history || [];
            }
        } catch (error) {
            console.warn('加载用户数据失败:', error);
            // 如果加载失败，使用本地数据
            this.loadLocalUserData(this.currentUser.uid);
        }
    }
    
    // 加载本地用户数据（离线模式）
    loadLocalUserData(userId) {
        // 登录成功后重新加载该用户的积分数据
        const savedPoints = localStorage.getItem(`user_points_${userId}`);
        if (savedPoints) {
            const points = parseInt(savedPoints);
            this.userPoints = isNaN(points) ? 0 : points;
        } else {
            // 新用户初始化为0积分
            this.userPoints = 0;
        }
        
        const savedFrozenPoints = localStorage.getItem(`frozen_points_${userId}`);
        if (savedFrozenPoints) {
            const frozenPoints = parseInt(savedFrozenPoints);
            this.frozenPoints = isNaN(frozenPoints) ? 0 : frozenPoints;
        } else {
            this.frozenPoints = 0;
        }
        
        const savedHistory = localStorage.getItem(`points_history_${userId}`);
        if (savedHistory) {
            this.pointsHistory = JSON.parse(savedHistory);
        } else {
            this.pointsHistory = [];
        }
    }

    // 加载本地存储数据
    loadLocalData() {
        try {
            // 加载项目数据
            const savedProjects = localStorage.getItem('voting_projects');
            if (savedProjects) {
                this.projects = JSON.parse(savedProjects);
                // 确保所有项目都有必要的属性
                this.projects.forEach(project => {
                    if (!project.voteDetails) {
                        project.voteDetails = [];
                    }
                    if (!project.votes) {
                        project.votes = { yes: 0, no: 0 };
                    }
                });
            }

            // 加载用户投票记录
            const savedVotes = localStorage.getItem('user_votes');
            if (savedVotes) {
                this.userVotes = JSON.parse(savedVotes);
            }

            // 加载用户积分（按用户ID存储）
            if (this.currentUser && this.currentUser.uid) {
                const userId = this.currentUser.uid;
                const savedPoints = localStorage.getItem(`user_points_${userId}`);
                if (savedPoints) {
                    const points = parseInt(savedPoints);
                    this.userPoints = isNaN(points) ? 0 : points;
                } else {
                    // 新用户初始化为0积分
                    this.userPoints = 0;
                }

                // 加载冻结积分
                const savedFrozenPoints = localStorage.getItem(`frozen_points_${userId}`);
                if (savedFrozenPoints) {
                    const frozenPoints = parseInt(savedFrozenPoints);
                    this.frozenPoints = isNaN(frozenPoints) ? 0 : frozenPoints;
                } else {
                    this.frozenPoints = 0;
                }

                // 加载积分历史记录
                const savedHistory = localStorage.getItem(`points_history_${userId}`);
                if (savedHistory) {
                    this.pointsHistory = JSON.parse(savedHistory);
                } else {
                    this.pointsHistory = [];
                }
            } else {
                // 未登录时重置为默认值
                this.userPoints = 0;
                this.frozenPoints = 0;
                this.pointsHistory = [];
            }

            // 加载用户信息
            const savedUser = localStorage.getItem('current_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                // 检查是否为测试用户数据，如果是则清除
                if (user.uid && (user.uid.startsWith('test_user_') || (user.username && user.username.startsWith('TestUser_')))) {
                    console.log('检测到测试用户数据，正在清除...');
                    localStorage.removeItem('current_user');
                    // 清除旧的全局积分数据
                    localStorage.removeItem('user_points');
                    localStorage.removeItem('frozen_points');
                    localStorage.removeItem('points_history');
                    this.currentUser = null;
                } else {
                    this.currentUser = user;
                    this.updateLoginButton();
                }
            }

            // 加载隐藏项目列表
            const savedHiddenProjects = localStorage.getItem('hidden_projects');
            if (savedHiddenProjects) {
                this.hiddenProjects = JSON.parse(savedHiddenProjects);
            }
        } catch (error) {
            console.error('加载本地数据失败:', error);
        }
    }

    // 保存数据到本地存储
    saveLocalData() {
        try {
            localStorage.setItem('voting_projects', JSON.stringify(this.projects));
            localStorage.setItem('user_votes', JSON.stringify(this.userVotes));
            // 按用户ID保存积分数据
            if (this.currentUser && this.currentUser.uid) {
                const userId = this.currentUser.uid;
                localStorage.setItem(`user_points_${userId}`, this.userPoints.toString());
                localStorage.setItem(`frozen_points_${userId}`, this.frozenPoints.toString());
                localStorage.setItem(`points_history_${userId}`, JSON.stringify(this.pointsHistory));
            }
            localStorage.setItem('hidden_projects', JSON.stringify(this.hiddenProjects));
            if (this.currentUser) {
                localStorage.setItem('current_user', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('保存数据失败:', error);
        }
    }

    // 初始化UI事件
    initializeUI() {
        // 创建项目表单提交
        const createForm = document.getElementById('createProjectForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateProject(e));
        }

        // 提现表单提交
        const withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', (e) => this.handleWithdraw(e));
        }

        // 设置最小截止时间为当前时间
        const endTimeInput = document.getElementById('endTime');
        if (endTimeInput) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            endTimeInput.min = now.toISOString().slice(0, 16);
        }

        // 项目标题输入框不再限制输入，只在提交时验证
        
        // 创建登录状态显示区域
        this.createLoginStatusDisplay();
    }
    
    // 创建登录状态显示区域
    createLoginStatusDisplay() {
        if (!document.getElementById('loginStatusDisplay')) {
            const statusDiv = document.createElement('div');
            statusDiv.id = 'loginStatusDisplay';
            statusDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 10px 15px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
                max-width: 300px;
                word-wrap: break-word;
                display: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            `;
            document.body.appendChild(statusDiv);
        }
    }
    
    // 显示登录状态
    showLoginStatus(message, type = 'info') {
        const statusDiv = document.getElementById('loginStatusDisplay');
        if (statusDiv) {
            let icon = 'ℹ️';
            let bgColor = 'rgba(0, 0, 0, 0.8)';
            
            switch(type) {
                case 'success':
                    icon = '✅';
                    bgColor = 'rgba(76, 175, 80, 0.9)';
                    break;
                case 'error':
                    icon = '❌';
                    bgColor = 'rgba(244, 67, 54, 0.9)';
                    break;
                case 'warning':
                    icon = '⚠️';
                    bgColor = 'rgba(255, 152, 0, 0.9)';
                    break;
            }
            
            statusDiv.innerHTML = `${icon} ${message}`;
            statusDiv.style.background = bgColor;
            statusDiv.style.display = 'block';
            
            // 3秒后自动隐藏
            setTimeout(() => {
                if (statusDiv) {
                    statusDiv.style.display = 'none';
                }
            }, 3000);
        }
    }

    // 处理登录/退出
    async handleLogin() {
        this.showLoginStatus('开始处理登录请求...');
        // 移除了调试日志调用
        
        try {
            if (this.currentUser) {
                // 退出登录
                // 移除了调试日志调用
                this.showLoginStatus('正在退出登录...', 'info');
                
                // 如果在线，通知后端退出登录
                if (this.isOnline) {
                    try {
                        await apiClient.post('/api/auth/logout');
                    } catch (logoutError) {
                        console.warn('后端退出登录失败:', logoutError.message);
                    }
                }
                
                // 清除本地数据
                // 移除了调试日志调用
                this.currentUser = null;
                this.userPoints = 0;
                this.frozenPoints = 0;
                this.pointsHistory = [];
                apiClient.setToken(null);
                localStorage.removeItem('current_user');
                
                this.updateLoginButton();
                this.updateUserPointsDisplay();
                this.renderProjects();
                this.showLoginStatus('已成功退出登录', 'success');
                // 移除了调试日志调用
                showCustomAlert('已退出登录', '退出成功', '✅');
            } else {
                // 移除了调试日志调用
                this.showLoginStatus('开始本地登录流程...', 'info');
                
                // 检查是否在模拟登录环境中
                // 移除了调试日志调用
                if (!window.Pi) {
                    // 移除了调试日志调用
                    this.showLoginStatus('❌ 登录系统不可用', 'error');
                    showCustomAlert('登录系统暂时不可用', '环境错误', '⚠️');
                    return;
                }
                
                // 移除了调试日志调用
                this.showLoginStatus('✅ 登录环境检测成功', 'success');
                
                // 确保Pi SDK已准备就绪
                if (!isPiSDKReady) {
                    this.showLoginStatus('正在等待Pi SDK准备就绪...', 'info');
                    try {
                        await waitForPiSDK();
                    } catch (error) {
                        this.showLoginStatus('❌ Pi SDK 加载失败', 'error');
                        throw error;
                    }
                }
                
                this.showLoginStatus('📞 正在连接Pi Network...', 'info');
                
                // Pi Network 登录认证
                const scopes = ['payments', 'username']; // 请求支付权限和用户名权限
                
                // 处理未完成的支付回调
                const onIncompletePaymentFound = (payment) => {
                    this.showLoginStatus('💰 发现未完成的支付，正在处理...', 'warning');
                };
                
                const authResult = await piSDK.authenticate(scopes, onIncompletePaymentFound);
                
                if (authResult && authResult.user) {
                    let userInfo = authResult.user;
                    
                    // 尝试获取详细用户信息
                    if (authResult.accessToken) {
                        try {
                            this.showLoginStatus('🔍 正在获取用户详细信息...', 'info');
                            const detailedUserInfo = await piSDK.me();
                            userInfo = detailedUserInfo;
                        } catch (meError) {
                            console.warn('获取用户详细信息失败:', meError.message);
                            this.showLoginStatus('⚠️ 获取详细信息失败，使用基本信息', 'warning');
                            // 继续使用认证结果中的用户信息
                        }
                    }
                    
                    // 准备发送到后端的用户数据
                    const piUserData = {
                        uid: userInfo.uid,
                        username: userInfo.username,
                        displayName: userInfo.displayName,
                        name: userInfo.name,
                        accessToken: authResult.accessToken
                    };
                    
                    // 如果在线，向后端发送登录请求
                    if (this.isOnline) {
                        try {
                            this.showLoginStatus('🔄 正在与服务器同步用户信息...', 'info');
                            const loginResponse = await apiClient.post('/api/auth/pi-login', piUserData);
                            
                            if (loginResponse.success) {
                                // 保存后端返回的认证令牌
                                apiClient.setToken(loginResponse.token);
                                
                                // 使用后端返回的用户信息
                                this.currentUser = loginResponse.user;
                                this.userPoints = loginResponse.user.points || 0;
                                this.frozenPoints = loginResponse.user.frozenPoints || 0;
                                
                                // 加载用户相关数据
                                await this.loadUserData();
                                
                                this.showLoginStatus('✅ 服务器同步成功', 'success');
                            } else {
                                throw new Error(loginResponse.message || '服务器登录失败');
                            }
                        } catch (backendError) {
                            console.warn('后端登录失败，使用本地模式:', backendError.message);
                            this.showLoginStatus('⚠️ 服务器连接失败，使用离线模式', 'warning');
                            
                            // 后端登录失败，使用本地数据
                            this.currentUser = piUserData;
                            this.loadLocalUserData(userInfo.uid);
                        }
                    } else {
                        // 离线模式，使用本地数据
                        this.currentUser = piUserData;
                        this.loadLocalUserData(userInfo.uid);
                        this.showLoginStatus('📱 离线登录成功', 'success');
                    }
                    
                    // 获取用户显示名称
                    const displayName = this.getUserDisplayName();
                    
                    this.saveLocalData();
                    this.updateLoginButton();
                    this.updateUserPointsDisplay();
                    this.renderProjects();
                    showCustomAlert(`欢迎，${displayName}！`, 'Pi Network 登录成功', '🎉');
                } else {
                    this.showLoginStatus('❌ 认证失败：未获取到用户信息', 'error');
                    throw new Error('认证失败：未获取到用户信息');
                }
            }
        } catch (error) {
            let errorMessage = '登录操作失败，请重试';
            
            // 根据错误类型提供更具体的错误信息
            if (error.message && error.message.includes('cancelled')) {
                errorMessage = '用户取消了登录操作';
            } else if (error.message && error.message.includes('network')) {
                errorMessage = '网络连接失败，请检查网络后重试';
            } else if (error.message && error.message.includes('Pi SDK')) {
                errorMessage = '请在Pi Browser中打开此应用';
            }
            
            this.showLoginStatus(`❌ ${errorMessage}`, 'error');
            showCustomAlert(errorMessage, '登录失败', '❌');
        }
    }

    // 添加积分历史记录
    addPointsHistory(type, points, description) {
        const historyItem = {
            id: Date.now(),
            type: type,
            points: points || 0,
            description: description,
            timestamp: new Date().toISOString(),
            balance: isNaN(this.userPoints) ? 0 : this.userPoints
        };
        this.pointsHistory.unshift(historyItem); // 添加到数组开头
        
        // 限制历史记录数量，只保留最近100条
        if (this.pointsHistory.length > 100) {
            this.pointsHistory = this.pointsHistory.slice(0, 100);
        }
    }

    // 计算冻结积分
    calculateFrozenPoints() {
        // 直接返回frozenPoints属性，因为现在我们已经正确维护了这个值
        return this.frozenPoints;
    }

    // 获取用户显示名称
    getUserDisplayName(user = this.currentUser) {
        if (!user) return '未知用户';
        
        // 优先显示真实用户名，如果都没有则显示uid的前8位
        return user.username || 
               user.displayName || 
               user.name || 
               (user.uid ? user.uid.substring(0, 8) + '...' : '未知用户');
    }

    // 显示积分明细
    showPointsDetail() {
        const modal = document.getElementById('pointsDetailModal');
        const availablePointsDisplay = document.getElementById('availablePointsDisplay');
        const frozenPointsDisplay = document.getElementById('frozenPointsDisplay');
        const historyList = document.getElementById('pointsHistoryList');
        
        // 计算积分
        const totalPoints = this.userPoints;
        const frozenPoints = this.calculateFrozenPoints();
        const availablePoints = totalPoints - frozenPoints;
        
        // 显示积分信息
        availablePointsDisplay.textContent = availablePoints;
        frozenPointsDisplay.textContent = frozenPoints;
        
        // 清空历史记录列表
        historyList.innerHTML = '';
        
        if (this.pointsHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">暂无积分记录</div>';
        } else {
            this.pointsHistory.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = `history-item ${item.points >= 0 ? 'positive' : 'negative'}`;
                
                const formatTime = new Date(item.timestamp).toLocaleString('zh-CN', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                
                // 提取类型和项目名称，移除括号内容
                const parts = item.description.split(' - ');
                const actionType = parts[0] || item.description;
                let projectName = parts[1] || '';
                // 移除项目名称后面的括号内容
                if (projectName) {
                    projectName = projectName.replace(/\s*\([^)]*\)$/, '');
                }
                
                historyItem.innerHTML = `
                    <div class="history-main">
                        <div class="history-details">
                            <div class="history-type">类型：${actionType}</div>
                            ${projectName ? `<div class="history-project">项目：${projectName}</div>` : ''}
                            <div class="history-time">时间：${formatTime}</div>
                        </div>
                        <div class="history-points ${item.points >= 0 ? 'positive' : 'negative'}">
                            ${item.points >= 0 ? '+' : ''}${item.points}
                        </div>
                    </div>
                `;
                
                historyList.appendChild(historyItem);
            });
        }
        
        // 显示模态框
         modal.style.display = 'block';
     }

    // 显示公布结果模态框
    showPublishResult(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            showCustomAlert('项目不存在', '错误', '❌');
            return;
        }
        
        if (project.creatorId !== this.currentUser.uid) {
            showCustomAlert('只有项目创建者可以公布结果', '权限不足', '🚫');
            return;
        }
        
        // 检查项目是否被删除
        const isDeleted = this.hiddenProjects.some(hiddenKey => {
            const projectIdFromKey = hiddenKey.split('_')[1];
            return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
        });
        
        if (isDeleted) {
            showCustomAlert('该项目已被删除，无法公布结果', '操作失败', '❌');
            return;
        }
        
        if (project.resultPublished) {
            showCustomAlert('结果已经公布过了', '提示', 'ℹ️');
            return;
        }
        
        // 移除项目结束时间限制，允许有投票时就可以公布结果
        
        const modal = document.getElementById('publishResultModal');
        const content = document.getElementById('publishResultContent');
        
        const yesVotes = project.votes?.yes || 0;
        const noVotes = project.votes?.no || 0;
        const totalVotes = yesVotes + noVotes;
        
        content.innerHTML = `
            <div class="publish-result-info">
                <h3>${project.title}</h3>
                <p>投票统计：</p>
                <div class="vote-stats">
                    <div>是：${yesVotes} 积分</div>
                    <div>否：${noVotes} 积分</div>
                    <div>总计：${totalVotes} 积分</div>
                </div>
                <p>冻结积分：${project.frozenPoints || 0}</p>
                <p>请选择实际结果：</p>
                <div class="result-options">
                    <button class="btn-result" onclick="publishResult('${projectId}', 'yes')">是</button>
                    <button class="btn-result" onclick="publishResult('${projectId}', 'no')">否</button>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // 公布项目结果并分配奖励
    async publishProjectResult(projectId, result) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            showCustomAlert('项目不存在', '错误', '❌');
            return;
        }
        
        // 检查项目是否被删除
        const isDeleted = this.hiddenProjects.some(hiddenKey => {
            const projectIdFromKey = hiddenKey.split('_')[1];
            return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
        });
        
        if (isDeleted) {
            showCustomAlert('该项目已被删除，无法公布结果', '操作失败', '❌');
            return;
        }
        
        // 如果在线，尝试向后端发送公布结果请求
        if (this.isOnline) {
            try {
                const publishData = {
                    projectId: projectId,
                    result: result
                };
                
                const response = await apiClient.post(`/api/projects/${projectId}/publish-result`, publishData);
                
                if (response.success) {
                    // 后端处理成功，更新本地数据
                    const updatedProject = response.data.project;
                    const userUpdates = response.data.userUpdates;
                    
                    // 更新项目数据
                    Object.assign(project, updatedProject);
                    
                    // 更新当前用户的积分和历史记录
                    if (userUpdates && userUpdates.newBalance !== undefined) {
                        this.userPoints = userUpdates.newBalance;
                        this.frozenPoints = userUpdates.newFrozenPoints || this.frozenPoints;
                        
                        // 添加积分历史记录
                        if (userUpdates.pointsHistory) {
                            userUpdates.pointsHistory.forEach(history => {
                                this.addPointsHistory(history.type, history.points, history.description);
                            });
                        }
                    }
                    
                    this.saveLocalData();
                    this.updateUserPointsDisplay();
                    this.renderProjects();
                    
                    closeModal('publishResultModal');
                    showCustomAlert(`结果公布成功！\n投票正确：${response.data.correctVoters}人\n投票错误：${response.data.incorrectVoters}人\n积分重新分配完成。`, '公布成功', '🎉');
                    return;
                }
            } catch (error) {
                console.error('公布结果请求失败:', error);
                // 如果后端请求失败，回退到本地处理
            }
        }
        
        // 离线模式或后端请求失败时的本地处理
        this.publishProjectResultLocally(projectId, result);
    }
    
    publishProjectResultLocally(projectId, result) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        // 设置结果
        project.result = result;
        project.resultPublished = true;
        
        // 分类投票用户：正确投票和错误投票
        let correctVoters = [];
        let incorrectVoters = [];
        let totalCorrectPoints = 0;
        let totalIncorrectPoints = 0;
        
        project.voteDetails.forEach(vote => {
            if (vote.option === result) {
                correctVoters.push(vote);
                totalCorrectPoints += vote.points;
            } else {
                incorrectVoters.push(vote);
                totalIncorrectPoints += vote.points;
            }
        });
        
        // 处理当前用户的积分变化
        if (this.currentUser) {
            // 检查当前用户是否既是发起人又是投票者
            const isCreatorAndVoter = project.creatorId === this.currentUser.uid && 
                project.voteDetails.some(vote => vote.voter === this.currentUser.uid);
            
            // 1. 处理投票错误的用户：冻结积分划扣给项目发起人
            incorrectVoters.forEach(vote => {
                if (vote.voter === this.currentUser.uid) {
                    // 解冻积分（从冻结积分中减去）
                    this.frozenPoints -= vote.points;
                    // 从总积分中扣除（积分被划扣）
                    this.userPoints -= vote.points;
                    this.addPointsHistory('vote_penalty', -vote.points, 
                        `投票错误积分划扣 - ${project.title} (${vote.points}积分)`);
                }
            });
            
            // 2. 处理投票正确的用户：解冻积分并获得奖励
            correctVoters.forEach(vote => {
                if (vote.voter === this.currentUser.uid) {
                    // 解冻原投票积分
                    this.frozenPoints -= vote.points;
                    // 如果用户既是发起人又是投票者，奖励从自己的冻结积分中扣除，不额外增加积分
                    if (isCreatorAndVoter) {
                        // 只解冻原投票积分，不给额外奖励（因为奖励来自自己的冻结积分）
                        this.addPointsHistory('vote_unfreeze', 0, 
                            `投票正确积分解冻 - ${project.title} (${vote.points}积分)`);
                    } else {
                        // 获得与投票积分相等的奖励（从项目发起人的冻结积分中划扣）
                        const reward = vote.points;
                        // 实际增加用户总积分
                        this.userPoints += reward;
                        this.addPointsHistory('vote_unfreeze', 0, 
                            `投票正确积分解冻 - ${project.title} (${vote.points}积分)`);
                        this.addPointsHistory('vote_reward', reward, 
                            `投票奖励 - ${project.title} (${reward}积分)`);
                    }
                }
            });
            
            // 3. 处理项目发起人
            if (project.creatorId === this.currentUser.uid) {
                // 获得投票错误用户的积分（直接转移到发起人账户）
                if (totalIncorrectPoints > 0) {
                    this.userPoints += totalIncorrectPoints;
                    this.addPointsHistory('project_income', totalIncorrectPoints, 
                        `项目收入 - ${project.title} (${totalIncorrectPoints}积分)`);
                }
                
                // 计算需要支付的奖励：只给非发起人的投票正确用户奖励
                let totalRewardsToOthers = 0;
                correctVoters.forEach(vote => {
                    if (vote.voter !== this.currentUser.uid) {
                        totalRewardsToOthers += vote.points;
                    }
                });
                
                // 从发起人冻结积分中扣除奖励支出
                this.frozenPoints -= project.frozenPoints;
                
                // 计算剩余积分：冻结积分 - 支付给其他投票正确用户的奖励
                const remainingPoints = project.frozenPoints - totalRewardsToOthers;
                if (remainingPoints > 0) {
                    // 剩余积分解冻到发起人账户
                    this.userPoints += remainingPoints;
                    this.addPointsHistory('project_unfreeze', remainingPoints, 
                        `项目剩余积分解冻 - ${project.title} (${remainingPoints}积分)`);
                }
                
                // 记录奖励支出（从冻结积分中支付，不从总积分中额外扣除）
                if (totalRewardsToOthers > 0) {
                    this.addPointsHistory('project_payout', -totalRewardsToOthers, 
                        `项目奖励支出 - ${project.title} (${totalRewardsToOthers}积分)`);
                }
            }
        }
        
        this.saveLocalData();
        this.updateUserPointsDisplay();
        this.renderProjects();
        
        closeModal('publishResultModal');
        showCustomAlert(`结果公布成功！\n投票正确：${correctVoters.length}人\n投票错误：${incorrectVoters.length}人\n积分重新分配完成。`, '公布成功', '🎉');
    }

    // 更新用户积分显示
    updateUserPointsDisplay() {
        const userPoints = document.getElementById('userPoints');
        if (userPoints && this.currentUser) {
            const totalPoints = isNaN(this.userPoints) ? 0 : this.userPoints;
            userPoints.textContent = `积分: ${totalPoints}`;
        }
    }

    // 更新登录按钮状态
    updateLoginButton() {
        const loginBtn = document.getElementById('loginBtn');
        const subtitle = document.getElementById('subtitle');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');
        const userPoints = document.getElementById('userPoints');
        const rechargeBtn = document.querySelector('.btn-recharge');
        const withdrawBtn = document.querySelector('.btn-withdraw');
        
        if (loginBtn) {
            if (this.currentUser) {
                loginBtn.textContent = '退出';
                loginBtn.className = 'btn btn-logout';
                
                // 隐藏副标题，显示用户信息
                if (subtitle) subtitle.style.display = 'none';
                if (userInfo) {
                    userInfo.style.display = 'flex';
                    // 获取用户显示名称
                    const displayName = this.getUserDisplayName();
                    if (userName) userName.textContent = displayName;
                    if (userPoints) {
                    const totalPoints = isNaN(this.userPoints) ? 0 : this.userPoints;
                    userPoints.textContent = `积分: ${totalPoints}`;
                }
                }
                
                // 登录后显示充值和提现按钮
                if (rechargeBtn) rechargeBtn.style.display = 'inline-block';
                if (withdrawBtn) withdrawBtn.style.display = 'inline-block';
            } else {
                loginBtn.textContent = '登录';
                loginBtn.className = 'btn btn-login';
                
                // 显示副标题，隐藏用户信息
                if (subtitle) subtitle.style.display = 'block';
                if (userInfo) userInfo.style.display = 'none';
                
                // 未登录时隐藏充值和提现按钮
                if (rechargeBtn) rechargeBtn.style.display = 'none';
                if (withdrawBtn) withdrawBtn.style.display = 'none';
            }
        }
    }

    // 处理创建项目
    async handleCreateProject(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            showCustomAlert('请先登录', '登录提示', '🔐');
            return;
        }

        const formData = new FormData(e.target);
        const title = document.getElementById('projectTitle').value.trim();
        const description = document.getElementById('projectDescription').value.trim();
        const endTime = document.getElementById('endTime').value;
        const maxPoints = parseInt(document.getElementById('maxPoints').value);

        // 验证表单
        if (!title || !endTime || !maxPoints) {
            showCustomAlert('请填写所有必填字段', '输入错误', '⚠️');
            return;
        }

        if (title.length > 11) {
            showCustomAlert('项目标题不能超过11个字符', '输入错误', '⚠️');
            return;
        }

        if (description.length > 40) {
            showCustomAlert('项目描述不能超过40个字符', '输入错误', '⚠️');
            return;
        }

        // 验证截止时间
        const endDate = new Date(endTime);
        if (endDate <= new Date()) {
            showCustomAlert('截止时间必须晚于当前时间', '时间错误', '⏰');
            return;
        }

        // 创建新项目（移除编辑功能）
        if (this.editingProjectId) {
            showCustomAlert('编辑模式下无法创建新项目，请先取消编辑', '操作提示', 'ℹ️');
            return;
        }
        
        // 检查最低积分要求
        if (maxPoints < 100) {
            showCustomAlert('项目最低要求100积分', '积分不足', '💰');
            return;
        }
        
        // 创建新项目
        if (maxPoints > this.userPoints) {
            showCustomAlert(`积分不足，当前积分：${this.userPoints}`, '积分不足', '💰');
            return;
        }

        const projectData = {
            title,
            description,
            endTime,
            maxPoints
        };

        // 如果在线，尝试向后端发送创建请求
        if (this.isOnline && this.currentUser) {
            try {
                const response = await apiClient.post('/api/projects', projectData);
                
                if (response.success) {
                    // 后端创建成功，使用后端返回的项目数据
                    const project = response.project;
                    this.projects.unshift(project);
                    
                    // 更新用户积分信息
                    this.userPoints = response.user.points || this.userPoints;
                    this.frozenPoints = response.user.frozenPoints || this.frozenPoints;
                    
                    this.addPointsHistory('project_freeze', 0, `创建项目冻结积分 - ${title} (冻结${maxPoints}积分)`);
                    showCustomAlert(`项目创建成功！已冻结${maxPoints}积分`, '创建成功', '🎉');
                } else {
                    throw new Error(response.message || '创建项目失败');
                }
            } catch (error) {
                console.warn('后端创建项目失败，使用本地模式:', error.message);
                showCustomAlert('服务器连接失败，使用离线模式创建项目', '提示', '⚠️');
                
                // 后端失败，使用本地创建
                this.createProjectLocally(projectData);
            }
        } else {
            // 离线模式，使用本地创建
            this.createProjectLocally(projectData);
        }

        // 保存数据并更新显示
        this.saveLocalData();
        this.updateUserPointsDisplay();

        // 重置表单
        e.target.reset();
        
        // 刷新显示
        console.log('项目创建后，当前项目数量:', this.projects.length);
        console.log('最新项目:', this.projects[0]);
        this.renderProjects();
    }
    
    // 本地创建项目
    createProjectLocally(projectData) {
        const { title, description, endTime, maxPoints } = projectData;
        
        const project = {
            id: Date.now().toString(),
            title,
            description,
            endTime,
            maxPoints,
            creatorId: this.currentUser.uid,
            creatorName: this.getUserDisplayName(),
            createdAt: new Date().toISOString(),
            frozenPoints: parseInt(maxPoints), // 冻结的积分
            votes: {
                yes: 0,
                no: 0
            },
            voters: [],
            voteDetails: [], // 投票详情
            status: 'active',
            result: null, // 发起人公布的结果
            resultPublished: false // 是否已公布结果
        };

        // 冻结积分（从总积分中扣除并增加冻结积分）
        // 只增加冻结积分，不从总积分中扣除
        this.frozenPoints += maxPoints;
        this.addPointsHistory('project_freeze', 0, `创建项目冻结积分 - ${title} (冻结${maxPoints}积分)`);
        
        // 添加项目
        this.projects.unshift(project);
        
        showCustomAlert(`项目创建成功！已冻结${maxPoints}积分，当前可用积分：${this.userPoints - this.frozenPoints}`, '创建成功', '🎉');
     }

    // 处理投票
    handleVote(projectId, option, votePoints) {
        if (!this.currentUser) {
            showCustomAlert('请先登录', '登录提示', '🔐');
            return;
        }

        const project = this.projects.find(p => p.id === projectId);
        if (!project) {
            showCustomAlert('项目不存在', '错误', '❌');
            return;
        }

        // 检查项目是否被删除
        const isDeleted = this.hiddenProjects.some(hiddenKey => {
            const projectIdFromKey = hiddenKey.split('_')[1];
            return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
        });
        
        if (isDeleted) {
            showCustomAlert('该项目已被删除，无法投票', '操作失败', '❌');
            return;
        }

        // 允许多次投票，移除已投票检查

        // 检查项目是否已结束
        if (new Date(project.endTime) <= new Date()) {
            showCustomAlert('投票已结束', '投票提示', '⏰');
            return;
        }

        // 检查可用积分是否足够（总积分 - 冻结积分）
        const availablePoints = this.userPoints - this.frozenPoints;
        if (availablePoints < votePoints) {
            showCustomAlert(`可用积分不足，当前可用积分：${availablePoints}`, '积分不足', '💰');
            return;
        }

        // 计算选中选项的剩余可投积分
        const currentVotes = project.votes[option] || 0;
        const remainingPoints = Math.max(0, project.maxPoints - currentVotes);
        
        // 检查投票积分是否超过该选项的剩余积分
        if (votePoints > remainingPoints) {
            showCustomAlert(`该选项剩余可投积分不足，最多可投${remainingPoints}积分`, '投票限制', '⚠️');
            return;
        }
        
        // 检查投票积分是否超过项目限制
        if (votePoints > project.maxPoints) {
            showCustomAlert(`投票积分不能超过${project.maxPoints}`, '投票限制', '⚠️');
            return;
        }

        // 准备投票数据
        const voteData = {
            projectId,
            option,
            points: votePoints
        };

        // 如果在线，尝试向后端发送投票请求
        if (this.isOnline && this.currentUser) {
            try {
                const response = await apiClient.post('/api/votes', voteData);
                
                if (response.success) {
                    // 后端投票成功，更新本地数据
                    const vote = {
                        projectId,
                        userId: this.currentUser.uid,
                        option,
                        points: votePoints,
                        timestamp: new Date().toISOString()
                    };
                    
                    this.userVotes.push(vote);
                    
                    // 更新项目投票数据
                    if (response.project) {
                        const projectIndex = this.projects.findIndex(p => p.id === projectId);
                        if (projectIndex !== -1) {
                            this.projects[projectIndex] = response.project;
                        }
                    } else {
                        // 如果后端没有返回完整项目数据，手动更新
                        project.votes[option] += votePoints;
                        project.voters.push(this.currentUser.uid);
                        project.voteDetails.push({
                            voter: this.currentUser.uid,
                            option: option,
                            points: votePoints,
                            timestamp: new Date().toISOString()
                        });
                    }
                    
                    // 更新用户积分信息
                    if (response.user) {
                        this.userPoints = response.user.points || this.userPoints;
                        this.frozenPoints = response.user.frozenPoints || this.frozenPoints;
                    } else {
                        // 如果后端没有返回用户数据，手动更新
                        this.frozenPoints += votePoints;
                    }
                    
                    this.addPointsHistory('vote_freeze', 0, `投票冻结积分 - ${project.title} (${option === 'yes' ? '是' : '否'}, 冻结${votePoints}积分)`);
                    showCustomAlert(`投票成功！已冻结${votePoints}积分`, '投票成功', '🎉');
                } else {
                    throw new Error(response.message || '投票失败');
                }
            } catch (error) {
                console.warn('后端投票失败，使用本地模式:', error.message);
                showCustomAlert('服务器连接失败，使用离线模式投票', '提示', '⚠️');
                
                // 后端失败，使用本地投票
                this.voteLocally(projectId, option, votePoints, project);
            }
        } else {
            // 离线模式，使用本地投票
            this.voteLocally(projectId, option, votePoints, project);
        }
        
        this.saveLocalData();
        this.updateUserPointsDisplay();
        this.renderProjects();
        closeModal('voteModal');
    }
    
    // 本地投票
    voteLocally(projectId, option, votePoints, project) {
        // 记录投票
        const vote = {
            projectId,
            userId: this.currentUser.uid,
            option,
            points: votePoints,
            timestamp: new Date().toISOString()
        };

        this.userVotes.push(vote);
        project.votes[option] += votePoints;
        project.voters.push(this.currentUser.uid);
        
        // 记录投票详情
        project.voteDetails.push({
            voter: this.currentUser.uid,
            option: option,
            points: votePoints,
            timestamp: new Date().toISOString()
        });
        
        // 冻结投票积分（从总积分中扣除并增加冻结积分）
        // 只增加冻结积分，不从总积分中扣除
        this.frozenPoints += votePoints;
        this.addPointsHistory('vote_freeze', 0, `投票冻结积分 - ${project.title} (${option === 'yes' ? '是' : '否'}, 冻结${votePoints}积分)`);
        
        showCustomAlert(`投票成功！已冻结${votePoints}积分，当前可用积分：${this.userPoints - this.frozenPoints}`, '投票成功', '🎉');
    }

    // 处理提现
    async handleWithdraw(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            showCustomAlert('请先登录', '登录提示', '🔐');
            return;
        }
        
        const address = document.getElementById('withdrawAddress').value.trim();
        const amount = parseInt(document.getElementById('withdrawAmount').value);
        
        // 验证地址（只能是数字和字母）
        if (!address) {
            showCustomAlert('请输入提币地址', '输入错误', '⚠️');
            return;
        }
        
        if (!/^[a-zA-Z0-9]+$/.test(address)) {
            showCustomAlert('提币地址只能包含数字和字母', '格式错误', '⚠️');
            return;
        }
        
        // 验证金额
        if (!amount || amount <= 0) {
            showCustomAlert('提币数量必须大于0', '数量错误', '⚠️');
            return;
        }
        
        if (!Number.isInteger(amount)) {
            showCustomAlert('提币数量必须是整数', '格式错误', '⚠️');
            return;
        }
        
        // 计算可提现积分（总积分 - 冻结积分）
        const availablePoints = this.userPoints - this.frozenPoints;
        
        if (amount > availablePoints) {
            showCustomAlert(`可提现积分不足，当前可提现积分：${availablePoints}\n冻结积分：${this.frozenPoints}\n冻结积分暂时不可提现`, '积分不足', '💰');
            return;
        }
        
        // 计算手续费
        const fee = Math.floor(amount * 0.1);
        const totalDeduction = amount + fee;
        
        // 如果在线，尝试向后端发送提现请求
        if (this.isOnline) {
            try {
                const withdrawData = {
                    address: address,
                    amount: amount,
                    fee: fee,
                    totalDeduction: totalDeduction
                };
                
                const response = await apiClient.post('/api/withdrawals', withdrawData);
                
                if (response.success) {
                    // 后端处理成功，更新本地数据
                    this.userPoints = response.data.newBalance;
                    this.addPointsHistory('withdraw', -totalDeduction, `提现 ${amount} 积分 (含手续费 ${fee})`);
                    
                    this.saveLocalData();
                    this.updateUserPointsDisplay();
                    
                    // 关闭模态框
                    closeModal('withdrawModal');
                    
                    showCustomAlert(`提现申请已提交！\n提现金额：${amount}\n手续费：${fee}\n预计1小时内到账`, '提现成功', '🎉');
                    return;
                }
            } catch (error) {
                console.error('提现请求失败:', error);
                // 如果后端请求失败，回退到本地处理
            }
        }
        
        // 离线模式或后端请求失败时的本地处理
        this.withdrawLocally(amount, fee, totalDeduction, address);
    }
    
    withdrawLocally(amount, fee, totalDeduction, address) {
        // 扣除积分
        this.userPoints -= totalDeduction;
        this.addPointsHistory('withdraw', -totalDeduction, `提现 ${amount} 积分 (含手续费 ${fee})`);
        
        this.saveLocalData();
        this.updateUserPointsDisplay();
        
        // 关闭模态框
        closeModal('withdrawModal');
        
        showCustomAlert(`提现申请已提交！\n提现金额：${amount}\n手续费：${fee}\n预计1小时内到账`, '提现成功', '🎉');
    }
    
    // 获取冻结积分（直接返回属性值）
    getFrozenPoints() {
        return this.frozenPoints;
    }

    // 验证Pi Network地址
    validatePiAddress(address) {
        // 简单的地址格式验证
        return address.length >= 20 && /^[A-Za-z0-9]+$/.test(address);
    }

    // 渲染项目列表
    renderProjects() {
        this.renderAllProjects();
        this.renderMyProjects();
    }

    // 渲染所有项目
    renderAllProjects() {
        const container = document.getElementById('projectsList');
        if (!container) return;

        // 只显示进行中且未公布结果的项目，并过滤掉被删除的项目，按创建时间倒序排列
        const allProjects = [...this.projects]
            .filter(project => {
                const isActive = new Date(project.endTime) > new Date();
                // 检查项目是否被任何用户删除（隐藏）
                const isDeleted = this.hiddenProjects.some(hiddenKey => {
                    const projectId = hiddenKey.split('_')[1];
                    return projectId === project.id && hiddenKey.startsWith(project.creatorId + '_');
                });
                return isActive && !project.resultPublished && !isDeleted;
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (allProjects.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">暂无项目</p>';
            return;
        }

        container.innerHTML = allProjects.map(project => {
            const endDate = new Date(project.endTime).toLocaleString('zh-CN', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            const isActive = new Date(project.endTime) > new Date();
            const isPaused = project.isPaused || false;
            
            // 计算参与人次（不重复计算同一用户）
            const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
            
            return `
                <div class="project-item">
                    <div class="project-title">${project.title} <span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[${isPaused ? '暂停' : (isActive ? '进行中' : '已结束')}]</span></div>
                    <div class="project-description">${project.description}</div>
                    <div class="project-meta">
                        <span>截止：${endDate}</span>
                        <span>参与人次：${formatLargeNumber(participantCount)}人</span>
                    </div>
                    <div class="project-actions">
                        <span class="creator-name">发起人：${project.creatorName}</span>
                        ${isPaused ? 
                            `<button class="btn-vote" style="background-color: #6c757d; cursor: not-allowed;" disabled>暂停中</button>` : 
                            `<button class="btn-vote" onclick="showVoteModal('${project.id}')">投票</button>`
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    // 渲染我的项目
    renderMyProjects() {
        if (!this.currentUser) {
            document.getElementById('createdProjects').innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">请先登录</p>';
            document.getElementById('participatedProjects').innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">请先登录</p>';
            return;
        }

        // 我创建的项目（过滤掉隐藏的项目）
        const createdProjects = this.projects.filter(p => {
            const isMyProject = p.creatorId === this.currentUser.uid;
            const hiddenKey = `${this.currentUser.uid}_${p.id}`;
            const isHidden = this.hiddenProjects.includes(hiddenKey);
            return isMyProject && !isHidden;
        });
        const createdContainer = document.getElementById('createdProjects');
        
        if (createdProjects.length === 0) {
            createdContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">您还没有创建任何项目</p>';
        } else {
            createdContainer.innerHTML = createdProjects.map(project => {
                const totalVotes = (project.votes?.yes || 0) + (project.votes?.no || 0);
                const endDate = new Date(project.endTime).toLocaleString('zh-CN', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const isActive = new Date(project.endTime) > new Date();
                
                // 计算参与人数（不重复计算同一用户）
                const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
                
                // 判断项目状态和背景颜色
                const isResultPublished = project.resultPublished;
                const hasVotes = totalVotes > 0;
                const isInProgress = isActive && !isResultPublished;
                
                // 设置背景颜色：已公布结果为灰色，进行中为红色
                const backgroundColor = isResultPublished ? 'rgba(128, 128, 128, 0.3)' : (isInProgress ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)');
                
                // 判断项目是否被暂停
                const isPaused = project.isPaused || false;
                
                return `
                    <div class="project-item" style="background: ${backgroundColor};">
                        <div class="project-title">${project.title} 
                            ${project.resultPublished ? 
                                `<span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[已结束]</span>` : 
                                `<span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[${isPaused ? '暂停' : '进行中'}]</span>`
                            }
                        </div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-meta">
                            <span>截止：${endDate}${project.resultPublished ? ` <span style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; position: absolute; right: 10px;">项目结果: ${project.result === 'yes' ? '是' : '否'}</span>` : ''}</span>
                        </div>
                        <div class="project-meta">
                            <span>是：${project.votes?.yes || 0}票</span>
                            <span>否：${project.votes?.no || 0}票</span>
                            <span>参与人数：${formatLargeNumber(participantCount)}人</span>
                        </div>
                        <div class="project-actions" style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center;">
                                ${!project.resultPublished ? 
                                    `<button style="font-size: 14px; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background-color: ${isPaused ? '#28a745' : '#ffc107'}; color: black; font-family: inherit; font-weight: normal;" onclick="${isPaused ? 'restartProject' : 'pauseProject'}('${project.id}')">${isPaused ? '重启项目' : '暂停项目'}</button>` : 
                                    ''
                                }
                            </div>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                ${!project.resultPublished && totalVotes > 0 ? `<button class="btn-publish" onclick="showPublishResultModal('${project.id}')">公布结果</button>` : ''}
                                ${(totalVotes === 0 || project.resultPublished) ? `<button class="btn-delete" onclick="deleteProject('${project.id}')">删除</button>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // 我参与的项目
        const participatedProjectIds = [...new Set(this.userVotes
            .filter(vote => vote.userId === this.currentUser.uid)
            .map(vote => vote.projectId))];
        
        const participatedProjects = this.projects.filter(p => {
            const isParticipated = participatedProjectIds.includes(p.id);
            const hiddenKey = `${this.currentUser.uid}_${p.id}`;
            const isHidden = this.hiddenProjects.includes(hiddenKey);
            return isParticipated && !isHidden;
        });
        
        const participatedContainer = document.getElementById('participatedProjects');
        
        if (participatedProjects.length === 0) {
            participatedContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">您还没有参与任何投票</p>';
        } else {
            participatedContainer.innerHTML = participatedProjects.map(project => {
                const myVotes = this.userVotes.filter(vote => 
                    vote.projectId === project.id && vote.userId === this.currentUser.uid
                );
                const endDate = new Date(project.endTime).toLocaleString('zh-CN', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const isActive = new Date(project.endTime) > new Date();
                
                // 统计我的投票
                const myYesVotes = myVotes.filter(v => v.option === 'yes').reduce((sum, v) => sum + v.points, 0);
                const myNoVotes = myVotes.filter(v => v.option === 'no').reduce((sum, v) => sum + v.points, 0);
                const myTotalVotes = myVotes.length;
                
                // 计算参与人次（不重复计算同一用户）
                const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
                
                // 判断项目状态和背景颜色
                const isResultPublished = project.resultPublished;
                const totalVotes = (project.votes?.yes || 0) + (project.votes?.no || 0);
                const isInProgress = isActive && !isResultPublished;
                
                // 设置背景颜色：已公布结果为灰色，进行中为红色
                const backgroundColor = isResultPublished ? 'rgba(128, 128, 128, 0.3)' : (isInProgress ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)');
                
                // 判断项目是否被暂停
                const isPaused = project.isPaused || false;
                
                return `
                    <div class="project-item" style="background: ${backgroundColor};">
                        <div class="project-title">${project.title} <span style="color: #dc3545; position: absolute; top: 10px; right: 10px; font-size: 12px; font-weight: bold;">[${project.resultPublished ? '已结束' : (isPaused ? '暂停' : (isActive ? '进行中' : '已结束'))}]</span></div>
                        <div class="project-description">${project.description}</div>
                        <div class="project-meta">
                            <span>截止：${endDate}${project.resultPublished ? ` <span style="background-color: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; position: absolute; right: 10px;">项目结果: ${project.result === 'yes' ? '是' : '否'}</span>` : ''}</span>
                        </div>
                        <div class="project-meta">
                            <span>我的投票次数：${myTotalVotes}次</span>
                            <span>参与人次：${formatLargeNumber(participantCount)}人</span>
                        </div>
                        <div class="project-meta">
                            <span>我投"是"：${myYesVotes}积分</span>
                            <span>我投"否"：${myNoVotes}积分</span>
                        </div>
                        <div class="project-actions" style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="creator-name">发起人：${project.creatorName}</span>
                            <div style="display: flex; gap: 10px; align-items: center;">
                                ${isInProgress && !isPaused ? `<button class="btn-vote" onclick="showVoteModal('${project.id}')">投票</button>` : 
                                  (!project.resultPublished && !isActive ? `<span class="result-pending">待公布</span>` : 
                                  (project.resultPublished ? `<button class="btn-delete" onclick="deleteParticipatedProject('${project.id}')">删除</button>` : ''))}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Pi SDK准备就绪回调
    onPiSDKReady() {
        console.log('Pi SDK 准备就绪');
        this.piSDKReady = true;
        piSDK = window.Pi;
        isPiSDKReady = true;
        
        // 如果应用已经初始化，更新登录状态
        if (this.currentUser) {
            this.updateLoginButton();
        }
    }

    // Pi SDK加载失败回调
    onPiSDKError() {
        console.log('Pi SDK 加载失败，继续离线模式');
        this.piSDKReady = false;
        piSDK = null;
        isPiSDKReady = false;
        
        // 显示离线模式提示
        this.showLoginStatus('当前为离线模式，部分功能可能受限', 'warning');
    }
}

// 格式化大数字显示
function formatLargeNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
}

// 全局变量
let app;

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    // 移除了调试日志调用
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    // 移除了调试日志调用
});

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded 事件触发，开始初始化应用');
    // 移除了调试日志调用
    
    try {
        app = new VotingApp();
        console.log('VotingApp 实例创建成功:', !!app);
        // 移除了调试日志调用
        
        // 确保app对象在全局可用
        window.app = app;
        console.log('app 对象已设置到 window.app');
        // 移除了调试日志调用
        
        // 调用初始化方法
        await app.init();
        console.log('应用初始化完成');
        // 移除了调试日志调用
    } catch (error) {
        console.error('应用初始化失败:', error);
        // 移除了调试日志调用
        showCustomAlert('应用初始化失败，请刷新页面重试', '初始化错误', '❌');
    }
});

// 全局函数

// 处理登录
function handleLogin() {
    console.log('全局 handleLogin 函数被调用');
    console.log('app 对象存在:', !!app);
    
    // 检查应用是否已初始化
    if (!app) {
        console.error('app 对象不存在，应用可能还在初始化中');
        showCustomAlert('应用正在初始化中，请稍后再试', '初始化中', '⏳');
        return;
    }
    
    // 检查Pi SDK是否已加载
    if (!window.Pi) {
        console.error('Pi SDK 未加载');
        showCustomAlert('Pi SDK 未加载，请确保在Pi Browser中打开此应用', 'SDK错误', '❌');
        return;
    }
    
    try {
        console.log('调用 app.handleLogin()');
        app.handleLogin();
    } catch (error) {
        console.error('登录过程中发生错误:', error);
        showCustomAlert('登录过程中发生错误，请重试', '登录错误', '❌');
    }
}

// 卡片展开/收起
function toggleCard(cardId) {
    const content = document.getElementById(cardId + 'Content');
    const arrow = document.getElementById(cardId + 'Arrow');
    
    if (content && arrow) {
        const isExpanded = content.classList.contains('expanded');
        
        if (isExpanded) {
            content.classList.remove('expanded');
            arrow.classList.remove('expanded');
            
            // 收起时恢复原始标题
            if (cardId === 'allProjects') {
                const allProjectsTitle = document.querySelector('.card-container .card-title span:nth-child(2)');
                if (allProjectsTitle) {
                    allProjectsTitle.textContent = '所有项目';
                }
            }
        } else {
            content.classList.add('expanded');
            arrow.classList.add('expanded');
            
            // 当展开卡片时，刷新相应内容
            if (app) {
                if (cardId === 'myProjects') {
                    app.renderMyProjects();
                } else if (cardId === 'allProjects') {
                    app.renderAllProjects();
                    
                    // 展开时显示统计信息
                    const allProjects = [...app.projects]
                        .filter(project => {
                            const isActive = new Date(project.endTime) > new Date();
                            const isDeleted = app.hiddenProjects.some(hiddenKey => {
                                const projectId = hiddenKey.split('_')[1];
                                return projectId === project.id && hiddenKey.startsWith(project.creatorId + '_');
                            });
                            return isActive && !project.resultPublished && !isDeleted;
                        });
                    
                    const totalProjects = allProjects.length;
                    const totalParticipants = [...new Set(
                        allProjects.flatMap(project => 
                            project.voteDetails?.map(vote => vote.voter) || []
                        )
                    )].length;
                    
                    const allProjectsTitle = document.querySelector('.card-container .card-title span:nth-child(2)');
                    if (allProjectsTitle) {
                        allProjectsTitle.innerHTML = `所有项目 <span style="display: inline-flex; align-items: center; margin-left: 50px; margin-right: 0px; font-size: 12px; vertical-align: middle; color: #ff4757;"><span style="text-align: center; margin-right: 8px;">总项目<br><strong>${totalProjects}</strong></span><span style="border-left: 1px solid #ff4757; height: 20px; margin-right: 8px;"></span><span style="text-align: center;">参与人<br><strong>${totalParticipants}</strong></span></span>`;
                    }
                }
            }
        }
    }
}

// 标签页切换
function switchTab(tabName) {
    // 移除所有活动状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // 激活选中的标签
    event.target.classList.add('active');
    
    if (tabName === 'created') {
        document.getElementById('createdProjects').classList.add('active');
    } else if (tabName === 'participated') {
        document.getElementById('participatedProjects').classList.add('active');
    }
    
    // 刷新"我的项目"内容
    if (app) {
        app.renderMyProjects();
    }
}

let selectedVoteOption = null;

function selectVoteOption(option) {
    selectedVoteOption = option;
    
    // 移除之前的选中状态
    document.querySelectorAll('.vote-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    // 添加当前选中状态
    const selectedElement = document.getElementById('vote' + (option === 'yes' ? 'Yes' : 'No'));
    selectedElement.classList.add('selected');
    
    // 获取选中选项的剩余积分
    const remainingPoints = parseInt(selectedElement.getAttribute('data-remaining'));
    
    // 更新投票积分输入框的最大值
    const votePointsInput = document.getElementById('votePoints');
    const maxPointsDisplay = document.getElementById('maxPointsDisplay');
    const remainingPointsInfo = document.getElementById('remainingPointsInfo');
    
    if (votePointsInput && maxPointsDisplay && remainingPointsInfo) {
        // 更新最大值为剩余积分和用户积分的较小值
        const maxAllowed = Math.min(remainingPoints, app.userPoints);
        votePointsInput.max = maxAllowed;
        maxPointsDisplay.textContent = maxAllowed;
        
        // 如果当前值超过新的最大值，调整为最大值
        if (parseInt(votePointsInput.value) > maxAllowed) {
            votePointsInput.value = Math.max(1, maxAllowed);
        }
        
        // 更新提示信息
        if (remainingPoints === 0) {
            remainingPointsInfo.textContent = `该选项已达到最大投票积分，无法继续投票`;
            remainingPointsInfo.style.color = '#ff6b6b';
            votePointsInput.disabled = true;
        } else {
            remainingPointsInfo.textContent = `该选项剩余可投积分: ${remainingPoints}，您的积分: ${app.userPoints}`;
            remainingPointsInfo.style.color = 'rgba(255,255,255,0.7)';
            votePointsInput.disabled = false;
        }
    }
}

function submitVote(projectId) {
    // 移除了调试日志调用
    
    if (!selectedVoteOption) {
        // 移除了调试日志调用
        showCustomAlert('请选择投票选项', '选择错误', '⚠️');
        return;
    }
    
    const votePoints = parseInt(document.getElementById('votePoints').value);
    if (!votePoints || votePoints < 1) {
        // 移除了调试日志调用
        showCustomAlert('请输入有效的投票积分', '输入错误', '⚠️');
        return;
    }
    
    // 移除了调试日志调用
    app.handleVote(projectId, selectedVoteOption, votePoints);
    selectedVoteOption = null;
}

function showPublishResultModal(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    app.showPublishResult(projectId);
}

async function publishResult(projectId, result) {
    // 显示确认提示
    const resultText = result === 'yes' ? '是' : '否';
    const confirmed = await showCustomConfirm(`确认公布结果为"${resultText}"吗？\n\n注意：结果一旦公布将无法修改，请仔细确认。`, '确认公布结果', '⚠️');
    
    if (confirmed) {
        app.publishProjectResult(projectId, result);
    }
}

// 显示充值模态框
function showRechargeModal() {
    if (!app.currentUser) {
        showCustomAlert('请先登录Pi Network账户', '登录提示', '🔐');
        return;
    }
    
    document.getElementById('rechargeModal').style.display = 'block';
    
    // 初始化充值表单事件
    const rechargeForm = document.getElementById('rechargeForm');
    if (rechargeForm && !rechargeForm.hasEventListener) {
        rechargeForm.addEventListener('submit', handleRechargeSubmit);
        rechargeForm.hasEventListener = true;
    }
    
    // 为转币数量输入框添加只能输入数字的限制
    const amountInput = document.getElementById('rechargeAmount');
    if (amountInput && !amountInput.hasEventListener) {
        amountInput.addEventListener('input', function(e) {
            // 只允许输入数字和小数点
            this.value = this.value.replace(/[^0-9.]/g, '');
            // 确保只有一个小数点
            const parts = this.value.split('.');
            if (parts.length > 2) {
                this.value = parts[0] + '.' + parts.slice(1).join('');
            }
        });
        amountInput.hasEventListener = true;
    }
}

// 复制地址功能
function copyAddress() {
    const addressElement = document.getElementById('rechargeAddress');
    const address = addressElement.textContent;
    
    // 使用现代的 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(address).then(() => {
            showCustomAlert('地址已复制到剪贴板', '复制成功', '✅');
        }).catch(err => {
            console.error('复制失败:', err);
            fallbackCopyTextToClipboard(address);
        });
    } else {
        // 降级方案
        fallbackCopyTextToClipboard(address);
    }
}

// 降级复制方案
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCustomAlert('地址已复制到剪贴板', '复制成功', '✅');
        } else {
            showCustomAlert('复制失败，请手动复制地址', '复制失败', '❌');
        }
    } catch (err) {
        console.error('复制失败:', err);
        showCustomAlert('复制失败，请手动复制地址', '复制失败', '❌');
    }
    
    document.body.removeChild(textArea);
}

// 处理充值表单提交 - 使用Pi Network支付
function handleRechargeSubmit(e) {
    e.preventDefault();
    
    if (!app.currentUser) {
        showCustomAlert('请先登录Pi Network账户', '登录提示', '🔐');
        return;
    }
    
    const amount = document.getElementById('rechargeAmount').value.trim();
    
    // 验证充值金额
    if (!amount) {
        showCustomAlert('请输入充值金额', '输入错误', '⚠️');
        return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
        showCustomAlert('充值金额必须大于0', '数量错误', '⚠️');
        return;
    }
    
    if (amountNum < 1) {
        showCustomAlert('最小充值金额为1 Pi', '数量错误', '⚠️');
        return;
    }
    
    // 确保Pi SDK已准备就绪
    if (!isPiSDKReady) {
        showCustomAlert('Pi Network SDK未准备就绪，请稍后重试', '系统错误', '❌');
        return;
    }
    
    // 创建Pi Network支付
    const paymentData = {
        amount: amountNum,
        memo: `投票平台充值 - ${amountNum} Pi`,
        metadata: {
            type: 'recharge',
            userId: app.currentUser.uid,
            timestamp: Date.now()
        }
    };
    
    const paymentCallbacks = {
        onReadyForServerApproval: function(paymentId) {
            console.log('支付已创建，等待服务器批准:', paymentId);
            showCustomAlert('支付已创建，正在处理...', '支付进行中', '⏳');
        },
        
        onReadyForServerCompletion: async function(paymentId, txid) {
            console.log('支付已完成:', paymentId, txid);
            
            const pointsToAdd = Math.floor(amountNum * 1); // 1 Pi = 1 积分，向下取整
            
            // 如果在线，尝试向后端发送充值记录
            if (app.isOnline) {
                try {
                    const rechargeData = {
                        amount: amountNum,
                        pointsAdded: pointsToAdd,
                        paymentId: paymentId,
                        txid: txid,
                        timestamp: Date.now()
                    };
                    
                    const response = await apiClient.post('/api/recharges', rechargeData);
                    
                    if (response.success) {
                        // 后端处理成功，更新本地数据
                        app.userPoints = response.data.newBalance;
                        app.addPointsHistory('recharge', pointsToAdd, `Pi Network充值 ${amountNum} Pi`);
                        app.saveLocalData();
                        app.updateUserPointsDisplay();
                        
                        showCustomAlert(
                            `充值成功！\n充值金额: ${amountNum} Pi\n获得积分: ${pointsToAdd}\n交易ID: ${txid}`,
                            'Pi Network 充值成功',
                            '🎉'
                        );
                        
                        // 重置表单并关闭模态框
                        document.getElementById('rechargeForm').reset();
                        closeModal('rechargeModal');
                        return;
                    }
                } catch (error) {
                    console.error('充值记录同步失败:', error);
                    // 如果后端请求失败，回退到本地处理
                }
            }
            
            // 离线模式或后端请求失败时的本地处理
            app.userPoints += pointsToAdd;
            app.addPointsHistory('recharge', pointsToAdd, `Pi Network充值 ${amountNum} Pi`);
            app.saveLocalData();
            app.updateUserPointsDisplay();
            
            showCustomAlert(
                `充值成功！\n充值金额: ${amountNum} Pi\n获得积分: ${pointsToAdd}\n交易ID: ${txid}`,
                'Pi Network 充值成功',
                '🎉'
            );
            
            // 重置表单并关闭模态框
            document.getElementById('rechargeForm').reset();
            closeModal('rechargeModal');
        },
        
        onCancel: function(paymentId) {
            console.log('用户取消了支付:', paymentId);
            showCustomAlert('支付已取消', '支付取消', 'ℹ️');
        },
        
        onError: function(error, payment) {
            console.error('支付错误:', error, payment);
            let errorMessage = '支付失败，请重试';
            
            if (error && error.message) {
                if (error.message.includes('insufficient')) {
                    errorMessage = 'Pi余额不足，请检查您的Pi钱包余额';
                } else if (error.message.includes('network')) {
                    errorMessage = '网络连接失败，请检查网络后重试';
                }
            }
            
            showCustomAlert(errorMessage, '支付失败', '❌');
        }
    };
    
    try {
        // 调用Pi SDK创建支付
        piSDK.createPayment(paymentData, paymentCallbacks);
        console.log('Pi Network支付请求已发送');
    } catch (error) {
        console.error('创建支付失败:', error);
        showCustomAlert('创建支付失败，请重试', '支付错误', '❌');
    }
}

// 显示提现模态框
function showWithdrawModal() {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    // 计算并显示可提现余额
    const availablePoints = app.userPoints - app.frozenPoints;
    const availableBalanceElement = document.getElementById('availableBalance');
    if (availableBalanceElement) {
        availableBalanceElement.textContent = availablePoints;
    }
    
    // 显示冻结积分信息
    const frozenPointsElement = document.getElementById('frozenPointsInfo');
    if (frozenPointsElement) {
        frozenPointsElement.textContent = `冻结积分：${app.frozenPoints} (暂时不可提现)`;
    }
    
    // 设置提币数量输入框的最大值
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    if (withdrawAmountInput) {
        withdrawAmountInput.max = availablePoints;
        
        // 添加输入限制事件监听器
        withdrawAmountInput.addEventListener('input', function() {
            // 限制只能输入整数
            this.value = this.value.replace(/[^0-9]/g, '');
            
            // 限制不能超过可提现余额
            const value = parseInt(this.value);
            if (value > availablePoints) {
                this.value = availablePoints;
            }
        });
    }
    
    // 为提币地址添加输入限制
    const withdrawAddressInput = document.getElementById('withdrawAddress');
    if (withdrawAddressInput) {
        withdrawAddressInput.addEventListener('input', function() {
            // 限制只能输入数字和字母
            this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
        });
    }
    
    document.getElementById('withdrawModal').style.display = 'block';
}

function showPointsDetailModal() {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    app.showPointsDetail();
}

// 显示投票模态框
function showVoteModal(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 检查项目是否被删除
    const isDeleted = app.hiddenProjects.some(hiddenKey => {
        const projectIdFromKey = hiddenKey.split('_')[1];
        return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
    });
    
    if (isDeleted) {
        showCustomAlert('该项目已被删除，无法投票', '操作失败', '❌');
        return;
    }
    
    // 检查项目是否被暂停
    if (project.isPaused) {
        showCustomAlert('该项目已被暂停，暂时无法投票', '投票提示', '⏸️');
        return;
    }
    
    const modal = document.getElementById('voteModal');
    const content = document.getElementById('voteContent');
    
    // 判断当前用户是否为项目发起人
    const isCreator = app.currentUser && project.creatorId === app.currentUser.uid;
    
    // 计算参与人数
    const participantCount = [...new Set(project.voteDetails?.map(vote => vote.voter) || [])].length;
    
    // 计算每个选项的剩余可投积分
    const yesVotes = project.votes?.yes || 0;
    const noVotes = project.votes?.no || 0;
    const remainingYesPoints = Math.max(0, project.maxPoints - yesVotes);
    const remainingNoPoints = Math.max(0, project.maxPoints - noVotes);
    
    // 根据用户身份显示不同的信息
    let yesDisplayText, noDisplayText;
    if (isCreator) {
        // 项目发起人显示详细票数和剩余积分
        yesDisplayText = `当前票数: ${yesVotes} (剩余: ${remainingYesPoints})`;
        noDisplayText = `当前票数: ${noVotes} (剩余: ${remainingNoPoints})`;
    } else {
        // 普通用户只显示参与人数
        yesDisplayText = `参与人数: ${participantCount}`;
        noDisplayText = `参与人数: ${participantCount}`;
    }
    
    content.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        
        <div class="vote-options-container">
            <div class="vote-option" onclick="selectVoteOption('yes')" id="voteYes" data-remaining="${remainingYesPoints}">
                <span class="option-text">是</span>
                <p>${yesDisplayText}</p>
            </div>
            <div class="vote-option" onclick="selectVoteOption('no')" id="voteNo" data-remaining="${remainingNoPoints}">
                <span class="option-text">否</span>
                <p>${noDisplayText}</p>
            </div>
        </div>
        
        <div class="vote-points-section">
            <label for="votePoints">投票积分 (1-<span id="maxPointsDisplay">${project.maxPoints}</span>) *</label>
            <input type="number" id="votePoints" min="1" max="${project.maxPoints}" value="1" required>
            <p id="remainingPointsInfo" style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 5px;">请先选择投票选项</p>
        </div>
        
        <button class="btn btn-primary" onclick="submitVote('${projectId}')">确认投票</button>
    `;
    
    modal.style.display = 'block';
}

// 关闭模态框
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// 错误处理
window.addEventListener('error', (event) => {
    console.error('应用错误:', event.error);
});

// 删除项目
async function deleteProject(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以删除项目', '权限不足', '🚫');
        return;
    }
    
    // 检查是否有人参与投票
    if ((project.voteDetails || []).length > 0) {
        // 如果有人投票，必须先公布结果才能删除
        if (!project.resultPublished) {
            showCustomAlert('已有人参与投票，请先公布结果后再删除项目', '删除限制', '⚠️');
            return;
        }
    }
    
    // 确认删除
    const confirmMessage = project.resultPublished 
        ? `确定要删除项目\"${project.title}\"吗？项目将从您的列表中移除，但其他参与用户仍可查看。`
        : `确定要删除项目\"${project.title}\"吗？删除后将返还冻结的${project.frozenPoints}积分。项目将从您的列表中移除，但其他参与用户仍可查看。`;
    
    const confirmed = await showCustomConfirm(confirmMessage, '确认删除项目', '🗑️');
    if (!confirmed) {
        return;
    }
    
    // 如果在线，尝试向后端发送删除请求
    if (app.isOnline) {
        try {
            const response = await apiClient.delete(`/api/projects/${projectId}`);
            
            if (response.success) {
                // 后端处理成功，更新本地数据
                deleteProjectLocally(project);
                return;
            }
        } catch (error) {
            console.error('删除项目请求失败:', error);
            // 如果后端请求失败，回退到本地处理
        }
    }
    
    // 离线模式或后端请求失败时的本地处理
    deleteProjectLocally(project);
}

// 本地删除项目逻辑
function deleteProjectLocally(project) {
    // 只有未公布结果的项目才返还冻结积分
    // 已公布结果的项目，积分已经在公布结果时处理过了
    if (!project.resultPublished) {
        const frozenPoints = project.frozenPoints || 0;
            app.frozenPoints -= frozenPoints;
            app.addPointsHistory('project_delete', 0, `删除项目解冻积分 - ${project.title} (解冻${frozenPoints}积分)`);
    }
    
    // 检查项目是否有人参与投票
    const totalVotes = (project.voteDetails || []).length;
    
    // 无论是否有人参与，删除项目都应该从projects数组中完全移除
    // 这样可以确保删除的项目不会在\"所有项目\"中展示给其他用户
    app.projects = app.projects.filter(p => p.id !== project.id);
    
    // 同时清理可能存在的隐藏项目记录
    app.hiddenProjects = app.hiddenProjects.filter(hiddenKey => {
        const projectIdFromKey = hiddenKey.split('_')[1];
        return projectIdFromKey !== project.id;
    });
    
    // 保存数据并更新显示
    app.saveLocalData();
    app.updateUserPointsDisplay();
    app.renderProjects();
    
    if (project.resultPublished) {
        showCustomAlert('项目删除成功！', '删除成功', '🗑️');
    } else {
        const frozenPoints = project.frozenPoints || 0;
        showCustomAlert(`项目删除成功！已返还${frozenPoints}积分，当前积分：${app.userPoints}`, '删除成功', '🗑️');
    }
}

// 删除参与的项目（从我的参与列表中移除）
async function deleteParticipatedProject(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }

    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }

    // 只有已公布结果的项目才能从参与列表中删除
    if (!project.resultPublished) {
        showCustomAlert('只有已公布结果的项目才能删除', '删除限制', '⚠️');
        return;
    }

    // 确认删除
    const confirmed = await showCustomConfirm(`确定要从参与列表中删除项目"${project.title}"吗？项目将从您的列表中隐藏。`, '确认删除参与项目', '🗑️');
    if (!confirmed) {
        return;
    }

    // 将项目添加到当前用户的隐藏列表中
    const hiddenProjectKey = `${app.currentUser.uid}_${projectId}`;
    if (!app.hiddenProjects.includes(hiddenProjectKey)) {
        app.hiddenProjects.push(hiddenProjectKey);
    }
    
    app.saveLocalData();
    app.renderProjects();
    
    showCustomAlert('项目已从参与列表中删除', '删除成功', '🗑️');
}

// 编辑项目
function editProject(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以编辑项目', '权限不足', '🚫');
        return;
    }
    
    // 检查项目是否被删除
    const isDeleted = app.hiddenProjects.some(hiddenKey => {
        const projectIdFromKey = hiddenKey.split('_')[1];
        return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
    });
    
    if (isDeleted) {
        showCustomAlert('该项目已被删除，无法编辑', '操作失败', '❌');
        return;
    }
    
    // 检查项目是否已结束
    if (new Date() > new Date(project.endTime)) {
        showCustomAlert('项目已结束，无法编辑', '编辑限制', '⏰');
        return;
    }
    
    // 填充表单数据
    const titleInput = document.getElementById('projectTitle');
    const descInput = document.getElementById('projectDescription');
    const endTimeInput = document.getElementById('endTime');
    const maxPointsInput = document.getElementById('maxPoints');
    
    if (titleInput) titleInput.value = project.title;
    if (descInput) descInput.value = project.description;
    if (endTimeInput) endTimeInput.value = new Date(project.endTime).toISOString().slice(0, 16);
    if (maxPointsInput) maxPointsInput.value = project.maxPoints;
    
    // 展开创建项目卡片
    const createContent = document.getElementById('createProjectContent');
    const createArrow = document.getElementById('createProjectArrow');
    if (createContent && createArrow) {
        createContent.classList.add('expanded');
        createArrow.classList.add('expanded');
    }
    
    // 滚动到创建项目区域
    const createProjectElement = document.getElementById('createProject');
    if (createProjectElement) {
        createProjectElement.scrollIntoView({ behavior: 'smooth' });
    }
    
    // 存储正在编辑的项目ID
    app.editingProjectId = projectId;
    
    // 检查是否需要显示公布结果按钮
    const hasVotes = (project.voteDetails || []).length > 0;
    const resultNotPublished = !project.resultPublished;
    
    // 获取提交按钮
    const submitBtn = document.querySelector('#createProjectForm button[type="submit"]');
    
    // 移除之前可能存在的公布结果按钮
    const existingPublishBtn = document.getElementById('editPublishResultBtn');
    if (existingPublishBtn) {
        existingPublishBtn.remove();
    }
    
    // 如果有投票且结果未公布，将提交按钮替换为公布结果按钮
    if (hasVotes && resultNotPublished) {
        if (submitBtn) {
            submitBtn.textContent = '公布结果';
            submitBtn.type = 'button';
            submitBtn.onclick = (e) => {
                e.preventDefault();
                showPublishResultModal(projectId);
            };
        }
    } else {
         // 如果没有投票或结果已公布，显示取消编辑按钮
         if (submitBtn) {
             submitBtn.textContent = '取消编辑';
             submitBtn.type = 'button';
             submitBtn.onclick = (e) => {
                 e.preventDefault();
                 cancelEdit();
             };
         }
     }
}

// 取消编辑项目
function cancelEdit() {
    if (!app.editingProjectId) {
        return;
    }
    
    // 清除编辑状态
    app.editingProjectId = null;
    
    // 重置表单
    const form = document.getElementById('createProjectForm');
    if (form) {
        form.reset();
    }
    
    // 恢复按钮
    const submitBtn = document.querySelector('#createProjectForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = '创建项目';
        submitBtn.type = 'submit';
        submitBtn.onclick = null;
        submitBtn.style.display = 'block';
    }
    
    // 移除可能存在的公布结果按钮
    const existingPublishBtn = document.getElementById('editPublishResultBtn');
    if (existingPublishBtn) {
        existingPublishBtn.remove();
    }
    
    // 收起创建项目卡片
    const createContent = document.getElementById('createProjectContent');
    const createArrow = document.getElementById('createProjectArrow');
    if (createContent && createArrow) {
        createContent.classList.remove('expanded');
        createArrow.classList.remove('expanded');
    }
    
    showCustomAlert('已取消编辑', '取消成功', 'ℹ️');
}

// 暂停项目
async function pauseProject(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以暂停项目', '权限不足', '🚫');
        return;
    }
    
    // 检查项目是否被删除
    const isDeleted = app.hiddenProjects.some(hiddenKey => {
        const projectIdFromKey = hiddenKey.split('_')[1];
        return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
    });
    
    if (isDeleted) {
        showCustomAlert('该项目已被删除，无法暂停', '操作失败', '❌');
        return;
    }
    
    if (project.resultPublished) {
        showCustomAlert('项目已结束，无法暂停', '暂停限制', '⏰');
        return;
    }
    
    const confirmed = await showCustomConfirm(`确定要暂停项目\"${project.title}\"吗？暂停后其他用户将无法投票。`, '确认暂停项目', '⏸️');
    if (confirmed) {
        // 如果在线，尝试向后端发送暂停请求
        if (app.isOnline) {
            try {
                const response = await apiClient.put(`/api/projects/${projectId}/pause`);
                
                if (response.success) {
                    // 后端处理成功，更新本地数据
                    project.isPaused = true;
                    app.saveLocalData();
                    app.renderProjects();
                    showCustomAlert('项目已暂停', '暂停成功', '⏸️');
                    return;
                }
            } catch (error) {
                console.error('暂停项目请求失败:', error);
                // 如果后端请求失败，回退到本地处理
            }
        }
        
        // 离线模式或后端请求失败时的本地处理
        project.isPaused = true;
        app.saveLocalData();
        app.renderProjects();
        showCustomAlert('项目已暂停', '暂停成功', '⏸️');
    }
}

// 重启项目
async function restartProject(projectId) {
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以重启项目', '权限不足', '🚫');
        return;
    }
    
    // 检查项目是否被删除
    const isDeleted = app.hiddenProjects.some(hiddenKey => {
        const projectIdFromKey = hiddenKey.split('_')[1];
        return projectIdFromKey === project.id && hiddenKey.startsWith(project.creatorId + '_');
    });
    
    if (isDeleted) {
        showCustomAlert('该项目已被删除，无法重启', '操作失败', '❌');
        return;
    }
    
    if (project.resultPublished) {
        showCustomAlert('项目已结束，无法重启', '重启限制', '⏰');
        return;
    }
    
    const confirmed = await showCustomConfirm(`确定要重启项目\"${project.title}\"吗？重启后其他用户可以继续投票。`, '确认重启项目', '▶️');
    if (confirmed) {
        // 如果在线，尝试向后端发送重启请求
        if (app.isOnline) {
            try {
                const response = await apiClient.put(`/api/projects/${projectId}/restart`);
                
                if (response.success) {
                    // 后端处理成功，更新本地数据
                    project.isPaused = false;
                    app.saveLocalData();
                    app.renderProjects();
                    showCustomAlert('项目已重启', '重启成功', '▶️');
                    return;
                }
            } catch (error) {
                console.error('重启项目请求失败:', error);
                // 如果后端请求失败，回退到本地处理
            }
        }
        
        // 离线模式或后端请求失败时的本地处理
        project.isPaused = false;
        app.saveLocalData();
        app.renderProjects();
        showCustomAlert('项目已重启', '重启成功', '▶️');
    }
}

// 导出给全局使用
window.app = app;