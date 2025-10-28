import { VideoMetadata } from '@/types'

/**
 * Validates if a file is a supported video format
 */
export function isVideoFile(filePath: string): boolean {
  const supportedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
  const extension = filePath.toLowerCase().slice(filePath.lastIndexOf('.'))
  return supportedExtensions.includes(extension)
}

/**
 * Extracts all video metadata using a single video element
 * More efficient than creating multiple elements
 */
export async function extractAllVideoData(filePath: string): Promise<{
  duration: number
  metadata: VideoMetadata
  thumbnail: string | null
} | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'
    
    let resolved = false
    let thumbnailGenerated = false
    
    const cleanup = () => {
      if (resolved) return
      resolved = true
      video.src = ''
      video.load()
      video.remove()
    }
    
    // Timeout after 10 seconds
    const timeoutId = setTimeout(() => {
      cleanup()
      resolve(null)
    }, 10000)
    
    video.onloadedmetadata = () => {
      const duration = video.duration
      const metadata: VideoMetadata = {
        width: video.videoWidth,
        height: video.videoHeight,
        codec: '',
        frameRate: 30,
      }
      
      // Seek to generate thumbnail
      video.currentTime = Math.min(1, duration / 2)
      thumbnailGenerated = false
    }
    
    video.onseeked = () => {
      if (thumbnailGenerated) return
      thumbnailGenerated = true
      
      try {
        // Validate duration is a valid number
        const duration = video.duration
        if (!isFinite(duration) || duration <= 0) {
          console.error('Invalid video duration:', duration, 'for file:', filePath)
          clearTimeout(timeoutId)
          cleanup()
          resolve(null)
          return
        }
        
        // Create canvas and draw video frame
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          clearTimeout(timeoutId)
          cleanup()
          resolve({
            duration,
            metadata: {
              width: video.videoWidth,
              height: video.videoHeight,
              codec: '',
              frameRate: 30,
            },
            thumbnail: null,
          })
          return
        }
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to base64 (lower quality to reduce size)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.5)
        
        clearTimeout(timeoutId)
        cleanup()
        resolve({
          duration,
          metadata: {
            width: video.videoWidth,
            height: video.videoHeight,
            codec: '',
            frameRate: 30,
          },
          thumbnail,
        })
      } catch (error) {
        clearTimeout(timeoutId)
        cleanup()
        resolve(null)
      }
    }
    
    video.onerror = () => {
      clearTimeout(timeoutId)
      cleanup()
      resolve(null)
    }
    
    // Use custom safe-file protocol for Electron (3 slashes required)
    video.src = `safe-file:///${filePath}`
  })
}

/**
 * Legacy function - kept for backward compatibility
 * Prefer extractAllVideoData() for better performance
 */
export async function extractVideoMetadata(filePath: string): Promise<VideoMetadata | null> {
  const result = await extractAllVideoData(filePath)
  return result?.metadata || null
}

/**
 * Legacy function - kept for backward compatibility
 * Prefer extractAllVideoData() for better performance
 */
export async function getVideoDuration(filePath: string): Promise<number> {
  const result = await extractAllVideoData(filePath)
  if (!result) throw new Error('Failed to load video')
  return result.duration
}

/**
 * Legacy function - kept for backward compatibility
 * Prefer extractAllVideoData() for better performance
 */
export async function generateThumbnail(
  filePath: string,
  timeInSeconds: number = 1
): Promise<string | null> {
  const result = await extractAllVideoData(filePath)
  return result?.thumbnail || null
}

/**
 * Get the filename from a file path
 */
export function getFileName(filePath: string): string {
  return filePath.split('/').pop() || filePath.split('\\').pop() || 'Unknown'
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '00:00'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}
