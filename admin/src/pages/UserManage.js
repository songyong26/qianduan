import React, { useEffect, useState } from 'react';
import { Table, Button, message } from 'antd';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function UserManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/user/all'); // 需后端提供所有用户接口
      setData(res.data);
    } catch (e) {
      message.error('获取用户失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPoints = data.reduce((sum, u) => sum + (u.points || 0), 0);

  const columns = [
    { title: '用户名', dataIndex: 'username' },
    { title: '当前积分', dataIndex: 'points' },
    { title: '冻结积分', dataIndex: 'frozenPoints' },
    {
      title: '操作',
      render: (_, r) => (
        <Button size="small" onClick={() => navigate(`/user-detail/${r.username}`)}>查看详情</Button>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>用户管理</h2>
      <div style={{ marginBottom: 16 }}>所有用户总积分：<b>{totalPoints}</b></div>
      <Table rowKey="username" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  );
} 