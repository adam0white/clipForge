# Tech Context: ClipForge

## Tech Stack

### Desktop Framework
- **Electron 38.4.0** - Mature ecosystem, excellent FFmpeg integration via Node.js
  - Chosen over Tauri due to 72-hour deadline and extensive video editing examples

### Frontend
- **React 19.2.0** - Component-based UI, large ecosystem (latest stable)
- **TypeScript 5.4.2** - Type safety and better developer experience
- **Zustand 5.0.8** - Lightweight state management for timeline state
- **Vite 7.1.12** - Fast build tool with HMR (latest stable)
- **Tailwind CSS 4.1.16** - Latest v4 with new CSS-based configuration and high-performance engine
- **@tailwindcss/vite 4.1.16** - Official Tailwind v4 Vite plugin

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
- **vite-plugin-electron 0.29.0** - Development with hot reload
- **electron-builder 26.0.12** - Packaging for Mac (.dmg)
- **vitest 4.0.4** - Testing framework (v4 pre-release/beta, bleeding edge)

## Architecture

- **Non-destructive editing** - Store edit decisions (in/out points), never modify source files
- **Optimistic UI** - Update timeline immediately, process in background
- **IPC Communication** - FFmpeg operations run in main process, UI in renderer
- **State Structure**: Clips (source path, in/out points, position) → Tracks → Timeline

## Development Commands
- `npm run dev` - Launch in development mode
- `npm run build` - Production build
- `npm run package` - Create distributable app

## Project Structure
```
clipForge/
├── electron/
│   ├── main/index.ts       # Main process (window, IPC)
│   ├── preload/index.ts    # Secure IPC bridge
│   └── ipc-handlers.ts     # IPC handlers (file dialogs, FFmpeg)
├── src/
│   ├── components/         # React components
│   ├── store/              # Zustand stores
│   │   └── timelineStore.ts
│   ├── types/              # TypeScript types
│   │   ├── index.ts
│   │   └── electron.d.ts
│   ├── App.tsx            # Main React component
│   ├── App.css            # Dark theme styles
│   └── index.css          # Tailwind v4 CSS config (@import "tailwindcss")
├── package.json
├── vite.config.ts         # Includes @tailwindcss/vite plugin
└── electron-builder.json
```

## Critical Notes
- ✅ FFmpeg binary installed (@ffmpeg-installer/ffmpeg)
- ✅ All dependencies on absolute latest versions (updated Oct 27, 2025)
- ✅ Tailwind CSS v4.1.16 - Uses CSS-based config (`@import "tailwindcss"` + `@theme` block)
- ✅ Tailwind v4 integrated via `@tailwindcss/vite` plugin (no PostCSS config needed)
- ✅ Vitest v4.0.4 pre-release (bleeding edge)
- ⚠️ Removed: `postcss.config.cjs`, `tailwind.config.js` (not needed in Tailwind v4)
- Test packaging early (end of Day 1)
- Validate exported videos in multiple players (VLC, QuickTime)
- Monitor memory usage with multiple clips
- Use TypeScript built-in utilities and automatic type inference where possible
