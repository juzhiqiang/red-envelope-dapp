// src/components/AddressAvatar.tsx
import React, { useState } from 'react';
import useENS from '../hooks/useENS';
import { generateGradientAvatar, formatAddress, isValidImageUrl } from '../utils/avatarGenerator';

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
              height: size,
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite'
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
                height: '16px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '4px',
                animation: 'shimmer 1.5s infinite',
                marginTop: '8px'
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
      
      <style jsx>{`
        .address-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .avatar-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-image {
          transition: all 0.2s ease;
        }
        
        .avatar-image:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .address-name {
          text-align: center;
          min-height: 20px;
        }
        
        .name-text {
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        
        .ens-name {
          color: #007bff;
          font-weight: 600;
        }
        
        .wallet-address {
          color: #6c757d;
          font-family: 'Courier New', monospace;
        }
        
        .name-text:hover {
          opacity: 0.8;
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default AddressAvatar;