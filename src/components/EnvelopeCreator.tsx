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
      console.error('Failed to create envelope:', error);
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
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>🧧 Create Red Envelope</h3>
      <div style={{ marginBottom: '20px', fontSize: '16px', lineHeight: '1.6' }}>
        <p>💰 Total Amount: <strong>0.05 ETH</strong></p>
        <p>📦 Number of Packets: <strong>6 packets</strong></p>
        <p>🎲 Random amount allocation to each packet</p>
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
        {creating ? 'Creating...' : '🚀 Create Envelope'}
      </button>
    </div>
  );
};

export default EnvelopeCreator;