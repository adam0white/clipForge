import './App.css'

function App() {
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="app-title">ClipForge</h1>
        <div className="header-controls">
          <button className="btn-import">Import</button>
          <button className="btn-export">Export</button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-content">
        {/* Media Library (Left) */}
        <aside className="media-library">
          <h2>Media Library</h2>
          <div className="media-grid">
            <p className="placeholder-text">Drop files here or click Import</p>
          </div>
        </aside>

        {/* Preview & Timeline (Right) */}
        <main className="editor-area">
          {/* Video Preview */}
          <section className="video-preview">
            <div className="preview-container">
              <div className="preview-placeholder">
                <p>No video loaded</p>
              </div>
            </div>
            <div className="playback-controls">
              <button className="btn-control">⏮</button>
              <button className="btn-control btn-play">▶</button>
              <button className="btn-control">⏭</button>
              <span className="timecode">00:00 / 00:00</span>
            </div>
          </section>

          {/* Timeline */}
          <section className="timeline-section">
            <div className="timeline-header">
              <h3>Timeline</h3>
              <div className="timeline-controls">
                <button className="btn-zoom">-</button>
                <button className="btn-zoom">+</button>
              </div>
            </div>
            <div className="timeline-container">
              <div className="timeline-ruler">
                <div className="timeline-marker">0:00</div>
                <div className="timeline-marker">0:10</div>
                <div className="timeline-marker">0:20</div>
                <div className="timeline-marker">0:30</div>
              </div>
              <div className="timeline-tracks">
                <div className="track">
                  <div className="track-label">Video 1</div>
                  <div className="track-content">
                    {/* Clips will be rendered here */}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
