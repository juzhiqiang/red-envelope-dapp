import React, { useState, useEffect, useCallback } from 'react';
import { TEXT } from '../config/text';
import './WalletConnection.css';

interface WalletConnectionProps {
  account: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

interface ENSInfo {
  name: string | null;
  avatar: string | null;
}

// 颜色常量
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
];

const WalletConnection: React.FC<WalletConnectionProps> = ({
  account,
  isConnecting,
  onConnect,
  onDisconnect
}) => {
  const [ensInfo, setEnsInfo] = useState<ENSInfo>({ name: null, avatar: null });
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [isLoadingEns, setIsLoadingEns] = useState(false);

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 生成默认头像
  const generateDefaultAvatar = (address: string) => {
    const colorIndex = parseInt(address.slice(-2), 16) % AVATAR_COLORS.length;
    const backgroundColor = AVATAR_COLORS[colorIndex];
    
    return (
      <div
        className="default-avatar"
        style={{ backgroundColor }}
      >
        {address.slice(2, 4)}
      </div>
    );
  };

  // 获取 ENS 信息
  const fetchENSInfo = useCallback(async (address: string) => {
    if (!address || !window.ethereum) return;
    
    setIsLoadingEns(true);
    try {
      const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
      
      try {
        const ensName = await provider.lookupAddress(address);
        if (ensName) {
          try {
            const resolver = await provider.getResolver(ensName);
            let avatar = null;
            if (resolver) {
              avatar = await resolver.getAvatar();
            }
            setEnsInfo({ name: ensName, avatar });
          } catch (avatarError) {
            console.log('Error fetching ENS avatar:', avatarError);
            setEnsInfo({ name: ensName, avatar: null });
          }
        } else {
          setEnsInfo({ name: null, avatar: null });
        }
      } catch (ensError) {
        console.log('Error fetching ENS name:', ensError);
        setEnsInfo({ name: null, avatar: null });
      }
    } catch (error) {
      console.error('Error fetching ENS info:', error);
      setEnsInfo({ name: null, avatar: null });
    } finally {
      setIsLoadingEns(false);
    }
  }, []);

  // 获取可用账户列表
  const fetchAvailableAccounts = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      setAvailableAccounts(accounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAvailableAccounts([]);
    }
  }, []);

  // 切换账户
  const switchAccount = async (selectedAccount: string) => {
    if (!window.ethereum || selectedAccount === account) {
      setShowWalletMenu(false);
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      window.location.reload();
    } catch (error) {
      console.error('Error switching account:', error);
    }
    setShowWalletMenu(false);
  };

  // 处理 ENS 头像加载错误
  const handleAvatarError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (!account) return;
    
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    
    const parent = img.parentNode as HTMLElement;
    if (parent && !parent.querySelector('.default-avatar')) {
      const defaultAvatarDiv = document.createElement('div');
      defaultAvatarDiv.className = 'default-avatar';
      const colorIndex = parseInt(account.slice(-2), 16) % AVATAR_COLORS.length;
      defaultAvatarDiv.style.backgroundColor = AVATAR_COLORS[colorIndex];
      defaultAvatarDiv.textContent = account.slice(2, 4);
      parent.appendChild(defaultAvatarDiv);
    }
  };

  // 当账户变化时获取 ENS 信息
  useEffect(() => {
    if (account) {
      fetchENSInfo(account);
      fetchAvailableAccounts();
    } else {
      setEnsInfo({ name: null, avatar: null });
      setAvailableAccounts([]);
    }
  }, [account, fetchENSInfo, fetchAvailableAccounts]);

  // 处理账户变化
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      setAvailableAccounts(accounts);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showWalletMenu && !target.closest('.wallet-menu-container')) {
        setShowWalletMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWalletMenu]);

  // 渲染头像组件
  const renderAvatar = (address: string, size: number = 32) => {
    if (isLoadingEns && address === account) {
      return (
        <div className="loading-avatar" style={{ width: size, height: size }}>
          <div className="loading-spinner" />
        </div>
      );
    }

    if (ensInfo.avatar && address === account) {
      return (
        <img
          src={ensInfo.avatar}
          alt="ENS Avatar"
          className="avatar"
          style={{ width: size, height: size }}
          onError={handleAvatarError}
        />
      );
    }

    const colorIndex = parseInt(address.slice(-2), 16) % AVATAR_COLORS.length;
    return (
      <div
        className="default-avatar"
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: AVATAR_COLORS[colorIndex],
          fontSize: size > 32 ? '16px' : '14px'
        }}
      >
        {address.slice(2, 4)}
      </div>
    );
  };

  return (
    <div className="wallet-connection-container" style={{
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      padding: '20px',
      gap: '10px',
      position: 'relative'
    }}>
      {account ? (
        <div className="wallet-menu-container" style={{ position: 'relative' }}>
          {/* 已连接状态显示 */}
          <div
            className="wallet-menu-hover"
            onClick={() => setShowWalletMenu(!showWalletMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '25px',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* 头像 */}
            <div style={{ width: '32px', height: '32px', position: 'relative' }}>
              {renderAvatar(account)}
            </div>

            {/* 名称/地址 */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}>
              <span style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {ensInfo.name || formatAddress(account)}
              </span>
              {ensInfo.name && (
                <span style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px'
                }}>
                  {formatAddress(account)}
                </span>
              )}
            </div>

            {/* 下拉箭头 */}
            <div style={{
              marginLeft: '8px',
              transform: showWalletMenu ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '12px'
            }}>
              ▼
            </div>
          </div>

          {/* 下拉菜单 */}
          {showWalletMenu && (
            <div className="wallet-dropdown">
              {/* 当前账户信息 */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px'
                }}>
                  {renderAvatar(account, 40)}
                  <div>
                    <div style={{
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '500'
                    }}>
                      {ensInfo.name || formatAddress(account)}
                    </div>
                    {ensInfo.name && (
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12px',
                        marginTop: '2px'
                      }}>
                        {formatAddress(account)}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '12px'
                }}>
                  🟢 已连接
                </div>
              </div>

              {/* 账户列表 */}
              {availableAccounts.length > 1 && (
                <div>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {TEXT?.SWITCH_ACCOUNT || '切换账户'}
                  </div>
                  {availableAccounts
                    .filter(acc => acc.toLowerCase() !== account.toLowerCase())
                    .slice(0, 3)
                    .map((acc, index) => (
                      <div
                        key={acc}
                        className="account-item"
                        onClick={() => switchAccount(acc)}
                        style={{
                          borderBottom: index === availableAccounts.filter(a => a.toLowerCase() !== account.toLowerCase()).slice(0, 3).length - 1 
                            ? '1px solid rgba(255, 255, 255, 0.1)' 
                            : 'none'
                        }}
                      >
                        {renderAvatar(acc)}
                        <span style={{
                          color: 'white',
                          fontSize: '14px'
                        }}>
                          {formatAddress(acc)}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              {/* 断开连接按钮 */}
              <div
                className="disconnect-hover"
                onClick={() => {
                  onDisconnect();
                  setShowWalletMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  color: '#ff4757',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <span>🔌</span>
                {TEXT?.DISCONNECT || '断开连接'}
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          className="connect-button"
          onClick={onConnect}
          disabled={isConnecting}
          style={{
            background: isConnecting 
              ? 'rgba(46, 213, 115, 0.6)' 
              : 'linear-gradient(135deg, #2ed573, #26d46c)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '25px',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isConnecting && (
            <div className="loading-spinner" style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid white'
            }} />
          )}
          {isConnecting ? (TEXT?.CONNECTING || '连接中...') : (TEXT?.CONNECT_WALLET || '连接 MetaMask')}
        </button>
      )}
    </div>
  );
};

export default WalletConnection;