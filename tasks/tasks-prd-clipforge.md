# Task List: ClipForge Desktop Video Editor

**Generated From**: `prd-clipforge.md`  
**Date**: October 27, 2025  
**Timeline**: 72 hours total (MVP in 24 hours)

---

## Timeline & Priorities

**🔴 Day 1 (MVP - 24 hours)**: Phases 1.0, 2.0, 3.0  
**🟡 Day 2 (Post-MVP - 48 hours)**: Phases 4.0, 5.0  
**🟢 Day 3 (Final - 72 hours)**: Phase 6.0

---

## Relevant Files

### Core Application Structure
- `package.json` - ✅ Project dependencies and scripts
- `electron/main/index.ts` - ✅ Electron main process entry point
- `electron/preload/index.ts` - ✅ Preload script for secure IPC (contextBridge API)
- `electron/ipc-handlers.ts` - ✅ IPC handlers for file operations and FFmpeg
- `src/App.tsx` - ✅ Root React component with dark theme UI shell
- `src/App.css` - ✅ Dark theme styling
- `src/main.tsx` - ✅ React app entry point
- `vite.config.ts` - ✅ Vite build configuration
- `electron-builder.json` - ✅ Electron packaging configuration (.dmg for Mac)

### State Management
- `src/store/timelineStore.ts` - ✅ Zustand store for timeline state (clips, tracks, playhead position)
- `src/types/index.ts` - ✅ TypeScript type definitions (Clip, Track, TimelineState, IPC channels)
- `src/types/electron.d.ts` - ✅ TypeScript declarations for Electron IPC API

### Components
- `src/components/MediaLibrary.tsx` - ✅ File import and media library UI
- `src/components/VideoPreview.tsx` - ✅ Video player component
- `src/components/Timeline.tsx` - ✅ Timeline editor component
- `src/components/TimelineClip.tsx` - ✅ Individual clip representation on timeline
- `src/components/TimelineTrack.tsx` - ✅ Track container component
- `src/components/ExportDialog.tsx` - ✅ Export settings and progress UI
- `src/components/RecordingControls.tsx` - Screen/webcam recording UI

### Services
- `electron/services/ffmpeg.ts` - ✅ FFmpeg integration for video export (main process)
- `src/services/recorder.ts` - Screen and webcam recording logic
- `src/services/videoProcessor.ts` - Video metadata extraction and validation
- `electron/ipc-handlers.ts` - ✅ IPC handlers for file operations, FFmpeg calls

### Utilities
- `src/utils/timelineCalculations.ts` - Timeline position/duration calculations
- `src/utils/videoUtils.ts` - ✅ Video format validation, thumbnail generation, metadata extraction

### Notes
- No test files initially - focus on working MVP first, add tests if time permits
- Use `npm run dev` for development, `npm run build` for production build
- Use `npm run package` to create distributable app

---

## Phases

- [x] **1.0 Project Setup & Development Environment** 🔴 Day 1
  - [x] 1.1 Initialize Electron + React + TypeScript project using `electron-vite` or similar boilerplate
  - [x] 1.2 Configure Vite for Electron with hot reload
  - [x] 1.3 Set up project structure (src/, electron/, components/, services/, store/, utils/)
  - [x] 1.4 Install core dependencies: React, Zustand, TypeScript, Electron, electron-builder
  - [x] 1.5 Install FFmpeg binary (download static build or use `ffmpeg-static` package)
  - [x] 1.6 Configure electron-builder in package.json for Mac builds (.dmg target)
  - [x] 1.7 Set up basic IPC communication between main and renderer processes
  - [x] 1.8 Create basic app shell with dark theme and placeholder UI sections
  - [x] 1.9 Verify app launches in dev mode (`npm run dev`)

- [x] **2.0 MVP Core Features (Import, Timeline, Preview, Trim, Export)** 🔴 Day 1
  - [x] 2.1 **File Import**
    - [x] 2.1.1 Create MediaLibrary component with drag-and-drop zone
    - [x] 2.1.2 Add file picker dialog (MP4/MOV filter)
    - [x] 2.1.3 Validate imported files (check if video is readable)
    - [x] 2.1.4 Extract video metadata (duration, resolution, codec) using video element or FFprobe
    - [x] 2.1.5 Add imported clips to Zustand timeline store
  - [x] 2.2 **Timeline View**
    - [x] 2.2.1 Create Timeline component with horizontal scrollable container
    - [x] 2.2.2 Create TimelineClip component (visual block with thumbnail, duration label)
    - [x] 2.2.3 Display clips on timeline proportional to their duration
    - [x] 2.2.4 Add time markers/ruler (show seconds/minutes)
    - [x] 2.2.5 Implement playhead indicator (vertical line showing current position)
  - [x] 2.3 **Video Preview Player**
    - [x] 2.3.1 Create VideoPreview component using HTML5 `<video>` element
    - [x] 2.3.2 Implement play/pause/stop controls
    - [x] 2.3.3 Load selected clip into preview player
    - [x] 2.3.4 Sync playhead position with video currentTime
  - [x] 2.4 **Trim Functionality**
    - [x] 2.4.1 Add in/out point UI controls (buttons or handles on timeline clip)
    - [x] 2.4.2 Update clip trim data in store (store in/out timestamps, don't modify source file)
    - [x] 2.4.3 Reflect trim in timeline visual (adjust clip width)
    - [x] 2.4.4 Apply trim in preview player (set video currentTime range)
  - [x] 2.5 **Export Pipeline**
    - [x] 2.5.1 Create ExportDialog component with file save dialog
    - [x] 2.5.2 Create ffmpeg service wrapper (use fluent-ffmpeg or direct CLI calls)
    - [x] 2.5.3 Implement IPC handler for FFmpeg export (runs in main process)
    - [x] 2.5.4 Build FFmpeg command: concatenate clips, apply trims, encode to H.264 MP4
    - [x] 2.5.5 Show export progress (parse FFmpeg output for progress percentage)
    - [x] 2.5.6 Test exported file plays in VLC and QuickTime
    - [x] 2.5.7 Handle export errors gracefully (show user-friendly error messages)
  - [x] 2.6 **Project Save/Load**
    - [x] 2.6.1 Define project file format (JSON schema with .cfproj extension)
    - [x] 2.6.2 Add IPC handlers for save/load project files
    - [x] 2.6.3 Add loadProject() and getProjectData() actions to Zustand store
    - [x] 2.6.4 Add Save/Load Project buttons to App UI

- [ ] **3.0 MVP Packaging & Initial Testing** 🔴 Day 1
  - [ ] 3.1 Run production build (`npm run build`)
  - [ ] 3.2 Package app using electron-builder (`npm run package`)
  - [ ] 3.3 Test packaged .dmg/.app on Mac (not just dev mode)
  - [ ] 3.4 Verify complete workflow in packaged app: import → timeline → trim → export
  - [ ] 3.5 Test with multiple video files (3+ clips)
  - [ ] 3.6 Validate exported videos play correctly in multiple players
  - [ ] 3.7 Fix any packaging issues discovered (missing FFmpeg binary, path issues, etc.)
  - [ ] 3.8 Document any known issues or limitations

- [ ] **4.0 Recording Features (Screen & Webcam)** 🟡 Day 2
  - [ ] 4.1 **Screen Recording**
    - [ ] 4.1.1 Create RecordingControls component UI
    - [ ] 4.1.2 Implement screen source selection using Electron's desktopCapturer API
    - [ ] 4.1.3 Use MediaRecorder API to record selected screen/window
    - [ ] 4.1.4 Add start/stop recording controls with visual indicator (red dot)
    - [ ] 4.1.5 Save recorded video to temp file, auto-import to timeline
    - [ ] 4.1.6 Test 30-second screen recording → timeline → export workflow
  - [ ] 4.2 **Webcam Recording**
    - [ ] 4.2.1 Add webcam toggle to recording controls
    - [ ] 4.2.2 Access webcam stream using getUserMedia API
    - [ ] 4.2.3 Support simultaneous screen + webcam recording (two MediaRecorder instances)
    - [ ] 4.2.4 Save both recordings and add to timeline as separate clips
    - [ ] 4.2.5 Test combined screen + webcam recording workflow

- [ ] **5.0 Advanced Editing Features (Drag, Split, Multi-track, Scrubbing)** 🟡 Day 2
  - [ ] 5.1 **Drag to Reorder Clips**
    - [ ] 5.1.1 Add drag-and-drop handlers to TimelineClip component
    - [ ] 5.1.2 Update clip order in store on drop
    - [ ] 5.1.3 Animate clip repositioning for smooth UX
  - [ ] 5.2 **Split Clips**
    - [ ] 5.2.1 Add "Split" button or keyboard shortcut (S key)
    - [ ] 5.2.2 Split selected clip at playhead position
    - [ ] 5.2.3 Create two new clips with adjusted in/out points in store
    - [ ] 5.2.4 Update timeline view to show both clips
  - [ ] 5.3 **Delete Clips**
    - [ ] 5.3.1 Add delete button or keyboard shortcut (Delete/Backspace key)
    - [ ] 5.3.2 Remove selected clip from store
    - [ ] 5.3.3 Add confirmation for destructive actions (optional)
  - [ ] 5.4 **Multi-Track Support**
    - [ ] 5.4.1 Update timeline store to support multiple tracks (array of tracks)
    - [ ] 5.4.2 Create TimelineTrack component container
    - [ ] 5.4.3 Allow clips to be placed on different tracks
    - [ ] 5.4.4 Update export to composite multiple tracks (FFmpeg overlay filter)
  - [ ] 5.5 **Real-Time Scrubbing**
    - [ ] 5.5.1 Make playhead draggable on timeline
    - [ ] 5.5.2 Update video preview currentTime as playhead moves
    - [ ] 5.5.3 Optimize for smooth scrubbing (debounce if needed, but < 100ms lag)
  - [ ] 5.6 **Export Resolution Options**
    - [ ] 5.6.1 Add resolution dropdown to ExportDialog (720p, 1080p presets)
    - [ ] 5.6.2 Update FFmpeg command to apply selected resolution (scale filter)
    - [ ] 5.6.3 Test exports at different resolutions

- [ ] **6.0 Final Packaging, Testing & Distribution** 🟢 Day 3
  - [ ] 6.1 Run full regression testing on all features
  - [ ] 6.2 Test complete workflows end-to-end:
    - [ ] 6.2.1 Record 30-sec screen → timeline → export
    - [ ] 6.2.2 Import 3 clips → arrange → trim → split → export
    - [ ] 6.2.3 Screen + webcam recording → multi-track → export
  - [ ] 6.3 Performance testing (10+ clips, 15+ min session, check for memory leaks)
  - [ ] 6.4 Fix critical bugs discovered during testing
  - [ ] 6.5 Polish UI (fix visual glitches, improve error messages)
  - [ ] 6.6 Build final production bundle
  - [ ] 6.7 Package final distributable (.dmg for Mac)
  - [ ] 6.8 Test packaged app on clean Mac system (not dev machine)
  - [ ] 6.9 Validate all exported videos upload successfully to YouTube
  - [ ] 6.10 Create brief README with installation and usage instructions
  - [ ] 6.11 Prepare for submission

---

## Notes

- **MVP Deadline**: Tuesday, October 28th at 10:59 PM CT
- **Final Deadline**: Wednesday, October 29th at 10:59 PM CT
- **Philosophy**: Working state is sacred - test after each logical change, every commit should be deployable
- **Priority**: Stability over features - no crashes during core workflow
- **Testing Strategy**: Test after each phase, validate packaging early (end of Day 1), test on real Mac hardware
- **FFmpeg Integration**: Package FFmpeg binary with app, test encoding early, parse output for progress
- **State Management**: Use Zustand for simplicity, store edit decisions not modified files (non-destructive)
- **Error Handling**: Validate files before import, handle unsupported codecs gracefully, show user-friendly errors
- **Research**: Consult latest Electron/React/FFmpeg docs when implementing - platforms evolve rapidly

