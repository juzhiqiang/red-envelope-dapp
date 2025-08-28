import React, { useState } from 'react';
import { EnvelopeInfo, ClaimResult } from '../types';
import { TEXT } from '../config/text';
import useENS from '../hooks/useENS';
import { generateGradientAvatar, formatAddress } from '../utils/avatarGenerator';

interface EnvelopeViewerProps {
  onQueryEnvelope: (id: number) => Promise<EnvelopeInfo | null>;
  onClaimEnvelope: (id: number) => Promise<ClaimResult | null>;
  onCheckClaimed: (id: number, address: string) => Promise<boolean>;
  userAddress: string | null;
  loading: boolean;
}

// 独立的已抢取用户项组件，支持 ENS
interface ClaimedUserItemProps {
  address: string;
  index: number;
  currentUser: string | null;
  onAvatarError: () => void;
  hasAvatarError: boolean;
}

const ClaimedUserItem: React.FC<ClaimedUserItemProps> = ({
  address,
  index,
  currentUser,
  onAvatarError,
  hasAvatarError
}) => {
  const { name: ensName, avatar: ensAvatar, isLoading: ensLoading } = useENS(address);
  const isCurrentUser = currentUser && address.toLowerCase() === currentUser.toLowerCase();

  const renderAvatar = () => {
    if (ensLoading) {
      return (
        <div 
          style={{ 
            width: 20, 
            height: 20,
            borderRadius: '50%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            marginRight: '8px'
          }}
        />
      );
    }

    if (ensAvatar && !hasAvatarError) {
      return (
        <img
          src={ensAvatar}
          alt={ensName || 'Avatar'}
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            marginRight: '8px'
          }}
          onError={onAvatarError}
        />
      );
    }

    return (
      <img
        src={generateGradientAvatar(address)}
        alt="Avatar"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          marginRight: '8px'
        }}
      />
    );
  };

  const getDisplayName = () => {
    if (ensLoading) {
      return (
        <div 
          style={{
            width: '80px',
            height: '12px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      );
    }

    const displayName = ensName || formatAddress(address);
    const isENS = Boolean(ensName);

    return (
      <span style={{ color: isENS ? '#00d4ff' : 'white', fontWeight: isENS ? '600' : 'normal' }}>
        {displayName}
        {isCurrentUser && <span style={{ color: '#ffd700', marginLeft: '4px' }}>(你)</span>}
      </span>
    );
  };

  return (
    <div style={{
      background: isCurrentUser ? 'rgba(255, 215, 0, 0.2)' : 'rgba(0, 0, 0, 0.2)',
      border: isCurrentUser ? '1px solid rgba(255, 215, 0, 0.5)' : 'none',
      padding: '8px 10px',
      borderRadius: '8px',
      marginBottom: '5px',
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', fontWeight: 'bold' }}>{index + 1}.</span>
        {renderAvatar()}
        {getDisplayName()}
        {ensName && (
          <div style={{ 
            marginLeft: '6px', 
            fontSize: '8px', 
            background: 'rgba(0, 212, 255, 0.3)', 
            color: '#00d4ff',
            padding: '1px 4px',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}>
            ENS
          </div>
        )}
      </div>
      <span style={{ color: '#2ed573', fontWeight: 'bold' }}>✓ 已抢到</span>
    </div>
  );
};

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
  const [avatarErrors, setAvatarErrors] = useState<Set<string>>(new Set());

  // 为创建者使用 ENS - 修复条件判断
  const creatorAddress = envelopeInfo?.creator || null;
  const { name: creatorEnsName, avatar: creatorEnsAvatar, isLoading: creatorEnsLoading } = useENS(creatorAddress);

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
      setAvatarErrors(new Set()); // 重置头像错误状态
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

  // 处理头像错误
  const handleAvatarError = (address: string) => {
    setAvatarErrors(prev => new Set(prev).add(address));
  };

  // 渲染地址头像 - 支持 ENS
  const renderAddressAvatar = (address: string, size: number = 24) => {
    const hasError = avatarErrors.has(address);
    
    // 如果是创建者，使用 ENS 数据
    if (address === envelopeInfo?.creator) {
      if (creatorEnsLoading) {
        return (
          <div 
            style={{ 
              width: size, 
              height: size,
              borderRadius: '50%',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              marginRight: '8px'
            }}
          />
        );
      }

      if (creatorEnsAvatar && !hasError) {
        return (
          <img
            src={creatorEnsAvatar}
            alt={creatorEnsName || 'Creator Avatar'}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              marginRight: '8px'
            }}
            onError={() => handleAvatarError(address)}
          />
        );
      }
    }

    // 使用生成的头像
    return (
      <img
        src={generateGradientAvatar(address)}
        alt="Avatar"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          marginRight: '8px'
        }}
      />
    );
  };

  // 渲染地址名称 - 支持 ENS
  const renderAddressName = (address: string) => {
    // 如果是创建者，使用 ENS 数据
    if (address === envelopeInfo?.creator) {
      if (creatorEnsLoading) {
        return (
          <div 
            style={{
              width: '100px',
              height: '16px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'shimmer 1.5s infinite'
            }}
          />
        );
      }

      const displayName = creatorEnsName || formatAddress(address);
      const isENS = Boolean(creatorEnsName);

      return (
        <span style={{ color: isENS ? '#00d4ff' : 'white', fontWeight: isENS ? '600' : 'normal' }}>
          {displayName}
        </span>
      );
    }

    // 对于其他地址，使用简单的格式化显示
    return <span>{formatAddress(address)}</span>;
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
            
            {/* 创建者信息 - 集成 ENS 显示 */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <strong style={{ marginRight: '8px' }}>{TEXT?.CREATOR || '创建者:'}</strong>
              {renderAddressAvatar(envelopeInfo.creator, 20)}
              {renderAddressName(envelopeInfo.creator)}
              {creatorEnsName && (
                <div style={{ 
                  marginLeft: '8px', 
                  fontSize: '10px', 
                  background: 'rgba(0, 212, 255, 0.2)', 
                  color: '#00d4ff',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontWeight: 'bold'
                }}>
                  ENS
                </div>
              )}
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

          {/* 抢取记录 - 集成头像显示 */}
          {envelopeInfo.claimedBy.length > 0 && (
            <div style={{ marginTop: '15px' }}>
              <strong>{TEXT?.CLAIM_RECORDS || '抢取记录:'}</strong>
              <div style={{ marginTop: '8px' }}>
                {envelopeInfo.claimedBy.map((address, index) => (
                  <ClaimedUserItem
                    key={`${address}-${index}`}
                    address={address}
                    index={index}
                    currentUser={userAddress}
                    onAvatarError={() => handleAvatarError(address)}
                    hasAvatarError={avatarErrors.has(address)}
                  />
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

      {/* 添加 CSS 动画 */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default EnvelopeViewer;