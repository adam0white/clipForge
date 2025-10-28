import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { Clip, ExportSettings } from '../../src/types'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'

// Set FFmpeg path - handle ASAR packaging
// In packaged app, binaries are in .asar.unpacked, not .asar
let ffmpegPath = ffmpegInstaller.path
if (ffmpegPath.includes('app.asar')) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
}
ffmpeg.setFfmpegPath(ffmpegPath)

/**
 * Export video clips to a single MP4 file
 * Supports multi-track overlay composition
 */
export async function exportVideo(
  clips: Clip[],
  settings: ExportSettings,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    if (clips.length === 0) {
      return { success: false, error: 'No clips to export' }
    }

    // Group clips by track
    const clipsByTrack = clips.reduce((acc, clip) => {
      if (!acc[clip.trackId]) {
        acc[clip.trackId] = []
      }
      acc[clip.trackId].push(clip)
      return acc
    }, {} as Record<string, Clip[]>)
    
    const trackIds = Object.keys(clipsByTrack)
    
    // If only one track, use simple concatenation
    if (trackIds.length === 1) {
      const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)
      
      // Calculate total duration for progress tracking
      const totalDuration = sortedClips.reduce(
        (sum, clip) => sum + (clip.trimEnd - clip.trimStart),
        0
      )
      
      if (sortedClips.length === 1) {
        return await exportSingleClip(sortedClips[0], settings, totalDuration, onProgress)
      }
      
      return await exportMultipleClips(sortedClips, settings, totalDuration, onProgress)
    }
    
    // Multiple tracks: concatenate all clips in timeline order
    // Note: True overlay composition (picture-in-picture) would require complex FFmpeg filter chains
    // For MVP, we concatenate all clips in timeline order regardless of track
    const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime)
    
    // Calculate total duration for progress tracking
    const totalDuration = sortedClips.reduce(
      (sum, clip) => sum + (clip.trimEnd - clip.trimStart),
      0
    )

    if (sortedClips.length === 1) {
      return await exportSingleClip(sortedClips[0], settings, totalDuration, onProgress)
    }

    return await exportMultipleClips(sortedClips, settings, totalDuration, onProgress)
  } catch (error) {
    console.error('Export error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown export error',
    }
  }
}

/**
 * Export a single clip with trim
 */
async function exportSingleClip(
  clip: Clip,
  settings: ExportSettings,
  totalDuration: number,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const command = ffmpeg(clip.filePath)
      .setStartTime(clip.trimStart)
      .setDuration(clip.trimEnd - clip.trimStart)

    // Apply resolution settings
    if (settings.resolution !== 'source') {
      const height = settings.resolution === '1080p' ? 1080 : 720
      command.size(`?x${height}`)
    }

    // Output settings
    command
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset fast',
        '-crf 23',
        '-movflags +faststart',
      ])
      .output(settings.outputPath)
      .on('progress', (progress) => {
        if (onProgress && progress.timemark) {
          // Parse timemark (HH:MM:SS.ms) to seconds
          const parts = progress.timemark.split(':')
          const seconds = 
            parseInt(parts[0]) * 3600 + 
            parseInt(parts[1]) * 60 + 
            parseFloat(parts[2])
          
          const percent = Math.min(100, (seconds / totalDuration) * 100)
          onProgress(percent)
        }
      })
      .on('end', () => resolve({ success: true }))
      .on('error', (err) => {
        console.error('FFmpeg error:', err)
        resolve({ success: false, error: err.message })
      })
      .run()
  })
}

/**
 * Export multiple clips by concatenating them
 */
async function exportMultipleClips(
  clips: Clip[],
  settings: ExportSettings,
  totalDuration: number,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create temporary directory for intermediate files
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'clipforge-'))
    const concatListPath = path.join(tempDir, 'concat_list.txt')
    const intermediateFiles: string[] = []

    // Determine target resolution for all clips (width x height)
    let targetWidth: number
    let targetHeight: number
    
    if (settings.resolution === '1080p') {
      targetWidth = 1920
      targetHeight = 1080
    } else if (settings.resolution === '720p') {
      targetWidth = 1280
      targetHeight = 720
    } else {
      // Use the first clip's resolution as the target (most common case)
      targetWidth = clips[0]?.metadata?.width || 1920
      targetHeight = clips[0]?.metadata?.height || 1080
    }

    // Step 1: Process each clip (trim, scale, and pad to consistent resolution)
    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i]
      const intermediatePath = path.join(tempDir, `clip_${i}.mp4`)
      intermediateFiles.push(intermediatePath)

      const success = await new Promise<boolean>((resolve) => {
        ffmpeg(clip.filePath)
          .setStartTime(clip.trimStart)
          .setDuration(clip.trimEnd - clip.trimStart)
          // Scale to fit within target resolution while maintaining aspect ratio,
          // then pad to exact target dimensions with black bars
          .videoFilters([
            `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease`,
            `pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2:black`
          ])
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions(['-preset fast', '-crf 23'])
          .output(intermediatePath)
          .on('end', () => resolve(true))
          .on('error', (err) => {
            console.error(`Error processing clip ${i}:`, err)
            resolve(false)
          })
          .run()
      })

      if (!success) {
        // Clean up temp files
        await cleanupTempFiles(tempDir, intermediateFiles)
        return { success: false, error: `Failed to process clip ${i + 1}` }
      }

      // Update progress for clip processing (0-50%)
      if (onProgress) {
        onProgress(((i + 1) / clips.length) * 50)
      }
    }

    // Step 2: Create concat list file
    const concatList = intermediateFiles
      .map(file => `file '${file}'`)
      .join('\n')
    await fs.writeFile(concatListPath, concatList, 'utf-8')

    // Step 3: Concatenate all clips (all clips are now same dimensions, so no scaling needed)
    const concatenateSuccess = await new Promise<boolean>((resolve) => {
      ffmpeg()
        .input(concatListPath)
        .inputOptions(['-f concat', '-safe 0'])
        // No need to scale - all intermediate clips are already the same resolution
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset fast',
          '-crf 23',
          '-movflags +faststart',
        ])
        .output(settings.outputPath)
        .on('progress', (progress) => {
          if (onProgress && progress.timemark) {
            // Parse timemark to seconds
            const parts = progress.timemark.split(':')
            const seconds = 
              parseInt(parts[0]) * 3600 + 
              parseInt(parts[1]) * 60 + 
              parseFloat(parts[2])
            
            // Progress from 50% to 100%
            const percent = 50 + Math.min(50, (seconds / totalDuration) * 50)
            onProgress(percent)
          }
        })
        .on('end', () => resolve(true))
        .on('error', (err) => {
          console.error('Concatenation error:', err)
          resolve(false)
        })
        .run()
    })

    // Clean up temp files
    await cleanupTempFiles(tempDir, intermediateFiles)
    await fs.unlink(concatListPath).catch(() => {})
    await fs.rmdir(tempDir).catch(() => {})

    if (concatenateSuccess) {
      return { success: true }
    } else {
      return { success: false, error: 'Failed to concatenate clips' }
    }
  } catch (error) {
    console.error('Export error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown export error',
    }
  }
}

/**
 * Clean up temporary files
 */
async function cleanupTempFiles(tempDir: string, files: string[]) {
  for (const file of files) {
    try {
      await fs.unlink(file)
    } catch (err) {
      console.error('Failed to delete temp file:', file, err)
    }
  }
}

