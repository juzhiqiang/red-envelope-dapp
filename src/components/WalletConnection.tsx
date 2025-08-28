import React, { useState, useEffect, useCallback } from 'react';
import { TEXT } from '../config/text';
import './WalletConnection.css';

interface WalletConnectionProps {
  account: string | null;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onAccountChange?: (account: string) => void | boolean;
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
  const [isSwitching, setIsSwitching] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
      // 使用 eth_accounts 而不是 eth_requestAccounts，避免触发权限请求
      const accounts: string[] = await window.ethereum.request({
        method: 'eth_accounts'
      });
      setAvailableAccounts(accounts);
      
      // 批量获取ENS信息，避免重复请求
      const promises = accounts.map(async (acc: string) => {
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
      
      // 等待所有ENS信息获取完成，但不阻塞主流程
      Promise.allSettled(promises).then(() => {
        console.log('所有ENS信息获取完成');
      });
      
    } catch (error) {
      console.error('Error fetching accounts:', error);
      setAvailableAccounts([]);
    }
  }, [account, accountsInfo, fetchAccountENSInfo]);

  // 优化的前端账户切换 - 确保不触发任何 MetaMask API
  const switchAccount = useCallback(async (selectedAccount: string) => {
    if (selectedAccount === account || isSwitching) {
      setShowWalletMenu(false);
      return;
    }

    console.log('🔄 开始切换账户:', selectedAccount);
    
    setIsSwitching(true);
    
    try {
      // 立即关闭菜单，提升用户体验
      setShowWalletMenu(false);
      
      // 检查是否为已授权账户（从当前的 availableAccounts 中检查）
      const isAuthorized = availableAccounts.some(
        addr => addr.toLowerCase() === selectedAccount.toLowerCase()
      );
      
      if (!isAuthorized) {
        console.warn('⚠️ 尝试切换到未授权的账户:', selectedAccount);
        console.warn('当前已授权账户:', availableAccounts);
        return;
      }

      // 调用父组件的切换回调 - 修复类型检查
      if (onAccountChange) {
        try {
          const result = onAccountChange(selectedAccount);
          // 如果返回值是 boolean 且为 false，则表示切换失败
          if (result === false) {
            console.warn('父组件拒绝了账户切换');
            return;
          }
        } catch (error) {
          console.error('账户切换回调执行失败:', error);
          return;
        }
      }
      
      // 立即更新本地 ENS 状态，提升用户体验
      const cachedInfo = accountsInfo.get(selectedAccount);
      if (cachedInfo) {
        setEnsInfo({
          name: cachedInfo.ensName || null,
          avatar: cachedInfo.ensAvatar || null
        });
      } else {
        setEnsInfo({ name: null, avatar: null });
        // 异步获取ENS信息
        fetchCurrentAccountENSInfo(selectedAccount);
      }
      
      console.log('✅ 账户切换完成:', selectedAccount);
      
    } catch (error) {
      console.error('❌ 账户切换失败:', error);
    } finally {
      // 延迟重置切换状态，确保状态更新完成
      setTimeout(() => {
        setIsSwitching(false);
      }, 300);
    }
  }, [account, isSwitching, availableAccounts, accountsInfo, onAccountChange, fetchCurrentAccountENSInfo]);

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
    if ((isLoadingEns && address === account) || (isSwitching && address === account)) {
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
            onClick={() => !isDisconnecting && !isSwitching && setShowWalletMenu(!showWalletMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '25px',
              cursor: (isDisconnecting || isSwitching) ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              opacity: (isDisconnecting || isSwitching) ? 0.7 : 1,
              pointerEvents: (isDisconnecting || isSwitching) ? 'none' : 'auto'
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
            ) : isSwitching ? (
              <div style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="loading-spinner" style={{
                  width: '12px',
                  height: '12px'
                }} />
                <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                  切换中...
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

          {showWalletMenu && !isDisconnecting && !isSwitching && (
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
                          onClick={() => !isSwitching && switchAccount(acc)}
                          style={{
                            borderBottom: index === filteredArray.length - 1
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none',
                            position: 'relative',
                            cursor: isSwitching ? 'not-allowed' : 'pointer',
                            opacity: isSwitching ? 0.6 : 1,
                            pointerEvents: isSwitching ? 'none' : 'auto'
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
                <span>已授权账户间可以直接切换，完全无需 MetaMask 确认</span>
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