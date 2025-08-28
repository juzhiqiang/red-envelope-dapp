import React, { useState } from 'react';
import { EnvelopeInfo, ClaimResult } from '../types';
import { TEXT } from '../config/text';
import useENS from '../hooks/useENS';
import { generateGradientAvatar, formatAddress } from '../utils/avatarGenerator';
import './EnvelopeViewer.css';

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
        <div className="avatar-skeleton user-avatar" />
      );
    }

    if (ensAvatar && !hasAvatarError) {
      return (
        <img
          src={ensAvatar}
          alt={ensName || 'Avatar'}
          className="user-avatar"
          onError={onAvatarError}
        />
      );
    }

    return (
      <img
        src={generateGradientAvatar(address)}
        alt="Avatar"
        className="user-avatar"
      />
    );
  };

  const getDisplayName = () => {
    if (ensLoading) {
      return (
        <div className="name-skeleton user-name-skeleton" />
      );
    }

    const displayName = ensName || formatAddress(address);
    const isENS = Boolean(ensName);

    return (
      <span className={`user-name ${isENS ? 'ens' : ''}`}>
        {displayName}
        {isCurrentUser && <span className="current-user-text">(你)</span>}
      </span>
    );
  };

  return (
    <div className={`claimed-user-item ${isCurrentUser ? 'current-user' : ''}`}>
      <div className="user-info">
        <span className="user-rank">{index + 1}.</span>
        {renderAvatar()}
        {getDisplayName()}
        {ensName && (
          <div className="user-badge">
            ENS
          </div>
        )}
      </div>
      <span className="claim-status">✓ 已抢到</span>
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
            className="avatar-skeleton creator-avatar"
            style={{ width: size, height: size }}
          />
        );
      }

      if (creatorEnsAvatar && !hasError) {
        return (
          <img
            src={creatorEnsAvatar}
            alt={creatorEnsName || 'Creator Avatar'}
            className="creator-avatar"
            style={{ width: size, height: size }}
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
        className="creator-avatar"
        style={{ width: size, height: size }}
      />
    );
  };

  // 渲染地址名称 - 支持 ENS
  const renderAddressName = (address: string) => {
    // 如果是创建者，使用 ENS 数据
    if (address === envelopeInfo?.creator) {
      if (creatorEnsLoading) {
        return (
          <div className="name-skeleton creator-name-skeleton" />
        );
      }

      const displayName = creatorEnsName || formatAddress(address);
      const isENS = Boolean(creatorEnsName);

      return (
        <span className={`creator-name ${isENS ? 'ens' : ''}`}>
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
    <div className="envelope-viewer">
      <h3>
        {TEXT?.QUERY_ENVELOPE || '🔍 查询红包'}
      </h3>
      
      <div className="query-section">
        <input
          type="number"
          placeholder={TEXT?.ENTER_ID || '输入红包ID'}
          value={envelopeId}
          onChange={(e) => setEnvelopeId(e.target.value)}
          className="query-input"
        />
        <button
          onClick={handleQuery}
          disabled={loading || !envelopeId || !userAddress}
          className="query-button"
        >
          {TEXT?.QUERY_BUTTON || '查询'}
        </button>
      </div>

      {envelopeInfo && (
        <div className="envelope-info-card">
          <h4>
            {TEXT?.ENVELOPE_INFO || '📦 红包信息'}
          </h4>
          
          {/* 红包进度条 */}
          <div className="progress-section">
            <div className="progress-header">
              <span>抢取进度</span>
              <span>
                {envelopeInfo.totalPackets - envelopeInfo.remainingPackets}/{envelopeInfo.totalPackets}
              </span>
            </div>
            <div className="progress-bar">
              <div 
                className={`progress-fill ${envelopeInfo.isActive ? 'active' : 'inactive'}`}
                style={{ 
                  width: `${((envelopeInfo.totalPackets - envelopeInfo.remainingPackets) / envelopeInfo.totalPackets) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="info-details">
            <div className="info-item">
              <strong>{TEXT?.ENVELOPE_ID || '红包ID:'}</strong> {envelopeInfo.id}
            </div>
            
            {/* 创建者信息 - 集成 ENS 显示 */}
            <div className="creator-info">
              <strong>{TEXT?.CREATOR || '创建者:'}</strong>
              {renderAddressAvatar(envelopeInfo.creator, 20)}
              {renderAddressName(envelopeInfo.creator)}
              {creatorEnsName && (
                <div className="ens-badge">
                  ENS
                </div>
              )}
            </div>
            
            <div className="info-item">
              <strong>{(TEXT?.TOTAL_AMOUNT || '红包总金额:').replace(':', '')}</strong> {envelopeInfo.totalAmount} ETH
            </div>
            <div className="info-item">
              <strong>{TEXT?.REMAINING_AMOUNT || '剩余金额:'}</strong> {envelopeInfo.remainingAmount} ETH
            </div>
            <div className="info-item">
              <strong>{TEXT?.REMAINING_PACKETS || '剩余红包数:'}</strong> 
              <span className={`remaining-count ${envelopeInfo.remainingPackets > 0 ? 'available' : 'depleted'}`}>
                {envelopeInfo.remainingPackets}
              </span>
            </div>
            <div className="info-item">
              <strong>{TEXT?.STATUS || '状态:'}</strong>
              <span className={`status-text ${envelopeInfo.isActive ? 'active' : 'inactive'}`}>
                {envelopeInfo.isActive ? (TEXT?.ACTIVE || ' 🟢 可抢取') : (TEXT?.ENDED || ' 🔴 已抢完')}
              </span>
            </div>
            <div className="info-item">
              <strong>{TEXT?.CREATED_TIME || '创建时间:'}</strong> {formatTime(envelopeInfo.createdAt)}
            </div>
            <div className="info-item">
              <strong>{TEXT?.CLAIMED_COUNT || '已抢取人数:'}</strong> {envelopeInfo.claimedBy.length}
            </div>
          </div>

          {/* 抢取记录 - 集成头像显示 */}
          {envelopeInfo.claimedBy.length > 0 && (
            <div className="claim-records">
              <strong>{TEXT?.CLAIM_RECORDS || '抢取记录:'}</strong>
              <div className="claim-records-list">
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

          <div className="action-section">
            {hasClaimed ? (
              <div className="status-message already-claimed">
                {TEXT?.ALREADY_CLAIMED || '✅ 您已经抢过这个红包了'}
              </div>
            ) : canClaim ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className={`claim-button ${claiming ? 'claiming' : 'active'}`}
              >
                {getClaimButtonText()}
              </button>
            ) : (
              <div className="status-message cannot-claim">
                {getStatusMessage()}
              </div>
            )}
          </div>

          {claimResult && (
            <div className="success-message">
              <h4>
                {TEXT?.CLAIM_SUCCESS || '🎊 恭喜！抢红包成功！'}
              </h4>
              <div className="success-amount">
                💰 {claimResult.amount} ETH
              </div>
              <div className="transaction-info">
                {TEXT?.TRANSACTION_HASH || '交易哈希: '}{claimResult.transactionHash.slice(0, 10)}...{claimResult.transactionHash.slice(-8)}
              </div>
              <div className="success-note">
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