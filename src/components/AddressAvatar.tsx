// src/components/AddressAvatar.tsx
import React, { useState } from 'react';
import useENS from '../hooks/useENS';
import { generateGradientAvatar, formatAddress } from '../utils/avatarGenerator';
import './AddressAvatar.css';

interface AddressAvatarProps {
  address: string;
  size?: number;
  showName?: boolean;
  className?: string;
}

const AddressAvatar: React.FC<AddressAvatarProps> = ({
  address,
  size = 40,
  showName = true,
  className = ''
}) => {
  const { name, avatar, isLoading } = useENS(address);
  const [avatarError, setAvatarError] = useState(false);

  // 处理头像加载错误
  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // 获取显示的头像
  const getDisplayAvatar = () => {
    if (avatar && !avatarError) {
      return avatar;
    }
    return generateGradientAvatar(address);
  };

  // 获取显示的名称
  const getDisplayName = () => {
    return name || formatAddress(address);
  };

  return (
    <div className={`address-avatar ${className}`}>
      <div className="avatar-container" style={{ width: size, height: size }}>
        {isLoading ? (
          <div 
            className="avatar-skeleton" 
            style={{ 
              width: size, 
              height: size
            }}
          />
        ) : (
          <img
            src={getDisplayAvatar()}
            alt={name || 'Avatar'}
            className="avatar-image"
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
            onError={handleAvatarError}
          />
        )}
      </div>
      
      {showName && (
        <div className="address-name">
          {isLoading ? (
            <div 
              className="name-skeleton"
              style={{
                width: '80px',
                height: '16px'
              }}
            />
          ) : (
            <span 
              className={`name-text ${name ? 'ens-name' : 'wallet-address'}`}
              title={address}
            >
              {getDisplayName()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressAvatar;