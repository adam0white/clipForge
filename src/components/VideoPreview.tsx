import { useEffect, useRef, useState, useCallback } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import { formatTime } from '@/utils/videoUtils'
import './VideoPreview.css'

const SEEK_TOLERANCE = 0.03
const MAX_SEEK_ATTEMPTS = 4
const SEEK_TIMEOUT_MS = 1200
const SEEK_RETRY_DELAY_MS = 30

export function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const currentLoadedPath = useRef<string>('') // Track currently loaded file
  const isLoadingRef = useRef(false) // Prevent concurrent loads
  const isScrubbingRef = useRef(false) // Track if user is scrubbing playhead
  const lastSeekTime = useRef<number>(0) // Prevent rapid seeking
  const isResumingRef = useRef(false) // Prevent load effect from interfering with resume
  const videoElementId = useRef<number>(0) // Track video element identity
  const pendingLoadPromise = useRef<Promise<void> | null>(null)
  const lastLoadedClipSignature = useRef<string | null>(null)
  const scrubSyncPromise = useRef<Promise<void> | null>(null)
  const pendingSeekPromise = useRef<Promise<void> | null>(null) // Prevent concurrent seeks
  const resumingTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  const seekSafely = useCallback(async (targetTime: number) => {
    const video = videoRef.current
    if (!video || Number.isNaN(targetTime)) return
    
    // Wait for any pending seek to complete first
    if (pendingSeekPromise.current) {
      try {
        await pendingSeekPromise.current
      } catch (error) {
        console.warn('Pending seek failed:', error)
      }
    }

    const withinTolerance = (value: number) => Math.abs(value - targetTime) <= SEEK_TOLERANCE

    if (withinTolerance(video.currentTime)) {
      return
    }

    // Create the seek operation and store it
    const seekOperation = (async () => {
      // Always wait for canplay to ensure video is truly ready for seeking
      if (video.readyState < 3) {
        await new Promise<void>((resolve) => {
          const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay)
            resolve()
          }
          video.addEventListener('canplay', onCanPlay, { once: true })
        })
      }

      for (let attempt = 1; attempt <= MAX_SEEK_ATTEMPTS; attempt += 1) {
        const beforeTime = video.currentTime
        
        // Set currentTime and check if browser accepts it
        video.currentTime = targetTime
        const immediateTime = video.currentTime
        
        // If browser rejected the assignment immediately, it's likely suspended
        if (Math.abs(immediateTime - targetTime) > SEEK_TOLERANCE && Math.abs(immediateTime - beforeTime) < 0.001) {
          // Force the browser to reload data
          video.load()
          
          // Wait for loadeddata to ensure data is actually loaded
          await new Promise<void>((resolve) => {
            const onLoadedData = () => {
              video.removeEventListener('loadeddata', onLoadedData)
              video.removeEventListener('canplay', onCanPlay)
              resolve()
            }
            const onCanPlay = () => {
              video.removeEventListener('loadeddata', onLoadedData)
              video.removeEventListener('canplay', onCanPlay)
              resolve()
            }
            video.addEventListener('loadeddata', onLoadedData, { once: true })
            video.addEventListener('canplay', onCanPlay, { once: true })
            
            // Timeout fallback
            setTimeout(() => {
              video.removeEventListener('loadeddata', onLoadedData)
              video.removeEventListener('canplay', onCanPlay)
              resolve()
            }, 1000)
          })
          
          // Try setting again after reload
          video.currentTime = targetTime
        }

        // Wait for seeked event
        await new Promise<void>((resolve, reject) => {
          let timeoutId: ReturnType<typeof setTimeout> | null = null

          const cleanup = () => {
            video.removeEventListener('seeked', onSeeked)
            video.removeEventListener('error', onError)
            if (timeoutId) clearTimeout(timeoutId)
          }

          const onSeeked = () => {
            cleanup()
            resolve()
          }

          const onError = (event: Event) => {
            const message = (event as any)?.message ?? video.error?.message ?? 'Video seek error'
            cleanup()
            reject(new Error(message))
          }

          video.addEventListener('seeked', onSeeked, { once: true })
          video.addEventListener('error', onError, { once: true })

          timeoutId = setTimeout(() => {
            cleanup()
            resolve()
          }, SEEK_TIMEOUT_MS)
        })

        if (withinTolerance(video.currentTime)) {
          return
        }

        await new Promise((resolve) => setTimeout(resolve, SEEK_RETRY_DELAY_MS))
      }

      throw new Error(`Seek failed (target=${targetTime}, current=${videoRef.current?.currentTime})`)
    })()

    pendingSeekPromise.current = seekOperation
    
    try {
      await seekOperation
    } finally {
      // Only clear if this is still the current pending seek
      if (pendingSeekPromise.current === seekOperation) {
        pendingSeekPromise.current = null
      }
    }
  }, [])

  
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
  const loadVideoSource = useCallback(async (filePath: string, seekTime: number) => {
    if (!videoRef.current) return

    const video = videoRef.current
    const targetSrc = `safe-file:///${filePath}`
    const fileName = filePath.split('/').pop()

    if (pendingLoadPromise.current) {
      try {
        await pendingLoadPromise.current
      } catch (error) {
        console.error('Pending load failed:', error)
      }
    }

    if (currentLoadedPath.current === filePath) {
      await seekSafely(seekTime)
      return
    }

    const previousPath = currentLoadedPath.current

    const loadPromise = new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata)
        video.removeEventListener('error', onError)
      }

      const onLoadedMetadata = () => {
        cleanup()
        resolve()
      }

      const onError = (event: Event) => {
        const message = (event as any)?.message ?? video.error?.message ?? 'Unknown video load error'
        cleanup()
        reject(new Error(message))
      }

      isLoadingRef.current = true
      
      // Wait for loadeddata (not just loadedmetadata) to ensure seeking works
      const onLoadedData = () => {
        video.removeEventListener('loadeddata', onLoadedData)
        video.removeEventListener('error', onError)
        onLoadedMetadata()
      }
      
      video.addEventListener('loadeddata', onLoadedData, { once: true })
      video.addEventListener('error', onError, { once: true })
      video.src = targetSrc
      video.load() // Force browser to reload
    })

    pendingLoadPromise.current = loadPromise

    try {
      await loadPromise
      currentLoadedPath.current = filePath
      await seekSafely(seekTime)
    } catch (error) {
      currentLoadedPath.current = previousPath
      throw error
    } finally {
      isLoadingRef.current = false
      pendingLoadPromise.current = null
    }
  }, [seekSafely])
  
  // Load selected clip into video element (but don't reset position during playback)
  useEffect(() => {
    const video = videoRef.current

    if (!selectedClip || !video) {
      lastLoadedClipSignature.current = null
      return
    }

    if (isResumingRef.current || isLoadingRef.current) {
      return
    }

    const clipSignature = [
      selectedClip.id,
      selectedClip.filePath,
      selectedClip.trimStart,
      selectedClip.trimEnd,
      selectedClip.startTime,
    ].join('|')

    if (
      clipSignature === lastLoadedClipSignature.current &&
      currentLoadedPath.current === selectedClip.filePath
    ) {
      setDuration(selectedClip.trimEnd - selectedClip.trimStart)
      return
    }

    const previousSignature = lastLoadedClipSignature.current
    let cancelled = false

    const handleError = (e: Event) => {
      const target = e.target as HTMLVideoElement
      const error = target.error

      if (error) {
        console.error('Video preview error:', selectedClip.filePath, error.message || error.code)

        if (error.code === 4 || error.code === 2) {
          const fileName = selectedClip.filePath.split('/').pop() || selectedClip.name
          const isTemp = selectedClip.filePath.includes('/clipforge-recordings/')

          const errorMessage = isTemp
            ? `Temporary recording file is missing: ${fileName}\n\nThis file may have been deleted.`
            : `Could not load: ${fileName}\n\nThe file may be missing, moved, or corrupted.`

          alert(errorMessage)
        }
      }

      setIsPlaying(false)
      isLoadingRef.current = false
      pendingLoadPromise.current = null
      lastLoadedClipSignature.current = null
    }

    video.addEventListener('error', handleError)

    const run = async () => {
      try {
        await loadVideoSource(selectedClip.filePath, selectedClip.trimStart)
        if (!cancelled) {
          setCurrentTime(selectedClip.trimStart)
          lastLoadedClipSignature.current = clipSignature
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Load failed:', error)
          setIsPlaying(false)
          lastLoadedClipSignature.current = previousSignature
        }
      } finally {
        if (!cancelled) {
          setDuration(selectedClip.trimEnd - selectedClip.trimStart)
        }
      }
    }

    void run()

    return () => {
      cancelled = true
      video.removeEventListener('error', handleError)
    }
  }, [selectedClip, loadVideoSource])
  
  // Sync video with playhead position (only when scrubbing - user is manually moving it)
  useEffect(() => {
    if (!videoRef.current || !selectedClip || !isScrubbingRef.current) return

    const video = videoRef.current
    const clipStart = selectedClip.startTime
    const clipEnd = clipStart + (selectedClip.trimEnd - selectedClip.trimStart)

    if (playheadPosition < clipStart || playheadPosition > clipEnd) {
      return
    }

    const clipRelativeTime = playheadPosition - clipStart
    const videoTime = selectedClip.trimStart + clipRelativeTime

    const now = performance.now()
    if (now - lastSeekTime.current <= 16 || Math.abs(video.currentTime - videoTime) <= 0.03) {
      return
    }

    lastSeekTime.current = now

    const applySeek = () => {
      const element = videoRef.current
      if (!element) return

      const withinTolerance = Math.abs(element.currentTime - videoTime) <= 0.02
      if (withinTolerance) return

      try {
        element.currentTime = videoTime
      } catch (error) {
        console.warn('🎚️ Scrub preview seek failed', error)
      }
    }

    if (video.readyState >= 1) {
      requestAnimationFrame(applySeek)
    } else {
      const onLoadedMetadata = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata)
        requestAnimationFrame(applySeek)
      }
      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
    }
  }, [playheadPosition, selectedClip])
  
  // Update current time
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !selectedClip) return
    
    const video = videoRef.current
    const currentVideoTime = video.currentTime
    
    if (isResumingRef.current) {
      return
    }
    
    // Check if we've reached the end of the current clip
    if (currentVideoTime >= selectedClip.trimEnd) {
      // Find the next clip
      const currentIndex = allClips.findIndex(c => c.id === selectedClip.id)
      const nextClip = allClips[currentIndex + 1]
      
      if (nextClip && isPlaying) {
        // Check if there's a gap between clips
        const currentClipEnd = selectedClip.startTime + (selectedClip.trimEnd - selectedClip.trimStart)
        const gapDuration = nextClip.startTime - currentClipEnd
        
        if (gapDuration > 0.05) {
          // There's a gap - continue playback through the blank space
          // Pause video but keep isPlaying true so playhead keeps moving
          video.pause()
          
          // Move playhead through the gap, then continue with next clip
          let gapStartTime = Date.now()
          const gapInterval = setInterval(() => {
            const elapsed = (Date.now() - gapStartTime) / 1000
            
            if (elapsed >= gapDuration) {
              clearInterval(gapInterval)
              // Gap finished - load and play next clip
              void loadVideoSource(nextClip.filePath, nextClip.trimStart)
                .then(async () => {
                  if (videoRef.current && isPlaying) {
                    await videoRef.current.play()
                  }
                })
                .then(() => {
                  if (isPlaying) {
                    useTimelineStore.getState().setSelectedClip(nextClip.id)
                  }
                })
                .catch((error) => {
                  console.error('Failed to resume after gap:', error)
                  setIsPlaying(false)
                })
            } else {
              // Update playhead position during gap
              setPlayheadPosition(currentClipEnd + elapsed)
            }
          }, 16) // ~60fps updates
          
          return
        }
        
        // No gap - immediately load and play next clip
        void loadVideoSource(nextClip.filePath, nextClip.trimStart)
          .then(async () => {
            if (videoRef.current) {
              await videoRef.current.play()
            }
          })
          .then(() => {
            if (isPlaying) {
              useTimelineStore.getState().setSelectedClip(nextClip.id)
            }
          })
          .catch((error) => {
            console.error('Failed to continue playback:', error)
            setIsPlaying(false)
          })
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
    
    // Only sync playhead position during actual playback, not when paused
    // This prevents automatic playhead movement when not playing
    if (isPlaying && !isScrubbingRef.current) {
      const timelinePosition = selectedClip.startTime + (currentVideoTime - selectedClip.trimStart)
      setPlayheadPosition(timelinePosition)
    }
  }, [selectedClip, allClips, isPlaying, setPlayheadPosition, loadVideoSource])
  
  const syncVideoToPlayhead = useCallback(async () => {
    const video = videoRef.current
    if (!video || allClips.length === 0) return

    let targetClip = allClips.find(
      clip => playheadPosition >= clip.startTime &&
              playheadPosition < clip.startTime + (clip.trimEnd - clip.trimStart)
    )

    if (!targetClip) {
      targetClip = allClips.find((clip) => clip.startTime >= playheadPosition) ?? allClips[allClips.length - 1]
    }

    if (!targetClip) return

    const clipRelativeTime = Math.max(0, playheadPosition - targetClip.startTime)
    const boundedRelative = Math.min(clipRelativeTime, targetClip.trimEnd - targetClip.trimStart)
    const videoTime = targetClip.trimStart + boundedRelative

    try {
      isResumingRef.current = true

      if (currentLoadedPath.current !== targetClip.filePath) {
        await loadVideoSource(targetClip.filePath, videoTime)
        useTimelineStore.getState().setSelectedClip(targetClip.id)
      } else if (Math.abs(video.currentTime - videoTime) > SEEK_TOLERANCE) {
        await seekSafely(videoTime)
      }

      setCurrentTime(video.currentTime)
    } catch (error) {
      console.error('Sync failed:', error)
      isResumingRef.current = false
    }
    // Note: Don't clear isResumingRef here - let resume() manage it if play is clicked
    // This prevents the load effect from interfering between scrub end and play
  }, [allClips, loadVideoSource, playheadPosition, seekSafely])

  // Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      // Clear the timeout since we're actually resuming now
      if (resumingTimeoutId.current) {
        clearTimeout(resumingTimeoutId.current)
        resumingTimeoutId.current = null
      }
      
      isResumingRef.current = true

      const resume = async () => {
        try {
          if (allClips.length === 0) {
            setIsPlaying(false)
            return
          }

          if (scrubSyncPromise.current) {
            try {
              await scrubSyncPromise.current
            } catch (error) {
              console.warn('Scrub sync failed before resume:', error)
            }
          }

          let targetClip = allClips.find(
            clip => playheadPosition >= clip.startTime &&
                    playheadPosition < clip.startTime + (clip.trimEnd - clip.trimStart)
          )

          if (!targetClip) {
            targetClip = allClips.find((clip) => clip.startTime >= playheadPosition) ?? allClips[0]
            setPlayheadPosition(targetClip.startTime)
            await loadVideoSource(targetClip.filePath, targetClip.trimStart)
            useTimelineStore.getState().setSelectedClip(targetClip.id)
          } else {
            const clipRelativeTime = playheadPosition - targetClip.startTime
            const videoTime = targetClip.trimStart + clipRelativeTime

            if (selectedClipId !== targetClip.id || currentLoadedPath.current !== targetClip.filePath) {
              await loadVideoSource(targetClip.filePath, videoTime)
              useTimelineStore.getState().setSelectedClip(targetClip.id)
            } else if (Math.abs(video.currentTime - videoTime) > SEEK_TOLERANCE) {
              await seekSafely(videoTime)
            }
          }

          await video.play()
          setIsPlaying(true)
        } catch (error) {
          console.error('Failed to resume playback:', error)
          setIsPlaying(false)
        } finally {
          isResumingRef.current = false
        }
      }

      void resume()
    } else {
      if (selectedClip) {
        const timelinePosition = selectedClip.startTime + (video.currentTime - selectedClip.trimStart)
        setPlayheadPosition(timelinePosition)
      }
      video.pause()
      setIsPlaying(false)
    }
  }, [allClips, loadVideoSource, playheadPosition, selectedClip, selectedClipId, seekSafely, setPlayheadPosition])
  
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
      void loadVideoSource(firstClip.filePath, firstClip.trimStart)
        .then(() => {
          setCurrentTime(firstClip.trimStart)
          useTimelineStore.getState().setSelectedClip(firstClip.id)
        })
        .catch((error) => {
          console.error('Failed to reset playback:', error)
        })
    }
  }, [allClips, setPlayheadPosition, loadVideoSource])
  
  // Jump to previous clip
  const handleJumpToStart = useCallback(() => {
    if (!videoRef.current || !selectedClip || allClips.length === 0) return
    
    // Find current clip index
    const currentIndex = allClips.findIndex(c => c.id === selectedClip.id)
    
    if (currentIndex > 0) {
      // Go to previous clip
      const prevClip = allClips[currentIndex - 1]
      setPlayheadPosition(prevClip.startTime)
      void loadVideoSource(prevClip.filePath, prevClip.trimStart)
        .then(() => {
          setCurrentTime(prevClip.trimStart)
          useTimelineStore.getState().setSelectedClip(prevClip.id)
        })
        .catch((error) => {
          console.error('Failed to jump to previous clip:', error)
        })
    } else {
      // Already at first clip - go to its start
      setPlayheadPosition(selectedClip.startTime)
      videoRef.current.currentTime = selectedClip.trimStart
      setCurrentTime(selectedClip.trimStart)
    }
  }, [selectedClip, allClips, setPlayheadPosition, loadVideoSource])
  
  // Jump to next clip
  const handleJumpToEnd = useCallback(() => {
    if (!videoRef.current || !selectedClip || allClips.length === 0) return
    
    // Find current clip index
    const currentIndex = allClips.findIndex(c => c.id === selectedClip.id)
    
    if (currentIndex < allClips.length - 1) {
      // Go to next clip
      const nextClip = allClips[currentIndex + 1]
      setPlayheadPosition(nextClip.startTime)
      void loadVideoSource(nextClip.filePath, nextClip.trimStart)
        .then(() => {
          setCurrentTime(nextClip.trimStart)
          useTimelineStore.getState().setSelectedClip(nextClip.id)
        })
        .catch((error) => {
          console.error('Failed to jump to next clip:', error)
        })
    } else {
      // Already at last clip - go to its end
      const clipEnd = selectedClip.startTime + (selectedClip.trimEnd - selectedClip.trimStart)
      setPlayheadPosition(clipEnd - 0.1)
      videoRef.current.currentTime = selectedClip.trimEnd - 0.1
      setCurrentTime(selectedClip.trimEnd - 0.1)
    }
  }, [selectedClip, allClips, setPlayheadPosition, loadVideoSource])
  
  // Listen for scrubbing events (playhead dragging)
  useEffect(() => {
    const handleStartScrubbing = () => {
      isScrubbingRef.current = true
      // Clear resuming flag and any pending timeout
      isResumingRef.current = false
      if (resumingTimeoutId.current) {
        clearTimeout(resumingTimeoutId.current)
        resumingTimeoutId.current = null
      }
      // Pause playback when scrubbing starts
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause()
        setIsPlaying(false)
      }
    }
    
    const handleEndScrubbing = () => {
      isScrubbingRef.current = false
      // Update currentTime display when scrubbing ends
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime)
      }

       const syncPromise = syncVideoToPlayhead()
       scrubSyncPromise.current = syncPromise
       void syncPromise.finally(() => {
         if (scrubSyncPromise.current === syncPromise) {
           scrubSyncPromise.current = null
         }
       })
       
       // Clear the resuming flag after a delay if no play happens
       // This prevents the flag from staying stuck
       if (resumingTimeoutId.current) {
         clearTimeout(resumingTimeoutId.current)
       }
       resumingTimeoutId.current = setTimeout(() => {
         isResumingRef.current = false
         resumingTimeoutId.current = null
       }, 2000)
    }
    
    window.addEventListener('pause-playback', handleStartScrubbing)
    window.addEventListener('scrubbing-end', handleEndScrubbing)
    
    return () => {
      window.removeEventListener('pause-playback', handleStartScrubbing)
      window.removeEventListener('scrubbing-end', handleEndScrubbing)
    }
  }, [syncVideoToPlayhead])
  
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
        <video
          ref={videoRef}
          className="preview-video"
          onTimeUpdate={handleTimeUpdate}
          preload="auto"
          style={{ display: selectedClip ? 'block' : 'none' }}
        >
          Your browser does not support video playback.
        </video>
        {!selectedClip && (
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
          title="Previous clip"
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
          title="Stop and reset"
        >
          ⏹
        </button>
        <button 
          className="btn-control" 
          onClick={handleJumpToEnd}
          disabled={!selectedClip}
          title="Next clip"
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

