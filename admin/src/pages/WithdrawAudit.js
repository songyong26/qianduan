import React, { useEffect, useState } from 'react';
import { Table, Button, message, Card, Tag } from 'antd';
import api from '../api';

export default function WithdrawAudit() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/withdraw/list');
      setData(res.data);
    } catch (e) {
      message.error('获取提现申请失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const handleAudit = async (id, approve) => {
    try {
      await api.post(`/api/admin/withdraw/${id}/audit`, { approve });
      message.success('审核成功');
      fetchWithdraws();
    } catch (e) {
      message.error('审核失败');
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '金额', dataIndex: 'amount' },
    { title: '钱包地址', dataIndex: 'wallet' },
    { title: '状态', dataIndex: 'status', render: v => v === 'pending' ? <Tag color="orange">待审核</Tag> : v === 'approved' ? <Tag color="green">已通过</Tag> : <Tag color="red">已拒绝</Tag> },
    { title: '申请时间', dataIndex: 'createdAt', render: t => t ? new Date(t).toLocaleString() : '-' },
    {
      title: '操作',
      render: (_, r) => r.status === 'pending' && (
        <>
          <Button type="primary" size="small" onClick={() => handleAudit(r._id, true)} style={{ marginRight: 8 }}>通过</Button>
          <Button danger size="small" onClick={() => handleAudit(r._id, false)}>拒绝</Button>
        </>
      )
    }
  ];

  return (
    <Card title="提现审核" style={{ margin: 24 }}>
      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={false} />
    </Card>
  );
} 