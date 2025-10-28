import './App.css'
import { MediaLibrary } from './components/MediaLibrary'
import { Timeline } from './components/Timeline'
import { VideoPreview } from './components/VideoPreview'
import { ExportDialog } from './components/ExportDialog'
import { useCallback, useState } from 'react'
import { useTimelineStore } from './store/timelineStore'
import { Clip } from './types'
import { isVideoFile, extractAllVideoData, getFileName } from './utils/videoUtils'

function App() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const addClip = useTimelineStore((state) => state.addClip)
  const addToLibrary = useTimelineStore((state) => state.addToLibrary)
  const tracks = useTimelineStore((state) => state.tracks)
  const getProjectData = useTimelineStore((state) => state.getProjectData)
  const loadProject = useTimelineStore((state) => state.loadProject)
  const setProjectFilePath = useTimelineStore((state) => state.setProjectFilePath)
  const projectName = useTimelineStore((state) => state.projectName)

  const handleImport = useCallback(async (filePaths: string[]) => {
    setIsProcessing(true)
    
    try {
      const defaultTrack = tracks[0]
      const trackId = defaultTrack?.id || 'track-1'
      
      // Calculate initial start position
      const existingClips = defaultTrack?.clips || []
      let currentPosition = existingClips.length > 0
        ? Math.max(...existingClips.map(c => c.startTime + (c.trimEnd - c.trimStart)))
        : 0

      for (const filePath of filePaths) {
        // 2.1.3: Validate imported files
        if (!isVideoFile(filePath)) {
          console.warn('Skipping unsupported file:', filePath)
          continue
        }

        try {
          // 2.1.4: Extract video metadata (optimized - single video element)
          const videoData = await extractAllVideoData(filePath)

          if (!videoData) {
            console.error('Failed to extract metadata for:', filePath)
            continue
          }
          
          const { duration, metadata, thumbnail } = videoData

          // Add to library (deduplicated automatically)
          addToLibrary({
            filePath,
            name: getFileName(filePath),
            duration,
            thumbnail: thumbnail || undefined,
            metadata,
          })
          
          // 2.1.5: Add clip instance to timeline
          const clip: Clip = {
            id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: getFileName(filePath),
            filePath,
            duration,
            startTime: currentPosition,
            trimStart: 0,
            trimEnd: duration,
            trackId,
            thumbnail: thumbnail || undefined,
            metadata,
          }

          addClip(clip)
          
          // Increment position for next clip in batch
          currentPosition += duration
        } catch (error) {
          console.error('Failed to process file:', filePath, error)
        }
      }
    } finally {
      setIsProcessing(false)
    }
  }, [addClip, addToLibrary, tracks])

  const handleSaveProject = useCallback(async () => {
    try {
      const projectData = getProjectData()
      const result = await window.electron.saveProject(projectData)
      
      if (result.success && result.filePath) {
        setProjectFilePath(result.filePath)
        console.log('Project saved successfully:', result.filePath)
      } else if (!result.canceled) {
        console.error('Failed to save project:', result.error)
        alert(`Failed to save project: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Save project error:', error)
      alert(`Failed to save project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [getProjectData, setProjectFilePath])

  const handleLoadProject = useCallback(async () => {
    try {
      const result = await window.electron.loadProject()
      
      if (result.success && result.data) {
        loadProject(result.data)
        if (result.filePath) {
          setProjectFilePath(result.filePath)
        }
        console.log('Project loaded successfully')
      } else if (!result.canceled) {
        console.error('Failed to load project:', result.error)
        alert(`Failed to load project: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Load project error:', error)
      alert(`Failed to load project: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [loadProject, setProjectFilePath])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">ClipForge</h1>
        <div className="project-name">{projectName}</div>
        <div className="header-controls">
          <button 
            className="btn-secondary"
            onClick={handleLoadProject}
            title="Load Project"
          >
            Open Project
          </button>
          <button 
            className="btn-secondary"
            onClick={handleSaveProject}
            disabled={tracks.flatMap(t => t.clips).length === 0}
            title="Save Project"
          >
            Save Project
          </button>
          <button 
            className="btn-import"
            onClick={async () => {
              const result = await window.electron.showOpenDialog()
              if (!result.canceled && result.filePaths.length > 0) {
                handleImport(result.filePaths)
              }
            }}
          >
            Import
          </button>
          <button 
            className="btn-export"
            onClick={() => setIsExportDialogOpen(true)}
            disabled={tracks.flatMap(t => t.clips).length === 0}
          >
            Export
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-content">
        {/* Media Library (Left) */}
        <MediaLibrary onImport={handleImport} />

        {/* Preview & Timeline (Right) */}
        <main className="editor-area">
          {/* Video Preview */}
          <VideoPreview />

          {/* Timeline */}
          <Timeline />
        </main>
      </div>
      
      {/* Export Dialog */}
      <ExportDialog 
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  )
}

export default App
