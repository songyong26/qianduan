import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag } from 'antd';
import api from '../api';

export default function WithdrawAudit() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/withdraw');
      setData(res.data.filter(w => w.status === 'pending'));
    } catch (e) {
      message.error('获取提现记录失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  const handleAudit = async (id, approve) => {
    try {
      await api.post(`/api/admin/withdraw/${id}/audit`, { approve });
      message.success('操作成功');
      fetchWithdraws();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '金额', dataIndex: 'amount' },
    { title: '钱包地址', dataIndex: 'wallet' },
    { title: '申请时间', dataIndex: 'createdAt', render: t => t ? new Date(t).toLocaleString() : '-' },
    { title: '状态', dataIndex: 'status', render: v => <Tag color={v === 'pending' ? 'orange' : v === 'approved' ? 'green' : 'red'}>{v}</Tag> },
    {
      title: '操作',
      render: (_, r) => (
        <>
          <Button type="primary" size="small" onClick={() => handleAudit(r._id, true)} style={{ marginRight: 8 }}>通过</Button>
          <Button danger size="small" onClick={() => handleAudit(r._id, false)}>拒绝</Button>
        </>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>提现审核</h2>
      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
} 