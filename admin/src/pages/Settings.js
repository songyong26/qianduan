import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Switch, InputNumber, Select, message,
  Divider, Space, Alert, Tabs, Row, Col, Statistic, Progress,
  Table, Tag, Modal
} from 'antd';
import {
  SettingOutlined, SaveOutlined, ReloadOutlined, DatabaseOutlined,
  SecurityScanOutlined, BellOutlined, GlobalOutlined, ToolOutlined,
  InfoCircleOutlined, WarningOutlined
} from '@ant-design/icons';
import { utils } from '../api';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

function Settings() {
  const [loading, setLoading] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [settingsForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [notificationForm] = Form.useForm();

  // 模拟系统信息
  const mockSystemInfo = {
    version: '1.0.0',
    uptime: '7天 12小时 30分钟',
    nodeVersion: 'v18.17.0',
    platform: 'Windows',
    memory: {
      used: 256,
      total: 1024,
      usage: 25
    },
    disk: {
      used: 15.6,
      total: 100,
      usage: 15.6
    },
    database: {
      status: 'connected',
      collections: 8,
      documents: 1250,
      size: '45.2 MB'
    }
  };

  // 模拟系统日志
  const mockLogs = [
    {
      id: 1,
      level: 'info',
      message: '系统启动成功',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      module: 'system'
    },
    {
      id: 2,
      level: 'warning',
      message: '内存使用率较高',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      module: 'monitor'
    },
    {
      id: 3,
      level: 'error',
      message: '数据库连接超时',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      module: 'database'
    },
    {
      id: 4,
      level: 'info',
      message: '用户登录成功',
      timestamp: new Date(Date.now() - 1000 * 60 * 2),
      module: 'auth'
    }
  ];

  // 初始化数据
  useEffect(() => {
    setSystemInfo(mockSystemInfo);
    
    // 初始化表单数据
    settingsForm.setFieldsValue({
      siteName: '投票系统',
      siteDescription: '专业的在线投票平台',
      maxFileSize: 10,
      allowedFileTypes: ['jpg', 'png', 'gif'],
      enableRegistration: true,
      enableEmailVerification: true,
      sessionTimeout: 24
    });

    securityForm.setFieldsValue({
      enableTwoFactor: false,
      passwordMinLength: 6,
      passwordRequireSpecial: true,
      loginAttempts: 5,
      lockoutDuration: 30,
      enableCaptcha: true
    });

    notificationForm.setFieldsValue({
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      adminEmail: 'admin@example.com',
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: 'noreply@example.com',
      smtpPassword: ''
    });
  }, []);

  // 保存基础设置
  const handleSaveSettings = async (values) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('基础设置保存成功');
      console.log('基础设置:', values);
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存安全设置
  const handleSaveSecurity = async (values) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('安全设置保存成功');
      console.log('安全设置:', values);
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存通知设置
  const handleSaveNotification = async (values) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('通知设置保存成功');
      console.log('通知设置:', values);
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 清理缓存
  const handleClearCache = () => {
    Modal.confirm({
      title: '确认清理缓存',
      content: '清理缓存可能会影响系统性能，确定要继续吗？',
      onOk: async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 2000));
          message.success('缓存清理完成');
        } catch (error) {
          message.error('清理失败');
        }
      }
    });
  };

  // 重启系统
  const handleRestartSystem = () => {
    Modal.confirm({
      title: '确认重启系统',
      content: '重启系统将中断所有用户连接，确定要继续吗？',
      okType: 'danger',
      onOk: async () => {
        try {
          message.info('系统重启中，请稍候...');
          // 模拟重启
          await new Promise(resolve => setTimeout(resolve, 3000));
          message.success('系统重启完成');
        } catch (error) {
          message.error('重启失败');
        }
      }
    });
  };

  // 日志级别标签
  const getLogLevelTag = (level) => {
    const levelMap = {
      info: { color: 'blue', text: '信息' },
      warning: { color: 'orange', text: '警告' },
      error: { color: 'red', text: '错误' },
      debug: { color: 'green', text: '调试' }
    };
    const config = levelMap[level] || levelMap.info;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 日志表格列
  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (date) => date.toLocaleString()
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: getLogLevelTag
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    }
  ];

  return (
    <div className="settings-container">
      <Card title="系统设置" className="settings-card">
        <Tabs defaultActiveKey="basic" type="card">
          {/* 基础设置 */}
          <TabPane tab={<span><SettingOutlined />基础设置</span>} key="basic">
            <Form
              form={settingsForm}
              layout="vertical"
              onFinish={handleSaveSettings}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="siteName"
                    label="网站名称"
                    rules={[{ required: true, message: '请输入网站名称' }]}
                  >
                    <Input placeholder="请输入网站名称" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="sessionTimeout"
                    label="会话超时时间（小时）"
                    rules={[{ required: true, message: '请输入会话超时时间' }]}
                  >
                    <InputNumber min={1} max={168} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="siteDescription"
                label="网站描述"
              >
                <TextArea rows={3} placeholder="请输入网站描述" />
              </Form.Item>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="maxFileSize"
                    label="最大文件大小（MB）"
                    rules={[{ required: true, message: '请输入最大文件大小' }]}
                  >
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="allowedFileTypes"
                    label="允许的文件类型"
                    rules={[{ required: true, message: '请选择允许的文件类型' }]}
                  >
                    <Select mode="multiple" placeholder="请选择文件类型">
                      <Option value="jpg">JPG</Option>
                      <Option value="png">PNG</Option>
                      <Option value="gif">GIF</Option>
                      <Option value="pdf">PDF</Option>
                      <Option value="doc">DOC</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="enableRegistration"
                    label="允许用户注册"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="enableEmailVerification"
                    label="邮箱验证"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 安全设置 */}
          <TabPane tab={<span><SecurityScanOutlined />安全设置</span>} key="security">
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSaveSecurity}
            >
              <Alert
                message="安全提醒"
                description="修改安全设置可能会影响用户登录体验，请谨慎操作"
                type="warning"
                style={{ marginBottom: 16 }}
              />
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="passwordMinLength"
                    label="密码最小长度"
                    rules={[{ required: true, message: '请输入密码最小长度' }]}
                  >
                    <InputNumber min={6} max={20} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="loginAttempts"
                    label="登录尝试次数"
                    rules={[{ required: true, message: '请输入登录尝试次数' }]}
                  >
                    <InputNumber min={3} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="lockoutDuration"
                label="锁定时长（分钟）"
                rules={[{ required: true, message: '请输入锁定时长' }]}
              >
                <InputNumber min={5} max={1440} style={{ width: '100%' }} />
              </Form.Item>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="enableTwoFactor"
                    label="启用双因子认证"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="passwordRequireSpecial"
                    label="密码需要特殊字符"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="enableCaptcha"
                    label="启用验证码"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 通知设置 */}
          <TabPane tab={<span><BellOutlined />通知设置</span>} key="notification">
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleSaveNotification}
            >
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="emailNotifications"
                    label="邮件通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="smsNotifications"
                    label="短信通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="pushNotifications"
                    label="推送通知"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              
              <Divider>邮件配置</Divider>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="adminEmail"
                    label="管理员邮箱"
                    rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                  >
                    <Input placeholder="请输入管理员邮箱" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="smtpHost"
                    label="SMTP服务器"
                  >
                    <Input placeholder="请输入SMTP服务器地址" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="smtpPort"
                    label="SMTP端口"
                  >
                    <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="smtpUser"
                    label="SMTP用户名"
                  >
                    <Input placeholder="请输入SMTP用户名" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="smtpPassword"
                    label="SMTP密码"
                  >
                    <Input.Password placeholder="请输入SMTP密码" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                  保存设置
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          {/* 系统信息 */}
          <TabPane tab={<span><InfoCircleOutlined />系统信息</span>} key="system">
            {systemInfo && (
              <div>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="系统版本"
                        value={systemInfo.version}
                        prefix={<GlobalOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="运行时间"
                        value={systemInfo.uptime}
                        prefix={<ToolOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="Node.js版本"
                        value={systemInfo.nodeVersion}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card>
                      <Statistic
                        title="操作系统"
                        value={systemInfo.platform}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                  <Col xs={24} md={12}>
                    <Card title="内存使用情况">
                      <Progress
                        percent={systemInfo.memory.usage}
                        status={systemInfo.memory.usage > 80 ? 'exception' : 'normal'}
                        format={() => `${systemInfo.memory.used}MB / ${systemInfo.memory.total}MB`}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="磁盘使用情况">
                      <Progress
                        percent={systemInfo.disk.usage}
                        status={systemInfo.disk.usage > 80 ? 'exception' : 'normal'}
                        format={() => `${systemInfo.disk.used}GB / ${systemInfo.disk.total}GB`}
                      />
                    </Card>
                  </Col>
                </Row>
                
                <Card title="数据库信息" style={{ marginTop: 16 }}>
                  <Row gutter={[16, 0]}>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="连接状态"
                        value={systemInfo.database.status === 'connected' ? '已连接' : '未连接'}
                        valueStyle={{ color: systemInfo.database.status === 'connected' ? '#52c41a' : '#f5222d' }}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="集合数量"
                        value={systemInfo.database.collections}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="文档数量"
                        value={systemInfo.database.documents}
                      />
                    </Col>
                    <Col xs={24} sm={6}>
                      <Statistic
                        title="数据库大小"
                        value={systemInfo.database.size}
                      />
                    </Col>
                  </Row>
                </Card>
                
                <Card title="系统操作" style={{ marginTop: 16 }}>
                  <Space>
                    <Button 
                      icon={<DatabaseOutlined />} 
                      onClick={handleClearCache}
                    >
                      清理缓存
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={handleRestartSystem}
                      danger
                    >
                      重启系统
                    </Button>
                  </Space>
                </Card>
              </div>
            )}
          </TabPane>

          {/* 系统日志 */}
          <TabPane tab={<span><WarningOutlined />系统日志</span>} key="logs">
            <Card title="最近日志">
              <Table
                columns={logColumns}
                dataSource={mockLogs}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true
                }}
                size="small"
              />
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}

export default Settings;