import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin } from 'antd';
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import adminAPI, { utils } from '../api';

function Login() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  // 检查是否已登录
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (utils.isLoggedIn()) {
          // 验证token有效性
          await adminAPI.auth.getProfile();
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (error) {
        // token无效，清除并继续显示登录页
        utils.clearToken();
      } finally {
        setPageLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // 处理登录
  const handleLogin = async (values) => {
    setLoading(true);
    
    try {
      console.log('登录请求数据:', values);
      
      const response = await adminAPI.auth.login({
        username: values.username.trim(),
        password: values.password
      });
      
      console.log('登录响应:', response.data);
      
      if (response.data && response.data.success) {
        const { token, admin } = response.data.data;
        
        // 保存token
        utils.setToken(token);
        
        message.success(`欢迎回来，${admin.username}！`);
        
        // 跳转到仪表盘
        navigate('/dashboard', { replace: true });
      } else {
        const errorMsg = response.data?.message || '登录失败，请检查用户名和密码';
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('登录错误:', error);
      
      let errorMessage = '登录失败，请稍后重试';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 处理登录失败
  const handleLoginError = (errorInfo) => {
    console.log('表单验证失败:', errorInfo);
    message.error('请填写完整的登录信息');
  };

  // 页面加载中
  if (pageLoading) {
    return (
      <div className="loading-wrapper">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-content">
        <Card className="login-card" bordered={false}>
          <div className="login-header">
            <h1 className="login-title">管理员登录</h1>
            <p className="login-subtitle">投票系统管理后台</p>
          </div>
          
          <Form
            form={form}
            name="login"
            className="login-form"
            onFinish={handleLogin}
            onFinishFailed={handleLoginError}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2个字符' },
                { max: 20, message: '用户名最多20个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="请输入用户名"
                autoComplete="username"
                allowClear
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
                autoComplete="current-password"
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>
            
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="login-button"
                loading={loading}
                block
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>
          
          <div className="login-footer">
            <div className="login-tips">
              <p>默认管理员账号：admin</p>
              <p>默认密码：admin123</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* 调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h4>调试信息</h4>
          <p>API地址: {adminAPI.defaults?.baseURL || 'https://api.toupiao01.top/api'}</p>
          <p>当前时间: {new Date().toLocaleString()}</p>
          <p>Token状态: {utils.isLoggedIn() ? '已存在' : '未登录'}</p>
        </div>
      )}
    </div>
  );
}

export default Login;