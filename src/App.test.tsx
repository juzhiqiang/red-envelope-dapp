import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders red envelope dapp title', () => {
  render(<App />);
  const titleElement = screen.getByText(/智能合约红包系统/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders connect wallet message when not connected', () => {
  render(<App />);
  const connectMessage = screen.getByText(/请先连接您的 MetaMask 钱包开始使用/i);
  expect(connectMessage).toBeInTheDocument();
});
