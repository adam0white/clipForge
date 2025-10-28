# ClipForge

Desktop video editor built with Electron, React, and TypeScript.

## Features

- 🎬 Import and organize video clips (drag & drop, file picker)
- ✂️ Timeline-based editing with trim functionality
- 🎥 Real-time video preview with playback controls
- 📤 Export to MP4 with progress tracking
- ⚡ FFmpeg-powered video processing
- 💾 Save/load projects (.cfproj format)
- 📦 Native desktop app for macOS (.dmg)

## Tech Stack

- **Electron 38** - Desktop framework
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 7** - Build tool with hot reload
- **Tailwind CSS 4** - Styling (latest v4 with CSS-based config)
- **Zustand** - State management
- **FFmpeg** - Video processing

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package as .dmg (macOS)
npm run package
```

## Project Structure

```
clipForge/
├── electron/           # Electron main process
│   ├── main/          # Window management, app lifecycle
│   ├── preload/       # Secure IPC bridge
│   └── ipc-handlers.ts # File operations, FFmpeg handlers
├── src/               # React renderer process
│   ├── components/    # React components
│   ├── store/         # Zustand state management
│   ├── types/         # TypeScript definitions
│   └── App.tsx        # Main application
└── memory-bank/       # Project documentation
```

## Status

✅ **MVP Complete** - Fully functional video editor packaged and tested
- Phase 1.0: Project setup ✅
- Phase 2.0: Core features (import, timeline, preview, trim, export) ✅
- Phase 3.0: Packaging & testing (.dmg for macOS) ✅

See `tasks/tasks-prd-clipforge.md` for detailed roadmap.

## License

MIT
