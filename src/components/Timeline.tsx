import { useRef } from 'react'
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
  
  const timelineRef = useRef<HTMLDivElement>(null)
  
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
  
  return (
    <section className="timeline-section">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-controls">
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
            className="timeline-playhead" 
            style={{ left: playheadPosition * zoom }}
          >
            <div className="playhead-line" />
            <div className="playhead-handle" />
          </div>
          
          {/* Tracks */}
          <div className="timeline-tracks">
            {tracks.map(track => (
              <TimelineTrack key={track.id} track={track} zoom={zoom} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

