import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import WalletConnection from './components/WalletConnection';
import ContractInfo from './components/ContractInfo';
import EnvelopeCreator from './components/EnvelopeCreator';
import EnvelopeViewer from './components/EnvelopeViewer';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract';
import { TEXT } from './config/text';

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
        alert(TEXT.CREATE_SUCCESS + txHash);
        setLastUpdateTime(Date.now());
      }
    } catch (error: any) {
      console.error('Create envelope failed:', error);
      let errorMessage = TEXT.CREATE_FAILED;

      if (error.message && error.message.includes('insufficient funds')) {
        errorMessage = TEXT.INSUFFICIENT_FUNDS;
      } else if (error.message && error.message.includes('user rejected')) {
        errorMessage = TEXT.USER_CANCELLED;
      } else if (error.message && error.message.includes('connect wallet')) {
        errorMessage = TEXT.CONNECT_FIRST;
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
            {TEXT.TITLE}
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
              <h2 style={{ marginBottom: '20px' }}>{TEXT.WELCOME_TITLE}</h2>
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                marginBottom: '30px' 
              }}>
                {TEXT.WELCOME_DESC1}
                <br />
                {TEXT.WELCOME_DESC2}
              </p>
              <div style={{ 
                fontSize: '16px', 
                color: '#ddd', 
                marginBottom: '30px' 
              }}>
                {TEXT.FEATURE_1}
                <br />
                {TEXT.FEATURE_2}
                <br />
                {TEXT.FEATURE_3}
                <br />
                {TEXT.FEATURE_4}
              </div>
              <p style={{ fontSize: '16px', color: '#f39c12' }}>
                {TEXT.CONNECT_PROMPT}
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={footerStyle}>
        <p>{TEXT.FOOTER_1}</p>
        <p>{TEXT.FOOTER_2}</p>
      </div>
    </div>
  );
};

export default App;