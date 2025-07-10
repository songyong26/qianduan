import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AuditOutlined,
  ProjectOutlined,
  UserOutlined,
  LockOutlined,
  ProfileOutlined,
  DollarOutlined
} from '@ant-design/icons';

const items = [
  { key: '/project-audit', icon: <AuditOutlined />, label: '项目审核' },
  { key: '/project-manage', icon: <ProjectOutlined />, label: '项目管理' },
  { key: '/user-manage', icon: <UserOutlined />, label: '用户管理' },
  { key: '/ban-user', icon: <LockOutlined />, label: '封禁/解封用户' },
  { key: '/withdraw-audit', icon: <DollarOutlined />, label: '提现审核' },
];

export default function MainMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      style={{ height: '100%', borderRight: 0 }}
      items={items}
      onClick={({ key }) => navigate(key)}
    />
  );
} 