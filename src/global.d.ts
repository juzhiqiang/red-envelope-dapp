// 全局类型声明
export {}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
      selectedAddress?: string
      chainId?: string
      networkVersion?: string
      // 支持更多的标准 EIP-1193 属性
      isConnected?: () => boolean
      enable?: () => Promise<string[]>
      send?: (method: string, params?: any[]) => Promise<any>
      sendAsync?: (request: any, callback: (error: any, response: any) => void) => void
    }
  }
}
