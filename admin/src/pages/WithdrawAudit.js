import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Tag, Modal, Form, Input, Select, message,
  Space, Tooltip, Drawer, Descriptions, Row, Col, Spin,
  DatePicker, Radio, InputNumber, Alert
} from 'antd';
import {
  EyeOutlined, CheckOutlined, CloseOutlined, SearchOutlined,
  ReloadOutlined, DollarOutlined, BankOutlined
} from '@ant-design/icons';
import adminAPI, { utils } from '../api';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

function WithdrawAudit() {
  const [loading, setLoading] = useState(false);
  const [withdraws, setWithdraws] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    keyword: '',
    dateRange: null,
    minAmount: null,
    maxAmount: null
  });
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [auditVisible, setAuditVisible] = useState(false);
  const [auditForm] = Form.useForm();

  // 获取提现列表
  const fetchWithdraws = async (page = 1, pageSize = 10) => {
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

      const response = await adminAPI.withdraws.getList(params);
      if (response.data && response.data.success) {
        const { withdraws, total } = response.data.data;
        setWithdraws(withdraws || []);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total
        }));
      }
    } catch (error) {
      console.error('获取提现列表失败:', error);
      message.error('获取提现列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchWithdraws();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    fetchWithdraws(1, pagination.pageSize);
  };

  // 重置搜索
  const handleReset = () => {
    setFilters({
      status: '',
      keyword: '',
      dateRange: null,
      minAmount: null,
      maxAmount: null
    });
    setTimeout(() => {
      fetchWithdraws(1, pagination.pageSize);
    }, 100);
  };

  // 查看详情
  const handleViewDetail = (withdraw) => {
    setSelectedWithdraw(withdraw);
    setDetailVisible(true);
  };

  // 开始审核
  const handleStartAudit = (withdraw) => {
    setSelectedWithdraw(withdraw);
    setAuditVisible(true);
    auditForm.resetFields();
  };

  // 提交审核
  const handleSubmitAudit = async (values) => {
    try {
      const response = await adminAPI.withdraws.audit(selectedWithdraw._id, values);
      if (response.data && response.data.success) {
        message.success('审核完成');
        setAuditVisible(false);
        fetchWithdraws(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      console.error('审核失败:', error);
      message.error('审核失败');
    }
  };

  // 快速审核
  const handleQuickAudit = async (withdraw, status, reason = '') => {
    try {
      const response = await adminAPI.withdraws.audit(withdraw._id, {
        status,
        reason
      });
      if (response.data && response.data.success) {
        message.success(`提现申请已${status === 'approved' ? '通过' : '拒绝'}`);
        fetchWithdraws(pagination.current, pagination.pageSize);
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
      rejected: { color: 'red', text: '已拒绝' },
      processing: { color: 'blue', text: '处理中' },
      completed: { color: 'green', text: '已完成' }
    };
    const config = statusMap[status] || statusMap.pending;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 提现方式标签
  const getMethodTag = (method) => {
    const methodMap = {
      alipay: { color: 'blue', text: '支付宝' },
      wechat: { color: 'green', text: '微信' },
      bank: { color: 'orange', text: '银行卡' }
    };
    const config = methodMap[method] || { color: 'default', text: method };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'user',
      width: 120,
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
      title: '提现金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
          ¥{utils.formatNumber(amount)}
        </span>
      ),
      sorter: true
    },
    {
      title: '手续费',
      dataIndex: 'fee',
      key: 'fee',
      width: 100,
      render: (fee) => `¥${utils.formatNumber(fee || 0)}`
    },
    {
      title: '实际到账',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      width: 120,
      render: (_, record) => {
        const actual = record.amount - (record.fee || 0);
        return (
          <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
            ¥{utils.formatNumber(actual)}
          </span>
        );
      }
    },
    {
      title: '提现方式',
      dataIndex: 'method',
      key: 'method',
      width: 100,
      render: getMethodTag
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag
    },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 140,
      render: (date) => new Date(date).toLocaleString(),
      sorter: true
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
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
    <div className="withdraw-audit-container">
      <Card className="search-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="搜索用户名"
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
              <Option value="processing">处理中</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Input.Group compact>
              <InputNumber
                placeholder="最小金额"
                value={filters.minAmount}
                onChange={(value) => setFilters(prev => ({ ...prev, minAmount: value }))}
                style={{ width: '50%' }}
                min={0}
              />
              <InputNumber
                placeholder="最大金额"
                value={filters.maxAmount}
                onChange={(value) => setFilters(prev => ({ ...prev, maxAmount: value }))}
                style={{ width: '50%' }}
                min={0}
              />
            </Input.Group>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }}>
          <Col>
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
        title="提现审核" 
        className="table-card"
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchWithdraws(pagination.current, pagination.pageSize)}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={withdraws}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              fetchWithdraws(page, pageSize);
            }
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 提现详情抽屉 */}
      <Drawer
        title="提现详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedWithdraw?.status === 'pending' && (
            <Space>
              <Button 
                type="primary" 
                icon={<CheckOutlined />}
                onClick={() => handleQuickAudit(selectedWithdraw, 'approved')}
              >
                通过
              </Button>
              <Button 
                danger 
                icon={<CloseOutlined />}
                onClick={() => handleStartAudit(selectedWithdraw)}
              >
                拒绝
              </Button>
            </Space>
          )
        }
      >
        {selectedWithdraw && (
          <div>
            <Alert
              message="提现信息"
              description={`用户 ${selectedWithdraw.user?.username} 申请提现 ¥${utils.formatNumber(selectedWithdraw.amount)}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions column={1} bordered>
              <Descriptions.Item label="用户名">{selectedWithdraw.user?.username}</Descriptions.Item>
              <Descriptions.Item label="用户邮箱">{selectedWithdraw.user?.email}</Descriptions.Item>
              <Descriptions.Item label="提现金额">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  ¥{utils.formatNumber(selectedWithdraw.amount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="手续费">
                ¥{utils.formatNumber(selectedWithdraw.fee || 0)}
              </Descriptions.Item>
              <Descriptions.Item label="实际到账">
                <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  ¥{utils.formatNumber(selectedWithdraw.amount - (selectedWithdraw.fee || 0))}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="提现方式">{getMethodTag(selectedWithdraw.method)}</Descriptions.Item>
              <Descriptions.Item label="收款账号">{selectedWithdraw.account}</Descriptions.Item>
              {selectedWithdraw.accountName && (
                <Descriptions.Item label="收款人">{selectedWithdraw.accountName}</Descriptions.Item>
              )}
              {selectedWithdraw.bankName && (
                <Descriptions.Item label="开户银行">{selectedWithdraw.bankName}</Descriptions.Item>
              )}
              <Descriptions.Item label="状态">{getStatusTag(selectedWithdraw.status)}</Descriptions.Item>
              <Descriptions.Item label="申请时间">
                {new Date(selectedWithdraw.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedWithdraw.processedAt && (
                <Descriptions.Item label="处理时间">
                  {new Date(selectedWithdraw.processedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedWithdraw.auditReason && (
                <Descriptions.Item label="审核意见">{selectedWithdraw.auditReason}</Descriptions.Item>
              )}
              {selectedWithdraw.remark && (
                <Descriptions.Item label="备注">{selectedWithdraw.remark}</Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* 审核对话框 */}
      <Modal
        title="提现审核"
        open={auditVisible}
        onCancel={() => setAuditVisible(false)}
        footer={null}
        width={500}
      >
        {selectedWithdraw && (
          <div>
            <Alert
              message={`审核 ${selectedWithdraw.user?.username} 的提现申请`}
              description={`提现金额：¥${utils.formatNumber(selectedWithdraw.amount)}`}
              type="warning"
              style={{ marginBottom: 16 }}
            />
            
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
          </div>
        )}
      </Modal>
    </div>
  );
}

export default WithdrawAudit;