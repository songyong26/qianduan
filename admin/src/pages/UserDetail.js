import React, { useEffect, useState } from 'react';
import { Table, Card, message, Input, Button } from 'antd';
import api from '../api';
import { useParams } from 'react-router-dom';

export default function UserDetail() {
  const { username: paramUsername } = useParams();
  const [username, setUsername] = useState(paramUsername || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUser = async (uname) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/user/info?username=${encodeURIComponent(uname)}`);
      setUser(res.data);
    } catch (e) {
      message.error('获取用户信息失败');
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (username) fetchUser(username);
  }, [username]);

  const columns = [
    { title: '时间', dataIndex: 'time' },
    { title: '类型', dataIndex: 'type' },
    { title: '变动', dataIndex: 'amount' },
    { title: '余额', dataIndex: 'balance' },
    { title: '备注', dataIndex: 'remark' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>用户详情</h2>
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="输入用户名"
          enterButton="查询"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onSearch={v => setUsername(v)}
          style={{ width: 300 }}
        />
        {user && (
          <div style={{ marginTop: 16 }}>
            <div>用户名：<b>{user.username}</b></div>
            <div>当前积分：<b>{user.points}</b></div>
            <div>冻结积分：<b>{user.frozenPoints}</b></div>
          </div>
        )}
      </Card>
      <Table
        rowKey={(r, i) => i}
        columns={columns}
        dataSource={user?.pointDetails || []}
        loading={loading}
        pagination={{ pageSize: 10 }}
        title={() => '积分明细'}
      />
    </div>
  );
} 