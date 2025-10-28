import { useState } from 'react'
import { useTimelineStore } from '@/store/timelineStore'
import { ExportSettings } from '@/types'
import './ExportDialog.css'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const tracks = useTimelineStore((state) => state.tracks)
  const [resolution, setResolution] = useState<'720p' | '1080p' | 'source'>('1080p')
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const allClips = tracks.flatMap(track => track.clips)
  
  const handleExport = async () => {
    if (allClips.length === 0) {
      setError('No clips to export')
      return
    }
    
    try {
      // Show save dialog
      const result = await window.electron.exportDialog()
      if (result.canceled || !result.filePath) {
        return
      }
      
      setIsExporting(true)
      setProgress(0)
      setError(null)
      
      // Set up progress listener
      const unsubscribe = window.electron.onExportProgress((progressData) => {
        setProgress(progressData.percent)
      })
      
      // Prepare export settings
      const exportSettings: ExportSettings = {
        outputPath: result.filePath,
        resolution,
        format: 'mp4',
        codec: 'h264',
      }
      
      // Start export
      const exportResult = await window.electron.exportVideo({
        clips: allClips,
        settings: exportSettings,
      })
      
      unsubscribe()
      
      if (exportResult.success) {
        setProgress(100)
        setTimeout(() => {
          onClose()
          setIsExporting(false)
          setProgress(0)
        }, 1000)
      } else {
        setError(exportResult.error || 'Export failed')
        setIsExporting(false)
      }
    } catch (err) {
      console.error('Export error:', err)
      setError(err instanceof Error ? err.message : 'Export failed')
      setIsExporting(false)
    }
  }
  
  if (!isOpen) return null
  
  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="export-dialog-header">
          <h2>Export Video</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        
        <div className="export-dialog-content">
          {!isExporting ? (
            <>
              <div className="export-summary">
                <p><strong>Clips:</strong> {allClips.length}</p>
                <p><strong>Total Duration:</strong> {
                  allClips.reduce((sum, clip) => sum + (clip.trimEnd - clip.trimStart), 0).toFixed(2)
                }s</p>
                <p className="export-note">
                  <small>Note: Clips will be joined end-to-end (gaps removed)</small>
                </p>
              </div>
              
              <div className="export-settings">
                <label>
                  <span>Resolution:</span>
                  <select 
                    value={resolution} 
                    onChange={(e) => setResolution(e.target.value as any)}
                  >
                    <option value="720p">720p (1280x720)</option>
                    <option value="1080p">1080p (1920x1080)</option>
                    <option value="source">Source (Original)</option>
                  </select>
                </label>
              </div>
              
              {error && (
                <div className="export-error">
                  {error}
                </div>
              )}
            </>
          ) : (
            <div className="export-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="progress-text">{Math.round(progress)}%</p>
              <p className="progress-message">Exporting video...</p>
            </div>
          )}
        </div>
        
        <div className="export-dialog-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
          <button 
            className="btn-export" 
            onClick={handleExport}
            disabled={isExporting || allClips.length === 0}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}

