import { useEffect, useRef, useState, useCallback } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import { formatTime } from '@/utils/videoUtils'
import './VideoPreview.css'

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  
  const tracks = useTimelineStore((state) => state.tracks)
  const selectedClipId = useTimelineStore((state) => state.selectedClipId)
  const setPlayheadPosition = useTimelineStore((state) => state.setPlayheadPosition)
  const playheadPosition = useTimelineStore((state) => state.playheadPosition)
  
  // Get all clips sorted by timeline position
  const allClips = tracks
    .flatMap(track => track.clips)
    .sort((a, b) => a.startTime - b.startTime)
  
  // Get the selected clip (or first clip if none selected)
  const selectedClip = selectedClipId
    ? allClips.find(clip => clip.id === selectedClipId)
    : allClips[0]
  
  // Load selected clip into video element
  useEffect(() => {
    if (!selectedClip || !videoRef.current) return
    
    const video = videoRef.current
    
    // Add error handler to prevent infinite loop
    const handleError = (e: Event) => {
      // WebM files from recordings may not load immediately - this is often normal
      const isWebM = selectedClip.filePath.toLowerCase().endsWith('.webm')
      if (!isWebM) {
        console.error('Video preview failed to load:', selectedClip.filePath)
      }
      // Don't retry - just stop
      video.removeEventListener('error', handleError)
    }
    
    video.addEventListener('error', handleError, { once: true })
    
    // IMPORTANT: Use 3 slashes (safe-file:///) for proper URL parsing
    video.src = `safe-file:///${selectedClip.filePath}`
    video.currentTime = selectedClip.trimStart
    setCurrentTime(selectedClip.trimStart)
    setDuration(selectedClip.trimEnd - selectedClip.trimStart)
    
    return () => {
      video.removeEventListener('error', handleError)
    }
  }, [selectedClip])
  
  // Sync video with playhead position (for scrubbing)
  useEffect(() => {
    if (!videoRef.current || !selectedClip || isPlaying) return
    
    // Find which clip the playhead is currently on
    const currentClip = allClips.find(
      clip => playheadPosition >= clip.startTime && 
              playheadPosition < clip.startTime + (clip.trimEnd - clip.trimStart)
    )
    
    if (currentClip && currentClip.id === selectedClip.id) {
      // Playhead is on the selected clip - seek to the correct position
      const clipRelativeTime = playheadPosition - currentClip.startTime
      const videoTime = currentClip.trimStart + clipRelativeTime
      
      if (Math.abs(videoRef.current.currentTime - videoTime) > 0.1) {
        videoRef.current.currentTime = videoTime
        setCurrentTime(videoTime)
      }
    } else if (currentClip && currentClip.id !== selectedClip.id) {
      // Playhead moved to a different clip - switch to it
      const video = videoRef.current
      video.src = `safe-file:///${currentClip.filePath}`
      
      const clipRelativeTime = playheadPosition - currentClip.startTime
      const videoTime = currentClip.trimStart + clipRelativeTime
      video.currentTime = videoTime
      setCurrentTime(videoTime)
      
      useTimelineStore.getState().setSelectedClip(currentClip.id)
    }
  }, [playheadPosition, selectedClip, allClips, isPlaying])
  
  // Update current time
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !selectedClip) return
    
    const video = videoRef.current
    const currentVideoTime = video.currentTime
    
    // Check if we've reached the end of the current clip
    if (currentVideoTime >= selectedClip.trimEnd) {
      // Find the next clip
      const currentIndex = allClips.findIndex(c => c.id === selectedClip.id)
      const nextClip = allClips[currentIndex + 1]
      
      if (nextClip && isPlaying) {
        // Load and play next clip
        video.src = `safe-file:///${nextClip.filePath}`
        video.currentTime = nextClip.trimStart
        video.play().catch(() => setIsPlaying(false))
        useTimelineStore.getState().setSelectedClip(nextClip.id)
      } else {
        // No more clips - stop playback
        video.pause()
        video.currentTime = selectedClip.trimStart
        setIsPlaying(false)
      }
      return
    }
    
    // Ensure playback stays within trim range
    if (currentVideoTime < selectedClip.trimStart) {
      video.currentTime = selectedClip.trimStart
    }
    
    setCurrentTime(currentVideoTime)
    
    // Sync with timeline playhead
    const timelinePosition = selectedClip.startTime + (currentVideoTime - selectedClip.trimStart)
    setPlayheadPosition(timelinePosition)
  }, [selectedClip, allClips, isPlaying, setPlayheadPosition])
  
  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])
  
  // Stop (pause and reset to start)
  const handleStop = useCallback(() => {
    if (!videoRef.current || !selectedClip) return
    
    const video = videoRef.current
    video.pause()
    video.currentTime = selectedClip.trimStart
    setIsPlaying(false)
    setCurrentTime(selectedClip.trimStart)
  }, [selectedClip])
  
  // Jump to start of clip
  const handleJumpToStart = useCallback(() => {
    if (!videoRef.current || !selectedClip) return
    
    const video = videoRef.current
    video.currentTime = selectedClip.trimStart
    setCurrentTime(selectedClip.trimStart)
  }, [selectedClip])
  
  // Jump to end of clip
  const handleJumpToEnd = useCallback(() => {
    if (!videoRef.current || !selectedClip) return
    
    const video = videoRef.current
    video.currentTime = selectedClip.trimEnd - 0.1 // Slightly before end
    setCurrentTime(selectedClip.trimEnd - 0.1)
  }, [selectedClip])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        handlePlayPause()
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handlePlayPause])
  
  const clipDuration = selectedClip 
    ? selectedClip.trimEnd - selectedClip.trimStart 
    : 0
  const relativeTime = selectedClip 
    ? currentTime - selectedClip.trimStart 
    : 0
  
  return (
    <section className="video-preview">
      <div className="preview-container">
        {selectedClip ? (
          <video
            ref={videoRef}
            className="preview-video"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <div className="preview-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p>Select a clip to preview</p>
          </div>
        )}
      </div>
      
      <div className="playback-controls">
        <button 
          className="btn-control" 
          onClick={handleJumpToStart}
          disabled={!selectedClip}
          title="Jump to start"
        >
          ⏮
        </button>
        <button 
          className="btn-control btn-play" 
          onClick={handlePlayPause}
          disabled={!selectedClip}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          className="btn-control" 
          onClick={handleStop}
          disabled={!selectedClip}
          title="Stop"
        >
          ⏹
        </button>
        <button 
          className="btn-control" 
          onClick={handleJumpToEnd}
          disabled={!selectedClip}
          title="Jump to end"
        >
          ⏭
        </button>
        <span className="timecode">
          {selectedClip 
            ? `${formatTime(relativeTime)} / ${formatTime(clipDuration)}`
            : '00:00 / 00:00'
          }
        </span>
      </div>
    </section>
  )
}

