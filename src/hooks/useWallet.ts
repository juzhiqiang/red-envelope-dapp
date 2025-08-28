import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { TEXT } from '../config/text';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert(TEXT.INSTALL_METAMASK);
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length > 0) {
        const browserProvider = new BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        setAccount(accounts[0]);
        console.log(TEXT.WALLET_CONNECTED, accounts[0]);
      }
    } catch (error: any) {
      console.error('Connect wallet failed:', error);
      if (error.code === 4001) {
        alert(TEXT.USER_REJECTED);
      } else {
        alert(TEXT.CONNECT_FAILED);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    setIsDisconnecting(true);
    
    try {
      // 方法1: 尝试撤销权限（如果支持的话）
      if (window.ethereum && window.ethereum.request) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (revokeError) {
          // 如果不支持撤销权限，继续执行其他清理操作
          console.log('Revoke permissions not supported:', revokeError);
        }
      }

      // 方法2: 清理本地状态
      setAccount(null);
      setProvider(null);
      
      // 方法3: 清理本地存储（如果有的话）
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem('walletconnect');
        localStorage.removeItem('WALLETCONNECT_DEEPLINK_CHOICE');
        // 清理可能的其他钱包相关存储
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('wallet') || key.includes('metamask') || key.includes('ethereum'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }

      // 方法4: 通知用户手动断开（如果需要）
      console.log(TEXT.WALLET_DISCONNECTED);
      
      // 可选：显示断开成功的消息
      setTimeout(() => {
        console.log('钱包已断开连接');
      }, 100);
      
    } catch (error) {
      console.error('Disconnect wallet error:', error);
      // 即使出错，也要清理本地状态
      setAccount(null);
      setProvider(null);
    } finally {
      setIsDisconnecting(false);
    }
  }, []);

  const checkConnection = useCallback(async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts.length > 0) {
          const browserProvider = new BrowserProvider(window.ethereum);
          setProvider(browserProvider);
          setAccount(accounts[0]);
        } else {
          // 如果没有账户，确保清理状态
          setAccount(null);
          setProvider(null);
        }
      } catch (error) {
        console.error('Check connection failed:', error);
        // 检查连接失败时也清理状态
        setAccount(null);
        setProvider(null);
      }
    }
  }, []);

  // 手动设置账户的方法（用于切换账户）
  const updateAccount = useCallback((newAccount: string) => {
    if (newAccount !== account) {
      setAccount(newAccount);
      // 更新 provider 以确保使用新账户
      if (window.ethereum) {
        const newProvider = new BrowserProvider(window.ethereum);
        setProvider(newProvider);
      }
    }
  }, [account]);

  // 强制断开连接（清理所有状态）
  const forceDisconnect = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setIsConnecting(false);
    setIsDisconnecting(false);
    
    // 清理本地存储
    if (typeof Storage !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('wallet') || key.includes('metamask') || key.includes('ethereum'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    console.log('强制断开连接完成');
  }, []);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          // 如果没有账户了，执行断开连接
          setAccount(null);
          setProvider(null);
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          // 添加空值检查
          if (window.ethereum) {
            const newProvider = new BrowserProvider(window.ethereum);
            setProvider(newProvider);
          }
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId);
        // 链变化时重新检查连接而不是直接刷新页面
        checkConnection();
      };

      const handleDisconnect = (error: any) => {
        console.log('MetaMask disconnected:', error);
        setAccount(null);
        setProvider(null);
      };

      // 添加更多的事件监听器
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('disconnect', handleDisconnect);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
          window.ethereum.removeListener('disconnect', handleDisconnect);
        }
      };
    }
  }, [checkConnection, account]);

  return {
    account,
    provider,
    isConnecting,
    isDisconnecting,
    connectWallet,
    disconnectWallet,
    forceDisconnect,
    checkConnection,
    setAccount: updateAccount // 导出 setAccount 方法用于手动切换账户
  };
};