# Product Requirements Document: ClipForge

**Version**: 1.0  
**Date**: October 27, 2025  
**Status**: Draft  
**Author**: Product Team  

---

## 1. Introduction/Overview

ClipForge is a desktop video editor designed for casual developers and content creators who need to quickly edit videos for YouTube. The application focuses on the essential workflow: record screen content, import video clips, arrange them on a timeline, trim out mistakes, and export the final product. 

**The Problem**: Existing video editors are either too complex (professional tools with steep learning curves) or too limited (browser-based tools with poor performance). Content creators need a native desktop app that "just works" without crashes or complicated features.

**The Solution**: A production-grade desktop video editor that handles the core loop reliably: Record → Import → Arrange → Export.

**Timeline Constraints**: 
- **MVP Deadline**: Tuesday, October 28th at 10:59 PM CT (24 hours from project start)
- **Final Submission**: Wednesday, October 29th at 10:59 PM CT
- **Total Development Time**: 72 hours

---

## 2. Goals

### Primary Goals
1. **Ship a working MVP in 24 hours** that demonstrates the complete video editing workflow
2. **Zero crashes during core workflow** - stability over features
3. **Native desktop experience** - fast, responsive, reliable
4. **Developer-friendly codebase** - easy to maintain and extend

### Secondary Goals
1. Enable screen and webcam recording natively within the app
2. Support multi-track timeline editing
3. Provide real-time video preview with smooth playback
4. Export videos in formats suitable for YouTube (MP4, H.264)

### Success Criteria
- User can complete full workflow (record → import → edit → export) without crashes
- Timeline UI remains responsive with 10+ video clips
- Video preview plays smoothly (30 fps minimum)
- Exported videos maintain quality without excessive file size
- App launches in under 5 seconds
- No memory leaks during 15+ minute editing sessions

---

## 3. User Stories

### Primary User: Developer Creating YouTube Tutorials
Records screen/webcam, imports B-roll, cuts out mistakes, exports to YouTube. Values reliability over features.

### MVP User Stories (24-Hour Deadline)

**US-001: Import and Preview** - Import video files to preview and edit them
- Drag-and-drop or file picker for video import
- Videos appear in media library/timeline
- Click to play in preview player
- Supports MP4 and MOV formats

**US-002: Timeline View** - See clips on timeline to arrange them
- Visual blocks showing clips and duration
- Time markers (seconds/minutes)
- Multiple clips supported

**US-003: Trim Clips** - Set in/out points to remove unwanted sections
- In/out point controls
- Timeline updates immediately
- Preview reflects trimmed version
- Non-destructive (original file unchanged)

**US-004: Export Video** - Export timeline to MP4 for YouTube
- Export button with file location chooser
- Progress indicator during export
- Valid MP4 output that plays in standard players
- No crashes during export

### Core Feature User Stories (72-Hour Final)

**US-005: Screen Recording** - Record screen directly in app
- Select full screen or specific window
- Start/stop recording controls
- Recorded video auto-appears in timeline
- Minimum 720p quality

**US-006: Webcam Recording** - Record webcam simultaneously with screen
- Enable webcam alongside screen recording
- Both streams captured simultaneously
- Webcam appears as separate clip or overlay

**US-007: Advanced Timeline** - Drag, split, delete clips for fine-tuning
- Drag clips to reorder
- Split clip at playhead
- Delete selected clips
- Smooth timeline updates

**US-008: Multi-Track** - Layer multiple video tracks (screen + webcam)
- At least 2 video tracks
- Place clips on different tracks
- Preview composites all visible tracks

**US-009: Real-Time Scrubbing** - Scrub timeline with real-time preview updates
- Drag playhead on timeline
- Frame-accurate preview updates
- Smooth scrubbing (< 100ms lag)

**US-010: Export Options** - Choose resolution to balance quality and file size
- Resolution presets (720p, 1080p)
- H.264 encoding

---

## 4. Functional Requirements

### 4.1 MVP Requirements (24-Hour Deadline)

**FR-001**: Desktop application must launch successfully as a native app (not just dev mode)

**FR-002**: Application must provide a file picker or drag-and-drop interface to import video files (MP4 and MOV minimum)

**FR-003**: Application must display imported video clips in a timeline view with visual representation of duration

**FR-004**: Application must include a video preview player that plays imported clips when selected

**FR-005**: Application must allow users to set in/out points on a clip (basic trim functionality)

**FR-006**: Application must export the timeline to a valid MP4 file that plays in standard video players

**FR-007**: Application must be packaged as a distributable native app (not just running in development mode)

### 4.2 Core Features (Final Submission - 72 Hours)

**FR-008**: Application must support screen recording with options to record full screen or specific windows

**FR-009**: Application must support webcam recording that can run simultaneously with screen recording

**FR-010**: Timeline editor must support drag-and-drop reordering of clips

**FR-011**: Timeline editor must support splitting clips at the playhead position

**FR-012**: Timeline editor must support deleting selected clips

**FR-013**: Timeline must support at least 2 video tracks for layering content

**FR-014**: Preview player must update in real-time when scrubbing the timeline playhead

**FR-015**: Export functionality must offer resolution options (at minimum: 720p, 1080p)

### 4.3 Performance Requirements

**FR-016**: Application must launch in under 5 seconds on modern hardware

**FR-017**: Timeline UI must remain responsive (no lag) with up to 10 clips loaded

**FR-018**: Video preview must maintain 30 fps playback minimum

**FR-019**: Application must not crash during normal usage sessions (15+ minutes)

**FR-020**: Application must not exhibit memory leaks during extended editing sessions

### 4.4 File Format Support

**FR-021**: Import must support MP4 format (H.264 codec)

**FR-022**: Import must support MOV format

**FR-023**: Export must produce MP4 files with H.264 video codec

**FR-024**: Exported videos must be compatible with YouTube upload requirements

### 4.5 User Interface Requirements

**FR-025**: Application must have a clear visual separation between media library, timeline, and preview areas

**FR-026**: Timeline must display time markers (seconds/minutes)

**FR-027**: Playback controls must include: Play, Pause, Stop

**FR-028**: Export process must show a progress indicator

**FR-029**: Recording controls must clearly indicate when recording is active

**FR-030**: Application must use native OS file dialogs for import/export

### 4.6 Data Management

**FR-031**: Application must perform non-destructive editing (original files remain unchanged)

**FR-032**: Application must save project state (optional for MVP, required for final)

**FR-033**: Application must handle missing/moved source files gracefully

---

## 5. Non-Goals (Out of Scope)

The following features are explicitly **out of scope** to maintain focus and meet deadlines:

### Permanently Out of Scope
1. **Transitions and Effects** - No fade, wipe, dissolve, or visual effects between clips
2. **Text Overlays and Titles** - No text editing, captions, or title cards
3. **Collaboration Features** - No multi-user editing, sharing, or real-time collaboration
4. **Advanced Color Grading** - No color correction, filters, or grading tools
5. **Audio Editing** - No waveform editing, audio effects, or mixing (basic audio passthrough only)
6. **Templates or Presets** - No pre-made project templates
7. **Plugins or Extensions** - No third-party plugin support
8. **Mobile Versions** - Desktop only (Mac primary target)
9. **Cloud Integration** - No cloud storage or syncing (stretch goal only)
10. **Advanced Export Formats** - MP4/H.264 only, no 4K, no ProRes, no VP9

### Stretch Goals (If Time Permits After MVP)
1. **Basic Audio Editing** - Volume adjustment, mute/unmute tracks
2. **Cloud Storage** - Save/load projects from cloud storage
3. **Project Save/Load** - Persistent project files (`.cfproj` format)
4. **Undo/Redo** - Timeline operation history
5. **Keyboard Shortcuts** - Common editing shortcuts (space for play/pause, etc.)
6. **Windows Build** - Cross-platform package (if framework supports it easily)

---

## 6. Design Considerations

### UI Layout
Standard video editor layout: Media library (left) + Preview player (top-right) + Timeline (bottom)
- Dark theme preferred
- Timeline shows clips as visual blocks with thumbnails
- Playhead as prominent vertical line
- Play/pause/stop/record controls near preview

### Key Interactions
- Drag-and-drop for import and reordering
- Click to select clips
- Space bar for play/pause
- Delete key to remove clips
- Right-click for split/delete options

---

## 7. Technical Considerations

### 7.1 Technology Stack Recommendations

**Desktop Framework**:

**Electron (Recommended for 72-hour deadline)**
- ✅ Mature ecosystem with extensive video editing examples
- ✅ `fluent-ffmpeg` npm package for easy FFmpeg integration
- ✅ Well-documented `desktopCapturer` API for screen recording
- ✅ Massive community - faster problem-solving when stuck
- ✅ Pure TypeScript/JavaScript - no context switching
- ⚠️ Larger bundle size (~150MB vs ~15MB)
- ⚠️ Slower startup time (~2-3s vs ~1s)

**Tauri (Modern alternative, riskier for deadline)**
- ✅ Smaller binaries, faster startup, more modern
- ✅ Can use TypeScript only (Rust backend is pre-built APIs)
- ⚠️ Newer ecosystem = fewer video editing examples
- ⚠️ Might need custom Rust commands for FFmpeg
- ⚠️ Smaller community = harder to debug edge cases

**Decision**: **Electron** - The deadline is tight, and getting stuck on Tauri-specific issues on Day 1 could derail the project. Electron's proven track record with media apps makes it the safer choice.

---

**Frontend Framework**:
- **React + TypeScript (Recommended)** - Industry standard, excellent tooling
  - Component-based architecture fits video editor UI well
  - TypeScript provides type safety and better IDE support
  - Large ecosystem of UI libraries

---

**Media Processing**:
- **FFmpeg** - Essential for video encoding/decoding
  - Use `@tauri-apps/api` to call FFmpeg binaries
  - For Electron: `fluent-ffmpeg` npm package
  
- **MediaRecorder API** - For screen/webcam recording
  - Browser-native API, well-supported
  - Works in both Electron and Tauri

- **Screen Capture**:
  - Tauri: Use platform-specific plugins or commands
  - Electron: `desktopCapturer` API

---

**Timeline UI**:
- **HTML5 Canvas (Recommended)** - High performance, full control
  - Fabric.js or Konva.js can simplify canvas manipulation
  
- **Alternative**: Custom CSS/DOM solution
  - Easier to implement initially
  - May have performance issues with many clips

**Recommendation**: Start with CSS/DOM for MVP speed, migrate to Canvas if performance becomes an issue.

---

**Video Player**:
- **HTML5 `<video>` element (Recommended)** - Native, reliable
  - Simple to implement
  - Good enough for preview playback
  
- **Alternative**: Video.js or Plyr for enhanced controls

---

### 7.2 Architecture Recommendations

**Build Strategy** (in order):
1. **File Import + Preview** - Validate media pipeline works
2. **Timeline View** - Build core UI before complex features
3. **Trim Functionality** - Simple editing before advanced operations
4. **Export Pipeline** - Test FFmpeg integration early
5. **Screen/Webcam Recording** - Add after core editing works
6. **Advanced Timeline** - Drag/split/multi-track last

**Key Architectural Patterns**:
- **Separation of Concerns**: Media logic separate from UI components
- **State Management**: Zustand or Redux for timeline state
- **Non-Destructive Editing**: Track edit decisions, never modify source files
- **Optimistic UI**: Update timeline immediately, process in background

---

### 7.3 Critical Implementation Notes

**FFmpeg Integration**:
- Package FFmpeg binary with the app (don't rely on system installation)
- Test encoding early - FFmpeg commands can be tricky
- Show progress during export (parse FFmpeg output)

**Memory Management**:
- Don't load entire video files into memory
- Use video element streaming for playback
- Clean up blob URLs when clips are removed

**Error Handling**:
- Gracefully handle unsupported codecs
- Validate files before import (check if video is readable)
- Show user-friendly error messages (no raw FFmpeg errors)

**Testing Strategy**:
- Test packaging early (Day 1 or Day 2)
- Test on real Mac hardware, not just dev environment
- Validate exported videos in multiple players (VLC, QuickTime, Chrome)

---

### 7.4 Development Workflow

**Day 1 (MVP - 24 hours)**:
1. Set up Tauri + React + TypeScript project
2. Implement file import (drag-and-drop or picker)
3. Display clips in simple timeline view
4. Add basic video preview player
5. Implement trim functionality (in/out points)
6. Integrate FFmpeg for export
7. **Package and test native build**

**Day 2 (Core Features - 24 hours)**:
1. Implement screen recording (MediaRecorder + desktopCapturer)
2. Add webcam recording
3. Build drag-and-drop timeline editing
4. Implement split and delete operations
5. Add multi-track support
6. Test complete workflow end-to-end

**Day 3 (Polish & Stretch Goals - 24 hours)**:
1. Real-time preview scrubbing optimization
2. Export resolution options
3. Bug fixes and performance tuning
4. Stretch goals if time permits (audio editing, undo/redo)
5. Final testing on Mac (and Windows if feasible)
6. **Package final build and validate submission**

---

### 7.5 Dependencies

**Core Dependencies**:
- `@tauri-apps/api` - Tauri framework APIs
- `react` + `react-dom` - UI framework
- `typescript` - Type safety
- `zustand` or `redux` - State management
- FFmpeg binary (bundled with app)

**Development Dependencies**:
- `vite` - Build tool (fast, modern)
- `@tauri-apps/cli` - Tauri CLI tools
- `eslint` + `prettier` - Code quality

**Optional Libraries**:
- `fabric.js` or `konva.js` - Canvas timeline (if needed)
- `react-player` - Enhanced video player (if HTML5 insufficient)

---

## 8. Success Metrics

### 8.1 Functional Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| MVP Feature Completion | 7/7 features | Manual checklist on Tuesday 10:59 PM |
| Core Feature Completion | 6/6 features | Manual checklist on Wednesday 10:59 PM |
| Crash-Free Workflow | 100% | Complete record → import → edit → export without crashes |
| File Format Support | MP4 + MOV import, MP4 export | Test with sample files |
| Packaging Success | Native app runs on Mac | Test `.dmg` or `.app` on clean Mac |

### 8.2 Performance Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| App Launch Time | < 5 seconds | Time from click to fully interactive |
| Timeline Responsiveness | No visible lag with 10 clips | Load 10+ clips, test drag/scroll |
| Preview Playback | 30 fps minimum | Visual inspection during playback |
| Memory Stability | No leaks in 15 min session | Monitor memory usage over time |
| Export Reliability | 100% success rate | Export 5 different timelines, all complete |

### 8.3 Quality Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Exported Video Quality | Visually lossless, < 2x file size growth | Compare source vs exported video |
| YouTube Compatibility | 100% upload success | Upload exported video to YouTube |
| User Workflow Completion | User completes full workflow in < 10 min | Manual testing scenario |

---

## 9. Open Questions

### 9.1 Technical Questions
1. **FFmpeg Licensing**: Do we need to include FFmpeg license/credits in the app?
2. **Codec Support**: Should we support additional codecs beyond H.264 (e.g., H.265/HEVC)?
3. **Max File Size**: Should we impose limits on import file size or video length?
4. **Timeline Precision**: What is the minimum time unit for editing (frame-level, second-level)?

### 9.2 UX Questions
1. **Project Files**: Should we save project state automatically or require manual save?
2. **Import Formats**: Are there other formats users will expect (AVI, WebM, MKV)?
3. **Webcam Overlay**: Should webcam default to overlay or separate track?
4. **Keyboard Shortcuts**: Which shortcuts are absolutely essential for MVP?

### 9.3 Scope Questions
1. **Audio Handling**: If we skip audio editing, do we at least pass through audio from source files?
2. **Error Recovery**: Should we auto-save project state to recover from crashes?
3. **Windows Support**: If Tauri makes cross-platform easy, should we target Windows on Day 3?
4. **Export Presets**: Should we include YouTube-specific export presets (1080p30, 1080p60)?

### 9.4 Testing Questions
1. **Test Files**: Do we have sample video files for testing, or should we create them?
2. **Edge Cases**: What should happen if user imports a 4K video or a corrupt file?
3. **Platform Testing**: Can we access a Windows machine for cross-platform testing?

---

## 10. Appendix

### 10.1 Acceptance Testing Scenarios

**Scenario 1: Basic Import and Export**
1. Launch ClipForge
2. Drag-and-drop a 30-second MP4 file
3. Clip appears in timeline
4. Click Export
5. Choose save location
6. Wait for export to complete
7. Verify exported MP4 plays correctly

**Scenario 2: Screen Recording**
1. Click "Record Screen"
2. Select window to record
3. Record for 30 seconds
4. Stop recording
5. Recorded clip appears in timeline
6. Preview plays smoothly

**Scenario 3: Multi-Clip Editing**
1. Import 3 video clips (MP4)
2. Arrange clips in desired order on timeline
3. Trim first clip (remove first 5 seconds)
4. Split second clip at 10-second mark
5. Delete unwanted section
6. Export final video
7. Verify exported video contains all edits

**Scenario 4: Webcam + Screen Recording**
1. Click "Record Screen + Webcam"
2. Select screen area and webcam
3. Record for 30 seconds
4. Both streams appear in timeline (or overlay)
5. Position/resize webcam overlay if needed
6. Export and verify both are visible

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | Product Team | Initial PRD created |

---

**Next Steps**:
1. Review and approve this PRD with stakeholders
2. Generate detailed task list from this PRD
3. Begin Day 1 implementation (MVP features)
4. Daily check-ins to track progress against timeline

