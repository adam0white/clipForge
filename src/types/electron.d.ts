// TypeScript declarations for Electron IPC API exposed via preload

import type { ProjectFile, DesktopCapturerSource } from './index'

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
  
  // Project operations
  saveProject: (projectData: ProjectFile) => Promise<{
    success: boolean
    filePath?: string
    canceled?: boolean
    error?: string
  }>
  loadProject: () => Promise<{
    success: boolean
    data?: ProjectFile
    filePath?: string
    canceled?: boolean
    error?: string
  }>
  
  // Recording operations
  getDesktopSources: () => Promise<{
    success: boolean
    sources?: DesktopCapturerSource[]
    error?: string
  }>
  saveTempRecording: (buffer: ArrayBuffer, filename: string) => Promise<{
    success: boolean
    filePath?: string
    error?: string
  }>
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

