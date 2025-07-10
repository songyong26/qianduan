import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, message, Spin } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  UserOutlined,
  DollarOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from './api';

// 页面组件
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectAudit from './pages/ProjectAudit';
import WithdrawAudit from './pages/WithdrawAudit';
import UserManage from './pages/UserManage';
import AdminManage from './pages/AdminManage';
import Settings from './pages/Settings';

const { Header, Sider, Content } = Layout;

// 受保护的路由组件
function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('开始认证检查...');
        
        if (!utils.isLoggedIn()) {
          console.log('未找到登录token，跳转到登录页');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log('找到token，验证有效性...');
        // 验证token有效性
        const response = await adminAPI.auth.getProfile();
        console.log('认证成功:', response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('认证检查失败:', error);
        setError(error.message || '认证失败');
        utils.clearToken();
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="loading-wrapper">
        <Spin size="large" tip="验证身份中..." />
        <div style={{ marginTop: 16, color: '#666' }}>正在检查登录状态...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-wrapper">
        <div className="error-title">认证失败</div>
        <div className="error-description">{error}</div>
        <Button type="primary" onClick={() => window.location.reload()}>重新加载</Button>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// 主布局组件
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // 菜单项配置
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表盘'
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目审核'
    },
    {
      key: '/withdraws',
      icon: <DollarOutlined />,
      label: '提现审核'
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理'
    },
    {
      key: '/admins',
      icon: <TeamOutlined />,
      label: '管理员',
      // 只有超级管理员可见
      style: adminInfo?.role !== 'super_admin' ? { display: 'none' } : {}
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置'
    }
  ];

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息'
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true
    }
  ];

  // 获取管理员信息
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const response = await adminAPI.auth.getProfile();
        setAdminInfo(response.data.data);
      } catch (error) {
        console.error('获取管理员信息失败:', error);
        message.error('获取用户信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, []);

  // 处理菜单点击
  const handleMenuClick = ({ key }) => {
    window.location.hash = key;
  };

  // 处理用户菜单点击
  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        message.info('个人信息功能开发中...');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // 退出登录
  const handleLogout = () => {
    adminAPI.auth.logout();
    message.success('已退出登录');
  };

  // 获取当前路径
  const getCurrentPath = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || '/dashboard';
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <Layout className="main-layout">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="layout-sider"
        width={240}
        collapsedWidth={80}
      >
        <div className="sider-logo">
          {collapsed ? '投票' : '投票系统管理后台'}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[getCurrentPath()]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      
      <Layout>
        <Header className="layout-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <span className="header-title">管理员后台</span>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <span>欢迎，{adminInfo?.username}</span>
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick
                }}
                placement="bottomRight"
                arrow
              >
                <Avatar 
                  style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
                  icon={<UserOutlined />}
                />
              </Dropdown>
            </div>
          </div>
        </Header>
        
        <Content className="layout-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectAudit />} />
            <Route path="/withdraws" element={<WithdrawAudit />} />
            <Route path="/users" element={<UserManage />} />
            <Route path="/admins" element={<AdminManage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

// 主应用组件
function App() {
  useEffect(() => {
    // 添加调试信息
    console.log('App组件已加载');
    console.log('当前URL:', window.location.href);
    console.log('当前hash:', window.location.hash);
    
    // 检查API连接
    const checkAPI = async () => {
      try {
        console.log('检查API连接...');
        const response = await fetch('https://api.toupiao01.top/api/health');
        console.log('API状态:', response.status);
      } catch (error) {
        console.error('API连接失败:', error);
      }
    };
    
    checkAPI();
  }, []);

  return (
    <Router>
      <div className="App pi-optimized">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;