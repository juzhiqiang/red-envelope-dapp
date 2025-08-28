// src/components/UserList.tsx
import React from 'react';
import AddressAvatar from './AddressAvatar';

interface ClaimRecord {
  address: string;
  amount: string;
  timestamp: number;
}

interface UserListProps {
  claimedUsers: ClaimRecord[];
  currentUser?: string;
  className?: string;
}

const UserList: React.FC<UserListProps> = ({ 
  claimedUsers, 
  currentUser, 
  className = '' 
}) => {
  return (
    <div className={`user-list ${className}`}>
      <div className="user-list-header">
        <h3>领取记录 ({claimedUsers.length})</h3>
      </div>
      
      <div className="user-list-content">
        {claimedUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🧧</div>
            <p>还没有人领取红包</p>
          </div>
        ) : (
          <div className="user-items">
            {claimedUsers.map((record, index) => (
              <div 
                key={`${record.address}-${index}`}
                className={`user-item ${
                  currentUser && record.address.toLowerCase() === currentUser.toLowerCase() 
                    ? 'current-user' 
                    : ''
                }`}
              >
                <div className="user-info">
                  <AddressAvatar 
                    address={record.address}
                    size={36}
                    showName={true}
                  />
                </div>
                
                <div className="claim-details">
                  <div className="amount">
                    <span className="amount-value">
                      {parseFloat(record.amount).toFixed(4)} ETH
                    </span>
                    {currentUser && record.address.toLowerCase() === currentUser.toLowerCase() && (
                      <span className="current-user-badge">你</span>
                    )}
                  </div>
                  
                  <div className="timestamp">
                    {new Date(record.timestamp * 1000).toLocaleString('zh-CN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div className="rank-badge">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .user-list {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .user-list-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .user-list-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .user-list-header h3::before {
          content: '📋';
          font-size: 16px;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .user-items {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .user-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
          position: relative;
        }
        
        .user-item:hover {
          background: rgba(255, 255, 255, 0.8);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }
        
        .user-item.current-user {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }
        
        .user-item.current-user .name-text {
          color: white !important;
        }
        
        .user-info {
          flex: 1;
          min-width: 0;
        }
        
        .claim-details {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        
        .amount {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .amount-value {
          font-weight: 600;
          font-size: 16px;
          color: #2e7d32;
        }
        
        .current-user .amount-value {
          color: #fff;
        }
        
        .current-user-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .timestamp {
          font-size: 12px;
          color: #666;
          font-weight: 400;
        }
        
        .current-user .timestamp {
          color: rgba(255, 255, 255, 0.8);
        }
        
        .rank-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
        
        .user-item.current-user .rank-badge {
          background: linear-gradient(45deg, #ffd700, #ffed4a);
          color: #333;
        }
        
        @media (max-width: 768px) {
          .user-list {
            padding: 16px;
          }
          
          .user-item {
            padding: 12px;
          }
          
          .claim-details {
            align-items: center;
          }
          
          .amount {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default UserList;