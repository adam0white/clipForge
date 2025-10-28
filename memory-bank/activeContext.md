# Active Context: ClipForge

**Last Updated**: 2025-10-28
**Phase**: Phase 4.0 Complete - Screen & Webcam Recording

## Current Status

✅ Phase 4.0 complete! Screen recording with source picker, webcam recording with audio, simultaneous screen+webcam capture, proper video scaling/padding for export, and WebM metadata handling all working perfectly.

## Current Focus

Ready for Phase 5.0 (Advanced Timeline Features) or Phase 6.0 (Final Polish).

## Next Steps

1. ✅ Phase 1.0: Project setup (Electron + React + TypeScript + FFmpeg)
2. ✅ Phase 2.0: MVP core features (Import, Timeline, Preview, Trim, Export)
3. ✅ Phase 3.0: MVP packaging and testing (.dmg build, install test)
4. ✅ Phase 4.0: Screen & webcam recording
5. Phase 5.0: Advanced timeline features (drag-to-reorder, split, multi-track)
6. Phase 6.0: Final polish and optimization

## Recent Decisions

**Phase 1:**
- **Desktop Framework**: Electron (over Tauri) - mature ecosystem, better FFmpeg integration
- **Frontend**: React + TypeScript + Zustand (state management)
- **Build Tools**: electron-vite (dev), electron-builder (packaging)
- **Target Platform**: Mac-first (.dmg builds)

**Phase 2:**
- **File Protocol**: Custom `safe-file://` protocol using `protocol.handle()` (official Electron API)
- **Library vs Timeline**: Separate library (source files) from timeline (clip instances)
- **Metadata Extraction**: Single-pass `extractAllVideoData()` - gets duration, metadata, and thumbnail in one video element
- **Optimistic UI**: Trim handles update local state immediately, store syncs after
- **Export**: Concatenate clips end-to-end (gaps removed) using FFmpeg filter_complex
- **Architecture**: Non-destructive editing, optimistic UI, Electron IPC for FFmpeg calls

**Phase 3:**
- **FFmpeg Packaging**: Binary unpacked from ASAR (`asarUnpack` in electron-builder.json), path adjusted at runtime
- **Icon Generation**: Used `iconutil` to create valid .icns from PNG sources (266 KB, "ic12" type)
- **Build Output**: Signed .dmg (126 MB) and .zip (121 MB) for macOS arm64
- **Testing**: Full workflow verified in packaged app (import, timeline, trim, export)

**Phase 4:**
- **Screen Recording**: Electron's desktopCapturer API with source picker modal showing thumbnails
- **Webcam Recording**: getUserMedia API with audio enabled, 1280x720 target resolution
- **Simultaneous Recording**: Two independent MediaRecorder instances (screen + webcam)
- **WebM Duration Handling**: MediaRecorder creates WebM files without duration metadata - tracked client-side and passed to import
- **Video Scaling**: FFmpeg scale+pad filter ensures all clips match target resolution (prevents stretching on export)
- **Auto-Import**: Recordings saved to temp directory, automatically imported to timeline with correct duration

## Known Issues / Deferred Features

**Working as designed (documented in systemPatterns.md):**
- Clips cannot be dragged to reorder (import sequence determines order) - deferred to Phase 5+
- Gaps in timeline are removed during export (clips concatenated end-to-end)

**Current limitations:**
- Single track only (multi-track deferred to Phase 5+)
- No split/cut functionality yet (trim only)
- No undo/redo (deferred to Phase 5+)
- Clips cannot be dragged to reorder (deferred to Phase 5+)

## Blockers

None.
