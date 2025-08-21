import { useState, useCallback } from 'react';
import { Contract, formatEther, parseEther } from 'ethers';
import type { BrowserProvider } from 'ethers';
import { EnvelopeInfo, ClaimResult } from '../types';

const CONTRACT_ABI = [
  "function createEnvelope() external payable",
  "function claimEnvelope(uint256 _envelopeId) external",
  "function getEnvelope(uint256 _envelopeId) external view returns (uint256 id, address creator, uint256 totalAmount, uint256 remainingAmount, uint256 totalPackets, uint256 remainingPackets, address[] claimedBy, bool isActive, uint256 createdAt)",
  "function hasUserClaimed(uint256 _envelopeId, address _user) external view returns (bool)",
  "function getTotalEnvelopes() external view returns (uint256)",
  "function nextEnvelopeId() external view returns (uint256)",
  "event EnvelopeCreated(uint256 indexed envelopeId, address indexed creator, uint256 totalAmount, uint256 packets)",
  "event EnvelopeClaimed(uint256 indexed envelopeId, address indexed claimer, uint256 amount)"
];

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const useContract = (provider: BrowserProvider | null) => {
  const [loading, setLoading] = useState(false);

  const getContract = useCallback(async (withSigner = false) => {
    if (!provider) return null;
    
    try {
      if (withSigner) {
        const signer = await provider.getSigner();
        return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      }
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    } catch (error) {
      console.error('Failed to get contract instance:', error);
      return null;
    }
  }, [provider]);

  const createEnvelope = async (): Promise<string | null> => {
    if (!provider) {
      throw new Error('Please connect wallet first');
    }
    
    setLoading(true);
    try {
      const contract = await getContract(true);
      if (!contract) {
        throw new Error('Unable to get contract instance');
      }
      
      const tx = await contract.createEnvelope({
        value: parseEther("0.05")
      });
      
      const receipt = await tx.wait();
      return receipt?.hash || null;
    } catch (error: any) {
      console.error('Failed to create envelope:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User cancelled the transaction');
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new Error('Insufficient balance');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const claimEnvelope = async (envelopeId: number): Promise<ClaimResult | null> => {
    if (!provider) {
      throw new Error('Please connect wallet first');
    }
    
    setLoading(true);
    try {
      const contract = await getContract(true);
      if (!contract) {
        throw new Error('Unable to get contract instance');
      }
      
      const tx = await contract.claimEnvelope(envelopeId);
      const receipt = await tx.wait();
      
      let claimedAmount = "0";
      if (receipt?.logs) {
        for (const log of receipt.logs) {
          try {
            const parsed = contract.interface.parseLog({
              topics: log.topics,
              data: log.data
            });
            if (parsed?.name === 'EnvelopeClaimed') {
              claimedAmount = formatEther(parsed.args.amount || 0);
              break;
            }
          } catch {
            // Ignore failed log parsing
          }
        }
      }
      
      return {
        amount: claimedAmount,
        transactionHash: receipt?.hash || ''
      };
    } catch (error: any) {
      console.error('Failed to claim envelope:', error);
      if (error.code === 'ACTION_REJECTED') {
        throw new Error('User cancelled the transaction');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEnvelope = async (envelopeId: number): Promise<EnvelopeInfo | null> => {
    try {
      const contract = await getContract(false);
      if (!contract) return null;
      
      const result = await contract.getEnvelope(envelopeId);
      return {
        id: Number(result.id),
        creator: result.creator,
        totalAmount: formatEther(result.totalAmount),
        remainingAmount: formatEther(result.remainingAmount),
        totalPackets: Number(result.totalPackets),
        remainingPackets: Number(result.remainingPackets),
        claimedBy: result.claimedBy,
        isActive: result.isActive,
        createdAt: Number(result.createdAt)
      };
    } catch (error) {
      console.error('Failed to get envelope info:', error);
      return null;
    }
  };

  const hasUserClaimed = async (envelopeId: number, userAddress: string): Promise<boolean> => {
    try {
      const contract = await getContract(false);
      if (!contract) return false;
      
      return await contract.hasUserClaimed(envelopeId, userAddress);
    } catch (error) {
      console.error('Failed to check if user claimed:', error);
      return false;
    }
  };

  const getTotalEnvelopes = async (): Promise<number> => {
    try {
      const contract = await getContract(false);
      if (!contract) return 0;
      
      const total = await contract.nextEnvelopeId();
      return Number(total);
    } catch (error) {
      console.error('Failed to get total envelopes:', error);
      return 0;
    }
  };

  return {
    loading,
    createEnvelope,
    claimEnvelope,
    getEnvelope,
    hasUserClaimed,
    getTotalEnvelopes,
    contractAddress: CONTRACT_ADDRESS
  };
};