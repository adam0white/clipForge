import { useRef, useEffect, useState, useCallback } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import { TimelineTrack } from './TimelineTrack'
import { formatTime } from '@/utils/videoUtils'
import './Timeline.css'

export function Timeline() {
  const tracks = useTimelineStore((state) => state.tracks)
  const zoom = useTimelineStore((state) => state.zoom)
  const setZoom = useTimelineStore((state) => state.setZoom)
  const duration = useTimelineStore((state) => state.duration)
  const playheadPosition = useTimelineStore((state) => state.playheadPosition)
  const setPlayheadPosition = useTimelineStore((state) => state.setPlayheadPosition)
  const selectedClipId = useTimelineStore((state) => state.selectedClipId)
  const splitClip = useTimelineStore((state) => state.splitClip)
  const removeClip = useTimelineStore((state) => state.removeClip)
  const addTrack = useTimelineStore((state) => state.addTrack)
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false)
  
  // Calculate timeline width based on duration and zoom
  const timelineWidth = Math.max(duration * zoom, 800)
  
  // Generate time markers every 5 seconds
  const markers = []
  const markerInterval = 5 // seconds
  for (let i = 0; i <= Math.ceil(duration / markerInterval); i++) {
    const time = i * markerInterval
    markers.push({
      time,
      position: time * zoom,
      label: formatTime(time),
    })
  }
  
  const handleZoomIn = () => setZoom(zoom + 10)
  const handleZoomOut = () => setZoom(zoom - 10)
  
  const handleSplit = () => {
    if (!selectedClipId) {
      alert('Please select a clip to split')
      return
    }
    
    // Split at playhead position
    splitClip(selectedClipId, playheadPosition)
  }
  
  const handleAddTrack = () => {
    const newTrack = {
      id: `track-${Date.now()}`,
      name: `Video Track ${tracks.length + 1}`,
      clips: [],
      isVisible: true,
      isMuted: false,
    }
    addTrack(newTrack)
  }
  
  // Playhead dragging
  const handlePlayheadMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingPlayhead(true)
    
    // Pause playback when dragging playhead
    window.dispatchEvent(new CustomEvent('pause-playback'))
  }, [])
  
  const handlePlayheadMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPlayhead || !timelineRef.current) return
    
    const timeline = timelineRef.current
    const rect = timeline.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const newPosition = Math.max(0, Math.min(duration, offsetX / zoom))
    
    setPlayheadPosition(newPosition)
  }, [isDraggingPlayhead, zoom, duration, setPlayheadPosition])
  
  const handlePlayheadMouseUp = useCallback(() => {
    setIsDraggingPlayhead(false)
  }, [])
  
  // Playhead drag listeners
  useEffect(() => {
    if (isDraggingPlayhead) {
      window.addEventListener('mousemove', handlePlayheadMouseMove)
      window.addEventListener('mouseup', handlePlayheadMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handlePlayheadMouseMove)
        window.removeEventListener('mouseup', handlePlayheadMouseUp)
      }
    }
  }, [isDraggingPlayhead, handlePlayheadMouseMove, handlePlayheadMouseUp])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      // Split clip (S key)
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (selectedClipId) {
          splitClip(selectedClipId, playheadPosition)
        }
      }
      
      // Delete clip (Delete or Backspace key)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        if (selectedClipId) {
          removeClip(selectedClipId)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedClipId, playheadPosition, splitClip, removeClip])
  
  return (
    <section className="timeline-section">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-controls">
          <button 
            className="btn-split" 
            onClick={handleSplit}
            disabled={!selectedClipId}
            title="Split clip at playhead (S)"
          >
            ✂️ Split
          </button>
          <button 
            className="btn-add-track" 
            onClick={handleAddTrack}
            title="Add new track"
          >
            ➕ Track
          </button>
          <div className="zoom-controls">
            <button 
              className="btn-zoom" 
              onClick={handleZoomOut}
              disabled={zoom <= 10}
              title="Zoom out"
            >
              -
            </button>
            <span className="zoom-level">{Math.round((zoom / 20) * 100)}%</span>
            <button 
              className="btn-zoom" 
              onClick={handleZoomIn}
              disabled={zoom >= 100}
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>
      
      <div className="timeline-scroll-container" ref={timelineRef}>
        <div className="timeline-container" style={{ width: timelineWidth }}>
          {/* Time ruler */}
          <div className="timeline-ruler">
            {markers.map((marker, index) => (
              <div
                key={index}
                className="timeline-marker"
                style={{ left: marker.position }}
              >
                {marker.label}
              </div>
            ))}
          </div>
          
          {/* Playhead */}
          <div 
            className={`timeline-playhead ${isDraggingPlayhead ? 'dragging' : ''}`}
            style={{ left: playheadPosition * zoom }}
          >
            <div className="playhead-line" />
            <div 
              className="playhead-handle" 
              onMouseDown={handlePlayheadMouseDown}
            />
          </div>
          
          {/* Tracks */}
          <div className="timeline-tracks">
            {tracks.map((track, index) => (
              <TimelineTrack key={track.id} track={track} zoom={zoom} trackIndex={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

