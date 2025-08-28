// src/components/WalletHeader.tsx
import React from 'react';
import AddressAvatar from './AddressAvatar';
import './WalletHeader.css';

interface WalletHeaderProps {
  address: string | null;
  balance?: string;
  isConnecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

const WalletHeader: React.FC<WalletHeaderProps> = ({
  address,
  balance,
  isConnecting = false,
  onConnect,
  onDisconnect,
  className = ''
}) => {
  const handleConnect = () => {
    if (onConnect) {
      onConnect();
    }
  };

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
    }
  };

  return (
    <div className={`wallet-header ${className}`}>
      {address ? (
        <div className="connected-wallet">
          <div className="wallet-info">
            <AddressAvatar 
              address={address}
              size={36}
              showName={true}
            />
            
            {balance && (
              <div className="balance-info">
                <span className="balance-label">余额:</span>
                <span className="balance-value">
                  {parseFloat(balance).toFixed(4)} ETH
                </span>
              </div>
            )}
          </div>
          
          <div className="wallet-actions">
            <button 
              className="action-button disconnect-button"
              onClick={handleDisconnect}
              title="断开连接"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m6 16l5-5-5-5m5 5H9" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              断开连接
            </button>
          </div>
        </div>
      ) : (
        <div className="disconnected-wallet">
          <button 
            className={`connect-button ${isConnecting ? 'loading' : ''}`}
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <>
                <div className="loading-spinner" />
                连接中...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M20 7h-9a3 3 0 100 6h9m-9-6V4a2 2 0 00-2-2H5a2 2 0 00-2 2v16a2 2 0 002 2h4a2 2 0 002-2v-3" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                连接钱包
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletHeader;