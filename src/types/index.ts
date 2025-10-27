// Core type definitions for ClipForge

export interface Clip {
  id: string
  name: string
  filePath: string
  duration: number // in seconds
  startTime: number // position on timeline in seconds
  trimStart: number // trim in point (seconds from start of source video)
  trimEnd: number // trim out point (seconds from start of source video)
  trackId: string
  thumbnail?: string
  metadata?: VideoMetadata
}

export interface VideoMetadata {
  width: number
  height: number
  codec: string
  frameRate: number
  bitrate?: number
}

export interface Track {
  id: string
  name: string
  clips: Clip[]
  isVisible: boolean
  isMuted: boolean
}

export interface TimelineState {
  tracks: Track[]
  playheadPosition: number // in seconds
  selectedClipId: string | null
  zoom: number // pixels per second
  duration: number // total timeline duration in seconds
}

export interface ExportSettings {
  outputPath: string
  resolution: '720p' | '1080p' | 'source'
  format: 'mp4'
  codec: 'h264'
}

// IPC Channel names for type-safe communication
export const IPC_CHANNELS = {
  FILE_IMPORT: 'file:import',
  FILE_EXPORT: 'file:export',
  VIDEO_METADATA: 'video:metadata',
  FFMPEG_PROGRESS: 'ffmpeg:progress',
  FFMPEG_EXPORT: 'ffmpeg:export',
} as const

// IPC message types
export interface ImportFileRequest {
  filePaths: string[]
}

export interface ExportRequest {
  clips: Clip[]
  settings: ExportSettings
}

export interface ExportProgress {
  percent: number
  currentClip: number
  totalClips: number
  message: string
}

