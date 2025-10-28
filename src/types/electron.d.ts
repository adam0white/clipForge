// TypeScript declarations for Electron IPC API exposed via preload

export interface ElectronAPI {
  // File operations
  showOpenDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>
  importFiles: () => Promise<{ canceled: boolean; filePaths: string[] }>
  exportDialog: () => Promise<{ canceled: boolean; filePath: string | null }>
  getPathForFile: (file: File) => string
  
  // Video operations
  getVideoMetadata: (filePath: string) => Promise<{
    success: boolean
    metadata?: any
    error?: string
  }>
  
  // FFmpeg operations
  exportVideo: (exportRequest: any) => Promise<{
    success: boolean
    error?: string
  }>
  
  // Event listeners
  onExportProgress: (callback: (progress: any) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    ipcRenderer: {
      on: (...args: any[]) => any
      off: (...args: any[]) => any
      send: (...args: any[]) => any
      invoke: (...args: any[]) => any
    }
  }
}

export {}

