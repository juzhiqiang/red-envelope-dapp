import React, { useState } from 'react';
import { EnvelopeInfo, ClaimResult } from '../types';

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
      alert('\u8bf7\u8f93\u5165\u6709\u6548\u7684\u7ea2\u5305ID');
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
      console.error('\u67e5\u8be2\u7ea2\u5305\u5931\u8d25:', error);
      alert('\u67e5\u8be2\u7ea2\u5305\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7ea2\u5305ID\u662f\u5426\u6b63\u786e');
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
      console.error('\u62a2\u7ea2\u5305\u5931\u8d25:', error);
      if (error.message && error.message.includes('Already claimed')) {
        alert('\u60a8\u5df2\u7ecf\u62a2\u8fc7\u8fd9\u4e2a\u7ea2\u5305\u4e86\uff01');
      } else if (error.message && error.message.includes('Creator cannot claim')) {
        alert('\u521b\u5efa\u8005\u4e0d\u80fd\u62a2\u81ea\u5df1\u7684\u7ea2\u5305\uff01');
      } else if (error.message && error.message.includes('No packets remaining')) {
        alert('\u7ea2\u5305\u5df2\u88ab\u62a2\u5b8c\uff01');
      } else {
        alert('\u62a2\u7ea2\u5305\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5');
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

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '30px',
      margin: '20px',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{'\ud83d\udd0d \u67e5\u8be2\u7ea2\u5305'}</h3>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="number"
          placeholder="\u8f93\u5165\u7ea2\u5305ID"
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
          {'\u67e5\u8be2'}
        </button>
      </div>

      {envelopeInfo && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '20px',
          marginTop: '20px'
        }}>
          <h4 style={{ marginTop: 0, marginBottom: '15px' }}>{'\ud83d\udce6 \u7ea2\u5305\u4fe1\u606f'}</h4>
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u7ea2\u5305ID:'}</strong> {envelopeInfo.id}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u521b\u5efa\u8005:'}</strong> {formatAddress(envelopeInfo.creator)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u603b\u91d1\u989d:'}</strong> {envelopeInfo.totalAmount} ETH
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u5269\u4f59\u91d1\u989d:'}</strong> {envelopeInfo.remainingAmount} ETH
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u603b\u7ea2\u5305\u6570:'}</strong> {envelopeInfo.totalPackets}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u5269\u4f59\u7ea2\u5305\u6570:'}</strong> {envelopeInfo.remainingPackets}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u72b6\u6001:'}</strong>
              <span style={{ 
                color: envelopeInfo.isActive ? '#2ed573' : '#ff4757',
                fontWeight: 'bold' 
              }}>
                {envelopeInfo.isActive ? ' \ud83d\udfe2 \u6d3b\u8dc3' : ' \ud83d\udd34 \u5df2\u7ed3\u675f'}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u521b\u5efa\u65f6\u95f4:'}</strong> {formatTime(envelopeInfo.createdAt)}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>{'\u5df2\u9886\u53d6\u4eba\u6570:'}</strong> {envelopeInfo.claimedBy.length}
            </div>
          </div>

          {envelopeInfo.claimedBy.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <strong>{'\u9886\u53d6\u8bb0\u5f55:'}</strong>
              <div style={{ marginTop: '8px' }}>
                {envelopeInfo.claimedBy.map((address, index) => (
                  <div key={index} style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '5px 10px',
                    borderRadius: '5px',
                    marginBottom: '5px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}>
                    {index + 1}. {formatAddress(address)}
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
                {'\u2705 \u60a8\u5df2\u7ecf\u9886\u53d6\u8fc7\u8fd9\u4e2a\u7ea2\u5305\u4e86'}
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
                  opacity: claiming ? 0.6 : 1
                }}
              >
                {claiming ? '\u62a2\u7ea2\u5305\u4e2d...' : '\ud83c\udf89 \u62a2\u7ea2\u5305'}
              </button>
            ) : (
              <div style={{
                background: 'rgba(255, 71, 87, 0.2)',
                border: '1px solid #ff4757',
                borderRadius: '10px',
                padding: '15px',
                color: '#ff4757'
              }}>
                {!envelopeInfo.isActive ? '\u274c \u7ea2\u5305\u5df2\u7ed3\u675f' :
                 envelopeInfo.remainingPackets === 0 ? '\u274c \u7ea2\u5305\u5df2\u88ab\u62a2\u5b8c' :
                 envelopeInfo.creator.toLowerCase() === userAddress?.toLowerCase() ? '\u274c \u4e0d\u80fd\u62a2\u81ea\u5df1\u7684\u7ea2\u5305' :
                 '\u274c \u65e0\u6cd5\u62a2\u53d6'}
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
              <h4 style={{ margin: '0 0 15px 0', color: '#2ed573' }}>{'\ud83c\udf8a \u606d\u559c\uff01\u62a2\u7ea2\u5305\u6210\u529f\uff01'}</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>
                {'\ud83d\udcb0 '}{claimResult.amount} ETH
              </div>
              <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                {'\u4ea4\u6613\u54c8\u5e0c: '}{claimResult.transactionHash.slice(0, 10)}...{claimResult.transactionHash.slice(-8)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvelopeViewer;