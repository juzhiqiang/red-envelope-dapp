# 🧧 Red Envelope DApp

一个基于以太坊智能合约的去中心化红包系统，使用 React + TypeScript 开发。

## 📋 功能特性

- 🔗 **MetaMask 钱包连接** - 支持连接和管理以太坊钱包
- 📊 **合约信息显示** - 实时显示智能合约地址和红包统计
- 🎁 **创建红包** - 创建包含 6 个子包的红包，总金额 0.05 ETH
- 🎲 **随机分配** - 智能合约自动随机分配金额到各个子包
- 🏃 **抢红包功能** - 用户可以抢取可用的红包
- 💰 **实时显示** - 显示抢到的金额和交易信息

## 🏗️ 技术栈

- **前端**: React 18, TypeScript
- **区块链**: Solidity, Ethers.js v6
- **钱包**: MetaMask
- **样式**: 内联样式 + CSS

## 📦 项目结构

```
red-envelope-dapp/
├── contracts/
│   └── RedEnvelope.sol          # 智能合约
├── src/
│   ├── components/
│   │   ├── WalletConnection.tsx # 钱包连接组件
│   │   ├── ContractInfo.tsx     # 合约信息组件
│   │   ├── EnvelopeCreator.tsx  # 创建红包组件
│   │   └── EnvelopeViewer.tsx   # 查询抢红包组件
│   ├── hooks/
│   │   ├── useWallet.ts         # 钱包管理钩子
│   │   └── useContract.ts       # 合约交互钩子
│   ├── types/
│   │   └── index.ts             # TypeScript 类型定义
│   ├── App.tsx                  # 主应用组件
│   └── index.tsx                # 应用入口
├── public/
└── package.json
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/juzhiqiang/red-envelope-dapp.git
cd red-envelope-dapp
```

### 2. 安装依赖

```bash
npm install
```

### 3. 部署智能合约

在部署智能合约之前，需要：

1. 安装 Hardhat 或 Truffle
2. 配置网络（建议使用测试网络如 Sepolia）
3. 部署 `contracts/RedEnvelope.sol`
4. 更新 `src/hooks/useContract.ts` 中的合约地址

### 4. 启动应用

```bash
npm start
```

应用将在 `http://localhost:3000` 启动。

## 🔧 配置说明

### 合约地址配置

在 `src/hooks/useContract.ts` 中更新合约地址：

```typescript
const CONTRACT_ADDRESS = "你的合约地址";
```

### 网络配置

确保 MetaMask 连接到正确的网络（主网或测试网）。

## 📝 智能合约说明

### 主要功能

- `createEnvelope()` - 创建红包（需要发送 0.05 ETH）
- `claimEnvelope(uint256 _envelopeId)` - 抢红包
- `getEnvelope(uint256 _envelopeId)` - 查询红包信息
- `hasUserClaimed(uint256 _envelopeId, address _user)` - 检查用户是否已抢过红包

### 安全特性

- 防止重复抢红包
- 创建者不能抢自己的红包
- 随机分配算法确保公平性
- 自动处理余额和状态更新

## 🎮 使用指南

### 1. 连接钱包
- 点击"连接 MetaMask"按钮
- 授权应用访问您的钱包

### 2. 创建红包
- 确保钱包有足够的 ETH（0.05 ETH + Gas费）
- 点击"创建红包"按钮
- 确认交易

### 3. 抢红包
- 输入红包ID进行查询
- 查看红包状态和剩余数量
- 点击"抢红包"按钮
- 确认交易

## ⚠️ 注意事项

- 本项目仅供学习和测试使用
- 建议在测试网络中进行测试
- 确保钱包中有足够的 ETH 支付Gas费
- 智能合约一旦部署无法修改，请谨慎操作

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Ethers.js 文档](https://docs.ethers.io/)
- [MetaMask 文档](https://docs.metamask.io/)
- [React 文档](https://reactjs.org/docs/)
- [Solidity 文档](https://docs.soliditylang.org/)

## 🎯 功能演示

### 创建红包流程
1. 连接 MetaMask 钱包
2. 确保账户有足够的 ETH（0.05 + Gas费）
3. 点击"创建红包"按钮
4. 确认交易并等待打包
5. 创建成功后获得红包ID

### 抢红包流程
1. 输入有效的红包ID
2. 查看红包详情（总金额、剩余数量等）
3. 点击"抢红包"按钮
4. 确认交易
5. 成功后显示抢到的金额

## 🔒 安全机制

1. **防重复领取**: 每个地址只能抢一次同一个红包
2. **创建者限制**: 红包创建者无法抢自己的红包  
3. **随机分配**: 使用区块链随机数确保公平分配
4. **状态管理**: 自动管理红包状态和剩余数量
5. **资金安全**: 智能合约自动处理ETH转账

## 🛠️ 开发指南

### 添加新功能
1. 在 `contracts/` 目录下修改智能合约
2. 更新 `src/types/` 中的类型定义
3. 在相应组件中实现前端逻辑
4. 测试功能完整性

### 自定义样式
- 修改各组件中的内联样式
- 在 `src/App.css` 中添加全局样式
- 支持响应式设计

### 部署到生产环境
1. 在主网或测试网部署智能合约
2. 更新合约地址配置
3. 构建生产版本: `npm run build`
4. 部署到 IPFS 或传统服务器

---

**⚡ 快速体验**: 部署合约后即可立即使用，无需复杂配置！