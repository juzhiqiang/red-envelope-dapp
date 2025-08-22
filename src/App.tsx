import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { TEXT } from './config/text';

const App: React.FC = () => {
  const { account, provider, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const {
    loading,
    createEnvelope, // 现在是充值功能
    claimEnvelope,
    getRedPacketInfo,
    hasUserClaimed,
    getUserClaimedAmount,
    getContractOwner,
    contractAddress
  } = useContract(provider);

  const [redPacketInfo, setRedPacketInfo] = useState<any>(null);
  const [userHasClaimed, setUserHasClaimed] = useState(false);
  const [userClaimedAmount, setUserClaimedAmount] = useState("0");
  const [contractOwner, setContractOwner] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  const fetchRedPacketInfo = useCallback(async () => {
    if (provider) {
      try {
        const info = await getRedPacketInfo();
        setRedPacketInfo(info);
        
        const owner = await getContractOwner();
        setContractOwner(owner);
        
        if (account) {
          setIsOwner(account.toLowerCase() === owner.toLowerCase());
          
          const claimed = await hasUserClaimed(account);
          setUserHasClaimed(claimed);
          
          if (claimed) {
            const amount = await getUserClaimedAmount(account);
            setUserClaimedAmount(amount);
          }
        }
      } catch (error) {
        console.error('Failed to fetch red packet info:', error);
      }
    }
  }, [provider, getRedPacketInfo, hasUserClaimed, getUserClaimedAmount, getContractOwner, account]);

  useEffect(() => {
    fetchRedPacketInfo();
  }, [fetchRedPacketInfo, lastUpdateTime]);

  const handleDeposit = async () => {
    try {
      const txHash = await createEnvelope();
      if (txHash) {
        alert('充值成功！交易哈希: ' + txHash);
        setLastUpdateTime(Date.now());
      }
    } catch (error: any) {
      console.error('Deposit failed:', error);
      let errorMessage = '充值失败，请重试';

      if (error.message && error.message.includes('insufficient funds')) {
        errorMessage = '余额不足';
      } else if (error.message && error.message.includes('user rejected')) {
        errorMessage = '用户取消了交易';
      } else if (error.message && error.message.includes('connect wallet')) {
        errorMessage = '请先连接钱包';
      } else if (error.message && error.message.includes('Only contract owner')) {
        errorMessage = '只有合约拥有者可以充值';
      }

      alert(errorMessage);
    }
  };

  const handleClaimRedPacket = async () => {
    try {
      const result = await claimEnvelope();
      if (result) {
        alert(`恭喜！您领取了 ${result.amount} ETH\\n交易哈希: ${result.transactionHash}`);
        setLastUpdateTime(Date.now());
      }
    } catch (error: any) {
      console.error('Claim failed:', error);
      let errorMessage = '领取失败，请重试';

      if (error.message && error.message.includes('Already claimed')) {
        errorMessage = '您已经领取过了';
      } else if (error.message && error.message.includes('All red packets claimed')) {
        errorMessage = '红包已被抢完';
      } else if (error.message && error.message.includes('No remaining amount')) {
        errorMessage = '红包余额不足';
      } else if (error.message && error.message.includes('user rejected')) {
        errorMessage = '用户取消了交易';
      }

      alert(errorMessage);
    }
  };

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

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '30px',
    margin: '20px',
    color: 'white'
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

  const buttonStyle = {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '25px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    margin: '10px'
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    background: '#95a5a6',
    cursor: 'not-allowed',
    opacity: 0.6
  };

  const successButtonStyle = {
    ...buttonStyle,
    background: '#2ecc71'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
    }}>
      <div style={headerStyle}>
        <div style={headerContainerStyle}>
          <h1 style={titleStyle}>
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

      <div style={mainContainerStyle}>
        {account ? (
          <>
            {/* 合约信息 */}
            <div style={cardStyle}>
              <h3>📋 合约信息</h3>
              <p><strong>合约地址:</strong> {contractAddress}</p>
              <p><strong>合约拥有者:</strong> {contractOwner}</p>
              {isOwner && (
                <p style={{ color: '#f39c12' }}>
                  ⭐ 您是合约拥有者，可以向红包充值
                </p>
              )}
              {redPacketInfo && (
                <>
                  <p><strong>剩余金额:</strong> {redPacketInfo.remainingAmount} ETH</p>
                  <p><strong>已领取人数:</strong> {redPacketInfo.claimedCount} / {redPacketInfo.maxRecipients}</p>
                  <p><strong>合约余额:</strong> {redPacketInfo.contractBalance} ETH</p>
                  <p><strong>状态:</strong> {redPacketInfo.isFinished ? '已完成' : '进行中'}</p>
                </>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '0' }}>
              {/* 充值区域 - 只有owner可见 */}
              {isOwner && (
                <div style={cardStyle}>
                  <h3>💰 充值红包</h3>
                  <p>作为合约拥有者，您可以向红包充值</p>
                  <p><strong>充值金额:</strong> 0.05 ETH</p>
                  <button
                    onClick={handleDeposit}
                    disabled={loading}
                    style={loading ? disabledButtonStyle : buttonStyle}
                  >
                    {loading ? '充值中...' : '💰 充值 0.05 ETH'}
                  </button>
                </div>
              )}

              {/* 领取红包区域 */}
              <div style={cardStyle}>
                <h3>🎁 领取红包</h3>
                {userHasClaimed ? (
                  <div>
                    <p style={{ color: '#2ecc71', fontSize: '18px', marginBottom: '20px' }}>
                      ✅ 您已成功领取了 {userClaimedAmount} ETH
                    </p>
                    <button
                      disabled
                      style={successButtonStyle}
                    >
                      ✅ 已领取 {userClaimedAmount} ETH
                    </button>
                  </div>
                ) : (
                  <div>
                    <p>点击下方按钮领取您的红包！</p>
                    <p><strong>注意:</strong> 每个地址只能领取一次</p>
                    <button
                      onClick={handleClaimRedPacket}
                      disabled={loading || !redPacketInfo || redPacketInfo.isFinished || redPacketInfo.remainingAmount === "0.0"}
                      style={
                        (loading || !redPacketInfo || redPacketInfo.isFinished || redPacketInfo.remainingAmount === "0.0") 
                          ? disabledButtonStyle 
                          : buttonStyle
                      }
                    >
                      {loading ? '领取中...' : '🎁 领取红包'}
                    </button>
                    {redPacketInfo && redPacketInfo.isFinished && (
                      <p style={{ color: '#e74c3c', marginTop: '10px' }}>❌ 红包已被抢完</p>
                    )}
                    {redPacketInfo && redPacketInfo.remainingAmount === "0.0" && !redPacketInfo.isFinished && (
                      <p style={{ color: '#f39c12', marginTop: '10px' }}>⚠️ 红包余额不足，请等待充值</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 领取记录 */}
            {redPacketInfo && redPacketInfo.claimers && redPacketInfo.claimers.length > 0 && (
              <div style={cardStyle}>
                <h3>📜 领取记录</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {redPacketInfo.claimers.map((claimer: string, index: number) => (
                    <div key={index} style={{ 
                      padding: '12px', 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      margin: '8px 0', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      border: claimer.toLowerCase() === account.toLowerCase() ? '2px solid #f39c12' : 'none'
                    }}>
                      <strong>第 {index + 1} 位:</strong> {claimer}
                      {claimer.toLowerCase() === account.toLowerCase() && (
                        <span style={{ color: '#f39c12', marginLeft: '10px' }}>( 您 )</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div style={cardStyle}>
              <h3>📖 使用说明</h3>
              <div style={{ fontSize: '16px', lineHeight: '1.6' }}>
                <p><strong>如何使用：</strong></p>
                <ol style={{ paddingLeft: '20px' }}>
                  <li>连接您的 MetaMask 钱包</li>
                  <li>如果您是合约拥有者，可以向红包充值 0.05 ETH</li>
                  <li>任何人都可以点击"领取红包"按钮参与抢红包</li>
                  <li>每个地址只能领取一次，金额随机分配</li>
                  <li>最多支持 6 个人领取</li>
                </ol>
                <p style={{ color: '#f39c12', marginTop: '15px' }}>
                  ⚠️ 注意：此为测试版本，请在测试网络中使用
                </p>
              </div>
            </div>
          </>
        ) : (
          <div style={welcomeContainerStyle}>
            <div style={welcomeCardStyle} className="fade-in">
              <h2 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🧧</h2>
              <h2 style={{ marginBottom: '20px' }}>
                欢迎使用智能合约红包系统
              </h2>
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                marginBottom: '30px' 
              }}>
                基于以太坊智能合约的去中心化红包系统
                <br />
                支持随机分配金额、抢红包等功能
              </p>
              <div style={{ 
                fontSize: '16px', 
                color: '#ddd', 
                marginBottom: '30px' 
              }}>
                🎯 支持最多 6 个用户领取
                <br />
                💰 每次充值 0.05 ETH
                <br />
                🎲 完全随机分配，公平公正
                <br />
                🔒 智能合约保证安全性
              </div>
              <p style={{ fontSize: '16px', color: '#f39c12' }}>
                请先连接您的 MetaMask 钱包开始使用
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{
        textAlign: 'center' as const,
        padding: '40px 20px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px'
      }}>
        <p>🚀 Red Packet DApp - 基于区块链的智能红包系统</p>
        <p>⚠️ 仅供学习和测试使用，请在测试网络中进行测试</p>
      </div>
    </div>
  );
};

export default App;