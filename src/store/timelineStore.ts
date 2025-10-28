import { create } from 'zustand'
import { Clip, Track, TimelineState } from '@/types'

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
}

const DEFAULT_TRACK_ID = 'track-1'

export const useTimelineStore = create<TimelineStore>((set) => ({
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
}))

