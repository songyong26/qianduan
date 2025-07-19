// API配置文件
const API_BASE = 'https://houduan.toupiao01.top/api';

// 通用请求函数
async function apiRequest(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(`${API_BASE}${url}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    
    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

// 用户相关API
export const userAPI = {
  // 获取用户信息
  getInfo: (username) => {
    return apiRequest(`/user/info?username=${encodeURIComponent(username)}`);
  },
  
  // 提现
  withdraw: (username, amount, wallet, piUid, feeRate, remark = '') => {
    return apiRequest('/user/withdraw', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        amount, 
        wallet, // 收币地址
        piUid,
        feeRate, // 手续费率
        remark,
        method: 'pi'
      })
    });
  },
  
  // Pi支付批准
  approvePayment: (paymentId, username) => {
    return apiRequest('/user/approve', {
      method: 'POST',
      body: JSON.stringify({ paymentId, username })
    });
  },
  
  // Pi支付完成
  completePayment: (paymentId, txid, username) => {
    return apiRequest('/user/complete', {
      method: 'POST',
      body: JSON.stringify({ paymentId, txid, username })
    });
  },
  
  // Pi支付取消
  cancelPayment: (paymentId, username) => {
    return apiRequest('/user/cancel', {
      method: 'POST',
      body: JSON.stringify({ paymentId, username })
    });
  }
};

// 项目相关API
export const projectAPI = {
  // 获取项目列表
  list: (username) => {
    let url = '/projects';
    if (username) {
      url += `?username=${encodeURIComponent(username)}`;
    }
    return apiRequest(url);
  },
  
  // 创建项目
  create: (username, title, description, deadline, maxPoints) => {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify({ username, title, description, deadline, maxPoints })
    });
  },
  
  // 投票
  vote: (projectId, username, choice, points) => {
    return apiRequest(`/projects/${projectId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ username, choice, points })
    });
  },
  
  // 公布结果
  publish: (projectId, username, option) => {
    return apiRequest(`/projects/${projectId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ username, option })
    });
  },
  
  // 暂停项目
  pause: (projectId, username) => {
    return apiRequest(`/projects/${projectId}/pause`, {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  },
  
  // 恢复项目
  resume: (projectId, username) => {
    return apiRequest(`/projects/${projectId}/resume`, {
      method: 'POST',
      body: JSON.stringify({ username })
    });
  },
  
  // 删除项目
  remove: (projectId, username) => {
    return apiRequest(`/projects/${projectId}`, {
      method: 'DELETE',
      body: JSON.stringify({ username })
    });
  }
};

// 提现相关API
export const withdrawAPI = {
  // 获取提现记录
  list: (username) => {
    return apiRequest(`/withdraw?username=${encodeURIComponent(username)}`);
  }
};

export default {
  userAPI,
  projectAPI,
  withdrawAPI
};