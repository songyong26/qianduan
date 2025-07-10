import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Tag, Modal, Form, Input, Select, message,
  Space, Tooltip, Drawer, Descriptions, Row, Col, Spin,
  Avatar, Badge, Alert
} from 'antd';
import {
  EyeOutlined, PlusOutlined, UserOutlined, CrownOutlined,
  ReloadOutlined, SettingOutlined, KeyOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

const { Option } = Select;
const { Password } = Input;

function AdminManage() {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [currentAdmin, setCurrentAdmin] = useState(null);

  // 获取当前管理员信息
  const fetchCurrentAdmin = async () => {
    try {
      const response = await adminAPI.auth.getProfile();
      if (response.data && response.data.success) {
        setCurrentAdmin(response.data.data);
      }
    } catch (error) {
      console.error('获取当前管理员信息失败:', error);
    }
  };

  // 获取管理员列表
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.superAdmin.getAdmins();
      if (response.data && response.data.success) {
        setAdmins(response.data.data || []);
      }
    } catch (error) {
      console.error('获取管理员列表失败:', error);
      message.error('获取管理员列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchCurrentAdmin();
    fetchAdmins();
  }, []);

  // 查看详情
  const handleViewDetail = (admin) => {
    setSelectedAdmin(admin);
    setDetailVisible(true);
  };

  // 创建管理员
  const handleCreateAdmin = async (values) => {
    try {
      const response = await adminAPI.superAdmin.createAdmin(values);
      if (response.data && response.data.success) {
        message.success('管理员创建成功');
        setCreateVisible(false);
        createForm.resetFields();
        fetchAdmins();
      }
    } catch (error) {
      console.error('创建管理员失败:', error);
      message.error('创建管理员失败');
    }
  };

  // 角色标签
  const getRoleTag = (role) => {
    const roleMap = {
      super_admin: { color: 'gold', text: '超级管理员', icon: <CrownOutlined /> },
      admin: { color: 'blue', text: '管理员', icon: <UserOutlined /> }
    };
    const config = roleMap[role] || roleMap.admin;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // 状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', text: '正常' },
      disabled: { color: 'red', text: '禁用' }
    };
    const config = statusMap[status] || statusMap.active;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 在线状态
  const getOnlineStatus = (lastLoginAt) => {
    if (!lastLoginAt) return <Badge status="default" text="从未登录" />;
    
    const now = new Date();
    const lastLogin = new Date(lastLoginAt);
    const diffHours = (now - lastLogin) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return <Badge status="success" text="在线" />;
    } else if (diffHours < 24) {
      return <Badge status="processing" text="最近活跃" />;
    } else {
      return <Badge status="default" text="离线" />;
    }
  };

  // 检查是否为超级管理员
  const isSuperAdmin = () => {
    return currentAdmin?.role === 'super_admin';
  };

  // 表格列配置
  const columns = [
    {
      title: '管理员信息',
      key: 'adminInfo',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            icon={<UserOutlined />}
            style={{ 
              marginRight: 12,
              backgroundColor: record.role === 'super_admin' ? '#faad14' : '#1890ff'
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <Button 
                type="link" 
                onClick={() => handleViewDetail(record)}
                style={{ padding: 0, height: 'auto', fontWeight: 'bold' }}
              >
                {record.username}
              </Button>
              {record._id === currentAdmin?._id && (
                <Tag color="green" size="small" style={{ marginLeft: 8 }}>当前</Tag>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: getRoleTag
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: '在线状态',
      dataIndex: 'lastLoginAt',
      key: 'onlineStatus',
      width: 120,
      render: getOnlineStatus
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      width: 140,
      render: (date) => date ? new Date(date).toLocaleString() : '从未登录'
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {/* 只有超级管理员可以管理其他管理员，且不能管理自己 */}
          {isSuperAdmin() && record._id !== currentAdmin?._id && (
            <Tooltip title="管理">
              <Button 
                type="text" 
                icon={<SettingOutlined />}
                onClick={() => message.info('管理功能开发中...')}
              />
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  // 权限检查
  if (!isSuperAdmin()) {
    return (
      <div className="admin-manage-container">
        <Alert
          message="权限不足"
          description="只有超级管理员才能访问管理员管理页面"
          type="warning"
          showIcon
          style={{ margin: '20px 0' }}
        />
      </div>
    );
  }

  return (
    <div className="admin-manage-container">
      <Card 
        title="管理员管理" 
        className="table-card"
        extra={
          <Space>
            <Button 
              type="primary"
              icon={<PlusOutlined />} 
              onClick={() => setCreateVisible(true)}
            >
              创建管理员
            </Button>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchAdmins}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Alert
          message="管理员权限说明"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>超级管理员：拥有所有权限，可以管理其他管理员</li>
              <li>普通管理员：可以审核项目、管理用户、处理提现等日常管理工作</li>
              <li>只有超级管理员可以创建和管理其他管理员账号</li>
            </ul>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={columns}
          dataSource={admins}
          rowKey="_id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 管理员详情抽屉 */}
      <Drawer
        title="管理员详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedAdmin && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: selectedAdmin.role === 'super_admin' ? '#faad14' : '#1890ff'
                }}
              />
              <h3 style={{ marginTop: 12, marginBottom: 4 }}>
                {selectedAdmin.username}
                {selectedAdmin._id === currentAdmin?._id && (
                  <Tag color="green" style={{ marginLeft: 8 }}>当前用户</Tag>
                )}
              </h3>
              <div>{getRoleTag(selectedAdmin.role)}</div>
            </div>
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">{selectedAdmin.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{selectedAdmin.email}</Descriptions.Item>
              <Descriptions.Item label="角色">{getRoleTag(selectedAdmin.role)}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedAdmin.status)}</Descriptions.Item>
              <Descriptions.Item label="在线状态">{getOnlineStatus(selectedAdmin.lastLoginAt)}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedAdmin.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(selectedAdmin.updatedAt).toLocaleString()}
              </Descriptions.Item>
              {selectedAdmin.lastLoginAt && (
                <Descriptions.Item label="最后登录时间">
                  {new Date(selectedAdmin.lastLoginAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* 创建管理员对话框 */}
      <Modal
        title="创建管理员"
        open={createVisible}
        onCancel={() => {
          setCreateVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="创建管理员账号"
          description="请谨慎创建管理员账号，确保账号信息的安全性"
          type="warning"
          style={{ marginBottom: 16 }}
        />
        
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateAdmin}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
              { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
              { max: 50, message: '密码最多50个字符' }
            ]}
          >
            <Password placeholder="请输入密码" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
              })
            ]}
          >
            <Password placeholder="请再次输入密码" />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="admin"
          >
            <Select placeholder="请选择角色">
              <Option value="admin">普通管理员</Option>
              <Option value="super_admin">超级管理员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setCreateVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建管理员
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default AdminManage;