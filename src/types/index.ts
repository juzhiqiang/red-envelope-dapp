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

declare global {
  interface Window {
    ethereum?: any;
  }
}