import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';
import { TEXT } from '../config/text';

export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    console.log(TEXT.WALLET_DISCONNECTED);
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
        console.error('Check connection failed:', error);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
          const newProvider = new BrowserProvider(window.ethereum);
          setProvider(newProvider);
        }
      };

      const handleChainChanged = (chainId: string) => {
        console.log('Chain changed:', chainId);
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