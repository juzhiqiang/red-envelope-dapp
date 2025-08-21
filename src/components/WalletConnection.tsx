import React from 'react';

interface WalletConnectionProps {
  account: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({
  account,
  isConnecting,
  onConnect,
  onDisconnect
}) => {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '20px',
      gap: '10px'
    }}>
      {account ? (
        <>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px',
            color: 'white',
            fontSize: '14px'
          }}>
            {formatAddress(account)}
          </div>
          <button
            onClick={onDisconnect}
            style={{
              background: '#ff4757',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            断开连接
          </button>
        </>
      ) : (
        <button
          onClick={onConnect}
          disabled={isConnecting}
          style={{
            background: '#2ed573',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            opacity: isConnecting ? 0.6 : 1
          }}
        >
          {isConnecting ? '连接中...' : '连接 MetaMask'}
        </button>
      )}
    </div>
  );
};

export default WalletConnection;