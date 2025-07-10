import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Tag, Modal, Form, Input, Select, message,
  Space, Tooltip, Drawer, Descriptions, Row, Col, Spin,
  DatePicker, Switch, Avatar, Badge, Statistic, Divider
} from 'antd';
import {
  EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined,
  ReloadOutlined, FilterOutlined, ExportOutlined, UserOutlined,
  ProjectOutlined, CalendarOutlined, DollarOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function ProjectManage() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    creator: '',
    dateRange: null
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditForm] = Form.useForm();
  const [stats, setStats] = useState(null);

  // 获取项目列表
  const fetchProjects = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
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
      
      const response = await adminAPI.projects.getAll(params);
      if (response.data && response.data.success) {
        setProjects(response.data.data.projects || []);
        setPagination({
          current: response.data.data.pagination.current,
          pageSize: response.data.data.pagination.pageSize,
          total: response.data.data.pagination.total
        });
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await adminAPI.stats.get();
      if (response.data && response.data.success) {
        setStats(response.data.data.projects);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, []);

  // 搜索和筛选
  const handleSearch = () => {
    fetchProjects(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({
      status: '',
      search: '',
      creator: '',
      dateRange: null
    });
    setTimeout(() => {
      fetchProjects(1, pagination.pageSize);
    }, 100);
  };

  // 查看详情
  const handleViewDetail = async (project) => {
    try {
      const response = await adminAPI.projects.getDetail(project.id);
      if (response.data && response.data.success) {
        setSelectedProject(response.data.data);
        setDetailVisible(true);
      }
    } catch (error) {
      console.error('获取项目详情失败:', error);
      message.error('获取项目详情失败');
    }
  };

  // 项目审核
  const handleAudit = (project, approve) => {
    setSelectedProject(project);
    auditForm.setFieldsValue({
      approve,
      reason: ''
    });
    setAuditVisible(true);
  };

  const handleAuditSubmit = async () => {
    try {
      const values = await auditForm.validateFields();
      const response = await adminAPI.projects.audit(selectedProject.id, {
        approve: values.approve,
        reason: values.reason
      });
      
      if (response.data && response.data.success) {
        message.success(`项目${values.approve ? '通过' : '拒绝'}成功`);
        setAuditVisible(false);
        fetchProjects(pagination.current, pagination.pageSize);
        fetchStats();
      }
    } catch (error) {
      console.error('项目审核失败:', error);
      message.error('项目审核失败');
    }
  };

  // 状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      pending_review: { color: 'orange', text: '待审核' },
      review_passed: { color: 'green', text: '已通过' },
      review_rejected: { color: 'red', text: '已拒绝' },
      active: { color: 'blue', text: '进行中' },
      completed: { color: 'purple', text: '已完成' },
      expired: { color: 'gray', text: '已过期' }
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <Button 
            type="link" 
            onClick={() => handleViewDetail(record)}
            style={{ padding: 0, height: 'auto' }}
          >
            {text}
          </Button>
        </Tooltip>
      )
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {creator}
        </Space>
      )
    },
    {
      title: '奖励',
      dataIndex: 'reward',
      key: 'reward',
      width: 100,
      render: (reward) => `¥${utils.formatNumber(reward)}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: '投票数',
      dataIndex: 'voteCount',
      key: 'voteCount',
      width: 80,
      render: (count) => (
        <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: '审核信息',
      key: 'audit',
      width: 120,
      render: (_, record) => {
        if (record.auditTime) {
          return (
            <div>
              <div>{record.auditor}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(record.auditTime).toLocaleDateString()}
              </div>
            </div>
          );
        }
        return '-';
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => {
        // 调试信息：打印项目状态
        console.log('项目状态调试:', {
          id: record.id,
          title: record.title,
          status: record.status,
          statusType: typeof record.status,
          isPendingReview: record.status === 'pending_review'
        });
        
        return (
          <Space size="small">
            <Tooltip title="查看详情">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>
            {/* 显示所有项目的审核按钮 */}
             <Tooltip title="通过">
               <Button 
                 type="text" 
                 icon={<CheckOutlined />} 
                 style={{ color: '#52c41a' }}
                 onClick={() => handleAudit(record, true)}
               />
             </Tooltip>
             <Tooltip title="拒绝">
               <Button 
                 type="text" 
                 icon={<CloseOutlined />} 
                 danger
                 onClick={() => handleAudit(record, false)}
               />
             </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
    <div className="project-manage-container">
      <div className="page-header">
        <h1 className="page-title">项目管理</h1>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => fetchProjects(pagination.current, pagination.pageSize)}
            loading={loading}
          >
            刷新
          </Button>
          <Button icon={<ExportOutlined />}>
            导出数据
          </Button>
        </Space>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总项目数"
                value={stats.total}
                prefix={<ProjectOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="待审核"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="已通过"
                value={stats.approved}
                prefix={<CheckOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="通过率"
                value={stats.approvalRate}
                suffix="%"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 搜索和筛选 */}
      <Card className="filter-card" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="搜索项目名称或描述"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="状态筛选"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="pending_review">待审核</Option>
              <Option value="review_passed">已通过</Option>
              <Option value="review_rejected">已拒绝</Option>
              <Option value="active">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="expired">已过期</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="创建者筛选"
              value={filters.creator}
              onChange={(e) => setFilters({ ...filters, creator: e.target.value })}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={2}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 项目列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchProjects(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              fetchProjects(1, size);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 项目详情抽屉 */}
      <Drawer
        title="项目详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedProject && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="项目名称">
                {selectedProject.title}
              </Descriptions.Item>
              <Descriptions.Item label="项目描述">
                {selectedProject.description}
              </Descriptions.Item>
              <Descriptions.Item label="创建者">
                {selectedProject.creator}
              </Descriptions.Item>
              <Descriptions.Item label="奖励金额">
                ¥{utils.formatNumber(selectedProject.reward)}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedProject.status)}
              </Descriptions.Item>
              <Descriptions.Item label="投票数">
                {selectedProject.voteCount}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {new Date(selectedProject.deadline).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedProject.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedProject.auditTime && (
                <>
                  <Descriptions.Item label="审核时间">
                    {new Date(selectedProject.auditTime).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核人">
                    {selectedProject.auditor}
                  </Descriptions.Item>
                </>
              )}
              {selectedProject.rejectReason && (
                <Descriptions.Item label="拒绝原因">
                  {selectedProject.rejectReason}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {selectedProject.options && selectedProject.options.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Divider>投票选项</Divider>
                {selectedProject.options.map((option, index) => (
                  <Card key={index} size="small" style={{ marginBottom: 8 }}>
                    <div>{option.text}</div>
                    <div style={{ color: '#666', fontSize: '12px' }}>
                      票数: {option.votes || 0}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 审核模态框 */}
      <Modal
        title="项目审核"
        open={auditVisible}
        onOk={handleAuditSubmit}
        onCancel={() => setAuditVisible(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form form={auditForm} layout="vertical">
          <Form.Item name="approve" label="审核结果" rules={[{ required: true }]}>
            <Select placeholder="请选择审核结果">
              <Option value={true}>通过</Option>
              <Option value={false}>拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item 
            name="reason" 
            label="审核意见"
            rules={[
              { required: true, message: '请输入审核意见' },
              { max: 500, message: '审核意见不能超过500字符' }
            ]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入审核意见（必填）"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectManage;