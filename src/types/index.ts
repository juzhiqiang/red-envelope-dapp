export interface EnvelopeInfo {
  id: number;
  creator: string;
  totalAmount: string;
  remainingAmount: string;
  totalPackets: number;
  remainingPackets: number;
  claimedBy: string[];
  isActive: boolean;
  createdAt: number;
}

export interface ClaimResult {
  amount: string;
  transactionHash: string;
}

// 新增：RedPacket 合约相关类型
export interface RedPacketInfo {
  remainingAmount: string;
  claimedCount: number;
  maxRecipients: number;
  isFinished: boolean;
  claimers: string[];
  contractBalance: string;
}

export interface UserClaimInfo {
  hasClaimed: boolean;
  claimedAmount: string;
}

export interface ContractInfo {
  address: string;
  owner: string;
  totalSupply: string;
  isActive: boolean;
}