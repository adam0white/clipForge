import { useState, useEffect } from 'react'
import { DesktopCapturerSource } from '@/types'
import './SourcePickerModal.css'

export interface SourcePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSource: (source: DesktopCapturerSource) => void
}

export function SourcePickerModal({ isOpen, onClose, onSelectSource }: SourcePickerModalProps) {
  const [sources, setSources] = useState<DesktopCapturerSource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'screen' | 'window'>('screen')

  useEffect(() => {
    if (isOpen) {
      loadSources()
    }
  }, [isOpen])

  const loadSources = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await window.electron.getDesktopSources()
      
      if (result.success && result.sources) {
        setSources(result.sources)
      } else {
        setError(result.error || 'Failed to load sources')
      }
    } catch (err) {
      console.error('Failed to get desktop sources:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSource = (source: DesktopCapturerSource) => {
    onSelectSource(source)
    onClose()
  }

  if (!isOpen) return null

  // Split sources into screens and windows
  const screens = sources.filter(s => s.name.includes('Screen') || s.name.includes('Entire'))
  const windows = sources.filter(s => !s.name.includes('Screen') && !s.name.includes('Entire'))

  const displaySources = activeTab === 'screen' ? screens : windows

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content source-picker" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Screen or Window</h2>
          <button className="modal-close" onClick={onClose} title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="source-tabs">
          <button
            className={`tab ${activeTab === 'screen' ? 'active' : ''}`}
            onClick={() => setActiveTab('screen')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Entire Screen ({screens.length})
          </button>
          <button
            className={`tab ${activeTab === 'window' ? 'active' : ''}`}
            onClick={() => setActiveTab('window')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
            </svg>
            Application Window ({windows.length})
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {loading && (
            <div className="source-loading">
              <div className="spinner"></div>
              <p>Loading sources...</p>
            </div>
          )}

          {error && (
            <div className="source-error">
              <p>Error: {error}</p>
              <button className="btn-retry" onClick={loadSources}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && displaySources.length === 0 && (
            <div className="source-empty">
              <p>No {activeTab === 'screen' ? 'screens' : 'windows'} available</p>
            </div>
          )}

          {!loading && !error && displaySources.length > 0 && (
            <div className="source-grid">
              {displaySources.map((source) => (
                <button
                  key={source.id}
                  className="source-item"
                  onClick={() => handleSelectSource(source)}
                  title={source.name}
                >
                  <div className="source-preview">
                    <img src={source.thumbnail} alt={source.name} />
                  </div>
                  <div className="source-info">
                    {source.appIcon && (
                      <img src={source.appIcon} alt="" className="source-icon" />
                    )}
                    <span className="source-name">{source.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

