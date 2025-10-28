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

// Desktop Capture Types
export interface DesktopCapturerSource {
  id: string
  name: string
  thumbnail: string // base64 data URL
  display_id?: string
  appIcon?: string
}

// IPC Channel names for type-safe communication
export const IPC_CHANNELS = {
  FILE_IMPORT: 'file:import',
  FILE_EXPORT: 'file:export',
  VIDEO_METADATA: 'video:metadata',
  FFMPEG_PROGRESS: 'ffmpeg:progress',
  FFMPEG_EXPORT: 'ffmpeg:export',
  PROJECT_SAVE: 'project:save',
  PROJECT_LOAD: 'project:load',
  RECORDING_GET_SOURCES: 'recording:get-sources',
  RECORDING_SAVE_TEMP: 'recording:save-temp',
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

// Project file format for save/load functionality
export interface ProjectFile {
  version: string // Schema version for future compatibility
  name: string // Project name
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
  timeline: {
    tracks: ProjectTrack[]
    playheadPosition: number
    zoom: number
    duration: number
  }
  library: ProjectLibraryItem[]
}

export interface ProjectTrack {
  id: string
  name: string
  clips: ProjectClip[]
  isVisible: boolean
  isMuted: boolean
}

export interface ProjectClip {
  id: string
  name: string
  filePath: string
  duration: number
  startTime: number
  trimStart: number
  trimEnd: number
  trackId: string
  metadata?: VideoMetadata
}

export interface ProjectLibraryItem {
  filePath: string
  name: string
  duration: number
  metadata: any
}

