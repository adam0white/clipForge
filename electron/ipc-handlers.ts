import { ipcMain, dialog, BrowserWindow } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { IPC_CHANNELS, ExportRequest } from '../src/types'
import { exportVideo } from './services/ffmpeg'

/**
 * Set up IPC handlers for communication between main and renderer processes
 */
export function setupIpcHandlers() {
  // File import handler - opens file dialog and returns selected file paths
  ipcMain.handle(IPC_CHANNELS.FILE_IMPORT, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'webm'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    })

    if (result.canceled) {
      return { canceled: true, filePaths: [] }
    }

    return { canceled: false, filePaths: result.filePaths }
  })

  // File export handler - opens save dialog and returns output path
  ipcMain.handle('file:export-dialog', async () => {
    const result = await dialog.showSaveDialog({
      defaultPath: `ClipForge-Export-${Date.now()}.mp4`,
      filters: [{ name: 'MP4 Video', extensions: ['mp4'] }],
    })

    if (result.canceled) {
      return { canceled: true, filePath: null }
    }

    return { canceled: false, filePath: result.filePath }
  })

  // Video metadata extraction (basic - will be enhanced with FFprobe later)
  ipcMain.handle(IPC_CHANNELS.VIDEO_METADATA, async (_, filePath: string) => {
    try {
      const stats = await fs.stat(filePath)
      
      return {
        success: true,
        metadata: {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          // Will add duration, resolution, codec later with FFprobe
        },
      }
    } catch (error) {
      console.error('Failed to get video metadata:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // FFmpeg export handler
  ipcMain.handle(IPC_CHANNELS.FFMPEG_EXPORT, async (event, exportRequest: ExportRequest) => {
    console.log('FFmpeg export requested:', {
      clipCount: exportRequest.clips.length,
      resolution: exportRequest.settings.resolution,
      outputPath: exportRequest.settings.outputPath,
    })
    
    try {
      const mainWindow = BrowserWindow.fromWebContents(event.sender)
      
      // Export with progress callback
      const result = await exportVideo(
        exportRequest.clips,
        exportRequest.settings,
        (percent) => {
          // Send progress updates to renderer
          mainWindow?.webContents.send(IPC_CHANNELS.FFMPEG_PROGRESS, {
            percent,
            currentClip: 1,
            totalClips: exportRequest.clips.length,
            message: `Exporting... ${Math.round(percent)}%`,
          })
        }
      )
      
      return result
    } catch (error) {
      console.error('Export error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error',
      }
    }
  })
}

