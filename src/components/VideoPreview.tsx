import { useEffect, useRef, useState, useCallback } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import { formatTime } from '@/utils/videoUtils'
import './VideoPreview.css'

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const currentLoadedPath = useRef<string>('') // Track currently loaded file
  const isLoadingRef = useRef(false) // Prevent concurrent loads
  const isScrubbingRef = useRef(false) // Track if user is scrubbing playhead
  
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
  
  // Helper function to safely load a video source
  const loadVideoSource = useCallback((filePath: string, seekTime: number) => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    const targetSrc = `safe-file:///${filePath}`
    
    // Only load if it's a different file and not already loading
    if (currentLoadedPath.current === filePath) {
      // Same file - just seek
      video.currentTime = seekTime
      return
    }
    
    // Prevent concurrent loads
    if (isLoadingRef.current) {
      return
    }
    
    isLoadingRef.current = true
    currentLoadedPath.current = filePath
    
    // Set up one-time load handler
    const onLoadedMetadata = () => {
      video.currentTime = seekTime
      isLoadingRef.current = false
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
    
    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
    video.src = targetSrc
  }, [])
  
  // Load selected clip into video element
  useEffect(() => {
    if (!selectedClip || !videoRef.current) return
    
    const video = videoRef.current
    
    // Add error handler for missing or corrupt files
    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      const error = target.error
      
      if (error) {
        // Log error but don't show alert (could be transient during rapid seeking)
        console.error('Video preview error:', selectedClip.filePath, error.message || error.code)
        
        // Only show alert for critical errors (file not found)
        if (error.code === 4 || error.code === 2) {
          const fileName = selectedClip.filePath.split('/').pop() || selectedClip.name
          const isTemp = selectedClip.filePath.includes('/clipforge-recordings/')
          
          const errorMessage = isTemp
            ? `Temporary recording file is missing: ${fileName}\n\nThis file may have been deleted.`
            : `Could not load: ${fileName}\n\nThe file may be missing, moved, or corrupted.`
          
          alert(errorMessage)
        }
      }
      
      // Stop playback and reset loading state on error
      setIsPlaying(false)
      isLoadingRef.current = false
    }
    
    video.addEventListener('error', handleError)
    
    // Load the video source safely
    loadVideoSource(selectedClip.filePath, selectedClip.trimStart)
    setCurrentTime(selectedClip.trimStart)
    setDuration(selectedClip.trimEnd - selectedClip.trimStart)
    
    return () => {
      video.removeEventListener('error', handleError)
    }
  }, [selectedClip, loadVideoSource])
  
  // Sync video with playhead position (for scrubbing)
  useEffect(() => {
    if (!videoRef.current || !selectedClip || isPlaying) return
    
    // During scrubbing, only seek within the selected clip - don't auto-switch clips
    if (isScrubbingRef.current) {
      // Check if playhead is within the selected clip's bounds
      const clipEnd = selectedClip.startTime + (selectedClip.trimEnd - selectedClip.trimStart)
      
      if (playheadPosition >= selectedClip.startTime && playheadPosition < clipEnd) {
        // Playhead is within selected clip - seek to position
        const clipRelativeTime = playheadPosition - selectedClip.startTime
        const videoTime = selectedClip.trimStart + clipRelativeTime
        
        if (Math.abs(videoRef.current.currentTime - videoTime) > 0.1) {
          videoRef.current.currentTime = videoTime
          setCurrentTime(videoTime)
        }
      }
      // If playhead is outside selected clip during scrubbing, don't do anything
      // This prevents automatic clip switching during scrubbing
      return
    }
    
    // Not scrubbing - allow automatic clip switching for playback
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
    }
    // Removed automatic clip switching when not scrubbing to prevent infinite loop
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
        // Check if there's a gap between clips
        const currentClipEnd = selectedClip.startTime + (selectedClip.trimEnd - selectedClip.trimStart)
        const hasGap = nextClip.startTime > currentClipEnd + 0.1 // Allow 0.1s tolerance
        
        if (hasGap) {
          // There's a gap - stop playback instead of jumping
          video.pause()
          setIsPlaying(false)
          return
        }
        
        // Load and play next clip
        loadVideoSource(nextClip.filePath, nextClip.trimStart)
        
        // Wait a tiny bit for the load to start, then play
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => setIsPlaying(false))
          }
        }, 50)
        
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
    
    // Sync with timeline playhead (but not during scrubbing to avoid feedback loop)
    if (!isScrubbingRef.current) {
      const timelinePosition = selectedClip.startTime + (currentVideoTime - selectedClip.trimStart)
      setPlayheadPosition(timelinePosition)
    }
  }, [selectedClip, allClips, isPlaying, setPlayheadPosition, loadVideoSource])
  
  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    if (video.paused) {
      // Before playing, ensure we're on a valid clip
      // If playhead is before all clips, jump to first clip
      if (allClips.length > 0) {
        const firstClip = allClips[0]
        if (playheadPosition < firstClip.startTime) {
          setPlayheadPosition(firstClip.startTime)
          loadVideoSource(firstClip.filePath, firstClip.trimStart)
          useTimelineStore.getState().setSelectedClip(firstClip.id)
        }
      }
      
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [allClips, playheadPosition, setPlayheadPosition, loadVideoSource])
  
  // Stop (pause and reset to start of timeline)
  const handleStop = useCallback(() => {
    if (!videoRef.current) return
    
    const video = videoRef.current
    video.pause()
    setIsPlaying(false)
    
    // Move playhead to start of timeline
    setPlayheadPosition(0)
    
    // If there's a first clip, load it and seek to its start
    if (allClips.length > 0) {
      const firstClip = allClips[0]
      loadVideoSource(firstClip.filePath, firstClip.trimStart)
      setCurrentTime(firstClip.trimStart)
      useTimelineStore.getState().setSelectedClip(firstClip.id)
    }
  }, [allClips, setPlayheadPosition, loadVideoSource])
  
  // Jump to start of timeline
  const handleJumpToStart = useCallback(() => {
    if (!videoRef.current) return
    
    // Move playhead to start of timeline
    setPlayheadPosition(0)
    
    // Load first clip if available
    if (allClips.length > 0) {
      const firstClip = allClips[0]
      loadVideoSource(firstClip.filePath, firstClip.trimStart)
      setCurrentTime(firstClip.trimStart)
      useTimelineStore.getState().setSelectedClip(firstClip.id)
    }
  }, [allClips, setPlayheadPosition, loadVideoSource])
  
  // Jump to end of timeline
  const handleJumpToEnd = useCallback(() => {
    if (!videoRef.current || allClips.length === 0) return
    
    // Find the last clip
    const lastClip = allClips[allClips.length - 1]
    const timelineEnd = lastClip.startTime + (lastClip.trimEnd - lastClip.trimStart)
    
    // Move playhead to end of timeline
    setPlayheadPosition(timelineEnd - 0.1)
    
    // Load and seek to last clip
    loadVideoSource(lastClip.filePath, lastClip.trimEnd - 0.1)
    setCurrentTime(lastClip.trimEnd - 0.1)
    useTimelineStore.getState().setSelectedClip(lastClip.id)
  }, [allClips, setPlayheadPosition, loadVideoSource])
  
  // Listen for scrubbing events (playhead dragging)
  useEffect(() => {
    const handleStartScrubbing = () => {
      isScrubbingRef.current = true
      // Pause playback when scrubbing starts
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
    
    const handleEndScrubbing = () => {
      isScrubbingRef.current = false
    }
    
    window.addEventListener('pause-playback', handleStartScrubbing)
    window.addEventListener('scrubbing-end', handleEndScrubbing)
    
    return () => {
      window.removeEventListener('pause-playback', handleStartScrubbing)
      window.removeEventListener('scrubbing-end', handleEndScrubbing)
    }
  }, [])
  
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

