import React, { useEffect, useState } from 'react';
import { Table, Button, message, Tag } from 'antd';
import api from '../api';

export default function ProjectAudit() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/projects');
      setData(res.data.filter(p => p.status === 'pending_review'));
    } catch (e) {
      message.error('获取项目失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAudit = async (id, approve) => {
    try {
      await api.post(`/api/admin/projects/${id}/audit`, { approve });
      message.success('审核成功');
      fetchProjects();
    } catch (e) {
      message.error('审核失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title' },
    { title: '描述', dataIndex: 'description' },
    { title: '发起人', dataIndex: 'creator' },
    { title: '截止时间', dataIndex: 'deadline', render: t => t ? new Date(t).toLocaleString() : '-' },
    { title: '待公布选项', dataIndex: 'pendingOption', render: v => <Tag color="blue">{v}</Tag> },
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
      <h2 style={{ marginBottom: 16 }}>项目审核</h2>
      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={false} />
    </div>
  );
} 