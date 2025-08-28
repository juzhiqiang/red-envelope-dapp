// src/components/WalletHeader.tsx
import React from 'react';
import AddressAvatar from './AddressAvatar';

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
      
      <style jsx>{`
        .wallet-header {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .connected-wallet {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .wallet-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .balance-info {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .balance-label {
          font-size: 12px;
          color: #666;
          font-weight: 400;
        }
        
        .balance-value {
          font-size: 14px;
          font-weight: 600;
          color: #2e7d32;
          font-family: 'Courier New', monospace;
        }
        
        .wallet-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .disconnect-button {
          background: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        }
        
        .disconnect-button:hover {
          background: rgba(220, 53, 69, 0.2);
          transform: translateY(-1px);
        }
        
        .disconnected-wallet {
          display: flex;
          align-items: center;
        }
        
        .connect-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 140px;
          justify-content: center;
        }
        
        .connect-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .connect-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .connect-button.loading {
          pointer-events: none;
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .wallet-header {
            padding: 12px 16px;
          }
          
          .connected-wallet {
            gap: 12px;
          }
          
          .balance-info {
            display: none;
          }
          
          .connect-button {
            padding: 10px 16px;
            font-size: 13px;
            min-width: 120px;
          }
          
          .action-button {
            padding: 6px 10px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default WalletHeader;