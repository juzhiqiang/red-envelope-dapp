// 全局类型声明
export {}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: true
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
      selectedAddress?: string
      chainId?: string
      networkVersion?: string
    }
  }
}
