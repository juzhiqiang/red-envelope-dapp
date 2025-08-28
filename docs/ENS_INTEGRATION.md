# ENS头像和名称展示功能集成指南

## 功能概述

此更新为红包 DApp 添加了 ENS（Ethereum Name Service）头像和名称展示功能：

✅ **有 ENS 信息时**：显示 ENS 头像和名称  
✅ **无 ENS 信息时**：显示钱包地址和自动生成的渐变头像

## 新增文件

### 1. 核心组件
- `src/components/AddressAvatar.tsx` + `AddressAvatar.css` - 智能头像组件
- `src/components/UserList.tsx` + `UserList.css` - 增强的用户列表组件
- `src/components/WalletHeader.tsx` + `WalletHeader.css` - 钱包连接头部组件

### 2. 工具和 Hooks
- `src/hooks/useENS.ts` - ENS 数据查询 Hook
- `src/utils/avatarGenerator.ts` - 头像生成工具

### 3. 样式文件
- `src/components/AddressAvatar.css` - 头像组件样式
- `src/components/UserList.css` - 用户列表样式
- `src/components/WalletHeader.css` - 钱包头部样式

### 4. 文档
- `docs/ENS_INTEGRATION.md` - 详细的集成指南

## 安装依赖

**无需额外依赖！** 所有样式都使用标准 CSS 文件，不需要安装 styled-jsx 或其他样式库。

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

由于使用了独立的 CSS 文件，您可以轻松自定义样式：

```css
/* 自定义 ENS 名称颜色 */
.address-avatar .ens-name {
  color: #your-custom-color;
  font-weight: bold;
}

/* 自定义钱包地址样式 */
.address-avatar .wallet-address {
  font-size: 12px;
  color: #your-custom-color;
}

/* 自定义头像悬停效果 */
.address-avatar .avatar-image:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}
```

## 样式架构

### CSS 文件组织
```
src/components/
├── AddressAvatar.tsx
├── AddressAvatar.css      # 头像组件样式
├── UserList.tsx  
├── UserList.css           # 用户列表样式
├── WalletHeader.tsx
└── WalletHeader.css       # 钱包头部样式
```

### 样式特点
- **模块化**：每个组件有独立的 CSS 文件
- **BEM 风格**：使用清晰的类名命名规范
- **响应式**：包含移动端适配
- **可维护**：样式与逻辑分离，易于修改

## 注意事项

1. **网络连接**：ENS 查询需要连接以太坊主网
2. **加载性能**：首次查询 ENS 可能需要几秒钟
3. **错误处理**：组件内置了完善的错误处理机制
4. **移动端适配**：在小屏设备上会自动隐藏部分信息
5. **CSS 优先级**：确保正确导入 CSS 文件

## 兼容性

- ✅ React 18+
- ✅ TypeScript 4.7+
- ✅ Ethers.js v6
- ✅ 标准 CSS3（无需额外依赖）
- ✅ 现代浏览器（Chrome, Firefox, Safari, Edge）
- ✅ 移动端浏览器

## 文件结构更新

### 重构前（styled-jsx）
```typescript
// 组件内使用 styled-jsx
<style jsx>{`
  .component {
    /* 样式 */
  }
`}</style>
```

### 重构后（独立 CSS）
```typescript
// 导入独立 CSS 文件
import './Component.css';

// 组件中直接使用类名
<div className="component">
```

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
- 确保正确导入了对应的 CSS 文件
- 检查 CSS 文件路径是否正确
- 验证组件的 className 属性
- 使用浏览器开发工具检查样式加载

### CSS 不生效？
- 确认 CSS 文件已正确导入到组件中
- 检查 CSS 选择器的优先级
- 验证 webpack 配置是否支持 CSS 文件导入