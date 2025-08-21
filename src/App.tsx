import React, { useState, useEffect } from 'react';
import WalletConnection from './components/WalletConnection';
import ContractInfo from './components/ContractInfo';
import EnvelopeCreator from './components/EnvelopeCreator';
import EnvelopeViewer from './components/EnvelopeViewer';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';

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

  // 获取红包总数
  const fetchTotalEnvelopes = async () => {
    if (provider) {
      const total = await getTotalEnvelopes();
      setTotalEnvelopes(total);
    }
  };

  useEffect(() => {
    fetchTotalEnvelopes();
  }, [provider, lastUpdateTime]);

  const handleCreateEnvelope = async () => {
    try {
      const txHash = await createEnvelope();
      if (txHash) {
        alert(`红包创建成功！\n交易哈希: ${txHash}`);
        setLastUpdateTime(Date.now()); // 触发数据刷新
      }
    } catch (error: any) {
      console.error('创建红包失败:', error);
      if (error.message?.includes('insufficient funds')) {
        alert('余额不足，需要至少 0.05 ETH + Gas费');
      } else {
        alert('创建红包失败，请重试');
      }
    }
  };

  const handleClaimEnvelope = async (envelopeId: number) => {
    const result = await claimEnvelope(envelopeId);
    if (result) {
      setLastUpdateTime(Date.now()); // 触发数据刷新
    }
    return result;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 20px'
        }}>
          <h1 style={{
            color: 'white',
            margin: '20px 0',
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            🧧 智能合约红包系统
          </h1>
          <WalletConnection
            account={account}
            isConnecting={isConnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {account ? (
          <>
            <ContractInfo 
              contractAddress={contractAddress}
              totalEnvelopes={totalEnvelopes}
            />
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
              gap: '20px',
              margin: '20px 0'
            }}>
              <EnvelopeCreator
                onCreateEnvelope={handleCreateEnvelope}
                loading={loading}
              />
              
              <EnvelopeViewer
                onQueryEnvelope={getEnvelope}
                onClaimEnvelope={handleClaimEnvelope}
                onCheckClaimed={hasUserClaimed}
                userAddress={account}
                loading={loading}
              />
            </div>
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '100px 20px',
            color: 'white'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '50px',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              <h2 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🧧</h2>
              <h2 style={{ marginBottom: '20px' }}>欢迎使用智能合约红包系统</h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
                基于以太坊智能合约的去中心化红包系统<br/>
                支持创建红包、随机分配金额、抢红包等功能
              </p>
              <div style={{ fontSize: '16px', color: '#ddd', marginBottom: '30px' }}>
                🎯 每个红包包含 6 个随机金额的子包<br/>
                💰 固定总金额 0.05 ETH<br/>
                🎲 完全随机分配，公平公正<br/>
                🔒 智能合约保证安全性
              </div>
              <p style={{ fontSize: '16px', color: '#f39c12' }}>
                请先连接您的 MetaMask 钱包开始使用
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px'
      }}>
        <p>🚀 Red Envelope DApp - 基于区块链的智能红包系统</p>
        <p>⚠️ 仅供学习和测试使用，请在测试网络中进行测试</p>
      </div>
    </div>
  );
};

export default App;