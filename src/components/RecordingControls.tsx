import { useState, useCallback, useEffect, useRef } from 'react'
import { DesktopCapturerSource } from '@/types'
import { SourcePickerModal } from './SourcePickerModal'
import './RecordingControls.css'

export interface RecordingControlsProps {
  onRecordingComplete?: (files: { filePath: string; duration: number }[]) => void
}

export function RecordingControls({ onRecordingComplete }: RecordingControlsProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedSource, setSelectedSource] = useState<DesktopCapturerSource | null>(null)
  const [webcamEnabled, setWebcamEnabled] = useState(false)
  const [isSourcePickerOpen, setIsSourcePickerOpen] = useState(false)
  
  // Recording state
  const [screenRecorder, setScreenRecorder] = useState<MediaRecorder | null>(null)
  const [webcamRecorder, setWebcamRecorder] = useState<MediaRecorder | null>(null)
  const [screenChunks, setScreenChunks] = useState<Blob[]>([])
  const [webcamChunks, setWebcamChunks] = useState<Blob[]>([])
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  
  // Ref to prevent duplicate saves
  const isSavingRef = useRef(false)

  // Timer effect for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    // Don't reset recordingTime here - we need it for saving the recording
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  // Save recordings when chunks are available
  useEffect(() => {
    if (screenChunks.length === 0 && webcamChunks.length === 0) return
    if (isSavingRef.current) return // Prevent duplicate saves

    const saveRecordings = async () => {
      // Set flag to prevent duplicate saves
      isSavingRef.current = true

      try {
        const savedFiles: { filePath: string; duration: number }[] = []
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const recordedDuration = recordingTime // Capture the recording time

        // Capture chunks before clearing state
        const currentScreenChunks = [...screenChunks]
        const currentWebcamChunks = [...webcamChunks]

        // Clear chunks immediately to prevent re-triggering
        setScreenChunks([])
        setWebcamChunks([])

        // Save screen recording
        if (currentScreenChunks.length > 0) {
          const blob = new Blob(currentScreenChunks, { type: 'video/webm' })
          const filename = `screen-${timestamp}.webm`
          const arrayBuffer = await blob.arrayBuffer()
          
          const tempPath = await saveTempRecording(arrayBuffer, filename)
          
          if (tempPath) {
            savedFiles.push({ filePath: tempPath, duration: recordedDuration })
          }
        }

        // Save webcam recording
        if (currentWebcamChunks.length > 0) {
          const blob = new Blob(currentWebcamChunks, { type: 'video/webm' })
          const filename = `webcam-${timestamp}.webm`
          const arrayBuffer = await blob.arrayBuffer()
          
          const tempPath = await saveTempRecording(arrayBuffer, filename)
          
          if (tempPath) {
            savedFiles.push({ filePath: tempPath, duration: recordedDuration })
          }
        }

        // Auto-import all recordings to timeline
        if (savedFiles.length > 0 && onRecordingComplete) {
          onRecordingComplete(savedFiles)
        }

        // Reset recording time after saving
        setRecordingTime(0)
      } catch (error) {
        console.error('Failed to save recordings:', error)
        alert(`Failed to save recordings: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        // Reset flag after save completes
        isSavingRef.current = false
      }
    }

    saveRecordings()
  }, [screenChunks, webcamChunks, onRecordingComplete, recordingTime])

  // Helper function to save recording via IPC
  const saveTempRecording = async (buffer: ArrayBuffer, filename: string): Promise<string | null> => {
    try {
      const result = await window.electron.saveTempRecording(buffer, filename)
      
      if (result.success && result.filePath) {
        return result.filePath
      } else {
        throw new Error(result.error || 'Failed to save recording')
      }
    } catch (error) {
      console.error('Failed to save temp recording:', error)
      return null
    }
  }

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = useCallback(async () => {
    if (!selectedSource) {
      console.error('No source selected')
      alert('Please select a screen or window to record.')
      return
    }

    try {
      // Reset recording time
      setRecordingTime(0)
      
      // 1. Get the screen stream using the selected source
      const screenConstraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedSource.id,
          },
        } as any,
      }

      const capturedScreenStream = await navigator.mediaDevices.getUserMedia(screenConstraints)
      setScreenStream(capturedScreenStream)

      // Create screen MediaRecorder
      const scrRecorder = new MediaRecorder(capturedScreenStream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      const scrChunks: Blob[] = []

      scrRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          scrChunks.push(event.data)
        }
      }

      scrRecorder.onstop = async () => {
        setScreenChunks(scrChunks)
        
        // Stop all tracks
        capturedScreenStream.getTracks().forEach(track => track.stop())
        setScreenStream(null)
      }

      scrRecorder.onerror = (event: Event) => {
        console.error('Screen recording error:', event)
        alert('Screen recording error occurred. Please try again.')
        setIsRecording(false)
      }

      // Start screen recording
      scrRecorder.start(1000) // Collect data every second
      setScreenRecorder(scrRecorder)
      setIsRecording(true)

      // 2. If webcam is enabled, start webcam recording
      if (webcamEnabled) {
        try {
          const webcamConstraints = {
            audio: true, // Enable audio for webcam
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }
          }

          const capturedWebcamStream = await navigator.mediaDevices.getUserMedia(webcamConstraints)
          setWebcamStream(capturedWebcamStream)

          // Create webcam MediaRecorder
          const camRecorder = new MediaRecorder(capturedWebcamStream, {
            mimeType: 'video/webm;codecs=vp9',
          })

          const camChunks: Blob[] = []

          camRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              camChunks.push(event.data)
            }
          }

          camRecorder.onstop = async () => {
            setWebcamChunks(camChunks)
            
            // Stop all tracks
            capturedWebcamStream.getTracks().forEach(track => track.stop())
            setWebcamStream(null)
          }

          camRecorder.onerror = (event: Event) => {
            console.error('Webcam recording error:', event)
            alert('Webcam recording error occurred.')
          }

          // Start webcam recording
          camRecorder.start(1000)
          setWebcamRecorder(camRecorder)
        } catch (webcamError) {
          console.error('Failed to start webcam:', webcamError)
          alert(`Failed to start webcam: ${webcamError instanceof Error ? webcamError.message : 'Unknown error'}. Screen recording will continue.`)
        }
      }
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsRecording(false)
    }
  }, [selectedSource, webcamEnabled])

  const handleStopRecording = useCallback(async () => {
    if (!screenRecorder || screenRecorder.state === 'inactive') {
      return
    }
    
    // Stop screen recording
    screenRecorder.stop()
    setScreenRecorder(null)
    
    // Stop webcam recording if active
    if (webcamRecorder && webcamRecorder.state !== 'inactive') {
      webcamRecorder.stop()
      setWebcamRecorder(null)
    }
    
    setIsRecording(false)
  }, [screenRecorder, webcamRecorder])

  const handleSelectSource = useCallback(() => {
    setIsSourcePickerOpen(true)
  }, [])

  const handleSourceSelected = useCallback((source: DesktopCapturerSource) => {
    setSelectedSource(source)
  }, [])

  return (
    <div className="recording-controls">
      <div className="recording-header">
        <h3>Recording</h3>
        {isRecording && (
          <div className="recording-indicator">
            <span className="recording-dot"></span>
            <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
          </div>
        )}
      </div>

      <div className="recording-actions">
        {/* Source Selection */}
        <button
          className="btn-select-source"
          onClick={handleSelectSource}
          disabled={isRecording}
          title="Select screen or window to record"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>{selectedSource?.name || 'Select Screen'}</span>
        </button>

        {/* Recording Controls */}
        <div className="recording-buttons">
          {!isRecording ? (
            <button
              className="btn-record"
              onClick={handleStartRecording}
              disabled={!selectedSource}
              title="Start recording"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              className="btn-stop"
              onClick={handleStopRecording}
              title="Stop recording"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              <span>Stop Recording</span>
            </button>
          )}
        </div>

        {/* Webcam Toggle */}
        <label className="webcam-toggle">
          <input
            type="checkbox"
            checked={webcamEnabled}
            onChange={(e) => setWebcamEnabled(e.target.checked)}
            disabled={isRecording}
          />
          <span className="toggle-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Include Webcam
          </span>
        </label>
      </div>

      {/* Status Messages */}
      {!selectedSource && !isRecording && (
        <p className="recording-hint">Select a screen or window to start recording</p>
      )}

      {/* Source Picker Modal */}
      <SourcePickerModal
        isOpen={isSourcePickerOpen}
        onClose={() => setIsSourcePickerOpen(false)}
        onSelectSource={handleSourceSelected}
      />
    </div>
  )
}
