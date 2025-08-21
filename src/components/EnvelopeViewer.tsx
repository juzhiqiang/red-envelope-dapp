import React, { useState } from 'react';
import { EnvelopeInfo, ClaimResult } from '../types';
import { TEXT } from '../config/text';

interface EnvelopeViewerProps {
  onQueryEnvelope: (id: number) => Promise<EnvelopeInfo | null>;
  onClaimEnvelope: (id: number) => Promise<ClaimResult | null>;
  onCheckClaimed: (id: number, address: string) => Promise<boolean>;
  userAddress: string | null;
  loading: boolean;
}

const EnvelopeViewer: React.FC<EnvelopeViewerProps> = ({
  onQueryEnvelope,
  onClaimEnvelope,
  onCheckClaimed,
  userAddress,
  loading
}) => {
  const [envelopeId, setEnvelopeId] = useState<string>('');
  const [envelopeInfo, setEnvelopeInfo] = useState<EnvelopeInfo | null>(null);
  const [hasClaimed, setHasClaimed] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<ClaimResult | null>(null);
  const [claiming, setClaiming] = useState(false);

  const handleQuery = async () => {
    if (!envelopeId || !userAddress) return;
    
    const id = parseInt(envelopeId);
    if (isNaN(id) || id < 0) {
      alert(TEXT?.INVALID_ID || '请输入有效的红包ID');
      return;
    }

    try {
      const [info, claimed] = await Promise.all([
        onQueryEnvelope(id),
        onCheckClaimed(id, userAddress)
      ]);
      
      setEnvelopeInfo(info);
      setHasClaimed(claimed);
      setClaimResult(null);
    } catch (error) {
      console.error('Query envelope failed:', error);
      alert(TEXT?.QUERY_FAILED || '查询红包失败，请检查红包ID是否正确');
    }
  };

  const handleClaim = async () => {
    if (!envelopeInfo || !userAddress) return;
    
    setClaiming(true);
    try {
      const result = await onClaimEnvelope(envelopeInfo.id);
      if (result) {
        setClaimResult(result);
        setHasClaimed(true);
        const updatedInfo = await onQueryEnvelope(envelopeInfo.id);
        setEnvelopeInfo(updatedInfo);
      }
    } catch (error: any) {
      console.error('Claim envelope failed:', error);
      if (error.message && error.message.includes('Already claimed')) {
        alert(TEXT?.ALREADY_CLAIMED_ERROR || '您已经抢过这个红包了！');
      } else if (error.message && error.message.includes('Creator cannot claim')) {
        alert(TEXT?.CREATOR_CANNOT_CLAIM || '创建者不能抢自己的红包！');
      } else if (error.message && error.message.includes('No packets remaining')) {
        alert(TEXT?.NO_PACKETS || '红包已被抢完！');
      } else {
        alert(TEXT?.CLAIM_FAILED || '抢红包失败，请重试');
      }
    } finally {
      setClaiming(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const canClaim = envelopeInfo && 
    envelopeInfo.isActive && 
    envelopeInfo.remainingPackets > 0 && 
    !hasClaimed && 
    userAddress && 
    envelopeInfo.creator.toLowerCase() !== userAddress.toLowerCase();

  const getClaimButtonText = () => {
    if (claiming) return TEXT?.CLAIMING || '抢红包中...';
    if (envelopeInfo?.remainingPackets === 6) return '🎉 开抢！第一个红包';
    return `🎉 抢红包 (还剩${envelopeInfo?.remainingPackets}个)`;
  };

  const getStatusMessage = () => {
    if (!envelopeInfo) return '';
    
    if (!envelopeInfo.isActive) {
      return TEXT?.ENVELOPE_ENDED || '❌ 红包已被抢完';
    }
    
    if (envelopeInfo.remainingPackets === 0) {
      return TEXT?.FULLY_CLAIMED || '❌ 红包已被抢光了';
    }
    
    if (envelopeInfo.creator.toLowerCase() === userAddress?.toLowerCase()) {
      return TEXT?.CANNOT_CLAIM_OWN || '❌ 不能抢自己创建的红包';
    }
    
    return TEXT?.CANNOT_CLAIM || '❌ 无法抢取';
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '30px',
      margin: '20px',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
        {TEXT?.QUERY_ENVELOPE || '🔍 查询红包'}
      </h3>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="number"
          placeholder={TEXT?.ENTER_ID || '输入红包ID'}
          value={envelopeId}
          onChange={(e) => setEnvelopeId(e.target.value)}
          style={{
            padding: '10px 15px',
            borderRadius: '10px',
            border: 'none',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '16px',
            flex: 1
          }}
        />
        <button
          onClick={handleQuery}
          disabled={loading || !envelopeId || !userAddress}
          style={{
            background: '#3742fa',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            cursor: (!loading && envelopeId && userAddress) ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            opacity: (!loading && envelopeId && userAddress) ? 1 : 0.6
          }}
        >
          {TEXT?.QUERY_BUTTON || '查询'}
        </button>
      </div>

      {envelopeInfo && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>
            {TEXT?.ENVELOPE_INFO || '📦 红包信息'}
          </h4>
          
          {/* 红包进度条 */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '5px' 
            }}>
              <span style={{ fontSize: '14px' }}>抢取进度</span>
              <span style={{ fontSize: '14px' }}>
                {envelopeInfo.totalPackets - envelopeInfo.remainingPackets}/{envelopeInfo.totalPackets}
              </span>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              height: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: envelopeInfo.isActive ? '#2ed573' : '#ff4757',
                height: '100%',
                width: `${((envelopeInfo.totalPackets - envelopeInfo.remainingPackets) / envelopeInfo.totalPackets) * 100}%`,
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.ENVELOPE_ID || '红包ID:'}</strong> {envelopeInfo.id}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.CREATOR || '创建者:'}</strong> {formatAddress(envelopeInfo.creator)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{(TEXT?.TOTAL_AMOUNT || '红包总金额:').replace(':', '')}</strong> {envelopeInfo.totalAmount} ETH
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.REMAINING_AMOUNT || '剩余金额:'}</strong> {envelopeInfo.remainingAmount} ETH
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.REMAINING_PACKETS || '剩余红包数:'}</strong> 
              <span style={{ 
                color: envelopeInfo.remainingPackets > 0 ? '#2ed573' : '#ff4757',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}>
                {envelopeInfo.remainingPackets}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.STATUS || '状态:'}</strong>
              <span style={{ 
                color: envelopeInfo.isActive ? '#2ed573' : '#ff4757',
                fontWeight: 'bold' 
              }}>
                {envelopeInfo.isActive ? (TEXT?.ACTIVE || ' 🟢 可抢取') : (TEXT?.ENDED || ' 🔴 已抢完')}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.CREATED_TIME || '创建时间:'}</strong> {formatTime(envelopeInfo.createdAt)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{TEXT?.CLAIMED_COUNT || '已抢取人数:'}</strong> {envelopeInfo.claimedBy.length}
            </div>
          </div>

          {envelopeInfo.claimedBy.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <strong>{TEXT?.CLAIM_RECORDS || '抢取记录:'}</strong>
              <div style={{ marginTop: '8px' }}>
                {envelopeInfo.claimedBy.map((address, index) => (
                  <div key={index} style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    marginBottom: '5px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{index + 1}. {formatAddress(address)}</span>
                    <span style={{ color: '#2ed573' }}>✓ 已抢到</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            {hasClaimed ? (
              <div style={{
                background: 'rgba(46, 213, 115, 0.2)',
                border: '1px solid #2ed573',
                borderRadius: '10px',
                padding: '15px',
                color: '#2ed573'
              }}>
                {TEXT?.ALREADY_CLAIMED || '✅ 您已经抢过这个红包了'}
              </div>
            ) : canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                style={{
                  background: claiming ? '#95a5a6' : '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: claiming ? 'not-allowed' : 'pointer',
                  opacity: claiming ? 0.6 : 1,
                  transform: claiming ? 'none' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {getClaimButtonText()}
              </button>
            ) : (
              <div style={{
                background: 'rgba(255, 71, 87, 0.2)',
                border: '1px solid #ff4757',
                borderRadius: '10px',
                padding: '15px',
                color: '#ff4757'
              }}>
                {getStatusMessage()}
              </div>
            )}
          </div>

          {claimResult && (
            <div style={{
              background: 'rgba(46, 213, 115, 0.2)',
              border: '1px solid #2ed573',
              borderRadius: '10px',
              padding: '20px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2ed573' }}>
                {TEXT?.CLAIM_SUCCESS || '🎊 恭喜！抢红包成功！'}
              </h4>
              <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '10px', color: '#2ed573' }}>
                💰 {claimResult.amount} ETH
              </div>
              <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                {TEXT?.TRANSACTION_HASH || '交易哈希: '}{claimResult.transactionHash.slice(0, 10)}...{claimResult.transactionHash.slice(-8)}
              </div>
              <div style={{ fontSize: '14px', color: '#ddd', marginTop: '10px' }}>
                🎉 手气不错！快去抢下一个红包吧！
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvelopeViewer;