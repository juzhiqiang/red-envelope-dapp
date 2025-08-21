import React from 'react';
import { TEXT } from '../config/text';

interface ContractInfoProps {
  contractAddress: string;
  totalEnvelopes: number;
}

const ContractInfo: React.FC<ContractInfoProps> = ({ contractAddress, totalEnvelopes }) => {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '15px',
      padding: '20px',
      margin: '20px',
      color: 'white'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '15px' }}>
        {TEXT?.CONTRACT_INFO || '📋 合约信息'}
      </h3>
      <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
        <div style={{ marginBottom: '10px' }}>
          <strong>{TEXT?.CONTRACT_ADDRESS || '合约地址:'}</strong>
          <div style={{
            fontFamily: 'monospace',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '5px 10px',
            borderRadius: '5px',
            marginTop: '5px',
            wordBreak: 'break-all'
          }}>
            {contractAddress}
          </div>
        </div>
        <div>
          <strong>{TEXT?.TOTAL_ENVELOPES || '已创建红包总数:'}</strong> {totalEnvelopes}
        </div>
      </div>
    </div>
  );
};

export default ContractInfo;