import { app, BrowserWindow, shell, ipcMain, protocol, net } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { update } from './update'
import { setupIpcHandlers } from '../ipc-handlers'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

// Register custom protocol as privileged (before app.whenReady)
// This is the official Electron way to serve local media files securely
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'safe-file',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,  // Critical for video/audio streaming
      bypassCSP: true,
    },
  },
])

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'ClipForge',
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Security: contextIsolation enabled by default
      // Use contextBridge in preload to expose APIs safely
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // Auto update
  update(win)
}

app.whenReady().then(() => {
  // Register custom protocol handler using modern Electron API
  // This is the official recommended approach for serving local media files
  protocol.handle('safe-file', (request) => {
    try {
      // Parse the URL to extract the file path
      // CRITICAL: URL parser treats first path segment as hostname!
      // safe-file:///Users/... → hostname='Users' (lowercased to 'users'), pathname='/abdul/...'
      // We need to reconstruct: /<hostname><pathname>
      const requestUrl = new URL(request.url)
      let filePath = decodeURIComponent(requestUrl.pathname)
      
      // Reconstruct full path from hostname + pathname
      if (requestUrl.hostname) {
        // The hostname is actually the first directory in the path
        // Reconstruct: /Users + /abdul/... = /Users/abdul/...
        filePath = '/' + requestUrl.hostname + filePath
      }
      
      // On Windows, pathname might be /C:/... so we need to remove leading slash
      if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
        filePath = filePath.slice(1)
      }
      
      // Security check: ensure the path is absolute
      if (!path.isAbsolute(filePath)) {
        console.error('[Protocol Error] Invalid path (not absolute):', filePath)
        return new Response('Bad Request', { 
          status: 400, 
          headers: { 'content-type': 'text/plain' } 
        })
      }
      
      // Convert to file URL and use net.fetch for proper streaming
      const fileUrl = pathToFileURL(filePath).toString()
      return net.fetch(fileUrl)
    } catch (error) {
      console.error('[Protocol Handler] Error:', error)
      return new Response('Internal Server Error', { 
        status: 500, 
        headers: { 'content-type': 'text/plain' } 
      })
    }
  })
  
  setupIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
