import React, { useState } from 'react';

interface EnvelopeCreatorProps {
  onCreateEnvelope: () => Promise<void>;
  loading: boolean;
}

const EnvelopeCreator: React.FC<EnvelopeCreatorProps> = ({ onCreateEnvelope, loading }) => {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateEnvelope();
    } catch (error) {
      console.error('创建红包失败:', error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '30px',
      margin: '20px',
      textAlign: 'center',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>🧧 创建红包</h3>
      <div style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6' }}>
        <p>💰 红包总金额: <strong>0.05 ETH</strong></p>
        <p>📦 红包个数: <strong>6 个</strong></p>
        <p>🎲 随机分配金额到每个红包</p>
      </div>
      <button
        onClick={handleCreate}
        disabled={loading || creating}
        style={{
          background: creating ? '#95a5a6' : '#e74c3c',
          color: 'white',
          border: 'none',
          padding: '15px 30px',
          borderRadius: '25px',
          fontSize: '18px',
          fontWeight: 'bold',
          cursor: (loading || creating) ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          opacity: (loading || creating) ? 0.6 : 1
        }}
      >
        {creating ? '创建中...' : '🚀 创建红包'}
      </button>
    </div>
  );
};

export default EnvelopeCreator;