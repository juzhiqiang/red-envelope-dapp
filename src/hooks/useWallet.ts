import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('请安装 MetaMask 钱包!');
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
        console.log('钱包连接成功:', accounts[0]);
      }
    } catch (error: any) {
      console.error('连接钱包失败:', error);
      if (error.code === 4001) {
        alert('用户拒绝了连接请求');
      } else {
        alert('连接钱包失败，请重试');
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    console.log('钱包已断开连接');
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
        }
      } catch (error) {
        console.error('检查连接状态失败:', error);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('账户变化:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          const newProvider = new BrowserProvider(window.ethereum);
          setProvider(newProvider);
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('网络变化:', chainId);
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [checkConnection, disconnectWallet]);

  return {
    account,
    provider,
    isConnecting,
    connectWallet,
    disconnectWallet,
    checkConnection
  };
};