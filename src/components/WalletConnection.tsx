import React, { useState, useEffect, useCallback } from 'react';
import { TEXT } from '../config/text';
import './WalletConnection.css';

interface WalletConnectionProps {
  account: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onAccountChange?: (account: string) => void;
  isDisconnecting?: boolean;
}

interface ENSInfo {
  name: string | null;
  avatar: string | null;
}

interface AccountInfo {
  address: string;
  ensName?: string;
  ensAvatar?: string;
}

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
];

const WalletConnection: React.FC<WalletConnectionProps> = ({
  account,
  isConnecting,
  onConnect,
  onDisconnect,
  onAccountChange,
  isDisconnecting = false
}) => {
  const [ensInfo, setEnsInfo] = useState<ENSInfo>({ name: null, avatar: null });
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<string[]>([]);
  const [accountsInfo, setAccountsInfo] = useState<Map<string, AccountInfo>>(new Map());
  const [isLoadingEns, setIsLoadingEns] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const generateDefaultAvatar = (address: string) => {
    const colorIndex = parseInt(address.slice(-2), 16) % AVATAR_COLORS.length;
    const backgroundColor = AVATAR_COLORS[colorIndex];
    
    return (
      <div className="default-avatar" style={{ backgroundColor }}>
        {address.slice(2, 4)}
      </div>
    );
  };

  const fetchAccountENSInfo = useCallback(async (address: string) => {
    if (!address || !window.ethereum) return null;
    
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
            return { address, ensName, ensAvatar: avatar };
          } catch (avatarError) {
            return { address, ensName, ensAvatar: null };
          }
        }
      } catch (ensError) {
        console.log('Error fetching ENS name:', ensError);
      }
    } catch (error) {
      console.error('Error fetching ENS info for', address, error);
    }
    
    return { address };
  }, []);

  const fetchCurrentAccountENSInfo = useCallback(async (address: string) => {
    if (!address || !window.ethereum) return;
    
    setIsLoadingEns(true);
    try {
      const info = await fetchAccountENSInfo(address);
      if (info) {
        setEnsInfo({ 
          name: info.ensName || null, 
          avatar: info.ensAvatar || null 
        });
        
        setAccountsInfo(prev => {
          const newMap = new Map(prev);
          newMap.set(address, info);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error fetching current account ENS info:', error);
      setEnsInfo({ name: null, avatar: null });
    } finally {
      setIsLoadingEns(false);
    }
  }, [fetchAccountENSInfo]);

  const fetchAvailableAccounts = useCallback(async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      setAvailableAccounts(accounts);
      
      accounts.forEach(async (acc) => {
        if (acc !== account && !accountsInfo.has(acc)) {
          try {
            const info = await fetchAccountENSInfo(acc);
            if (info) {
              setAccountsInfo(prev => {
                const newMap = new Map(prev);
                newMap.set(acc, info);
                return newMap;
              });
            }
          } catch (error) {
            console.log('Background ENS fetch failed for', acc);
          }
        }
      });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAvailableAccounts([]);
    }
  }, [account, accountsInfo, fetchAccountENSInfo]);

  // 纯前端账户切换 - 完全不触发 MetaMask API
  const switchAccount = (selectedAccount: string) => {
    if (selectedAccount === account) {
      setShowWalletMenu(false);
      return;
    }

    console.log('前端直接切换账户:', selectedAccount);
    
    // 直接调用父组件的切换回调
    if (onAccountChange) {
      onAccountChange(selectedAccount);
    }
    
    // 立即更新本地 ENS 状态
    const cachedInfo = accountsInfo.get(selectedAccount);
    if (cachedInfo) {
      setEnsInfo({
        name: cachedInfo.ensName || null,
        avatar: cachedInfo.ensAvatar || null
      });
    } else {
      setEnsInfo({ name: null, avatar: null });
    }
    
    setShowWalletMenu(false);
  };

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

  const getAccountDisplayName = (address: string) => {
    const cached = accountsInfo.get(address);
    return cached?.ensName || formatAddress(address);
  };

  const getAccountAvatar = (address: string) => {
    const cached = accountsInfo.get(address);
    return cached?.ensAvatar;
  };

  useEffect(() => {
    if (account) {
      fetchCurrentAccountENSInfo(account);
      fetchAvailableAccounts();
    } else {
      setEnsInfo({ name: null, avatar: null });
      setAvailableAccounts([]);
    }
  }, [account, fetchCurrentAccountENSInfo, fetchAvailableAccounts]);

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

  const renderAvatar = (address: string, size: number = 32) => {
    if (isLoadingEns && address === account) {
      return (
        <div className="loading-avatar" style={{ width: size, height: size }}>
          <div className="loading-spinner" />
        </div>
      );
    }

    const avatarUrl = address === account ? ensInfo.avatar : getAccountAvatar(address);
    
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt="Avatar"
          className="avatar"
          style={{ width: size, height: size }}
          onError={address === account ? handleAvatarError : undefined}
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

  const handleDisconnect = async () => {
    setShowWalletMenu(false);
    await onDisconnect();
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
          <div
            className="wallet-menu-hover"
            onClick={() => !isDisconnecting && setShowWalletMenu(!showWalletMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '25px',
              cursor: isDisconnecting ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              opacity: isDisconnecting ? 0.7 : 1,
              pointerEvents: isDisconnecting ? 'none' : 'auto'
            }}
          >
            <div style={{ width: '32px', height: '32px', position: 'relative' }}>
              {renderAvatar(account)}
            </div>

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

            {isDisconnecting ? (
              <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="loading-spinner" style={{
                  width: '12px',
                  height: '12px'
                }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  断开中...
                </span>
              </div>
            ) : (
              <>
                {availableAccounts.length > 1 && (
                  <div style={{
                    marginLeft: '4px',
                    background: 'rgba(46, 213, 115, 0.8)',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                  }}>
                    {availableAccounts.length}
                  </div>
                )}
                <div style={{
                  marginLeft: '8px',
                  transform: showWalletMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '12px'
                }}>
                  ▼
                </div>
              </>
            )}
          </div>

          {showWalletMenu && !isDisconnecting && (
            <div className="wallet-dropdown">
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
                  🟢 当前账户
                </div>
              </div>

              {availableAccounts.length > 1 && (
                <div>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '12px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>⚡ 快速切换</span>
                    <span style={{ 
                      background: 'rgba(46, 213, 115, 0.8)',
                      color: 'white',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontWeight: 'bold'
                    }}>
                      无需确认
                    </span>
                  </div>
                  {availableAccounts
                    .filter(acc => acc.toLowerCase() !== account.toLowerCase())
                    .slice(0, 4)
                    .map((acc, index, filteredArray) => {
                      const displayName = getAccountDisplayName(acc);
                      const isENS = displayName !== formatAddress(acc);
                      
                      return (
                        <div
                          key={acc}
                          className="account-item"
                          onClick={() => switchAccount(acc)}
                          style={{
                            borderBottom: index === filteredArray.length - 1
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none',
                            position: 'relative',
                            cursor: 'pointer'
                          }}
                        >
                          {renderAvatar(acc)}
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span style={{
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: isENS ? '500' : 'normal'
                            }}>
                              {displayName}
                            </span>
                            {isENS && (
                              <span style={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                fontSize: '12px'
                              }}>
                                {formatAddress(acc)}
                              </span>
                            )}
                          </div>
                          <div style={{
                            color: 'rgba(46, 213, 115, 0.8)',
                            fontSize: '14px',
                            marginLeft: '8px',
                            fontWeight: 'bold'
                          }}>
                            ⚡
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div style={{
                padding: '8px 16px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}>
                <span>💡</span>
                <span>已授权账户间可以直接切换，无需 MetaMask 确认</span>
              </div>

              <div
                className="disconnect-hover"
                onClick={handleDisconnect}
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