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

// Pi Network SDK 初始化和环境检测
function isPiBrowser() {
    // 更准确的Pi浏览器环境检测
    
    // 检查是否有Pi特有的API和方法
    const hasPiAPI = typeof window.Pi !== 'undefined' && 
                     window.Pi !== null && 
                     typeof window.Pi.authenticate === 'function';
    
    if (!hasPiAPI) {
        console.log('环境检测结果: 没有Pi API，非Pi环境');
        return false;
    }
    
    // 检查Pi SDK是否是通过外部脚本加载的（非Pi环境）
    // 在真实Pi环境中，Pi对象应该是原生提供的，而不是通过外部SDK注入的
    try {
        // 尝试检测Pi对象的一些内部特征
        // 真实的Pi浏览器应该有一些特定的属性或方法
        const hasNativePiFeatures = 
            // 检查Pi对象是否有原生特征（这些在外部SDK中通常不存在）
            (typeof window.Pi._internal !== 'undefined') ||
            (typeof window.Pi.version !== 'undefined' && window.Pi.version !== '2.0') ||
            // 检查是否在移动应用环境中（Pi Browser是移动应用）
            (typeof window.ReactNativeWebView !== 'undefined') ||
            // 检查是否有应用特有的全局变量
            (typeof window.PiBrowser !== 'undefined');
        
        // 检查User Agent是否包含移动设备标识（Pi Browser是移动应用）
        const userAgent = navigator.userAgent;
        const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
        
        // 检查是否在应用内浏览器环境（通常有特定的标识）
        const isInApp = /wv|WebView/i.test(userAgent) || 
                       typeof window.webkit !== 'undefined' ||
                       typeof window.ReactNativeWebView !== 'undefined';
        
        const isPiEnvironment = hasNativePiFeatures || (isMobile && isInApp && hasPiAPI);
        
        console.log('环境检测结果:', {
            userAgent: navigator.userAgent,
            hasPiAPI,
            hasNativePiFeatures,
            isMobile,
            isInApp,
            isPiEnvironment
        });
        
        return isPiEnvironment;
        
    } catch (error) {
        console.error('Pi环境检测出错:', error);
        // 如果检测出错，但有Pi API，则假设是Pi环境
        return hasPiAPI;
    }
}

// 根据环境选择SDK
const piSDK = {
    async init() {
        if (isPiBrowser()) {
            console.log('检测到Pi浏览器环境，使用真实SDK');
            // Pi浏览器环境，SDK已通过script标签加载
            return Promise.resolve();
        } else {
            console.log('非Pi浏览器环境，使用模拟SDK');
            return Promise.resolve();
        }
    },
    
    async authenticate() {
        if (isPiBrowser()) {
            try {
                // 在Pi浏览器中使用真实SDK进行认证
                const scopes = ['username', 'payments'];
                
                // 处理未完成的支付回调
                function onIncompletePaymentFound(payment) {
                    console.log('发现未完成的支付:', payment);
                    
                    // 检查支付类型是否为充值
                    if (payment.metadata && payment.metadata.type === 'recharge') {
                        showCustomAlert(
                            `检测到未完成的充值支付\n金额: ${payment.amount} Pi\n\n请完成支付流程或取消支付。`,
                            '未完成的支付',
                            '💰'
                        );
                        
                        // 可以选择自动恢复支付流程
                        // 这里可以调用相应的处理函数来恢复支付
                        handleIncompletePayment(payment);
                    }
                }
                
                const auth = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
                console.log('Pi SDK认证成功:', auth);
                
                return {
                    user: {
                        uid: auth.user.uid,
                        username: auth.user.username
                    }
                };
            } catch (error) {
                console.error('Pi SDK认证失败:', error);
                throw error;
            }
        } else {
            // 非Pi浏览器环境，使用测试账号
            console.log('使用测试账号登录');
            return Promise.resolve({ 
                user: { 
                    uid: 'test_user_123', 
                    username: 'TestUser' 
                } 
            });
        }
    },
    
    async signOut() {
        if (isPiBrowser()) {
            // Pi浏览器环境的登出逻辑
            console.log('Pi浏览器环境登出');
            return Promise.resolve();
        } else {
            // 非Pi浏览器环境的登出逻辑
            console.log('测试环境登出');
            return Promise.resolve();
        }
    }
};

// 应用状态管理
class VotingApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.userVotes = [];
        this.userPoints = 1000; // 初始积分
        this.frozenPoints = 0; // 冻结积分
        this.pointsHistory = []; // 积分历史记录
        this.hiddenProjects = []; // 用户隐藏的项目列表
        this.init();
    }

    async init() {
        try {
            // 初始化 Pi SDK
            if (typeof piSDK.init === 'function') {
                await piSDK.init();
            }
            

            
            // 加载本地数据
            this.loadLocalData();
            
            // 初始化UI
            this.initializeUI();
            
            // 渲染项目列表
            this.renderProjects();
            
            console.log('应用初始化完成');
        } catch (error) {
            console.error('应用初始化失败:', error);
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

            // 加载用户积分
            const savedPoints = localStorage.getItem('user_points');
            if (savedPoints) {
                const points = parseInt(savedPoints);
                this.userPoints = isNaN(points) ? 1000 : points;
            }

            // 加载冻结积分
            const savedFrozenPoints = localStorage.getItem('frozen_points');
            if (savedFrozenPoints) {
                const frozenPoints = parseInt(savedFrozenPoints);
                this.frozenPoints = isNaN(frozenPoints) ? 0 : frozenPoints;
            }

            // 加载积分历史记录
            const savedHistory = localStorage.getItem('points_history');
            if (savedHistory) {
                this.pointsHistory = JSON.parse(savedHistory);
            }

            // 加载用户信息
            const savedUser = localStorage.getItem('current_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.updateLoginButton();
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
            localStorage.setItem('user_points', this.userPoints.toString());
            localStorage.setItem('frozen_points', this.frozenPoints.toString());
            localStorage.setItem('points_history', JSON.stringify(this.pointsHistory));
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
    }

    // 处理登录/退出
    async handleLogin() {
        try {
            if (this.currentUser) {
                // 退出登录
                await piSDK.signOut();
                this.currentUser = null;
                localStorage.removeItem('current_user');
                this.updateLoginButton();
                this.renderProjects();
                showCustomAlert('已退出登录', '退出成功', '✅');
            } else {
                // 登录
                const authResult = await piSDK.authenticate();
                if (authResult && authResult.user) {
                    const isNewUser = !this.currentUser;
                    this.currentUser = authResult.user;
                    
                    // 如果是新用户且没有积分历史记录，添加初始积分记录
                    if (isNewUser && this.pointsHistory.length === 0) {
                        this.addPointsHistory('initial', 1000, '新用户注册奖励');
                    }
                    
                    this.saveLocalData();
                    this.updateLoginButton();
                    this.renderProjects();
                    showCustomAlert(`欢迎，${this.currentUser.username || this.currentUser.uid}！`, '登录成功', '🎉');
                }
            }
        } catch (error) {
            console.error('登录操作失败:', error);
            showCustomAlert('登录操作失败，请重试', '登录失败', '❌');
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
        let frozenPoints = 0;
        
        // 计算投票冻结的积分
        this.projects.forEach(project => {
            if (!project.resultPublished) {
                project.voteDetails?.forEach(vote => {
                    if (vote.voter === this.currentUser?.uid) {
                        frozenPoints += vote.points;
                    }
                });
            }
        });
        
        return frozenPoints;
    }

    // 显示积分明细
    showPointsDetail() {
        const modal = document.getElementById('pointsDetailModal');
        const availablePointsDisplay = document.getElementById('availablePointsDisplay');
        const frozenPointsDisplay = document.getElementById('frozenPointsDisplay');
        const historyList = document.getElementById('pointsHistoryList');
        
        // 计算积分
        const totalPoints = this.userPoints;
        const frozenPoints = this.frozenPoints; // 直接使用this.frozenPoints属性
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
                
                // 提取类型和项目名称
                const parts = item.description.split(' - ');
                const actionType = parts[0] || item.description;
                const projectName = parts[1] || '';
                
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
    publishProjectResult(projectId, result) {
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
            // 第三：投票错误的用户被冻结积分要直接划扣到发起人账户的可用积分
            incorrectVoters.forEach(vote => {
                if (vote.voter === this.currentUser.uid) {
                    // 从冻结积分中减去（积分已被划扣，不返还）
                    this.frozenPoints -= vote.points;
                    this.addPointsHistory('vote_penalty', 0, 
                        `投票错误积分划扣 - ${project.title} (${vote.points}积分被划扣)`);
                }
            });
            
            // 第五：投票正确的用户，冻结积分要解冻，并且在可用积分和总积分准确更新
            correctVoters.forEach(vote => {
                if (vote.voter === this.currentUser.uid) {
                    // 解冻原投票积分
                    this.frozenPoints -= vote.points;
                    this.userPoints += vote.points; // 解冻到可用积分
                    this.addPointsHistory('vote_unfreeze', vote.points, 
                        `投票正确积分解冻 - ${project.title} (${vote.points}积分)`);
                }
            });
            
            // 第六：投票正确的用户奖励积分来源是发起人被冻结的积分
            correctVoters.forEach(vote => {
                if (vote.voter === this.currentUser.uid && vote.voter !== project.creatorId) {
                    // 获得与投票积分相等的奖励（从项目发起人的冻结积分中划扣）
                    const reward = vote.points;
                    this.userPoints += reward;
                    this.addPointsHistory('vote_reward', reward, 
                        `投票奖励 - ${project.title} (${reward}积分)`);
                }
            });
            
            // 处理项目发起人
            if (project.creatorId === this.currentUser.uid) {
                // 第三：获得投票错误用户的积分
                this.userPoints += totalIncorrectPoints;
                this.addPointsHistory('project_income', totalIncorrectPoints, 
                    `项目收入 - ${project.title} (${totalIncorrectPoints}积分)`);
                
                // 第六：支付给投票正确用户的奖励（不包括发起人自己）
                let totalRewardsToOthers = 0;
                correctVoters.forEach(vote => {
                    if (vote.voter !== this.currentUser.uid) {
                        totalRewardsToOthers += vote.points;
                    }
                });
                
                // 从发起人冻结积分中支付奖励
                this.frozenPoints -= totalRewardsToOthers;
                this.addPointsHistory('project_payout', -totalRewardsToOthers, 
                    `项目奖励支出 - ${project.title} (${totalRewardsToOthers}积分)`);
                
                // 第二：项目完结后冻结积分分配完毕要把剩余的积分从冻结积分的地方解冻并转移到可用积分里面
                const remainingFrozenPoints = project.frozenPoints - totalRewardsToOthers;
                if (remainingFrozenPoints > 0) {
                    this.frozenPoints -= remainingFrozenPoints;
                    this.userPoints += remainingFrozenPoints;
                    this.addPointsHistory('project_unfreeze', remainingFrozenPoints, 
                        `项目剩余积分解冻 - ${project.title} (${remainingFrozenPoints}积分)`);
                } else {
                    // 如果没有剩余积分，只记录解冻操作
                    this.addPointsHistory('project_unfreeze', 0, 
                        `项目冻结积分解冻完成 - ${project.title}`);
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
        
        // 如果积分详情页面已打开，实时更新显示
        this.updatePointsDetailIfOpen();
    }
    
    // 更新已打开的积分详情页面
    updatePointsDetailIfOpen() {
        const modal = document.getElementById('pointsDetailModal');
        if (modal && modal.style.display === 'block') {
            const availablePointsDisplay = document.getElementById('availablePointsDisplay');
            const frozenPointsDisplay = document.getElementById('frozenPointsDisplay');
            
            if (availablePointsDisplay && frozenPointsDisplay) {
                const totalPoints = this.userPoints;
                const frozenPoints = this.frozenPoints;
                const availablePoints = totalPoints - frozenPoints;
                
                availablePointsDisplay.textContent = availablePoints;
                frozenPointsDisplay.textContent = frozenPoints;
            }
        }
        
        // 如果提现页面已打开，也实时更新显示
        const withdrawModal = document.getElementById('withdrawModal');
        if (withdrawModal && withdrawModal.style.display === 'block') {
            const availableBalanceElement = document.getElementById('availableBalance');
            const frozenPointsElement = document.getElementById('frozenPointsInfo');
            
            if (availableBalanceElement) {
                const availablePoints = this.userPoints - this.frozenPoints;
                availableBalanceElement.textContent = availablePoints;
            }
            
            if (frozenPointsElement) {
                frozenPointsElement.textContent = `冻结积分：${this.frozenPoints} (暂时不可提现)`;
            }
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
                    if (userName) {
                        const displayName = this.currentUser.username || this.currentUser.uid;
                        userName.textContent = displayName;
                    }
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
                loginBtn.className = 'btn btn-primary';
                
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
    handleCreateProject(e) {
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
        
        {
            // 检查最低积分要求
            if (maxPoints < 100) {
                showCustomAlert('项目最低要求100积分', '积分不足', '💰');
                return;
            }
            
            // 检查可用积分是否足够（总积分 - 冻结积分）
            const availablePoints = this.userPoints - this.frozenPoints;
            if (maxPoints > availablePoints) {
                showCustomAlert(`可用积分不足，当前可用积分：${availablePoints}`, '积分不足', '💰');
                return;
            }

            const project = {
                id: Date.now().toString(),
                title,
                description,
                endTime,
                maxPoints,
                creatorId: this.currentUser.uid,
                creatorName: this.currentUser.username || this.currentUser.uid,
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

            // 第一：创建项目时冻结积分要减掉，显示在冻结积分里面
            this.userPoints -= maxPoints; // 从总积分中扣除
            this.frozenPoints += maxPoints; // 增加到冻结积分
            this.addPointsHistory('project_freeze', -maxPoints, `创建项目冻结积分 - ${title} (冻结${maxPoints}积分)`);
            
            // 添加项目
            this.projects.unshift(project);
            
            showCustomAlert(`项目创建成功！已冻结${maxPoints}积分，当前可用积分：${this.userPoints - this.frozenPoints}`, '创建成功', '🎉');
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
        
        // 第四：投票人参与投票的积分要减掉，体现在冻结积分里面
        this.userPoints -= votePoints; // 从总积分中扣除
        this.frozenPoints += votePoints; // 增加到冻结积分
        this.addPointsHistory('vote_freeze', -votePoints, `投票冻结积分 - ${project.title} (${option === 'yes' ? '是' : '否'}, 冻结${votePoints}积分)`);
        
        this.saveLocalData();
        this.updateUserPointsDisplay();
        this.renderProjects();
        
        showCustomAlert(`投票成功！已冻结${votePoints}积分，当前可用积分：${this.userPoints - this.frozenPoints}`, '投票成功', '🎉');
        closeModal('voteModal');
    }

    // 处理提现
    handleWithdraw(e) {
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

        // 显示所有进行中且未被暂停的项目，按创建时间倒序排列
        const allProjects = [...this.projects]
            .filter(project => {
                const isActive = new Date(project.endTime) > new Date();
                const isPaused = project.isPaused || false;
                const isResultPublished = project.resultPublished || false;
                // 只显示进行中、未暂停、未公布结果的项目
                return isActive && !isPaused && !isResultPublished;
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

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app = new VotingApp();
});

// 全局函数

// 处理登录
function handleLogin() {
    if (app) {
        app.handleLogin();
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
    if (!selectedVoteOption) {
        showCustomAlert('请选择投票选项', '选择错误', '⚠️');
        return;
    }
    
    const votePoints = parseInt(document.getElementById('votePoints').value);
    if (!votePoints || votePoints < 1) {
        showCustomAlert('请输入有效的投票积分', '输入错误', '⚠️');
        return;
    }
    
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
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    document.getElementById('rechargeModal').style.display = 'block';
    
    // 初始化Pi Network充值表单事件
    const rechargeForm = document.getElementById('rechargeForm');
    if (rechargeForm && !rechargeForm.hasEventListener) {
        rechargeForm.addEventListener('submit', handleRechargeSubmit);
        rechargeForm.hasEventListener = true;
    }
    
    // 为充值金额输入框添加限制
    const amountInput = document.getElementById('rechargeAmount');
    if (amountInput && !amountInput.hasEventListener) {
        amountInput.addEventListener('input', function(e) {
            // 只允许输入数字
            this.value = this.value.replace(/[^0-9]/g, '');
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

// 处理充值表单提交
// Pi Network 支付流程实现
async function createPiPayment(amount) {
    try {
        if (!isPiBrowser()) {
            // 非Pi环境的模拟充值
            showCustomAlert(`模拟充值成功！\n充值金额: ${amount} Pi\n积分将按1:1比例到账。`, '充值成功', '🎉');
            
            // 模拟添加积分
            app.userPoints += amount;
            app.addPointsHistory('recharge', amount, `Pi Network充值 ${amount} Pi`);
            app.updateUserPointsDisplay();
            app.saveLocalData();
            
            closeModal('rechargeModal');
            return;
        }
        
        // Pi环境的真实支付流程
        const paymentData = {
            amount: amount,
            memo: `投票平台充值 ${amount} Pi`,
            metadata: {
                userId: app.currentUser.uid,
                type: 'recharge',
                timestamp: new Date().toISOString()
            }
        };
        
        // 阶段1: 创建支付
        const payment = await window.Pi.createPayment(paymentData, {
            onReadyForServerApproval: function(paymentId) {
                console.log('支付创建成功，等待服务端批准:', paymentId);
                // 这里应该调用你的后端API来批准支付
                approvePaymentOnServer(paymentId, amount);
            },
            onReadyForServerCompletion: function(paymentId, txid) {
                console.log('区块链交易完成，等待服务端确认:', paymentId, txid);
                // 这里应该调用你的后端API来完成支付
                completePaymentOnServer(paymentId, txid, amount);
            },
            onCancel: function(paymentId) {
                console.log('支付被取消:', paymentId);
                showCustomAlert('支付已取消', '支付提示', 'ℹ️');
            },
            onError: function(error, payment) {
                console.error('支付错误:', error, payment);
                showCustomAlert('支付过程中发生错误，请重试', '支付错误', '❌');
            }
        });
        
        console.log('支付流程启动:', payment);
        
    } catch (error) {
        console.error('创建支付失败:', error);
        showCustomAlert('创建支付失败，请重试', '支付错误', '❌');
    }
}

// 模拟服务端批准支付（在真实环境中应该是后端API）
async function approvePaymentOnServer(paymentId, amount) {
    try {
        console.log('模拟服务端批准支付:', paymentId);
        // 在真实环境中，这里应该调用你的后端API
        // 后端会调用 Pi Server API 来批准支付
        
        // 模拟批准成功
        setTimeout(() => {
            console.log('支付已批准，等待用户确认交易');
        }, 1000);
        
    } catch (error) {
        console.error('批准支付失败:', error);
    }
}

// 模拟服务端完成支付（在真实环境中应该是后端API）
async function completePaymentOnServer(paymentId, txid, amount) {
    try {
        console.log('模拟服务端完成支付:', paymentId, txid);
        // 在真实环境中，这里应该调用你的后端API
        // 后端会调用 Pi Server API 来完成支付并验证交易
        
        // 模拟完成成功，添加积分
        app.userPoints += amount;
        app.addPointsHistory('recharge', amount, `Pi Network充值 ${amount} Pi (TxID: ${txid})`);
        app.updateUserPointsDisplay();
        app.saveLocalData();
        
        showCustomAlert(`充值成功！\n充值金额: ${amount} Pi\n交易ID: ${txid}\n积分已到账`, '充值成功', '🎉');
        closeModal('rechargeModal');
        
    } catch (error) {
        console.error('完成支付失败:', error);
        showCustomAlert('完成支付时发生错误', '支付错误', '❌');
    }
}

// 处理未完成的支付
function handleIncompletePayment(payment) {
    try {
        console.log('处理未完成的支付:', payment);
        
        // 根据支付状态决定如何处理
        if (payment.status === 'pending') {
            // 支付仍在等待中，可以继续等待或提示用户
            console.log('支付仍在处理中，请耐心等待');
        } else if (payment.status === 'cancelled') {
            // 支付已取消，清理相关状态
            console.log('支付已取消');
        } else {
            // 其他状态，尝试恢复支付流程
            console.log('尝试恢复支付流程');
        }
        
    } catch (error) {
        console.error('处理未完成支付时发生错误:', error);
    }
}

// 添加支付状态检查功能
function checkPaymentStatus() {
    if (isPiBrowser() && window.Pi) {
        // 在Pi环境中检查是否有未完成的支付
        console.log('检查支付状态...');
    }
}

// 新的充值提交处理函数
function handleRechargeSubmit(e) {
    e.preventDefault();
    
    if (!app.currentUser) {
        showCustomAlert('请先登录', '登录提示', '🔐');
        return;
    }
    
    const amount = parseInt(document.getElementById('rechargeAmount').value);
    
    // 验证充值金额
    if (isNaN(amount) || amount < 1) {
        showCustomAlert('充值金额必须是大于等于1的整数', '输入错误', '⚠️');
        return;
    }
    
    // 启动Pi支付流程
    createPiPayment(amount);
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
        ? `确定要删除项目"${project.title}"吗？项目将从您的列表中移除，但其他参与用户仍可查看。`
        : `确定要删除项目"${project.title}"吗？删除后将返还冻结的${project.frozenPoints}积分。项目将从您的列表中移除，但其他参与用户仍可查看。`;
    
    const confirmed = await showCustomConfirm(confirmMessage, '确认删除项目', '🗑️');
    if (!confirmed) {
        return;
    }
    
    // 只有未公布结果的项目才返还冻结积分
    // 已公布结果的项目，积分已经在公布结果时处理过了
    if (!project.resultPublished) {
        const frozenPoints = project.frozenPoints || 0;
        app.userPoints += frozenPoints; // 返还积分到总积分
        app.frozenPoints -= frozenPoints; // 减少冻结积分
        app.addPointsHistory('project_delete', frozenPoints, `删除项目 - ${project.title}`);
    }
    
    // 直接从项目数组中删除项目（全局删除）
    const projectIndex = app.projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
        app.projects.splice(projectIndex, 1);
    }
    
    // 同时清理相关的投票记录
    app.userVotes = app.userVotes.filter(vote => vote.projectId !== projectId);
    
    // 从隐藏列表中移除相关记录（如果存在）
    app.hiddenProjects = app.hiddenProjects.filter(hiddenKey => !hiddenKey.endsWith(`_${projectId}`));
    
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
    
    const confirmed = await showCustomConfirm(`确定要暂停项目"${project.title}"吗？暂停后其他用户将无法投票。`, '确认暂停项目', '⏸️');
    if (confirmed) {
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
    
    const confirmed = await showCustomConfirm(`确定要重启项目"${project.title}"吗？重启后其他用户可以继续投票。`, '确认重启项目', '▶️');
    if (confirmed) {
        project.isPaused = false;
        app.saveLocalData();
        app.renderProjects();
        showCustomAlert('项目已重启', '重启成功', '▶️');
    }
}

// 导出给全局使用
window.app = app;