import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
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
        alert(`Red envelope created successfully!\\nTransaction hash: ${txHash}`);
        setLastUpdateTime(Date.now());
      }
    } catch (error: any) {
      console.error('Failed to create envelope:', error);
      let errorMessage = 'Failed to create red envelope, please try again';
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient balance, need at least 0.05 ETH + Gas fee';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'User cancelled the transaction';
      } else if (error.message?.includes('connect wallet')) {
        errorMessage = 'Please connect MetaMask wallet first';
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
      console.error('Failed to claim envelope:', error);
      throw error;
    }
  };

  const handleGetEnvelope = useCallback(async (envelopeId: number) => {
    return await getEnvelope(envelopeId);
  }, [getEnvelope]);

  const handleHasUserClaimed = useCallback(async (envelopeId: number, userAddress: string) => {
    return await hasUserClaimed(envelopeId, userAddress);
  }, [hasUserClaimed]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
            Red Envelope DApp
          </h1>
          <WalletConnection
            account={account}
            isConnecting={isConnecting}
            onConnect={connectWallet}
            onDisconnect={disconnectWallet}
          />
        </div>
      </div>

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
            }} className="grid-responsive">
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
            }} className="fade-in">
              <h2 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>🧧</h2>
              <h2 style={{ marginBottom: '20px' }}>Welcome to Red Envelope DApp</h2>
              <p style={{ fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
                Decentralized red envelope system based on Ethereum smart contracts<br/>
                Support creating red envelopes, random allocation, and claiming features
              </p>
              <div style={{ fontSize: '16px', color: '#ddd', marginBottom: '30px' }}>
                🎯 Each envelope contains 6 random amount sub-packets<br/>
                💰 Fixed total amount 0.05 ETH<br/>
                🎲 Completely random allocation, fair and just<br/>
                🔒 Smart contract ensures security
              </div>
              <p style={{ fontSize: '16px', color: '#f39c12' }}>
                Please connect your MetaMask wallet to get started
              </p>
            </div>
          </div>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '40px 20px',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '14px'
      }}>
        <p>🚀 Red Envelope DApp - Blockchain-based smart red envelope system</p>
        <p>⚠️ For learning and testing purposes only, please test on test networks</p>
      </div>
    </div>
  );
};

export default App;