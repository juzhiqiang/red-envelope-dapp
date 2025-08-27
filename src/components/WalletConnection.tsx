import React, { useState, useEffect, useCallback } from 'react';
import { TEXT } from '../config/text';

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
    // 使用地址生成一个简单的几何图案作为默认头像
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
    ];
    const colorIndex = parseInt(address.slice(-2), 16) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    return (
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
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
      // 检查是否支持 ENS
      const provider = new (window as any).ethers.providers.Web3Provider(window.ethereum);
      
      // 尝试获取 ENS 名称
      try {
        const ensName = await provider.lookupAddress(address);
        if (ensName) {
          // 尝试获取 ENS 头像
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
      
      // 刷新页面或触发重新连接
      window.location.reload();
    } catch (error) {
      console.error('Error switching account:', error);
    }
    setShowWalletMenu(false);
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

  return (
    <>
      {/* CSS 样式 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .wallet-menu-hover:hover {
            background-color: rgba(255, 255, 255, 0.1) !important;
          }
          
          .disconnect-hover:hover {
            background-color: rgba(255, 71, 87, 0.1) !important;
          }
          
          .connect-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(46, 213, 115, 0.4);
          }
        `}
      </style>

      <div style={{
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
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* 头像 */}
              <div style={{ width: '32px', height: '32px', position: 'relative' }}>
                {isLoadingEns ? (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  </div>
                ) : ensInfo.avatar ? (
                  <img
                    src={ensInfo.avatar}
                    alt="ENS Avatar"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                    onError={(e) => {
                      // 如果 ENS 头像加载失败，隐藏图片并显示默认头像
                      (e.target as HTMLImageElement).style.display = 'none';
                      const parent = (e.target as HTMLImageElement).parentNode as HTMLElement;
                      if (parent && !parent.querySelector('.default-avatar')) {
                        const defaultAvatarDiv = document.createElement('div');
                        defaultAvatarDiv.className = 'default-avatar';
                        defaultAvatarDiv.style.cssText = `
                          width: 32px;
                          height: 32px;
                          border-radius: 50%;
                          background-color: ${colors[parseInt(account.slice(-2), 16) % colors.length]};
                          display: flex;
                          align-items: center;
                          justify-content: center;
                          color: white;
                          font-size: 14px;
                          font-weight: bold;
                          text-transform: uppercase;
                        `;
                        defaultAvatarDiv.textContent = account.slice(2, 4);
                        parent.appendChild(defaultAvatarDiv);
                      }
                    }}
                  />
                ) : (
                  generateDefaultAvatar(account)
                )}
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
              <div style={{
                position: 'absolute',
                top: '100%',
                right: '0',
                marginTop: '8px',
                background: 'rgba(20, 20, 20, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(10px)',
                minWidth: '280px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
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
                    {ensInfo.avatar ? (
                      <img
                        src={ensInfo.avatar}
                        alt="ENS Avatar"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: colors[parseInt(account.slice(-2), 16) % colors.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          textTransform: 'uppercase'
                        }}
                      >
                        {account.slice(2, 4)}
                      </div>
                    )}
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
                      .slice(0, 3) // 最多显示3个其他账户
                      .map((acc, index) => (
                        <div
                          key={acc}
                          className="wallet-menu-hover"
                          onClick={() => switchAccount(acc)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            borderBottom: index === availableAccounts.filter(a => a.toLowerCase() !== account.toLowerCase()).slice(0, 3).length - 1 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}
                        >
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              backgroundColor: colors[parseInt(acc.slice(-2), 16) % colors.length],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textTransform: 'uppercase'
                            }}
                          >
                            {acc.slice(2, 4)}
                          </div>
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
                    fontWeight: '500',
                    transition: 'background-color 0.2s ease'
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
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 15px rgba(46, 213, 115, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isConnecting && (
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
            )}
            {isConnecting ? (TEXT?.CONNECTING || '连接中...') : (TEXT?.CONNECT_WALLET || '连接 MetaMask')}
          </button>
        )}
      </div>
    </>
  );
};

// 颜色常量
const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
];

export default WalletConnection;