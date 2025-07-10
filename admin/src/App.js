import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import Login from './pages/Login';
import ProjectAudit from './pages/ProjectAudit';
import ProjectManage from './pages/ProjectManage';
import UserManage from './pages/UserManage';
import UserDetail from './pages/UserDetail';
import BanUser from './pages/BanUser';
import WithdrawAudit from './pages/WithdrawAudit';
import MainMenu from './components/MainMenu';

const { Header, Content, Sider } = Layout;

export default function App() {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider width={200} style={{ background: '#fff' }}>
          <MainMenu />
        </Sider>
        <Layout>
          <Header style={{ background: '#fff', padding: 0, fontWeight: 'bold', fontSize: 20, textAlign: 'center' }}>
            管理员后台
          </Header>
          <Content style={{ margin: '24px 16px 0', background: '#fff', minHeight: 360, padding: 24 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/project-audit" element={<ProjectAudit />} />
              <Route path="/project-manage" element={<ProjectManage />} />
              <Route path="/user-manage" element={<UserManage />} />
              <Route path="/user-detail/:username" element={<UserDetail />} />
              <Route path="/ban-user" element={<BanUser />} />
              <Route path="/withdraw-audit" element={<WithdrawAudit />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
} 