import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { TEXT } from './config/text';

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
  const titleElement = screen.getByText(TEXT.TITLE);
  expect(titleElement).toBeInTheDocument();
});

test('renders connect wallet message when not connected', () => {
  render(<App />);
  const connectMessage = screen.getByText(TEXT.CONNECT_PROMPT);
  expect(connectMessage).toBeInTheDocument();
});

test('renders connect MetaMask button', () => {
  render(<App />);
  const connectButton = screen.getByText(TEXT.CONNECT_WALLET);
  expect(connectButton).toBeInTheDocument();
});