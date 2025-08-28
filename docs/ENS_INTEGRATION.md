# ENS头像和名称展示功能集成指南

## 功能概述

此更新为红包 DApp 添加了 ENS（Ethereum Name Service）头像和名称展示功能：

✅ **有 ENS 信息时**：显示 ENS 头像和名称  
✅ **无 ENS 信息时**：显示钱包地址和自动生成的渐变头像

## 新增文件

### 1. `src/hooks/useENS.ts`
- 自定义 Hook，负责查询 ENS 名称和头像
- 支持异步加载和错误处理
- 自动处理 IPFS 链接转换

### 2. `src/utils/avatarGenerator.ts` 
- 基于钱包地址生成唯一的渐变色头像
- 地址格式化工具函数
- 图片URL验证功能

### 3. `src/components/AddressAvatar.tsx`
- 核心头像组件，智能切换ENS头像和生成头像
- 支持加载状态和错误处理
- 响应式设计，支持不同尺寸

### 4. `src/components/UserList.tsx`
- 更新的用户列表组件，集成头像展示
- 支持当前用户高亮显示
- 优化的移动端体验

### 5. `src/components/WalletHeader.tsx`
- 钱包连接头部组件，显示用户信息
- 集成 ENS 支持和余额显示
- 连接/断开连接功能

## 安装依赖

需要添加 `styled-jsx` 依赖来支持组件样式：

```bash
npm install styled-jsx@^5.1.0
# 或
yarn add styled-jsx@^5.1.0

# 开发依赖
npm install -D @types/styled-jsx@^3.4.4
# 或  
yarn add -D @types/styled-jsx@^3.4.4
```

## 使用方法

### 基础用法

```typescript
import AddressAvatar from './components/AddressAvatar';

// 在任何需要显示地址的地方使用
<AddressAvatar 
  address="0x742d35Cc6634C0532925a3b8D11DB7D8B4C8D2f5"
  size={40}
  showName={true}
/>
```

### 在现有组件中集成

1. **钱包连接区域**：
```typescript
import WalletHeader from './components/WalletHeader';

<WalletHeader
  address={userAddress}
  balance={userBalance}
  onConnect={connectWallet}
  onDisconnect={disconnectWallet}
/>
```

2. **用户列表展示**：
```typescript
import UserList from './components/UserList';

<UserList 
  claimedUsers={claimRecords}
  currentUser={currentAddress}
/>
```

## 核心特性

### 🎨 智能头像生成
- ENS 头像优先显示
- 无 ENS 时自动生成基于地址的渐变头像
- 支持 IPFS 头像链接自动转换

### 🏷️ ENS 名称显示
- 自动查询和显示 ENS 名称
- 降级显示格式化的钱包地址
- 支持加载状态和错误处理

### 📱 响应式设计
- 移动端友好的布局
- 自适应头像大小
- 优化的交互体验

### ⚡ 性能优化
- 缓存 ENS 查询结果
- 懒加载和错误重试
- 最小化网络请求

## 配置选项

### AddressAvatar 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `address` | `string` | 必填 | 钱包地址 |
| `size` | `number` | `40` | 头像尺寸（像素） |
| `showName` | `boolean` | `true` | 是否显示名称 |
| `className` | `string` | `''` | 自定义CSS类 |

### 自定义样式

可以通过传入 `className` 属性来自定义样式：

```css
.custom-avatar .ens-name {
  color: #your-color;
  font-weight: bold;
}

.custom-avatar .wallet-address {
  font-size: 12px;
}
```

## 注意事项

1. **网络连接**：ENS 查询需要连接以太坊主网
2. **加载性能**：首次查询 ENS 可能需要几秒钟
3. **错误处理**：组件内置了完善的错误处理机制
4. **移动端适配**：在小屏设备上会自动隐藏部分信息

## 兼容性

- ✅ React 18+
- ✅ TypeScript 4.7+
- ✅ Ethers.js v6
- ✅ 现代浏览器（Chrome, Firefox, Safari, Edge）
- ✅ 移动端浏览器

## 故障排除

### ENS 名称不显示？
- 检查网络连接
- 确认地址格式正确
- 验证 ENS 域名是否设置了反向解析

### 头像加载失败？
- IPFS 链接可能需要时间加载
- 组件会自动降级到生成头像
- 检查浏览器控制台的错误信息

### 样式问题？
- 确保安装了 `styled-jsx` 依赖
- 检查CSS优先级设置
- 验证组件的 className 属性