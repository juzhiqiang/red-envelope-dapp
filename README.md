# 智能合约红包系统 (Red Packet DApp)

基于以太坊智能合约的去中心化红包系统，支持随机分配金额和公平抢红包功能。

## 🚀 功能特性

- 🎯 支持最多 6 个用户参与抢红包
- 💰 每次充值固定金额 0.05 ETH
- 🎲 完全随机分配金额，确保公平公正
- 🔒 基于智能合约，安全可靠
- 👑 合约拥有者可以充值红包
- 📊 实时显示红包状态和领取记录
- 🌐 支持 MetaMask 钱包连接

## 📦 技术栈

- **前端**: React 18 + TypeScript
- **区块链**: Ethereum + Solidity ^0.8.19
- **Web3库**: ethers.js v6
- **开发工具**: Hardhat
- **样式**: CSS3 + 渐变背景

## 🛠️ 合约信息

- **合约地址**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **合约名称**: RedPacket
- **主要功能**:
  - `claimRedPacket()`: 领取红包
  - `deposit()`: 充值红包 (仅限合约拥有者)
  - `getRedPacketInfo()`: 获取红包信息
  - `hasClaimed(address)`: 检查地址是否已领取

## 🚀 快速开始

### 环境要求

- Node.js 16+
- npm 或 yarn
- MetaMask 浏览器扩展

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm start
# 或
yarn start
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 📱 使用指南

### 基本流程

1. **连接钱包**
   - 点击右上角"连接钱包"按钮
   - 授权 MetaMask 连接

2. **查看红包状态**
   - 查看剩余金额和已领取人数
   - 检查自己是否为合约拥有者

3. **充值红包** (仅限合约拥有者)
   - 如果您是合约拥有者，可以向红包充值 0.05 ETH
   - 点击"充值 0.05 ETH"按钮并确认交易

4. **领取红包**
   - 点击"领取红包"按钮
   - 确认交易并等待区块确认
   - 查看领取到的随机金额

5. **查看记录**
   - 在页面底部查看所有领取记录
   - 自己的记录会特别标注

### 重要提示

- ⚠️ 每个地址只能领取一次红包
- 🎲 领取金额完全随机分配
- 👑 只有合约拥有者可以充值
- 📦 最多支持 6 个人领取
- 🔐 建议在测试网络中使用

## 🎯 合约设计

### 核心特性

- **随机分配算法**: 使用区块哈希和时间戳生成伪随机数
- **安全机制**: 
  - ReentrancyGuard 防止重入攻击
  - Ownable 访问控制
  - 状态检查确保安全性
- **公平性保证**: 
  - 每个地址只能领取一次
  - 最后一个用户获得所有剩余金额
  - 前面用户的分配不会影响后续用户

### 主要函数

```solidity
// 领取红包
function claimRedPacket() external nonReentrant

// 充值红包 (仅限owner)
function deposit() external payable onlyOwner

// 获取红包信息
function getRedPacketInfo() external view returns (
    uint256 _remainingAmount,
    uint256 _claimedCount,
    uint256 _maxRecipients,
    bool _isFinished
)

// 检查是否已领取
function hasClaimed(address _user) external view returns (bool)
```

## 🔧 开发

### 项目结构

```
src/
├── components/          # React 组件
├── hooks/              # 自定义 Hooks
│   ├── useContract.ts  # 合约交互逻辑
│   └── useWallet.ts    # 钱包连接逻辑
├── types/              # TypeScript 类型定义
├── config/             # 配置文件
└── App.tsx             # 主应用组件
```

### 关键文件说明

- **useContract.ts**: 封装了所有与智能合约的交互逻辑
- **useWallet.ts**: 处理 MetaMask 钱包的连接和状态管理
- **App.tsx**: 主界面组件，整合所有功能

### 自定义配置

如需修改合约地址，请编辑 `src/hooks/useContract.ts`:

```typescript
const CONTRACT_ADDRESS = "你的合约地址";
```

## 🚨 注意事项

### 安全提醒

1. **测试环境**: 本项目仅供学习和测试使用
2. **资金安全**: 请在测试网络中进行测试，避免使用主网资金
3. **私钥保护**: 切勿泄露您的私钥或助记词
4. **合约验证**: 在主网使用前，请确保合约已通过专业审计

### 常见问题

**Q: 为什么创建红包失败？**
A: 请确保：
- 已连接正确的钱包
- 账户余额充足
- 如果是充值操作，确保您是合约拥有者

**Q: 领取红包失败怎么办？**
A: 可能原因：
- 您已经领取过了
- 红包已被抢完
- 红包余额不足
- 网络拥堵，请稍后重试

**Q: 如何成为合约拥有者？**
A: 合约拥有者是部署合约的地址，无法更改

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📄 许可证

MIT License

## 🔗 相关链接

- [合约代码仓库](https://github.com/juzhiqiang/hardhat-hb)
- [以太坊官网](https://ethereum.org/)
- [MetaMask](https://metamask.io/)
- [React 官网](https://reactjs.org/)

---

⚠️ **免责声明**: 本项目仅供学习和研究使用，使用者需要自行承担相关风险。在主网使用前，请确保充分了解智能合约的风险和限制。