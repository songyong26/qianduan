import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Tag, Modal, Form, Input, Select, message,
  Space, Tooltip, Drawer, Descriptions, Image, Row, Col, Spin,
  DatePicker, Radio
} from 'antd';
import {
  EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined,
  ReloadOutlined, FilterOutlined, ExportOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

function ProjectAudit() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
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
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditForm] = Form.useForm();

  // 获取项目列表
  const fetchProjects = async (page = 1, pageSize = 10) => {
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

      const response = await adminAPI.projects.getPending(params);
      if (response.data && response.data.success) {
        const { projects, total } = response.data.data;
        setProjects(projects || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total
        }));
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      message.error('获取项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchProjects();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchProjects(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({
      status: '',
      keyword: '',
      dateRange: null
    });
    setTimeout(() => {
      fetchProjects(1, pagination.pageSize);
    }, 100);
  };

  // 查看详情
  const handleViewDetail = (project) => {
    setSelectedProject(project);
    setDetailVisible(true);
  };

  // 开始审核
  const handleStartAudit = (project) => {
    setSelectedProject(project);
    setAuditVisible(true);
    auditForm.resetFields();
  };

  // 提交审核
  const handleSubmitAudit = async (values) => {
    try {
      const response = await adminAPI.projects.audit(selectedProject._id, values);
      if (response.data && response.data.success) {
        message.success('审核完成');
        setAuditVisible(false);
        fetchProjects(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  };

  // 快速审核
  const handleQuickAudit = async (project, status, reason = '') => {
    try {
      const response = await adminAPI.projects.audit(project._id, {
        status,
        reason
      });
      if (response.data && response.data.success) {
        message.success(`项目已${status === 'approved' ? '通过' : '拒绝'}`);
        fetchProjects(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  };

  // 状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审核' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <Button 
          type="link" 
          onClick={() => handleViewDetail(record)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'username'],
      key: 'creator',
      width: 120
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const typeMap = {
          single: '单选',
          multiple: '多选',
          ranking: '排序'
        };
        return typeMap[type] || type;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              <Tooltip title="通过">
                <Button 
                  type="text" 
                  icon={<CheckOutlined />} 
                  style={{ color: '#52c41a' }}
                  onClick={() => handleQuickAudit(record, 'approved')}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button 
                  type="text" 
                  icon={<CloseOutlined />} 
                  danger
                  onClick={() => handleStartAudit(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="project-audit-container">
      <Card className="search-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索项目名称或创建者"
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
              <Option value="pending">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
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
        title="项目审核" 
        className="table-card"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchProjects(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchProjects(page, pageSize);
            }
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 项目详情抽屉 */}
      <Drawer
        title="项目详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedProject?.status === 'pending' && (
            <Space>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => handleQuickAudit(selectedProject, 'approved')}
              >
                通过
              </Button>
              <Button 
                danger 
                icon={<CloseOutlined />}
                onClick={() => handleStartAudit(selectedProject)}
              >
                拒绝
              </Button>
            </Space>
          )
        }
      >
        {selectedProject && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="项目名称">{selectedProject.title}</Descriptions.Item>
            <Descriptions.Item label="项目描述">{selectedProject.description}</Descriptions.Item>
            <Descriptions.Item label="创建者">{selectedProject.creator?.username}</Descriptions.Item>
            <Descriptions.Item label="投票类型">
              {{
                single: '单选',
                multiple: '多选',
                ranking: '排序'
              }[selectedProject.type] || selectedProject.type}
            </Descriptions.Item>
            <Descriptions.Item label="状态">{getStatusTag(selectedProject.status)}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(selectedProject.createdAt).toLocaleString()}
            </Descriptions.Item>
            {selectedProject.endTime && (
              <Descriptions.Item label="结束时间">
                {new Date(selectedProject.endTime).toLocaleString()}
              </Descriptions.Item>
            )}
            {selectedProject.options && selectedProject.options.length > 0 && (
              <Descriptions.Item label="投票选项">
                <div>
                  {selectedProject.options.map((option, index) => (
                    <div key={index} style={{ marginBottom: 8 }}>
                      <strong>{option.text}</strong>
                      {option.image && (
                        <div style={{ marginTop: 4 }}>
                          <Image 
                            src={option.image} 
                            alt={option.text}
                            width={100}
                            height={100}
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Descriptions.Item>
            )}
            {selectedProject.auditReason && (
              <Descriptions.Item label="审核意见">{selectedProject.auditReason}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      {/* 审核对话框 */}
      <Modal
        title="项目审核"
        open={auditVisible}
        onCancel={() => setAuditVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={auditForm}
          layout="vertical"
          onFinish={handleSubmitAudit}
        >
          <Form.Item
            name="status"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Radio.Group>
              <Radio value="approved">通过</Radio>
              <Radio value="rejected">拒绝</Radio>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="reason"
            label="审核意见"
            rules={[{ required: true, message: '请输入审核意见' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请输入审核意见..." 
              maxLength={500}
              showCount
            />
          </Form.Item>
          
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAuditVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">提交审核</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default ProjectAudit;