import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Tag, Modal, Form, Input, Select, message,
  Space, Tooltip, Drawer, Descriptions, Row, Col, Spin,
  DatePicker, Switch, Avatar, Badge, Statistic
} from 'antd';
import {
  EyeOutlined, SearchOutlined, ReloadOutlined, UserOutlined,
  StopOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  MailOutlined, PhoneOutlined, CalendarOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;

function UserManage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
    dateRange: null
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [stats, setStats] = useState(null);

  // 获取用户列表
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filters
      };

      // 处理日期范围
      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await adminAPI.users.getList(params);
      if (response.data && response.data.success) {
        const { users, total, stats } = response.data.data;
        setUsers(users || []);
        setStats(stats);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total
        }));
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchUsers();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchUsers(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({
      status: '',
      keyword: '',
      dateRange: null
    });
    setTimeout(() => {
      fetchUsers(1, pagination.pageSize);
    }, 100);
  };

  // 查看详情
  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setDetailVisible(true);
  };

  // 切换用户状态
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    const action = newStatus === 'active' ? '启用' : '禁用';
    
    Modal.confirm({
      title: `确认${action}用户`,
      content: `确定要${action}用户 "${user.username}" 吗？`,
      onOk: async () => {
        try {
          const response = await adminAPI.users.toggleStatus(user._id, {
            status: newStatus
          });
          if (response.data && response.data.success) {
            message.success(`用户已${action}`);
            fetchUsers(pagination.current, pagination.pageSize);
          }
        } catch (error) {
          console.error(`${action}用户失败:`, error);
          message.error(`${action}用户失败`);
        }
      }
    });
  };

  // 状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: 'green', text: '正常', icon: <CheckCircleOutlined /> },
      disabled: { color: 'red', text: '禁用', icon: <StopOutlined /> },
      pending: { color: 'orange', text: '待验证', icon: <ExclamationCircleOutlined /> }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // 在线状态
  const getOnlineStatus = (lastActiveAt) => {
    if (!lastActiveAt) return <Badge status="default" text="未知" />;
    
    const now = new Date();
    const lastActive = new Date(lastActiveAt);
    const diffMinutes = (now - lastActive) / (1000 * 60);
    
    if (diffMinutes < 5) {
      return <Badge status="success" text="在线" />;
    } else if (diffMinutes < 30) {
      return <Badge status="processing" text="最近活跃" />;
    } else {
      return <Badge status="default" text="离线" />;
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={record.avatar} 
            icon={<UserOutlined />}
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              <Button 
                type="link" 
                onClick={() => handleViewDetail(record)}
                style={{ padding: 0, height: 'auto', fontWeight: 'bold' }}
              >
                {record.username}
              </Button>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
      filters: [
        { text: '正常', value: 'active' },
        { text: '禁用', value: 'disabled' },
        { text: '待验证', value: 'pending' }
      ]
    },
    {
      title: '在线状态',
      dataIndex: 'lastActiveAt',
      key: 'onlineStatus',
      width: 120,
      render: getOnlineStatus
    },
    {
      title: '项目数',
      dataIndex: 'projectCount',
      key: 'projectCount',
      width: 80,
      render: (count) => utils.formatNumber(count || 0),
      sorter: true
    },
    {
      title: '投票数',
      dataIndex: 'voteCount',
      key: 'voteCount',
      width: 80,
      render: (count) => utils.formatNumber(count || 0),
      sorter: true
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      render: (balance) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
          ¥{utils.formatNumber(balance || 0)}
        </span>
      ),
      sorter: true
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: true
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActiveAt',
      key: 'lastActiveAt',
      width: 120,
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
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
          <Tooltip title={record.status === 'active' ? '禁用用户' : '启用用户'}>
            <Button 
              type="text" 
              icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
              danger={record.status === 'active'}
              style={record.status !== 'active' ? { color: '#52c41a' } : {}}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="user-manage-container">
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总用户数"
                value={stats.total || 0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={stats.active || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="禁用用户"
                value={stats.disabled || 0}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={stats.todayNew || 0}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card className="search-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索用户名或邮箱"
              value={filters.keyword}
              onChange={(e) => setFilters(prev => ({ ...prev, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择状态"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="active">正常</Option>
              <Option value="disabled">禁用</Option>
              <Option value="pending">待验证</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card 
        title="用户管理" 
        className="table-card"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchUsers(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchUsers(page, pageSize);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户详情抽屉 */}
      <Drawer
        title="用户详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedUser && (
            <Space>
              <Button 
                type={selectedUser.status === 'active' ? 'default' : 'primary'}
                icon={selectedUser.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                danger={selectedUser.status === 'active'}
                onClick={() => handleToggleStatus(selectedUser)}
              >
                {selectedUser.status === 'active' ? '禁用用户' : '启用用户'}
              </Button>
            </Space>
          )
        }
      >
        {selectedUser && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Avatar 
                size={80} 
                src={selectedUser.avatar} 
                icon={<UserOutlined />}
              />
              <h3 style={{ marginTop: 12, marginBottom: 4 }}>{selectedUser.username}</h3>
              <div>{getStatusTag(selectedUser.status)}</div>
            </div>
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="邮箱" icon={<MailOutlined />}>
                {selectedUser.email}
              </Descriptions.Item>
              {selectedUser.phone && (
                <Descriptions.Item label="手机号" icon={<PhoneOutlined />}>
                  {selectedUser.phone}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="状态">{getStatusTag(selectedUser.status)}</Descriptions.Item>
              <Descriptions.Item label="在线状态">{getOnlineStatus(selectedUser.lastActiveAt)}</Descriptions.Item>
              <Descriptions.Item label="账户余额">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  ¥{utils.formatNumber(selectedUser.balance || 0)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="创建项目数">
                {utils.formatNumber(selectedUser.projectCount || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="参与投票数">
                {utils.formatNumber(selectedUser.voteCount || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="注册时间" icon={<CalendarOutlined />}>
                {new Date(selectedUser.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedUser.lastActiveAt && (
                <Descriptions.Item label="最后活跃时间">
                  {new Date(selectedUser.lastActiveAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedUser.lastLoginAt && (
                <Descriptions.Item label="最后登录时间">
                  {new Date(selectedUser.lastLoginAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedUser.registerIp && (
                <Descriptions.Item label="注册IP">{selectedUser.registerIp}</Descriptions.Item>
              )}
              {selectedUser.lastLoginIp && (
                <Descriptions.Item label="最后登录IP">{selectedUser.lastLoginIp}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default UserManage;