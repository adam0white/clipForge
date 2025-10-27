# Tech Context: ClipForge

## Tech Stack (TBD - To Be Decided)

### Desktop Framework Options
- **Electron**: More mature ecosystem, larger bundle size, Node.js access
- **Tauri**: Rust-based, smaller binaries, faster startup, modern approach

### Frontend Options
- React, Vue, Svelte, or Vanilla JS
- TypeScript recommended for type safety

### Media Processing
- **FFmpeg** - Essential for encoding/decoding
  - `fluent-ffmpeg` for Node.js (Electron)
  - `@ffmpeg/ffmpeg` for browser context
  - Native commands in Tauri
- **MediaRecorder API** - For screen/webcam recording
- **desktopCapturer** (Electron) or platform-specific APIs (Tauri)

### Timeline UI Options
- HTML5 Canvas
- Fabric.js or Konva.js
- Custom CSS/DOM solution

### Video Player
- HTML5 `<video>` element
- Video.js
- Plyr

## Architecture Patterns (To Be Implemented)

### Build Strategy
1. **Start with Import and Preview** - Validate media pipeline first
2. **Build the Timeline** - Core interface before complex features
3. **Add Recording Last** - Not critical for MVP
4. **Test Export Early** - FFmpeg encoding can be tricky
5. **Package and Test** - Don't wait until last minute

## Development Commands (To Be Defined)
Will be added once stack is chosen.

## Critical Configuration Notes
Will be documented as decisions are made.
