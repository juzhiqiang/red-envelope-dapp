import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

jest.mock('ethers', () => ({
  BrowserProvider: jest.fn(),
  Contract: jest.fn(),
  formatEther: jest.fn(() => '0.05'),
  parseEther: jest.fn(() => '50000000000000000')
}));

Object.defineProperty(window, 'ethereum', {
  value: undefined,
  writable: true
});

test('renders red envelope dapp title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Red Envelope DApp/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders connect wallet message when not connected', () => {
  render(<App />);
  const connectMessage = screen.getByText(/Please connect your MetaMask wallet to get started/i);
  expect(connectMessage).toBeInTheDocument();
});

test('renders connect MetaMask button', () => {
  render(<App />);
  const connectButton = screen.getByText(/Connect MetaMask/i);
  expect(connectButton).toBeInTheDocument();
});