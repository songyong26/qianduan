import React, { useState } from 'react';
import { Card, Input, Button, message } from 'antd';
import api from '../api';

export default function BanUser() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBan = async (ban) => {
    if (!username) return message.warning('请输入用户名');
    setLoading(true);
    try {
      await api.post(`/api/admin/ban-user`, { username, ban });
      message.success(ban ? '封禁成功' : '解封成功');
    } catch (e) {
      message.error('操作失败');
    }
    setLoading(false);
  };

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>封禁/解封用户</h2>
      <Card style={{ width: 400 }}>
        <Input
          placeholder="输入用户名"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 16 }}>
          <Button type="primary" danger loading={loading} onClick={() => handleBan(true)}>封禁</Button>
          <Button type="primary" loading={loading} onClick={() => handleBan(false)}>解封</Button>
        </div>
      </Card>
    </div>
  );
} 