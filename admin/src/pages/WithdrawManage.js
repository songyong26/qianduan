import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Tag, Modal, Form, Input, Select, message,
  Space, Tooltip, Drawer, Descriptions, Row, Col, Spin,
  DatePicker, Switch, Avatar, Badge, Statistic, Divider,
  InputNumber, Popconfirm, Image
} from 'antd';
import {
  EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined,
  ReloadOutlined, FilterOutlined, ExportOutlined, UserOutlined,
  DollarOutlined, BankOutlined, CreditCardOutlined, AlipayOutlined,
  WechatOutlined, CalendarOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function WithdrawManage() {
  const [loading, setLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    method: '',
    dateRange: null
  });
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditForm] = Form.useForm();
  const [stats, setStats] = useState(null);

  // 获取提现列表
  const fetchWithdrawals = async (page = 1, pageSize = 10) => {
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
      
      const response = await adminAPI.withdraws.getAll(params);
      if (response.data && response.data.success) {
        setWithdrawals(response.data.data.withdrawals || []);
        setPagination({
          current: response.data.data.pagination.current,
          pageSize: response.data.data.pagination.pageSize,
          total: response.data.data.pagination.total
        });
      }
    } catch (error) {
      console.error('获取提现列表失败:', error);
      message.error('获取提现列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const response = await adminAPI.stats.get();
      if (response.data && response.data.success) {
        setStats(response.data.data.withdrawals);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchStats();
  }, []);

  // 搜索和筛选
  const handleSearch = () => {
    fetchWithdrawals(1, pagination.pageSize);
  };

  const handleReset = () => {
    setFilters({
      status: '',
      search: '',
      method: '',
      dateRange: null
    });
    setTimeout(() => {
      fetchWithdrawals(1, pagination.pageSize);
    }, 100);
  };

  // 查看详情
  const handleViewDetail = async (withdraw) => {
    try {
      const response = await adminAPI.withdraws.getDetail(withdraw.id);
      if (response.data && response.data.success) {
        setSelectedWithdraw(response.data.data);
        setDetailVisible(true);
      }
    } catch (error) {
      console.error('获取提现详情失败:', error);
      message.error('获取提现详情失败');
    }
  };

  // 提现审核
  const handleAudit = (withdraw, approve) => {
    setSelectedWithdraw(withdraw);
    auditForm.setFieldsValue({
      approve,
      reason: ''
    });
    setAuditVisible(true);
  };

  const handleAuditSubmit = async () => {
    try {
      const values = await auditForm.validateFields();
      const response = await adminAPI.withdraws.audit(selectedWithdraw.id, {
        approve: values.approve,
        reason: values.reason
      });
      
      if (response.data && response.data.success) {
        message.success(`提现申请${values.approve ? '通过' : '拒绝'}成功`);
        setAuditVisible(false);
        fetchWithdrawals(pagination.current, pagination.pageSize);
        fetchStats();
      }
    } catch (error) {
      console.error('提现审核失败:', error);
      message.error('提现审核失败');
    }
  };

  // 状态标签
  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待审核', icon: <ClockCircleOutlined /> },
      approved: { color: 'green', text: '已通过', icon: <CheckOutlined /> },
      rejected: { color: 'red', text: '已拒绝', icon: <CloseOutlined /> },
      processing: { color: 'blue', text: '处理中', icon: <ClockCircleOutlined /> },
      completed: { color: 'purple', text: '已完成', icon: <CheckOutlined /> },
      failed: { color: 'red', text: '失败', icon: <CloseOutlined /> }
    };
    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  // 提现方式图标
  const getMethodIcon = (method) => {
    const methodMap = {
      alipay: <AlipayOutlined style={{ color: '#1890ff' }} />,
      wechat: <WechatOutlined style={{ color: '#52c41a' }} />,
      bank: <BankOutlined style={{ color: '#722ed1' }} />
    };
    return methodMap[method] || <CreditCardOutlined />;
  };

  // 表格列定义
  const columns = [
    {
      title: '申请信息',
      key: 'withdrawInfo',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>¥{utils.formatNumber(record.amount)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            申请号: {record.id}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {new Date(record.createdAt).toLocaleString()}
          </div>
        </div>
      )
    },
    {
      title: '用户信息',
      key: 'userInfo',
      width: 150,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div>{record.username}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              余额: ¥{utils.formatNumber(record.userBalance)}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '提现方式',
      dataIndex: 'method',
      key: 'method',
      width: 120,
      render: (method, record) => (
        <Space>
          {getMethodIcon(method)}
          <div>
            <div>{method === 'alipay' ? '支付宝' : method === 'wechat' ? '微信' : '银行卡'}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.accountInfo}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 80,
      render: (fee) => `¥${utils.formatNumber(fee || 0)}`
    },
    {
      title: '实际到账',
      key: 'actualAmount',
      width: 100,
      render: (_, record) => (
        <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
          ¥{utils.formatNumber(record.amount - (record.fee || 0))}
        </span>
      )
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
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="withdraw-manage-container">
      <div className="page-header">
        <h1 className="page-title">提现管理</h1>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={() => fetchWithdrawals(pagination.current, pagination.pageSize)}
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
                title="总申请数"
                value={stats.total}
                prefix={<DollarOutlined />}
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
              placeholder="搜索用户名或申请号"
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
              <Option value="pending">待审核</Option>
              <Option value="approved">已通过</Option>
              <Option value="rejected">已拒绝</Option>
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder="提现方式"
              value={filters.method}
              onChange={(value) => setFilters({ ...filters, method: value })}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="alipay">支付宝</Option>
              <Option value="wechat">微信</Option>
              <Option value="bank">银行卡</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
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

      {/* 提现列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={withdrawals}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchWithdrawals(page, pageSize);
            },
            onShowSizeChange: (current, size) => {
              fetchWithdrawals(1, size);
            }
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 提现详情抽屉 */}
      <Drawer
        title="提现详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedWithdraw && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="申请号">
                {selectedWithdraw.id}
              </Descriptions.Item>
              <Descriptions.Item label="用户">
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  {selectedWithdraw.username}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="提现金额">
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f5222d' }}>
                  ¥{utils.formatNumber(selectedWithdraw.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="手续费">
                ¥{utils.formatNumber(selectedWithdraw.fee || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="实际到账">
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{utils.formatNumber(selectedWithdraw.amount - (selectedWithdraw.fee || 0))}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="提现方式">
                <Space>
                  {getMethodIcon(selectedWithdraw.method)}
                  {selectedWithdraw.method === 'alipay' ? '支付宝' : 
                   selectedWithdraw.method === 'wechat' ? '微信' : '银行卡'}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="收款账户">
                {selectedWithdraw.accountInfo}
              </Descriptions.Item>
              <Descriptions.Item label="收款人">
                {selectedWithdraw.accountName}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(selectedWithdraw.status)}
              </Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(selectedWithdraw.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedWithdraw.auditTime && (
                <>
                  <Descriptions.Item label="审核时间">
                    {new Date(selectedWithdraw.auditTime).toLocaleString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="审核人">
                    {selectedWithdraw.auditor}
                  </Descriptions.Item>
                </>
              )}
              {selectedWithdraw.rejectReason && (
                <Descriptions.Item label="拒绝原因">
                  {selectedWithdraw.rejectReason}
                </Descriptions.Item>
              )}
              {selectedWithdraw.remark && (
                <Descriptions.Item label="备注">
                  {selectedWithdraw.remark}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {selectedWithdraw.proofImage && (
              <div style={{ marginTop: 24 }}>
                <Divider>凭证图片</Divider>
                <Image
                  width={200}
                  src={selectedWithdraw.proofImage}
                  placeholder="加载中..."
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 审核模态框 */}
      <Modal
        title="提现审核"
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

export default WithdrawManage;