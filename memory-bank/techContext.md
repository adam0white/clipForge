# Tech Context: ClipForge

## Tech Stack

### Desktop Framework
- **Electron** - Mature ecosystem, excellent FFmpeg integration via Node.js
  - Chosen over Tauri due to 72-hour deadline and extensive video editing examples

### Frontend
- **React** - Component-based UI, large ecosystem
- **TypeScript** - Type safety and better developer experience
- **Zustand** - Lightweight state management for timeline state
- **Vite** - Fast build tool with HMR

### Media Processing
- **FFmpeg** - Video encoding/decoding/processing
  - `fluent-ffmpeg` npm package or direct CLI calls
  - Static binary packaged with app
- **MediaRecorder API** - Screen and webcam recording
- **Electron desktopCapturer** - Screen source selection

### UI Components
- **Timeline**: Start with CSS/DOM, migrate to Canvas if performance issues
- **Video Player**: HTML5 `<video>` element (sufficient for preview)

### Build & Packaging
- **electron-vite** - Development with hot reload
- **electron-builder** - Packaging for Mac (.dmg)

## Architecture

- **Non-destructive editing** - Store edit decisions (in/out points), never modify source files
- **Optimistic UI** - Update timeline immediately, process in background
- **IPC Communication** - FFmpeg operations run in main process, UI in renderer
- **State Structure**: Clips (source path, in/out points, position) → Tracks → Timeline

## Development Commands
- `npm run dev` - Launch in development mode
- `npm run build` - Production build
- `npm run package` - Create distributable app

## Critical Notes
- Package FFmpeg binary with app (don't rely on system installation)
- Test packaging early (end of Day 1)
- Validate exported videos in multiple players (VLC, QuickTime)
- Monitor memory usage with multiple clips
