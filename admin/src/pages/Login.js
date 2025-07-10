import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 假设后端登录接口 /api/admin/login
      const res = await api.post('/api/admin/login', values);
      localStorage.setItem('admin_token', res.data.token);
      message.success('登录成功');
      navigate('/project-audit');
    } catch (e) {
      message.error(e.response?.data?.message || '登录失败');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <Card title="管理员登录" style={{ width: 350 }}>
        <Form onFinish={onFinish}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}> <Input placeholder="用户名" autoComplete="username" /> </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}> <Input.Password placeholder="密码" autoComplete="current-password" /> </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 