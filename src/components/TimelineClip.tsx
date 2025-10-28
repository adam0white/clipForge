import { Clip } from '@/types'
import { useTimelineStore } from '@/store/timelineStore'
import { formatTime } from '@/utils/videoUtils'
import { useState, useCallback, useRef, useEffect } from 'react'
import './TimelineClip.css'

interface TimelineClipProps {
  clip: Clip
  zoom: number
}

export function TimelineClip({ clip, zoom }: TimelineClipProps) {
  const selectedClipId = useTimelineStore((state) => state.selectedClipId)
  const setSelectedClip = useTimelineStore((state) => state.setSelectedClip)
  const updateClip = useTimelineStore((state) => state.updateClip)
  const removeClip = useTimelineStore((state) => state.removeClip)
  
  const [isDraggingLeft, setIsDraggingLeft] = useState(false)
  const [isDraggingRight, setIsDraggingRight] = useState(false)
  const dragStartX = useRef(0)
  const initialTrim = useRef({ start: 0, end: 0, startTime: 0 })
  
  // Optimistic UI: Local state for immediate visual feedback
  const [optimisticTrimStart, setOptimisticTrimStart] = useState(clip.trimStart)
  const [optimisticTrimEnd, setOptimisticTrimEnd] = useState(clip.trimEnd)
  const [optimisticStartTime, setOptimisticStartTime] = useState(clip.startTime)
  
  // Sync optimistic state with actual clip state when not dragging
  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) {
      setOptimisticTrimStart(clip.trimStart)
      setOptimisticTrimEnd(clip.trimEnd)
      setOptimisticStartTime(clip.startTime)
    }
  }, [clip.trimStart, clip.trimEnd, clip.startTime, isDraggingLeft, isDraggingRight])
  
  // Calculate visual properties using optimistic state
  const clipDuration = optimisticTrimEnd - optimisticTrimStart
  const width = isFinite(clipDuration) && clipDuration > 0 ? clipDuration * zoom : 100 // Fallback to 100px
  const left = isFinite(optimisticStartTime) ? optimisticStartTime * zoom : 0
  
  const isSelected = selectedClipId === clip.id
  
  const handleClick = (e: React.MouseEvent) => {
    // Don't select if clicking on handles
    if ((e.target as HTMLElement).classList.contains('clip-handle')) {
      return
    }
    setSelectedClip(clip.id)
  }
  
  // Handle left trim (in point)
  const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingLeft(true)
    dragStartX.current = e.clientX
    initialTrim.current = { start: clip.trimStart, end: clip.trimEnd, startTime: clip.startTime }
    setSelectedClip(clip.id)
  }, [clip.trimStart, clip.trimEnd, clip.startTime, clip.id, setSelectedClip])
  
  // Handle right trim (out point)
  const handleRightMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDraggingRight(true)
    dragStartX.current = e.clientX
    initialTrim.current = { start: clip.trimStart, end: clip.trimEnd, startTime: clip.startTime }
    setSelectedClip(clip.id)
  }, [clip.trimStart, clip.trimEnd, clip.startTime, clip.id, setSelectedClip])
  
  // Mouse move handler with optimistic UI
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLeft && !isDraggingRight) return
    
    const deltaX = e.clientX - dragStartX.current
    const deltaTime = deltaX / zoom
    
    if (isDraggingLeft) {
      // Trim from start - moves clip forward and adjusts in-point
      const newTrimStart = Math.max(
        0,
        Math.min(
          initialTrim.current.end - 0.5, // Minimum 0.5s clip duration
          initialTrim.current.start + deltaTime
        )
      )
      
      // When trimming from start, we need to move the clip's start position too
      const actualDelta = newTrimStart - initialTrim.current.start
      const newStartTime = initialTrim.current.startTime + actualDelta
      
      // Optimistic update - immediate visual feedback
      setOptimisticTrimStart(newTrimStart)
      setOptimisticStartTime(newStartTime)
      
      // Store update - actual state
      updateClip(clip.id, { 
        trimStart: newTrimStart,
        startTime: newStartTime
      })
    } else if (isDraggingRight) {
      // Trim from end - only adjusts out-point
      const newTrimEnd = Math.min(
        clip.duration,
        Math.max(
          initialTrim.current.start + 0.5, // Minimum 0.5s clip duration
          initialTrim.current.end + deltaTime
        )
      )
      
      // Optimistic update - immediate visual feedback
      setOptimisticTrimEnd(newTrimEnd)
      
      // Store update - actual state
      updateClip(clip.id, { trimEnd: newTrimEnd })
    }
  }, [isDraggingLeft, isDraggingRight, zoom, clip.id, clip.duration, updateClip])
  
  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsDraggingLeft(false)
    setIsDraggingRight(false)
  }, [])
  
  // Delete handler
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    removeClip(clip.id)
  }, [clip.id, removeClip])
  
  // Set up global mouse listeners when dragging
  useEffect(() => {
    if (isDraggingLeft || isDraggingRight) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingLeft, isDraggingRight, handleMouseMove, handleMouseUp])
  
  return (
    <div
      className={`timeline-clip ${isSelected ? 'selected' : ''}`}
      style={{
        width: `${width}px`,
        left: `${left}px`,
      }}
      onClick={handleClick}
    >
      {/* Thumbnail background */}
      {clip.thumbnail && (
        <div 
          className="clip-thumbnail"
          style={{ backgroundImage: `url(${clip.thumbnail})` }}
        />
      )}
      
      {/* Clip info */}
      <div className="clip-info">
        <div className="clip-name">{clip.name}</div>
        <div className="clip-duration">{formatTime(clipDuration)}</div>
      </div>
      
      {/* Delete button (only show when selected) */}
      {isSelected && (
        <button 
          className="clip-delete-btn"
          onClick={handleDelete}
          title="Delete clip"
        >
          ×
        </button>
      )}
      
      {/* Resize handles */}
      <div 
        className="clip-handle clip-handle-left" 
        onMouseDown={handleLeftMouseDown}
      />
      <div 
        className="clip-handle clip-handle-right"
        onMouseDown={handleRightMouseDown}
      />
    </div>
  )
}

