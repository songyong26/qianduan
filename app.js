// 移除了调试面板相关代码

// 纯前端项目 - 移除了所有后端API调用

// 调试信息显示功能
function toggleDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (debugInfo) {
        debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
    }
}

function updateDebugInfo(message) {
    const debugContent = document.getElementById('debugContent');
    if (debugContent) {
        const timestamp = new Date().toLocaleTimeString();
        debugContent.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        // 保持最新的10条信息
        const lines = debugContent.children;
        if (lines.length > 10) {
            debugContent.removeChild(lines[0]);
        }
    }
    console.log(`[DEBUG] ${message}`);
}

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

// Pi Network SDK 全局变量已移除，直接使用 window.Pi

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
        
        // 不在构造函数中自动初始化，由外部调用
    }
    


    async init() {
        try {
            console.log('开始初始化应用');
            
            // 初始化 Pi SDK
            this.initPiSDK();
            
            // 检查网络状态
            this.checkNetworkStatus();
            
            // 加载本地数据
            this.loadLocalData();
            
            // 初始化UI
            this.initializeUI();
            
            // 渲染项目列表
            this.renderProjects();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
            
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

    // 初始化 Pi SDK
    initPiSDK() {
        try {
            console.log('开始初始化 Pi SDK');
            updateDebugInfo('开始初始化 Pi SDK');
            
            // 首先尝试初始化 Pi SDK
            if (window.Pi) {
                try {
                    console.log('调用 Pi.init...');
                    updateDebugInfo('调用 Pi.init...');
                    window.Pi.init({ version: "2.0", sandbox: false });
                    console.log('Pi.init 调用完成');
                    updateDebugInfo('Pi.init 调用完成');
                } catch (initError) {
                    console.error('Pi.init 调用失败:', initError);
                    updateDebugInfo(`Pi.init 调用失败: ${initError.message}`);
                }
            } else {
                console.warn('window.Pi 对象不存在，可能不在 Pi Browser 环境中');
                updateDebugInfo('window.Pi 对象不存在，可能不在 Pi Browser 环境中');
            }
            
            // 检查 Pi SDK 是否已经加载并可用
            const checkPiSDK = () => {
                if (window.Pi && typeof window.Pi.authenticate === 'function') {
                    this.piSDKReady = true;
                    console.log('Pi SDK 已加载并可用');
                    updateDebugInfo('✅ Pi SDK 已加载并可用');
                    this.showLoginStatus('Pi SDK 已就绪', 'success');
                    return true;
                }
                return false;
            };
            
            // 立即检查一次
            if (checkPiSDK()) {
                return;
            }
            
            // 如果 Pi SDK 还没有完全加载，等待一段时间后重试
            let retryCount = 0;
            const maxRetries = 20; // 增加重试次数
            const retryInterval = 500; // 500ms
            
            const retryCheck = () => {
                retryCount++;
                console.log(`检查 Pi SDK 状态 (第${retryCount}次)`);
                updateDebugInfo(`检查 Pi SDK 状态 (第${retryCount}次)`);
                
                if (checkPiSDK()) {
                    return;
                }
                
                if (retryCount < maxRetries) {
                    setTimeout(retryCheck, retryInterval);
                } else {
                    console.warn('Pi SDK 加载超时，应用将在离线模式下运行');
                    updateDebugInfo('⚠️ Pi SDK 加载超时，应用将在离线模式下运行');
                    this.showLoginStatus('离线模式：请在Pi Browser中打开', 'warning');
                    this.piSDKReady = false;
                }
            };
            
            // 开始重试检查
            setTimeout(retryCheck, retryInterval);
            
        } catch (error) {
            console.error('Pi SDK 初始化失败:', error);
            updateDebugInfo(`❌ Pi SDK 初始化失败: ${error.message}`);
            this.showLoginStatus('Pi SDK 初始化失败', 'error');
            this.piSDKReady = false;
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

    // 纯前端项目 - 移除了后端数据加载方法
    
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

    // 初始化UI事件 - Pi浏览器兼容版本
    initializeUI() {
        var self = this;
        
        // 创建项目表单提交
        var createForm = document.getElementById('createProjectForm');
        if (createForm) {
            createForm.addEventListener('submit', function(e) {
                try {
                    self.handleCreateProject(e);
                } catch (error) {
                    console.error('创建项目事件处理失败:', error);
                }
            });
        }

        // 提现表单提交
        var withdrawForm = document.getElementById('withdrawForm');
        if (withdrawForm) {
            withdrawForm.addEventListener('submit', function(e) {
                try {
                    self.handleWithdraw(e);
                } catch (error) {
                    console.error('提现事件处理失败:', error);
                }
            });
        }

        // 设置最小截止时间为当前时间
        var endTimeInput = document.getElementById('endTime');
        if (endTimeInput) {
            try {
                var now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                endTimeInput.min = now.toISOString().slice(0, 16);
            } catch (error) {
                console.error('设置时间输入框失败:', error);
            }
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

    // 处理登录/退出 - Pi浏览器兼容版本
    handleLogin() {
        var self = this;
        
        try {
            this.loginAttempts++;
            console.log(`开始第${this.loginAttempts}次登录尝试`);
            
            if (typeof self.showLoginStatus === 'function') {
                self.showLoginStatus('开始处理登录请求...');
            }
            
            if (this.currentUser) {
                // 退出登录
                console.log('用户请求退出登录');
                if (typeof self.showLoginStatus === 'function') {
                    self.showLoginStatus('正在退出登录...', 'info');
                }
                
                // 清除本地数据
                this.currentUser = null;
                this.userPoints = 0;
                this.frozenPoints = 0;
                this.pointsHistory = [];
                
                try {
                    localStorage.removeItem('current_user');
                } catch (storageError) {
                    console.warn('清除本地存储失败:', storageError);
                }
                
                if (typeof this.updateLoginButton === 'function') {
                    this.updateLoginButton();
                }
                if (typeof this.updateUserPointsDisplay === 'function') {
                    this.updateUserPointsDisplay();
                }
                if (typeof this.renderProjects === 'function') {
                    this.renderProjects();
                }
                
                if (typeof self.showLoginStatus === 'function') {
                    self.showLoginStatus('已成功退出登录', 'success');
                }
                
                if (typeof showCustomAlert === 'function') {
                    showCustomAlert('已退出登录', '退出成功', '✅');
                } else {
                    alert('已退出登录');
                }
            } else {
                // 开始登录流程
                console.log('开始Pi Network登录流程');
                if (typeof self.showLoginStatus === 'function') {
                    self.showLoginStatus('开始本地登录流程...', 'info');
                }
                
                // 记录Pi SDK状态用于调试
                const sdkStatus = {
                    windowPi: !!window.Pi,
                    piSDKLoadTime: this.piSDKLoadTime
                };
                console.log('Pi SDK 检查 - window.Pi:', !!window.Pi);
                
                if (typeof self.showLoginStatus === 'function') {
                    self.showLoginStatus('🔍 检查Pi SDK状态...', 'info');
                }
                
                // 确保Pi SDK已准备就绪
                if (!window.Pi || typeof window.Pi.authenticate !== 'function') {
                    if (typeof self.showLoginStatus === 'function') {
                        self.showLoginStatus('❌ Pi SDK 不可用', 'error');
                    }
                    if (typeof showCustomAlert === 'function') {
                        showCustomAlert('请在 Pi Browser 中打开此应用，或等待 Pi SDK 加载完成', 'SDK错误', '❌');
                    } else {
                        alert('请在 Pi Browser 中打开此应用，或等待 Pi SDK 加载完成');
                    }
                } else {
                    // Pi SDK已准备就绪，直接进行认证
                    this.performPiAuthentication();
                }
            }
        } catch (error) {
            console.error('登录初始化错误:', error);
            console.error('登录初始化错误:', error);
            var errorMessage = '登录功能初始化失败，请重试';
            
            if (typeof self.showLoginStatus === 'function') {
                self.showLoginStatus('❌ ' + errorMessage, 'error');
            }
            
            if (typeof showCustomAlert === 'function') {
                showCustomAlert(errorMessage, '登录失败', '❌');
            } else {
                alert(errorMessage);
            }
        }
    }
    
    // Pi Network 用户认证 - 按照官方文档实现
    async performPiAuthentication() {
        try {
            console.log('=== 开始 Pi 认证流程 ===');
            updateDebugInfo('=== 开始 Pi 认证流程 ===');
            console.log('window.Pi 存在:', !!window.Pi);
            updateDebugInfo(`window.Pi 存在: ${!!window.Pi}`);
            console.log('window.Pi.authenticate 类型:', typeof window.Pi?.authenticate);
            updateDebugInfo(`window.Pi.authenticate 类型: ${typeof window.Pi?.authenticate}`);
            console.log('Pi SDK 就绪状态:', this.piSDKReady);
            updateDebugInfo(`Pi SDK 就绪状态: ${this.piSDKReady}`);
            
            // 检查 Pi SDK 是否可用
            if (!window.Pi) {
                console.error('window.Pi 对象不存在');
                updateDebugInfo('❌ window.Pi 对象不存在');
                throw new Error('Pi SDK 未加载，请在 Pi Browser 中打开此应用');
            }
            
            if (typeof window.Pi.authenticate !== 'function') {
                console.error('window.Pi.authenticate 不是函数，类型:', typeof window.Pi.authenticate);
                updateDebugInfo(`❌ window.Pi.authenticate 不是函数，类型: ${typeof window.Pi.authenticate}`);
                console.log('window.Pi 对象内容:', Object.keys(window.Pi));
                updateDebugInfo(`window.Pi 对象内容: ${Object.keys(window.Pi).join(', ')}`);
                throw new Error('Pi SDK authenticate 方法不可用，请等待 SDK 完全加载');
            }

            this.showLoginStatus('正在连接 Pi Network...', 'info');
            console.log('开始调用 Pi.authenticate...');
            updateDebugInfo('✅ Pi SDK 检查通过，开始认证...');

            // 定义权限范围
            const scopes = ['payments', 'username'];
            console.log('请求权限范围:', scopes);
            updateDebugInfo(`请求权限范围: ${scopes.join(', ')}`);

            // 处理未完成支付的回调函数
            const onIncompletePaymentFound = (payment) => {
                console.log('发现未完成的支付:', payment);
                updateDebugInfo('⚠️ 发现未完成的支付');
                this.showLoginStatus('发现未完成的支付，正在处理...', 'warning');
                // 这里可以添加处理未完成支付的逻辑
                return payment.txid;
            };

            // 执行认证
            console.log('调用 window.Pi.authenticate...');
            updateDebugInfo('🔄 正在调用 Pi.authenticate...');
            const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
            
            console.log('Pi 认证返回结果:', authResult);
            updateDebugInfo('✅ Pi.authenticate 调用完成');
            console.log('认证结果类型:', typeof authResult);
            updateDebugInfo(`认证结果类型: ${typeof authResult}`);
            console.log('用户信息存在:', !!authResult?.user);
            updateDebugInfo(`用户信息存在: ${!!authResult?.user}`);
            
            if (authResult && authResult.user) {
                console.log('认证成功，处理用户登录...');
                updateDebugInfo('🎉 认证成功，处理用户登录...');
                // 处理用户登录
                this.processUserLogin(authResult.user, authResult.accessToken);
            } else {
                console.error('认证失败：认证结果无效', authResult);
                updateDebugInfo('❌ 认证失败：认证结果无效');
                throw new Error('认证失败：未获取到用户信息');
            }

        } catch (error) {
            console.error('=== Pi 认证失败 ===');
            updateDebugInfo('❌ === Pi 认证失败 ===');
            console.error('错误对象:', error);
            console.error('错误消息:', error.message);
            updateDebugInfo(`错误消息: ${error.message}`);
            console.error('错误堆栈:', error.stack);
            console.error('错误类型:', error.constructor.name);
            updateDebugInfo(`错误类型: ${error.constructor.name}`);
            
            let errorMessage = '登录失败，请重试';
            let debugInfo = '';
            
            // 根据错误类型提供具体的错误信息
            if (error.message && error.message.includes('cancelled')) {
                errorMessage = '用户取消了登录操作';
                updateDebugInfo('用户取消了登录操作');
            } else if (error.message && error.message.includes('network')) {
                errorMessage = '网络连接失败，请检查网络后重试';
                updateDebugInfo('网络连接失败');
            } else if (error.message && error.message.includes('Pi SDK')) {
                errorMessage = '请在 Pi Browser 中打开此应用';
                updateDebugInfo('Pi SDK 相关错误');
            } else {
                // 添加调试信息
                debugInfo = `\n调试信息: ${error.message || '未知错误'}`;
                errorMessage = '登录过程中出现错误' + debugInfo;
                updateDebugInfo(`未知错误: ${error.message || '未知错误'}`);
            }
            
            this.showLoginStatus(errorMessage, 'error');
            showCustomAlert(errorMessage, '登录失败', '❌');
        }
    }

    // 处理用户登录
    processUserLogin(userInfo, accessToken) {
        try {
            console.log('处理用户登录:', userInfo);
            
            // 准备用户数据
            const userData = {
                uid: userInfo.uid || 'pi_user_' + Date.now(),
                username: userInfo.username || 'Pi用户',
                displayName: userInfo.displayName || userInfo.username || 'Pi用户',
                name: userInfo.name || userInfo.username || 'Pi用户',
                accessToken: accessToken
            };
            
            // 设置当前用户
            this.currentUser = userData;
            
            // 加载用户的本地数据
            this.loadLocalUserData(userData.uid);
            
            // 保存数据
            this.saveLocalData();
            
            // 更新UI
            this.updateLoginButton();
            this.updateUserPointsDisplay();
            this.renderProjects();
            
            // 显示成功消息
            this.showLoginStatus('登录成功', 'success');
            
            const displayName = this.getUserDisplayName();
            showCustomAlert(`欢迎，${displayName}！`, 'Pi Network 登录成功', '🎉');
            
        } catch (error) {
            console.error('处理用户登录失败:', error);
            this.showLoginStatus('登录处理失败', 'error');
            showCustomAlert('登录处理失败，请重试', '处理失败', '❌');
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
        
        // 如果应用已经初始化，更新登录状态
        if (this.currentUser) {
            this.updateLoginButton();
        }
    }

    // Pi SDK加载失败回调
    onPiSDKError() {
        console.log('Pi SDK 加载失败，继续离线模式');
        this.piSDKReady = false;
        
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

// 页面加载完成后初始化应用 - Pi浏览器兼容版本
function initializeApp() {
    console.log('开始初始化应用');
    
    // 防止重复初始化
    if (window.app && window.app instanceof VotingApp) {
        console.log('应用已经初始化，跳过重复初始化');
        return;
    }
    
    try {
        window.app = new VotingApp();
        console.log('VotingApp 实例创建成功:', !!window.app);
        
        // 调用初始化方法
        window.app.init().then(function() {
            console.log('应用初始化完成');
        }).catch(function(error) {
            console.error('应用初始化失败:', error);
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('应用初始化失败，请刷新页面重试', '初始化错误', '❌');
            } else {
                alert('应用初始化失败，请刷新页面重试');
            }
        });
        
    } catch (error) {
        console.error('应用初始化失败:', error);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('应用初始化失败，请刷新页面重试', '初始化错误', '❌');
        } else {
            alert('应用初始化失败，请刷新页面重试');
        }
    }
}

// 多种方式确保应用初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // 如果DOM已经加载完成，直接初始化
    initializeApp();
}

// 备用初始化方式
window.addEventListener('load', function() {
    if (!window.app) {
        console.log('备用初始化触发');
        setTimeout(initializeApp, 100);
    }
});

// 全局函数

// 处理登录 - Pi浏览器兼容版本
function handleLogin() {
    console.log('全局 handleLogin 函数被调用');
    updateDebugInfo('🔘 全局 handleLogin 函数被调用');
    console.log('app 对象存在:', !!window.app);
    updateDebugInfo(`app 对象存在: ${!!window.app}`);
    console.log('Pi SDK 状态 - window.Pi:', !!window.Pi);
    updateDebugInfo(`Pi SDK 状态 - window.Pi: ${!!window.Pi}`);
    
    try {
        // 检查应用是否已初始化
        if (!window.app || typeof window.app !== 'object') {
            console.error('app 对象不存在，应用可能还在初始化中');
            updateDebugInfo('❌ app 对象不存在，应用可能还在初始化中');
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('应用正在初始化中，请稍后再试', '初始化中', '⏳');
            } else {
                alert('应用正在初始化中，请稍后再试');
            }
            return;
        }
        
        // 检查handleLogin方法是否存在
        if (typeof window.app.handleLogin !== 'function') {
            console.error('app.handleLogin 方法不存在');
            if (typeof showCustomAlert === 'function') {
                showCustomAlert('登录功能不可用，请刷新页面重试', '功能错误', '❌');
            } else {
                alert('登录功能不可用，请刷新页面重试');
            }
            return;
        }
        
        // 直接调用app的handleLogin方法，让它内部处理Pi SDK的检查
        console.log('调用 app.handleLogin()');
        window.app.handleLogin();
    } catch (error) {
        console.error('登录过程中发生错误:', error);
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('登录过程中发生错误，请重试', '登录错误', '❌');
        } else {
            alert('登录过程中发生错误，请重试');
        }
    }
}

// 卡片展开/收起 - Pi浏览器兼容版本
function toggleCard(cardId) {
    console.log('toggleCard 被调用，cardId:', cardId);
    
    try {
        var content = document.getElementById(cardId + 'Content');
        var arrow = document.getElementById(cardId + 'Arrow');
        
        console.log('找到元素 - content:', !!content, 'arrow:', !!arrow);
        
        if (content && arrow) {
            var isExpanded = false;
            
            // 兼容性检查classList
            if (content.classList && typeof content.classList.contains === 'function') {
                isExpanded = content.classList.contains('expanded');
            } else {
                // 备用方法
                isExpanded = content.className && content.className.indexOf('expanded') !== -1;
            }
            
            console.log('当前展开状态:', isExpanded);
            
            if (isExpanded) {
                // 收起卡片
                if (content.classList && typeof content.classList.remove === 'function') {
                    content.classList.remove('expanded');
                    arrow.classList.remove('expanded');
                } else {
                    // 备用方法
                    content.className = content.className.replace(/\bexpanded\b/g, '').trim();
                    arrow.className = arrow.className.replace(/\bexpanded\b/g, '').trim();
                }
                
                // 收起时恢复原始标题
                if (cardId === 'allProjects') {
                    try {
                        var allProjectsTitle = document.querySelector('.card-container .card-title span:nth-child(2)');
                        if (allProjectsTitle) {
                            allProjectsTitle.textContent = '所有项目';
                        }
                    } catch (titleError) {
                        console.error('恢复标题失败:', titleError);
                    }
                }
            } else {
                // 展开卡片
                if (content.classList && typeof content.classList.add === 'function') {
                    content.classList.add('expanded');
                    arrow.classList.add('expanded');
                } else {
                    // 备用方法
                    if (content.className.indexOf('expanded') === -1) {
                        content.className += ' expanded';
                    }
                    if (arrow.className.indexOf('expanded') === -1) {
                        arrow.className += ' expanded';
                    }
                }
                
                // 当展开卡片时，刷新相应内容
                if (window.app && typeof window.app === 'object') {
                    try {
                        if (cardId === 'myProjects' && typeof window.app.renderMyProjects === 'function') {
                            window.app.renderMyProjects();
                        } else if (cardId === 'allProjects' && typeof window.app.renderAllProjects === 'function') {
                            window.app.renderAllProjects();
                            
                            // 展开时显示统计信息
                            try {
                                if (window.app.projects && Array.isArray(window.app.projects)) {
                                    var allProjects = window.app.projects.filter(function(project) {
                                        var isActive = new Date(project.endTime) > new Date();
                                        var isDeleted = false;
                                        
                                        if (window.app.hiddenProjects && Array.isArray(window.app.hiddenProjects)) {
                                            isDeleted = window.app.hiddenProjects.some(function(hiddenKey) {
                                                var projectId = hiddenKey.split('_')[1];
                                                return projectId === project.id && hiddenKey.indexOf(project.creatorId + '_') === 0;
                                            });
                                        }
                                        
                                        return isActive && !project.resultPublished && !isDeleted;
                                    });
                                    
                                    var totalProjects = allProjects.length;
                                    var allVoters = [];
                                    
                                    for (var i = 0; i < allProjects.length; i++) {
                                        var project = allProjects[i];
                                        if (project.voteDetails && Array.isArray(project.voteDetails)) {
                                            for (var j = 0; j < project.voteDetails.length; j++) {
                                                var vote = project.voteDetails[j];
                                                if (vote.voter && allVoters.indexOf(vote.voter) === -1) {
                                                    allVoters.push(vote.voter);
                                                }
                                            }
                                        }
                                    }
                                    
                                    var totalParticipants = allVoters.length;
                                    
                                    var allProjectsTitle = document.querySelector('.card-container .card-title span:nth-child(2)');
                                    if (allProjectsTitle) {
                                        allProjectsTitle.innerHTML = '所有项目 <span style="display: inline-flex; align-items: center; margin-left: 50px; margin-right: 0px; font-size: 12px; vertical-align: middle; color: #ff4757;"><span style="text-align: center; margin-right: 8px;">总项目<br><strong>' + totalProjects + '</strong></span><span style="border-left: 1px solid #ff4757; height: 20px; margin-right: 8px;"></span><span style="text-align: center;">参与人<br><strong>' + totalParticipants + '</strong></span></span>';
                                    }
                                }
                            } catch (statsError) {
                                console.error('更新统计信息失败:', statsError);
                            }
                        }
                    } catch (renderError) {
                        console.error('渲染内容失败:', renderError);
                    }
                } else {
                    console.warn('app对象不可用');
                }
            }
            
            console.log('toggleCard 执行完成');
        } else {
            console.error('未找到必要的DOM元素 - content:', !!content, 'arrow:', !!arrow);
        }
    } catch (error) {
        console.error('toggleCard 执行失败:', error);
        // 备用提示
        if (typeof alert === 'function') {
            alert('卡片操作失败，请刷新页面重试');
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
    if (window.app) {
        window.app.renderMyProjects();
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
        const maxAllowed = Math.min(remainingPoints, window.app.userPoints);
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
            remainingPointsInfo.textContent = `该选项剩余可投积分: ${remainingPoints}，您的积分: ${window.app.userPoints}`;
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
    window.app.handleVote(projectId, selectedVoteOption, votePoints);
    selectedVoteOption = null;
}

function showPublishResultModal(projectId) {
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    window.app.showPublishResult(projectId);
}

async function publishResult(projectId, result) {
    // 显示确认提示
    const resultText = result === 'yes' ? '是' : '否';
    const confirmed = await showCustomConfirm(`确认公布结果为"${resultText}"吗？\n\n注意：结果一旦公布将无法修改，请仔细确认。`, '确认公布结果', '⚠️');
    
    if (confirmed) {
        window.app.publishProjectResult(projectId, result);
    }
}

// 显示充值模态框
function showRechargeModal() {
    if (!window.app.currentUser) {
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
    
    if (!window.app.currentUser) {
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
    if (!window.Pi) {
        showCustomAlert('Pi Network SDK未准备就绪，请稍后重试', '系统错误', '❌');
        return;
    }
    
    // 创建Pi Network支付
    const paymentData = {
        amount: amountNum,
        memo: `投票平台充值 - ${amountNum} Pi`,
        metadata: {
            type: 'recharge',
            userId: window.app.currentUser.uid,
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
            if (window.app.isOnline) {
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
                        window.app.userPoints = response.data.newBalance;
                    window.app.addPointsHistory('recharge', pointsToAdd, `Pi Network充值 ${amountNum} Pi`);
                    window.app.saveLocalData();
                    window.app.updateUserPointsDisplay();
                        
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
            window.app.userPoints += pointsToAdd;
             window.app.addPointsHistory('recharge', pointsToAdd, `Pi Network充值 ${amountNum} Pi`);
             window.app.saveLocalData();
             window.app.updateUserPointsDisplay();
            
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
        window.Pi.createPayment(paymentData, paymentCallbacks);
        console.log('Pi Network支付请求已发送');
    } catch (error) {
        console.error('创建支付失败:', error);
        showCustomAlert('创建支付失败，请重试', '支付错误', '❌');
    }
}

// 显示提现模态框
function showWithdrawModal() {
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    // 计算并显示可提现余额
    const availablePoints = window.app.userPoints - window.app.frozenPoints;
    const availableBalanceElement = document.getElementById('availableBalance');
    if (availableBalanceElement) {
        availableBalanceElement.textContent = availablePoints;
    }
    
    // 显示冻结积分信息
    const frozenPointsElement = document.getElementById('frozenPointsInfo');
    if (frozenPointsElement) {
        frozenPointsElement.textContent = `冻结积分：${window.app.frozenPoints} (暂时不可提现)`;
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
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    window.app.showPointsDetail();
}

// 显示投票模态框
function showVoteModal(projectId) {
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = window.app.projects.find(p => p.id === projectId);
    if (!project) return;
    
    // 检查项目是否被删除
    const isDeleted = window.app.hiddenProjects.some(hiddenKey => {
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
    const isCreator = window.app.currentUser && project.creatorId === window.app.currentUser.uid;
    
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
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = window.app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== window.app.currentUser.uid) {
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
    if (window.app.isOnline) {
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
            window.app.frozenPoints -= frozenPoints;
            window.app.addPointsHistory('project_delete', 0, `删除项目解冻积分 - ${project.title} (解冻${frozenPoints}积分)`);
    }
    
    // 检查项目是否有人参与投票
    const totalVotes = (project.voteDetails || []).length;
    
    // 无论是否有人参与，删除项目都应该从projects数组中完全移除
    // 这样可以确保删除的项目不会在\"所有项目\"中展示给其他用户
    window.app.projects = window.app.projects.filter(p => p.id !== project.id);
    
    // 同时清理可能存在的隐藏项目记录
    window.app.hiddenProjects = window.app.hiddenProjects.filter(hiddenKey => {
        const projectIdFromKey = hiddenKey.split('_')[1];
        return projectIdFromKey !== project.id;
    });
    
    // 保存数据并更新显示
    window.app.saveLocalData();
    window.app.updateUserPointsDisplay();
    window.app.renderProjects();
    
    if (project.resultPublished) {
        showCustomAlert('项目删除成功！', '删除成功', '🗑️');
    } else {
        const frozenPoints = project.frozenPoints || 0;
        showCustomAlert(`项目删除成功！已返还${frozenPoints}积分，当前积分：${window.app.userPoints}`, '删除成功', '🗑️');
    }
}

// 删除参与的项目（从我的参与列表中移除）
async function deleteParticipatedProject(projectId) {
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }

    const project = window.app.projects.find(p => p.id === projectId);
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
    const hiddenProjectKey = `${window.app.currentUser.uid}_${projectId}`;
    if (!window.app.hiddenProjects.includes(hiddenProjectKey)) {
        window.app.hiddenProjects.push(hiddenProjectKey);
    }
    
    window.app.saveLocalData();
    window.app.renderProjects();
    
    showCustomAlert('项目已从参与列表中删除', '删除成功', '🗑️');
}

// 编辑项目
function editProject(projectId) {
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = window.app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== window.app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以编辑项目', '权限不足', '🚫');
        return;
    }
    
    // 检查项目是否被删除
    const isDeleted = window.app.hiddenProjects.some(hiddenKey => {
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
    window.app.editingProjectId = projectId;
    
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
    if (!window.app.editingProjectId) {
        return;
    }
    
    // 清除编辑状态
    window.app.editingProjectId = null;
    
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
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = window.app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== window.app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以暂停项目', '权限不足', '🚫');
        return;
    }
    
    // 检查项目是否被删除
    const isDeleted = window.app.hiddenProjects.some(hiddenKey => {
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
        if (window.app.isOnline) {
            try {
                const response = await apiClient.put(`/api/projects/${projectId}/pause`);
                
                if (response.success) {
                    // 后端处理成功，更新本地数据
                    project.isPaused = true;
                    window.app.saveLocalData();
                    window.app.renderProjects();
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
        window.app.saveLocalData();
        window.app.renderProjects();
        showCustomAlert('项目已暂停', '暂停成功', '⏸️');
    }
}

// 重启项目
async function restartProject(projectId) {
    if (!window.app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const project = window.app.projects.find(p => p.id === projectId);
    if (!project) {
        showCustomAlert('项目不存在', '错误', '❌');
        return;
    }
    
    if (project.creatorId !== window.app.currentUser.uid) {
        showCustomAlert('只有项目创建者可以重启项目', '权限不足', '🚫');
        return;
    }
    
    // 检查项目是否被删除
    const isDeleted = window.app.hiddenProjects.some(hiddenKey => {
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
        if (window.app.isOnline) {
            try {
                const response = await apiClient.put(`/api/projects/${projectId}/restart`);
                
                if (response.success) {
                    // 后端处理成功，更新本地数据
                    project.isPaused = false;
                    window.app.saveLocalData();
                    window.app.renderProjects();
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
        window.app.saveLocalData();
        window.app.renderProjects();
        showCustomAlert('项目已重启', '重启成功', '▶️');
    }
}

// app对象已在initializeApp函数中设置到window.app

// 调试面板功能