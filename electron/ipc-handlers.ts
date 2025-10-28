import { ipcMain, dialog, BrowserWindow, desktopCapturer } from 'electron'
import path from 'node:path'
import fs from 'node:fs/promises'
import { IPC_CHANNELS, ExportRequest, ProjectFile, DesktopCapturerSource } from '../src/types'
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

  // Project save handler - saves project as JSON file
  ipcMain.handle(IPC_CHANNELS.PROJECT_SAVE, async (_, projectData: ProjectFile) => {
    try {
      const result = await dialog.showSaveDialog({
        defaultPath: `${projectData.name || 'Untitled'}.cfproj`,
        filters: [
          { name: 'ClipForge Project', extensions: ['cfproj'] },
          { name: 'JSON File', extensions: ['json'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return { success: false, canceled: true }
      }

      // Update the updatedAt timestamp
      const updatedProject: ProjectFile = {
        ...projectData,
        updatedAt: new Date().toISOString(),
      }

      // Write project file with pretty formatting (human-readable)
      await fs.writeFile(
        result.filePath,
        JSON.stringify(updatedProject, null, 2),
        'utf-8'
      )

      return {
        success: true,
        filePath: result.filePath,
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown save error',
      }
    }
  })

  // Project load handler - loads project from JSON file
  ipcMain.handle(IPC_CHANNELS.PROJECT_LOAD, async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: 'ClipForge Project', extensions: ['cfproj', 'json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true }
      }

      const filePath = result.filePaths[0]
      const fileContent = await fs.readFile(filePath, 'utf-8')
      
      // Parse and validate project file
      const projectData: ProjectFile = JSON.parse(fileContent)
      
      // Basic validation
      if (!projectData.version || !projectData.timeline) {
        throw new Error('Invalid project file format')
      }

      return {
        success: true,
        data: projectData,
        filePath,
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown load error',
      }
    }
  })

  // Recording: Get desktop sources (screen/window capture)
  ipcMain.handle(IPC_CHANNELS.RECORDING_GET_SOURCES, async () => {
    try {
      // Get available desktop sources (screens and windows)
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 300, height: 200 },
      })

      // Convert to our format
      const formattedSources: DesktopCapturerSource[] = sources.map(source => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
        display_id: source.display_id,
        appIcon: source.appIcon?.toDataURL(),
      }))

      return {
        success: true,
        sources: formattedSources,
      }
    } catch (error) {
      console.error('Failed to get desktop sources:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  // Recording: Save temp recording file
  ipcMain.handle(IPC_CHANNELS.RECORDING_SAVE_TEMP, async (_, buffer: ArrayBuffer, filename: string) => {
    try {
      const { app } = await import('electron')
      const os = await import('node:os')
      
      // Create temp directory path
      const tempDir = path.join(os.tmpdir(), 'clipforge-recordings')
      
      // Ensure directory exists
      await fs.mkdir(tempDir, { recursive: true })
      
      // Create full file path
      const filePath = path.join(tempDir, filename)
      
      // Write buffer to file
      await fs.writeFile(filePath, Buffer.from(buffer))
      
      return {
        success: true,
        filePath,
      }
    } catch (error) {
      console.error('Failed to save temp recording:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })
}

