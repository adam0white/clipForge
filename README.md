# ClipForge

Desktop video editor built with Electron, React, and TypeScript.

## Features

- 🎬 Import and organize video clips
- ✂️ Timeline-based video editing
- 🎥 Real-time video preview
- ⚡ FFmpeg-powered video processing
- 📦 Native desktop app for macOS

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

🟢 **Phase 1 Complete** - Development environment ready

See `tasks/tasks-prd-clipforge.md` for detailed roadmap.

## License

MIT
