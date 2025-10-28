import { useState, useCallback } from 'react'
import { useTimelineStore, LibraryItem } from '@/store/timelineStore'
import { formatTime } from '@/utils/videoUtils'
import { Clip } from '@/types'
import './MediaLibrary.css'

interface MediaLibraryProps {
  onImport: (filePaths: string[]) => void
}

export function MediaLibrary({ onImport }: MediaLibraryProps) {
  const [isDragging, setIsDragging] = useState(false)
  const library = useTimelineStore((state) => state.library)
  const tracks = useTimelineStore((state) => state.tracks)
  const addClip = useTimelineStore((state) => state.addClip)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    try {
      const files = Array.from(e.dataTransfer.files)
      
      // Use Electron's webUtils to get file paths from File objects
      const filePaths = files.map(file => window.electron.getPathForFile(file))
      
      if (filePaths.length > 0) {
        onImport(filePaths)
      }
    } catch (error) {
      console.error('[Drag&Drop] Error processing dropped files:', error)
    }
  }, [onImport])

  const handleFilePickerClick = async () => {
    const result = await window.electron.showOpenDialog()
    if (!result.canceled && result.filePaths.length > 0) {
      onImport(result.filePaths)
    }
  }
  
  // Add clip from library to timeline
  const handleClipClick = useCallback((libraryItem: LibraryItem) => {
    const defaultTrack = tracks[0]
    const trackId = defaultTrack?.id || 'track-1'
    
    // Calculate position at the end of the timeline
    const existingClips = defaultTrack?.clips || []
    const startTime = existingClips.length > 0
      ? Math.max(...existingClips.map(c => c.startTime + (c.trimEnd - c.trimStart)))
      : 0
    
    // Create a new clip instance from library item
    const newClip: Clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: libraryItem.name,
      filePath: libraryItem.filePath,
      duration: libraryItem.duration,
      startTime,
      trimStart: 0,
      trimEnd: libraryItem.duration,
      trackId,
      thumbnail: libraryItem.thumbnail,
      metadata: libraryItem.metadata,
    }
    
    addClip(newClip)
  }, [tracks, addClip])

  return (
    <aside className="media-library">
      <h2>Media Library</h2>
      
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFilePickerClick}
      >
        <div className="drop-zone-content">
          <svg className="drop-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="drop-zone-text">
            {isDragging ? 'Drop files here' : 'Drop video files here or click to browse'}
          </p>
          <p className="drop-zone-hint">Supported: MP4, MOV, AVI, MKV, WebM</p>
        </div>
      </div>

      <div className="media-grid">
        {library.map(item => (
          <div 
            key={item.filePath} 
            className="media-item"
            onClick={() => handleClipClick(item)}
            title="Click to add to timeline"
          >
            {item.thumbnail ? (
              <img 
                src={item.thumbnail} 
                alt={item.name}
                className="media-thumbnail"
              />
            ) : (
              <div className="media-thumbnail-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <div className="media-info">
              <div className="media-name" title={item.name}>{item.name}</div>
              <div className="media-duration">{formatTime(item.duration)}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

