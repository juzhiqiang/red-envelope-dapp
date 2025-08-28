import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';

const App: React.FC = () => {
  const { account, provider, isConnecting, isDisconnecting, connectWallet, disconnectWallet, setAccount } = useWallet();
  const {
    loading,
    createEnvelope,
    claimEnvelope,
    getRedPacketInfo,
    hasUserClaimed,
    getUserClaimedAmount,
    getContractOwner,
    getContractConstants,
    contractAddress
  } = useContract(provider);

  const [redPacketInfo, setRedPacketInfo] = useState<any>(null);
  const [userHasClaimed, setUserHasClaimed] = useState(false);
  const [userClaimedAmount, setUserClaimedAmount] = useState("0");
  const [contractOwner, setContractOwner] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [contractConstants, setContractConstants] = useState({ totalAmount: "0.05", maxRecipients: 6 });
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // 处理账户变化的回调
  const handleAccountChange = (newAccount: string) => {
    if (setAccount) {
      setAccount(newAccount);
      // 触发数据重新加载
      setLastUpdateTime(Date.now());
    }
  };

  const fetchRedPacketInfo = useCallback(async () => {
    if (provider) {
      try {
        const info = await getRedPacketInfo();
        setRedPacketInfo(info);
        
        const owner = await getContractOwner();
        setContractOwner(owner);
        
        const constants = await getContractConstants();
        setContractConstants(constants);
        
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
  }, [provider, getRedPacketInfo, hasUserClaimed, getUserClaimedAmount, getContractOwner, getContractConstants, account]);

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

  // 计算进度百分比
  const getProgressPercentage = () => {
    if (!redPacketInfo || !contractConstants.totalAmount) return 0;
    const distributed = parseFloat(redPacketInfo.distributedAmount || "0");
    const total = parseFloat(contractConstants.totalAmount);
    return total > 0 ? (distributed / total) * 100 : 0;
  };

  // 样式定义
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    backgroundPattern: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.05) 0%, transparent 50%)
      `,
      pointerEvents: 'none' as const
    },
    header: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      position: 'relative' as const,
      zIndex: 10
    },
    headerContainer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    title: {
      color: 'white',
      margin: '20px 0',
      fontSize: '32px',
      fontWeight: 'bold',
      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
      background: 'linear-gradient(45deg, #fff, #f0f0f0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    mainContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      position: 'relative' as const,
      zIndex: 1
    },
    card: {
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      padding: '30px',
      margin: '20px 0',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    overviewCard: {
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.1) 100%)',
      borderRadius: '24px',
      padding: '40px',
      marginBottom: '30px'
    },
    cardTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '25px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      marginTop: '25px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: '16px',
      padding: '25px',
      textAlign: 'center' as const,
      border: '1px solid rgba(255, 255, 255, 0.2)',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      marginBottom: '8px',
      background: 'linear-gradient(45deg, #fff, #f0f0f0)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    statLabel: {
      fontSize: '14px',
      opacity: 0.9,
      fontWeight: '500'
    },
    progressContainer: {
      marginTop: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.08)',
      borderRadius: '16px'
    },
    progressHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px'
    },
    progressBar: {
      width: '100%',
      height: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '6px',
      overflow: 'hidden',
      position: 'relative' as const
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #00f260, #0575e6)',
      borderRadius: '6px',
      transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const
    },
    actionGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '25px',
      margin: '25px 0'
    },
    button: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '16px 32px',
      borderRadius: '16px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
      margin: '8px'
    },
    depositButton: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    claimButton: {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
    },
    successButton: {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      color: '#2c3e50'
    },
    disabledButton: {
      background: 'rgba(149, 165, 166, 0.6)',
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none'
    },
    recordsContainer: {
      maxHeight: '320px',
      overflowY: 'auto' as const,
      padding: '10px'
    },
    recordItem: {
      padding: '16px',
      background: 'rgba(255, 255, 255, 0.1)',
      margin: '10px 0',
      borderRadius: '12px',
      fontSize: '14px',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      transition: 'all 0.3s ease',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    userRecord: {
      border: '2px solid #f39c12',
      background: 'rgba(243, 156, 18, 0.15)',
      boxShadow: '0 0 20px rgba(243, 156, 18, 0.3)'
    },
    welcomeContainer: {
      textAlign: 'center' as const,
      padding: '80px 20px',
      color: 'white'
    },
    welcomeCard: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(25px)',
      borderRadius: '30px',
      padding: '60px',
      maxWidth: '700px',
      margin: '0 auto',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
    },
    footer: {
      textAlign: 'center' as const,
      padding: '50px 20px',
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '14px',
      background: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backgroundPattern} />
      
      <div style={styles.header}>
        <div style={styles.headerContainer}>
          <h1 style={styles.title}>
            🧧 智能合约红包系统
          </h1>
          <WalletConnection
            account={account}
            isConnecting={isConnecting}
            isDisconnecting={isDisconnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
            onAccountChange={handleAccountChange}
          />
        </div>
      </div>

      <div style={styles.mainContainer}>
        {account ? (
          <>
            {/* 红包总览信息 */}
            <div style={styles.overviewCard}>
              <h3 style={styles.cardTitle}>
                📊 红包总览
              </h3>
              
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: '#f39c12'}}>
                    {contractConstants.totalAmount} ETH
                  </div>
                  <div style={styles.statLabel}>初始总额度</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: '#2ecc71'}}>
                    {redPacketInfo?.distributedAmount || "0"} ETH
                  </div>
                  <div style={styles.statLabel}>已分配金额</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: '#3498db'}}>
                    {redPacketInfo?.remainingAmount || "0"} ETH
                  </div>
                  <div style={styles.statLabel}>剩余金额</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{...styles.statValue, color: '#e74c3c'}}>
                    {redPacketInfo?.claimedCount || 0} / {contractConstants.maxRecipients}
                  </div>
                  <div style={styles.statLabel}>参与人数</div>
                </div>
              </div>
              
              {/* 进度条 */}
              <div style={styles.progressContainer}>
                <div style={styles.progressHeader}>
                  <span style={{fontWeight: 'bold'}}>分配进度</span>
                  <span style={{fontWeight: 'bold', color: '#00f2fe'}}>{getProgressPercentage().toFixed(1)}%</span>
                </div>
                <div style={styles.progressBar}>
                  <div 
                    style={{
                      ...styles.progressFill,
                      width: `${getProgressPercentage()}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 合约信息 */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                📋 合约信息
              </h3>
              <div style={{fontSize: '16px', lineHeight: '1.8'}}>
                <p><strong>合约地址:</strong> <code style={{background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px'}}>{contractAddress}</code></p>
                <p><strong>合约拥有者:</strong> <code style={{background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px'}}>{contractOwner}</code></p>
                {isOwner && (
                  <div style={{
                    background: 'rgba(243, 156, 18, 0.15)',
                    border: '1px solid rgba(243, 156, 18, 0.3)',
                    borderRadius: '12px',
                    padding: '15px',
                    marginTop: '15px'
                  }}>
                    <p style={{ color: '#f39c12', margin: 0, fontWeight: 'bold' }}>
                      ⭐ 您是合约拥有者，可以向红包充值
                    </p>
                  </div>
                )}
                {redPacketInfo && (
                  <>
                    <p><strong>合约余额:</strong> {redPacketInfo.contractBalance} ETH</p>
                    <p><strong>状态:</strong> 
                      <span style={{
                        color: redPacketInfo.isFinished ? '#2ecc71' : '#f39c12',
                        fontWeight: 'bold',
                        marginLeft: '8px'
                      }}>
                        {redPacketInfo.isFinished ? '✅ 已完成' : '🔄 进行中'}
                      </span>
                    </p>
                  </>
                )}
              </div>
            </div>

            <div style={styles.actionGrid}>
              {/* 充值区域 - 只有owner可见 */}
              {isOwner && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>
                    💰 充值红包
                  </h3>
                  <div style={{fontSize: '16px', lineHeight: '1.6', marginBottom: '25px'}}>
                    <p>作为合约拥有者，您可以向红包充值</p>
                    <p><strong>充值金额:</strong> {contractConstants.totalAmount} ETH</p>
                    <div style={{
                      background: 'rgba(52, 152, 219, 0.15)',
                      border: '1px solid rgba(52, 152, 219, 0.3)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '14px'
                    }}>
                      💡 提示：每次充值会增加红包池的总金额
                    </div>
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={loading}
                    style={loading ? 
                      {...styles.button, ...styles.disabledButton} : 
                      {...styles.button, ...styles.depositButton}
                    }
                  >
                    {loading ? '充值中...' : `💰 充值 ${contractConstants.totalAmount} ETH`}
                  </button>
                </div>
              )}

              {/* 领取红包区域 */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  🎁 领取红包
                </h3>
                {userHasClaimed ? (
                  <div style={{textAlign: 'center'}}>
                    <div style={{
                      background: 'rgba(46, 204, 113, 0.15)',
                      border: '1px solid rgba(46, 204, 113, 0.3)',
                      borderRadius: '12px',
                      padding: '20px',
                      marginBottom: '20px'
                    }}>
                      <p style={{ color: '#2ecc71', fontSize: '18px', margin: '0 0 10px 0', fontWeight: 'bold' }}>
                        ✅ 领取成功！
                      </p>
                      <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                        {userClaimedAmount} ETH
                      </p>
                    </div>
                    <button
                      disabled
                      style={{...styles.button, ...styles.successButton}}
                    >
                      ✅ 已领取 {userClaimedAmount} ETH
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize: '16px', lineHeight: '1.6', marginBottom: '20px'}}>
                      <p>点击下方按钮领取您的红包！</p>
                      <div style={{
                        background: 'rgba(52, 152, 219, 0.15)',
                        border: '1px solid rgba(52, 152, 219, 0.3)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '14px',
                        marginBottom: '10px'
                      }}>
                        💡 金额随机分配，最后一位用户将获得所有剩余金额
                      </div>
                      <p style={{fontSize: '14px'}}><strong>注意:</strong> 每个地址只能领取一次</p>
                    </div>
                    <button
                      onClick={handleClaimRedPacket}
                      disabled={loading || !redPacketInfo || redPacketInfo.isFinished || redPacketInfo.remainingAmount === "0.0"}
                      style={
                        (loading || !redPacketInfo || redPacketInfo.isFinished || redPacketInfo.remainingAmount === "0.0") 
                          ? {...styles.button, ...styles.disabledButton}
                          : {...styles.button, ...styles.claimButton}
                      }
                    >
                      {loading ? '领取中...' : '🎁 领取红包'}
                    </button>
                    {redPacketInfo && redPacketInfo.isFinished && (
                      <p style={{ color: '#e74c3c', marginTop: '15px', fontWeight: 'bold' }}>❌ 红包已被抢完</p>
                    )}
                    {redPacketInfo && redPacketInfo.remainingAmount === "0.0" && !redPacketInfo.isFinished && (
                      <p style={{ color: '#f39c12', marginTop: '15px', fontWeight: 'bold' }}>⚠️ 红包余额不足，请等待充值</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 领取记录 */}
            {redPacketInfo && redPacketInfo.claimers && redPacketInfo.claimers.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  📜 领取记录
                </h3>
                <div style={styles.recordsContainer}>
                  {redPacketInfo.claimers.map((claimer: string, index: number) => (
                    <div 
                      key={index} 
                      style={
                        claimer.toLowerCase() === account.toLowerCase() 
                          ? {...styles.recordItem, ...styles.userRecord}
                          : styles.recordItem
                      }
                    >
                      <div>
                        <strong>第 {index + 1} 位</strong>
                        {claimer.toLowerCase() === account.toLowerCase() && (
                          <span style={{ color: '#f39c12', marginLeft: '10px', fontWeight: 'bold' }}>( 您 )</span>
                        )}
                      </div>
                      <code style={{
                        background: 'rgba(255,255,255,0.1)', 
                        padding: '4px 8px', 
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}>
                        {claimer}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 使用说明 */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>
                📖 使用说明
              </h3>
              <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
                <p><strong>如何使用：</strong></p>
                <ol style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                  <li style={{marginBottom: '8px'}}>连接您的 MetaMask 钱包</li>
                  <li style={{marginBottom: '8px'}}>如果您是合约拥有者，可以向红包充值 {contractConstants.totalAmount} ETH</li>
                  <li style={{marginBottom: '8px'}}>任何人都可以点击"领取红包"按钮参与抢红包</li>
                  <li style={{marginBottom: '8px'}}>每个地址只能领取一次，金额随机分配</li>
                  <li style={{marginBottom: '8px'}}>最多支持 {contractConstants.maxRecipients} 个人领取</li>
                  <li style={{marginBottom: '8px'}}>最后一位用户将获得所有剩余金额</li>
                </ol>
                <div style={{
                  background: 'rgba(231, 76, 60, 0.15)',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '12px',
                  padding: '15px'
                }}>
                  <p style={{ color: '#e74c3c', margin: 0, fontWeight: 'bold' }}>
                    ⚠️ 注意：此为测试版本，请在测试网络中使用
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={styles.welcomeContainer}>
            <div style={styles.welcomeCard}>
              <h2 style={{ fontSize: '64px', margin: '0 0 30px 0' }}>🧧</h2>
              <h2 style={{ marginBottom: '25px', fontSize: '32px' }}>
                欢迎使用智能合约红包系统
              </h2>
              <p style={{ 
                fontSize: '20px', 
                lineHeight: '1.6', 
                marginBottom: '35px',
                opacity: 0.9
              }}>
                基于以太坊智能合约的去中心化红包系统
                <br />
                支持随机分配金额、抢红包等功能
              </p>
              <div style={{ 
                fontSize: '18px', 
                color: 'rgba(255,255,255,0.9)', 
                marginBottom: '40px',
                lineHeight: '1.8'
              }}>
                🎯 支持最多 6 个用户领取
                <br />
                💰 初始总额度 0.05 ETH
                <br />
                🎲 完全随机分配，公平公正
                <br />
                🔒 智能合约保证安全性
              </div>
              <p style={{ fontSize: '18px', color: '#f39c12', fontWeight: 'bold' }}>
                请先连接您的 MetaMask 钱包开始使用
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <p>🚀 Red Packet DApp - 基于区块链的智能红包系统</p>
        <p>⚠️ 仅供学习和测试使用，请在测试网络中进行测试</p>
      </div>
    </div>
  );
};

export default App;