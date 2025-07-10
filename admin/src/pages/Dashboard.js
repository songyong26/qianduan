import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, message, Spin, Empty, Space, Tooltip } from 'antd';
import {
  UserOutlined,
  ProjectOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentWithdraws, setRecentWithdraws] = useState([]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await adminAPI.stats.get();
      if (response.data && response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      message.error('获取统计数据失败');
    } finally {
      setStatsLoading(false);
    }
  };

  // 获取最近项目
  const fetchRecentProjects = async () => {
    try {
      const response = await adminAPI.projects.getPending({ 
        page: 1, 
        limit: 5,
        status: 'pending'
      });
      if (response.data && response.data.success) {
        setRecentProjects(response.data.data.projects || []);
      }
    } catch (error) {
      console.error('获取最近项目失败:', error);
    }
  };

  // 获取最近提现
  const fetchRecentWithdraws = async () => {
    try {
      const response = await adminAPI.withdraws.getList({ 
        page: 1, 
        limit: 5,
        status: 'pending'
      });
      if (response.data && response.data.success) {
        setRecentWithdraws(response.data.data.withdraws || []);
      }
    } catch (error) {
      console.error('获取最近提现失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchStats(),
          fetchRecentProjects(),
          fetchRecentWithdraws()
        ]);
      } catch (error) {
        console.error('初始化数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // 刷新数据
  const handleRefresh = () => {
    fetchStats();
    fetchRecentProjects();
    fetchRecentWithdraws();
    message.success('数据已刷新');
  };

  // 项目状态标签
  const getProjectStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <ExclamationCircleOutlined /> }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // 提现状态标签
  const getWithdrawStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <ExclamationCircleOutlined /> }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // 项目审核处理
  const handleProjectAudit = async (projectId, status) => {
    try {
      const response = await adminAPI.projects.audit(projectId, { status });
      if (response.data && response.data.success) {
        message.success(`项目${status === 'approved' ? '通过' : '拒绝'}成功`);
        fetchRecentProjects();
        fetchStats();
      }
    } catch (error) {
      console.error('项目审核失败:', error);
      message.error('项目审核失败');
    }
  };

  // 项目表格列
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      ellipsis: true
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'username'],
      key: 'creator',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getProjectStatusTag
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Tooltip title="通过">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  style={{ color: '#52c41a' }}
                  onClick={() => handleProjectAudit(record._id, 'approved')}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  danger
                  onClick={() => handleProjectAudit(record._id, 'rejected')}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => window.location.hash = `/projects?id=${record._id}`}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // 提现审核处理
  const handleWithdrawAudit = async (withdrawId, status) => {
    try {
      const response = await adminAPI.withdraws.audit(withdrawId, { status });
      if (response.data && response.data.success) {
        message.success(`提现申请${status === 'approved' ? '通过' : '拒绝'}成功`);
        fetchRecentWithdraws();
        fetchStats();
      }
    } catch (error) {
      console.error('提现审核失败:', error);
      message.error('提现审核失败');
    }
  };

  // 提现表格列
  const withdrawColumns = [
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'user',
      width: 100
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount) => `¥${utils.formatNumber(amount)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getWithdrawStatusTag
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Tooltip title="通过">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  style={{ color: '#52c41a' }}
                  onClick={() => handleWithdrawAudit(record._id, 'approved')}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  danger
                  onClick={() => handleWithdrawAudit(record._id, 'rejected')}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => window.location.hash = `/withdraws?id=${record._id}`}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div className="loading-wrapper">
        <Spin size="large" tip="加载仪表盘数据..." />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">仪表盘</h1>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={statsLoading}
        >
          刷新数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总用户数"
              value={stats?.users?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => utils.formatNumber(value)}
            />
            <div className="stat-extra">
              <span className="stat-label">活跃用户:</span>
              <span className="stat-value">{utils.formatNumber(stats?.users?.active || 0)}</span>
              <span className="stat-label">今日新增:</span>
              <span className="stat-value">{utils.formatNumber(stats?.users?.today || 0)}</span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总项目数"
              value={stats?.projects?.total || 0}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => utils.formatNumber(value)}
            />
            <div className="stat-extra">
              <span className="stat-label">待审核:</span>
              <span className="stat-value pending">{utils.formatNumber(stats?.projects?.pending || 0)}</span>
              <span className="stat-label">通过率:</span>
              <span className="stat-value">{stats?.projects?.approvalRate || 0}%</span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="提现申请"
              value={stats?.withdraws?.total || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => utils.formatNumber(value)}
            />
            <div className="stat-extra">
              <span className="stat-label">待审核:</span>
              <span className="stat-value pending">{utils.formatNumber(stats?.withdraws?.pending || 0)}</span>
              <span className="stat-label">通过率:</span>
              <span className="stat-value">{stats?.withdraws?.approvalRate || 0}%</span>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总交易额"
              value={stats?.transactions?.total || 0}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
              formatter={(value) => utils.formatNumber(value)}
            />
            <div className="stat-extra">
              <span className="stat-label">今日:</span>
              <span className="stat-value">¥{utils.formatNumber(stats?.transactions?.today || 0)}</span>
              <span className="stat-label">用户余额:</span>
              <span className="stat-value">¥{utils.formatNumber(stats?.transactions?.userBalance || 0)}</span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Row gutter={[16, 16]} className="recent-activity">
        <Col xs={24} lg={12}>
          <Card 
            title="最近待审核项目" 
            className="activity-card"
            extra={
              <Button 
                type="link" 
                onClick={() => window.location.hash = '/projects'}
              >
                查看全部
              </Button>
            }
          >
            {recentProjects.length > 0 ? (
              <Table
                dataSource={recentProjects}
                columns={projectColumns}
                pagination={false}
                size="small"
                rowKey="_id"
                scroll={{ x: 600 }}
              />
            ) : (
              <Empty 
                description="暂无待审核项目" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title="最近提现申请" 
            className="activity-card"
            extra={
              <Button 
                type="link" 
                onClick={() => window.location.hash = '/withdraws'}
              >
                查看全部
              </Button>
            }
          >
            {recentWithdraws.length > 0 ? (
              <Table
                dataSource={recentWithdraws}
                columns={withdrawColumns}
                pagination={false}
                size="small"
                rowKey="_id"
                scroll={{ x: 600 }}
              />
            ) : (
              <Empty 
                description="暂无提现申请" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;