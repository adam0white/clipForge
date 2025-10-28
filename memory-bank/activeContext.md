# Active Context: ClipForge

**Last Updated**: 2025-10-28
**Phase**: Phase 2.0 Complete - MVP Core Features Working

## Current Status

✅ Phase 2.0 complete. Full video editing workflow functional: import → timeline → preview → trim → export. Custom `safe-file://` protocol enables secure local file access. Optimized single-pass metadata extraction prevents resource contention.

## Current Focus

Ready for Phase 3.0 (Packaging/Distribution) - building .dmg for Mac.

## Next Steps

1. ✅ Phase 1.0: Project setup (Electron + React + TypeScript + FFmpeg)
2. ✅ Phase 2.0: MVP core features (Import, Timeline, Preview, Trim, Export)
3. Phase 3.0: MVP packaging and testing (.dmg build, install test)
4. Phase 4.0: Screen recording (if time permits)
5. Phase 5.0+: Enhancements and polish

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

## Known Issues / Deferred Features

**Working as designed (documented in systemPatterns.md):**
- Clips cannot be dragged to reorder (import sequence determines order) - deferred to Phase 3+
- Gaps in timeline are removed during export (clips concatenated end-to-end)

**Current limitations:**
- Single track only (multi-track deferred to Phase 4+)
- No split/cut functionality yet (trim only)
- No undo/redo (deferred to Phase 5+)

## Blockers

None.
