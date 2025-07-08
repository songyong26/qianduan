import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button } from 'antd';
import { getToken, setToken } from './api';
import Login from './pages/Login';
import ProjectAudit from './pages/ProjectAudit';
import WithdrawAudit from './pages/WithdrawAudit';

const { Header, Content } = Layout;

function PrivateRoute({ children }) {
  return getToken() ? children : <Navigate to="/login" />;
}

function MainLayout({ children }) {
  const navigate = useNavigate();
  const logout = () => {
    setToken('');
    navigate('/login');
  };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['projects']}>
          <Menu.Item key="projects">
            <Link to="/projects">项目审核</Link>
          </Menu.Item>
          <Menu.Item key="withdraws">
            <Link to="/withdraws">提现审核</Link>
          </Menu.Item>
          <Menu.Item key="logout" style={{ float: 'right' }}>
            <Button type="link" onClick={logout} style={{ color: '#fff' }}>退出登录</Button>
          </Menu.Item>
        </Menu>
      </Header>
      <Content>{children}</Content>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <MainLayout>
              <Routes>
                <Route path="/projects" element={<ProjectAudit />} />
                <Route path="/withdraws" element={<WithdrawAudit />} />
                <Route path="*" element={<Navigate to="/projects" />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
} 