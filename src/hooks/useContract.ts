import { useState, useCallback } from 'react';
import { Contract, formatEther, parseEther } from 'ethers';
import { BrowserProvider } from 'ethers';
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

// 这里使用一个示例合约地址，实际部署后需要替换
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const useContract = (provider: BrowserProvider | null) => {
  const [loading, setLoading] = useState(false);

  const getContract = useCallback((withSigner = false) => {
    if (!provider) return null;
    
    if (withSigner) {
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider.getSigner());
    }
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }, [provider]);

  const createEnvelope = async (): Promise<string | null> => {
    if (!provider) return null;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.createEnvelope({
        value: parseEther("0.05") // 0.05 ETH
      });
      
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error('创建红包失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const claimEnvelope = async (envelopeId: number): Promise<ClaimResult | null> => {
    if (!provider) return null;
    
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.claimEnvelope(envelopeId);
      const receipt = await tx.wait();
      
      // 从事件中获取抢到的金额
      const claimEvent = receipt.logs.find((log: any) => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'EnvelopeClaimed';
        } catch {
          return false;
        }
      });
      
      let claimedAmount = "0";
      if (claimEvent) {
        const parsed = contract.interface.parseLog(claimEvent);
        claimedAmount = formatEther(parsed?.args.amount || 0);
      }
      
      return {
        amount: claimedAmount,
        transactionHash: receipt.hash
      };
    } catch (error) {
      console.error('抢红包失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getEnvelope = async (envelopeId: number): Promise<EnvelopeInfo | null> => {
    const contract = getContract();
    if (!contract) return null;
    
    try {
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
      console.error('获取红包信息失败:', error);
      return null;
    }
  };

  const hasUserClaimed = async (envelopeId: number, userAddress: string): Promise<boolean> => {
    const contract = getContract();
    if (!contract) return false;
    
    try {
      return await contract.hasUserClaimed(envelopeId, userAddress);
    } catch (error) {
      console.error('检查用户是否已抢红包失败:', error);
      return false;
    }
  };

  const getTotalEnvelopes = async (): Promise<number> => {
    const contract = getContract();
    if (!contract) return 0;
    
    try {
      const total = await contract.nextEnvelopeId();
      return Number(total);
    } catch (error) {
      console.error('获取红包总数失败:', error);
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