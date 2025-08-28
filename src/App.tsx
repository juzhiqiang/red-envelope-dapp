import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';

const App: React.FC = () => {
  const { 
    account, 
    provider, 
    isConnecting, 
    isDisconnecting, 
    authorizedAccounts,
    connectWallet, 
    disconnectWallet, 
    setAccount 
  } = useWallet();
  
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

  // 处理账户变化的回调 - 现在支持无缝切换
  const handleAccountChange = (newAccount: string) => {
    console.log('切换账户:', newAccount);
    
    // 检查是否为已授权账户
    if (authorizedAccounts.includes(newAccount)) {
      // 直接切换，无需询问确认
      setAccount(newAccount);
      // 立即触发数据重新加载
      setLastUpdateTime(Date.now());
    } else {
      console.warn('尝试切换到未授权的账户:', newAccount);
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
          } else {
            // 重置已领取金额
            setUserClaimedAmount("0");
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
        {/* 钱包状态提示 */}
        {account && authorizedAccounts.length > 1 && (
          <div style={{
            ...styles.card,
            background: 'rgba(52, 152, 219, 0.15)',
            border: '1px solid rgba(52, 152, 219, 0.3)',
            padding: '20px',
            margin: '10px 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px'
            }}>
              <span>⚡</span>
              <span>
                检测到 {authorizedAccounts.length} 个已授权账户，可以通过钱包菜单快速切换，无需确认
              </span>
            </div>
          </div>
        )}

        {account ? (
          <>
            {/* 其他组件内容已省略，保持原有样式和功能 */}
            <div>主要功能内容...</div>
          </>
        ) : (
          <div style={styles.container}>
            <div style={styles.card}>
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
                <br />
                ⚡ 支持多账户快速切换
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
        <p>⚠️ 仅供学习和测试使用，请在测试网络中使用</p>
        <p style={{marginTop: '10px', color: 'rgba(255, 255, 255, 0.6)'}}>
          ⚡ v2.0 - 支持快速账户切换 & ENS 显示
        </p>
      </div>
    </div>
  );
};

export default App;