// src/utils/avatarGenerator.ts

/**
 * 生成基于地址的渐变色头像
 */
export const generateGradientAvatar = (address: string): string => {
  if (!address) return '';
  
  // 基于地址生成颜色
  const colors = getColorsFromAddress(address);
  
  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${address.slice(2, 8)}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#grad-${address.slice(2, 8)})" />
      <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
            text-anchor="middle" fill="white">
        ${getInitials(address)}
      </text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * 基于地址生成颜色
 */
const getColorsFromAddress = (address: string) => {
  const hash = address.slice(2); // 移除 0x
  
  // 使用地址的不同部分生成两个颜色
  const primaryHex = hash.slice(0, 6);
  const secondaryHex = hash.slice(6, 12);
  
  return {
    primary: `#${primaryHex}`,
    secondary: `#${secondaryHex}`
  };
};

/**
 * 从地址生成首字母
 */
const getInitials = (address: string): string => {
  if (!address) return '';
  
  // 取地址的前两个字符作为首字母（去掉0x）
  return address.slice(2, 4).toUpperCase();
};

/**
 * 格式化地址显示
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  
  if (address.length <= 10) return address;
  
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * 验证图片URL是否有效
 */
export const isValidImageUrl = async (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // 5秒超时
    setTimeout(() => resolve(false), 5000);
  });
};