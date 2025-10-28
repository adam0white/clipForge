import { create } from 'zustand'
import { Clip, Track, TimelineState, ProjectFile } from '@/types'

// Library item represents an imported video file
export interface LibraryItem {
  filePath: string
  name: string
  duration: number
  thumbnail?: string
  metadata: any
}

interface TimelineStore extends TimelineState {
  // Library (imported video files, independent of timeline)
  library: LibraryItem[]
  
  // Project metadata
  projectName: string
  projectFilePath: string | null
  
  // Actions
  addClip: (clip: Clip) => void
  removeClip: (clipId: string) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  addTrack: (track: Track) => void
  removeTrack: (trackId: string) => void
  setPlayheadPosition: (position: number) => void
  setSelectedClip: (clipId: string | null) => void
  setZoom: (zoom: number) => void
  clearTimeline: () => void
  
  // Library actions
  addToLibrary: (item: LibraryItem) => void
  removeFromLibrary: (filePath: string) => void
  
  // Project actions
  setProjectName: (name: string) => void
  setProjectFilePath: (path: string | null) => void
  loadProject: (projectData: ProjectFile) => void
  getProjectData: () => ProjectFile
}

const DEFAULT_TRACK_ID = 'track-1'

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  // Initial state
  tracks: [
    {
      id: DEFAULT_TRACK_ID,
      name: 'Video Track 1',
      clips: [],
      isVisible: true,
      isMuted: false,
    },
  ],
  library: [], // Imported video files
  playheadPosition: 0,
  selectedClipId: null,
  zoom: 20, // pixels per second
  duration: 0,
  projectName: 'Untitled Project',
  projectFilePath: null,

  // Actions
  addClip: (clip) =>
    set((state) => {
      const track = state.tracks.find((t) => t.id === clip.trackId) || state.tracks[0]
      const updatedTracks = state.tracks.map((t) =>
        t.id === track.id
          ? { ...t, clips: [...t.clips, clip] }
          : t
      )
      
      // Calculate new timeline duration
      const newDuration = Math.max(
        state.duration,
        clip.startTime + (clip.trimEnd - clip.trimStart)
      )

      return { tracks: updatedTracks, duration: newDuration }
    }),

  removeClip: (clipId) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.filter((clip) => clip.id !== clipId),
      })),
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId,
    })),

  updateClip: (clipId, updates) =>
    set((state) => ({
      tracks: state.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId ? { ...clip, ...updates } : clip
        ),
      })),
    })),

  addTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, track],
    })),

  removeTrack: (trackId) =>
    set((state) => ({
      tracks: state.tracks.filter((track) => track.id !== trackId),
    })),

  setPlayheadPosition: (position) =>
    set({ playheadPosition: position }),

  setSelectedClip: (clipId) =>
    set({ selectedClipId: clipId }),

  setZoom: (zoom) =>
    set({ zoom: Math.max(10, Math.min(100, zoom)) }), // Clamp zoom between 10-100 px/sec

  clearTimeline: () =>
    set({
      tracks: [
        {
          id: DEFAULT_TRACK_ID,
          name: 'Video Track 1',
          clips: [],
          isVisible: true,
          isMuted: false,
        },
      ],
      playheadPosition: 0,
      selectedClipId: null,
      duration: 0,
    }),
  
  // Library actions
  addToLibrary: (item) =>
    set((state) => {
      // Check if item already exists (by filePath)
      const exists = state.library.some(lib => lib.filePath === item.filePath)
      if (exists) return state // Don't add duplicates
      
      return { library: [...state.library, item] }
    }),
  
  removeFromLibrary: (filePath) =>
    set((state) => ({
      library: state.library.filter(item => item.filePath !== filePath),
    })),
  
  // Project actions
  setProjectName: (name) => set({ projectName: name }),
  
  setProjectFilePath: (path) => set({ projectFilePath: path }),
  
  loadProject: (projectData) => {
    // Restore complete timeline state from project file
    set({
      tracks: projectData.timeline.tracks.map(track => ({
        ...track,
        // Ensure clips don't have thumbnails (will be regenerated if needed)
        clips: track.clips.map(clip => ({
          ...clip,
          thumbnail: undefined, // Thumbnails not saved in project file
        })),
      })),
      library: projectData.library,
      playheadPosition: projectData.timeline.playheadPosition,
      zoom: projectData.timeline.zoom,
      duration: projectData.timeline.duration,
      projectName: projectData.name,
      selectedClipId: null, // Reset selection on load
    })
  },
  
  getProjectData: () => {
    const state = get()
    
    // Create project file data structure
    const projectData: ProjectFile = {
      version: '1.0.0',
      name: state.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: {
        tracks: state.tracks.map(track => ({
          id: track.id,
          name: track.name,
          isVisible: track.isVisible,
          isMuted: track.isMuted,
          clips: track.clips.map(clip => ({
            id: clip.id,
            name: clip.name,
            filePath: clip.filePath,
            duration: clip.duration,
            startTime: clip.startTime,
            trimStart: clip.trimStart,
            trimEnd: clip.trimEnd,
            trackId: clip.trackId,
            metadata: clip.metadata,
            // Explicitly exclude thumbnail (too large for project file)
          })),
        })),
        playheadPosition: state.playheadPosition,
        zoom: state.zoom,
        duration: state.duration,
      },
      library: state.library.map(item => ({
        filePath: item.filePath,
        name: item.name,
        duration: item.duration,
        metadata: item.metadata,
        // Explicitly exclude thumbnail
      })),
    }
    
    return projectData
  },
}))

