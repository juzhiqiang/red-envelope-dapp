// src/components/UserList.tsx
import React from 'react';
import AddressAvatar from './AddressAvatar';
import './UserList.css';

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
    </div>
  );
};

export default UserList;