import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import ContractInfo from './components/ContractInfo';
import EnvelopeCreator from './components/EnvelopeCreator';
import EnvelopeViewer from './components/EnvelopeViewer';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { TEXT } from './config/text';

// 调试：检查TEXT对象是否正确导入
console.log('TEXT object:', TEXT);
console.log('TEXT.TITLE:', TEXT.TITLE);

const App: React.FC = () => {
  const { account, provider, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const {
    loading,
    createEnvelope,
    claimEnvelope,
    getEnvelope,
    hasUserClaimed,
    getTotalEnvelopes,
    contractAddress
  } = useContract(provider);

  const [totalEnvelopes, setTotalEnvelopes] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  const fetchTotalEnvelopes = useCallback(async () => {
    if (provider) {
      try {
        const total = await getTotalEnvelopes();
        setTotalEnvelopes(total);
      } catch (error) {
        console.error('Failed to fetch total envelopes:', error);
      }
    }
  }, [provider, getTotalEnvelopes]);

  useEffect(() => {
    fetchTotalEnvelopes();
  }, [fetchTotalEnvelopes, lastUpdateTime]);

  const handleCreateEnvelope = async () => {
    try {
      const txHash = await createEnvelope();
      if (txHash) {
        alert((TEXT?.CREATE_SUCCESS || '红包创建成功！\n交易哈希: ') + txHash);
        setLastUpdateTime(Date.now());
      }
    } catch (error: any) {
      console.error('Create envelope failed:', error);
      let errorMessage = TEXT?.CREATE_FAILED || '创建红包失败，请重试';

      if (error.message && error.message.includes('insufficient funds')) {
        errorMessage = TEXT?.INSUFFICIENT_FUNDS || '余额不足';
      } else if (error.message && error.message.includes('user rejected')) {
        errorMessage = TEXT?.USER_CANCELLED || '用户取消了交易';
      } else if (error.message && error.message.includes('connect wallet')) {
        errorMessage = TEXT?.CONNECT_FIRST || '请先连接钱包';
      }

      alert(errorMessage);
    }
  };

  const handleClaimEnvelope = async (envelopeId: number) => {
    try {
      const result = await claimEnvelope(envelopeId);
      if (result) {
        setLastUpdateTime(Date.now());
      }
      return result;
    } catch (error: any) {
      console.error('Claim envelope failed:', error);
      throw error;
    }
  };

  const handleGetEnvelope = useCallback(async (envelopeId: number) => {
    return await getEnvelope(envelopeId);
  }, [getEnvelope]);

  const handleHasUserClaimed = useCallback(async (envelopeId: number, userAddress: string) => {
    return await hasUserClaimed(envelopeId, userAddress);
  }, [hasUserClaimed]);

  const headerStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const headerContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px'
  };

  const titleStyle = {
    color: 'white',
    margin: '20px 0',
    fontSize: '28px',
    fontWeight: 'bold'
  };

  const mainContainerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  };

  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
    gap: '20px',
    margin: '20px 0'
  };

  const welcomeContainerStyle = {
    textAlign: 'center' as const,
    padding: '100px 20px',
    color: 'white'
  };

  const welcomeCardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '50px',
    maxWidth: '600px',
    margin: '0 auto'
  };

  const footerStyle = {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <div style={headerStyle}>
        <div style={headerContainerStyle}>
          <h1 style={titleStyle}>
            {TEXT?.TITLE || '🧧 智能合约红包系统'}
          </h1>
          <WalletConnection
            account={account}
            isConnecting={isConnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>
      </div>

      <div style={mainContainerStyle}>
        {account ? (
          <>
            <ContractInfo
              contractAddress={contractAddress}
              totalEnvelopes={totalEnvelopes}
            />

            <div style={gridContainerStyle} className="grid-responsive">
              <EnvelopeCreator
                onCreateEnvelope={handleCreateEnvelope}
                loading={loading}
              />

              <EnvelopeViewer
                onQueryEnvelope={handleGetEnvelope}
                onClaimEnvelope={handleClaimEnvelope}
                onCheckClaimed={handleHasUserClaimed}
                userAddress={account}
                loading={loading}
              />
            </div>
          </>
        ) : (
          <div style={welcomeContainerStyle}>
            <div style={welcomeCardStyle} className="fade-in">
              <h2 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🧧</h2>
              <h2 style={{ marginBottom: '20px' }}>
                {TEXT?.WELCOME_TITLE || '欢迎使用智能合约红包系统'}
              </h2>
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                marginBottom: '30px' 
              }}>
                {TEXT?.WELCOME_DESC1 || '基于以太坊智能合约的去中心化红包系统'}
                <br />
                {TEXT?.WELCOME_DESC2 || '支持创建红包、随机分配金额、抢红包等功能'}
              </p>
              <div style={{ 
                fontSize: '16px', 
                color: '#ddd', 
                marginBottom: '30px' 
              }}>
                {TEXT?.FEATURE_1 || '🎯 每个红包包含 6 个随机金额的子包'}
                <br />
                {TEXT?.FEATURE_2 || '💰 固定总金额 0.05 ETH'}
                <br />
                {TEXT?.FEATURE_3 || '🎲 完全随机分配，公平公正'}
                <br />
                {TEXT?.FEATURE_4 || '🔒 智能合约保证安全性'}
              </div>
              <p style={{ fontSize: '16px', color: '#f39c12' }}>
                {TEXT?.CONNECT_PROMPT || '请先连接您的 MetaMask 钱包开始使用'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <p>{TEXT?.FOOTER_1 || '🚀 Red Envelope DApp - 基于区块链的智能红包系统'}</p>
        <p>{TEXT?.FOOTER_2 || '⚠️ 仅供学习和测试使用，请在测试网络中进行测试'}</p>
      </div>
    </div>
  );
};

export default App;