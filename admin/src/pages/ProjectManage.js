import React, { useEffect, useState } from 'react';
import { Table, Button, message, Popconfirm } from 'antd';
import api from '../api';

export default function ProjectManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/projects');
      setData(res.data);
    } catch (e) {
      message.error('获取项目失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id, creator) => {
    try {
      await api.delete(`/api/projects/${id}`, { data: { username: creator } });
      message.success('删除成功');
      fetchProjects();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const columns = [
    { title: '标题', dataIndex: 'title' },
    { title: '描述', dataIndex: 'description' },
    { title: '发起人', dataIndex: 'creator' },
    { title: '截止时间', dataIndex: 'deadline', render: t => t ? new Date(t).toLocaleString() : '-' },
    { title: '状态', dataIndex: 'status' },
    {
      title: '操作',
      render: (_, r) => (
        <Popconfirm title="确定删除该项目吗？" onConfirm={() => handleDelete(r._id, r.creator)} okText="删除" cancelText="取消">
          <Button danger size="small">删除</Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>项目管理</h2>
      <Table rowKey="_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
} 