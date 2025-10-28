# System Patterns: ClipForge

## General Development Patterns (Learned from Past Projects)

### Intent-State-View Pattern

**Core Concept**: Applications need more than just `View = f(State)`. They need `Intent → State → View`.

**The Problem**: 
- Text editor: cursor on line 1 col 6, press down → line 2 col 6, but line 2 is only 1 char
- Cursor moves to col 1, but pressing down again should return to col 6
- The "true" cursor position is both col 1 AND col 6 simultaneously

**The Solution**:
Intent (what user wants) → State (valid, renderable) → View (display)

**Key Principles**:
1. **Intent is source of truth** - Preserve what user actually wants, even if currently invalid
2. **State is derived** - Parse and validate Intent into State for rendering
3. **Preserve invalid intent** - Don't discard "impossible" values, they may become valid later
4. **New intent from state, old intent preserved** - Mixed function of previous intent + state

**Examples in UX**:
- Tree view remembers expand/collapse state for hidden rows
- Tabs remember which tab was selected, even if currently disabled
- Widget toggles A/B/C remember ALL options, even if mutually exclusive
- Spreadsheets allow cyclic references temporarily (fixing one side fixes the other)

**UI Etiquette**: When software "remembers" your intent, it's invisible. When it forgets, users notice and get frustrated. Good UX is the goalkeeper's curse - only noticed when it fails.

**Validation Strategy**:
- Validate continuously and non-destructively
- Preserve the "mess" as much as possible
- Allow state transitions through invalid states
- New intent should be as valid as possible, old intent preserved as-is

**Architecture Impact**:
- Don't flatten intent into normalized state
- APIs should accept liberal user intent, not just valid mutations
- User-space should be very forgiving, kernel-space can be strict
- Front-end should sit NEXT to back-end, not in front of it
- User data belongs to user, not the system

**Reference**: [I is for Intent by Steven Wittens](https://acko.net/blog/i-is-for-intent/)

---

### Optimistic UI Pattern
Best for user-facing actions that need immediate feedback:

1. User performs action → Generate client-side ID
2. Update UI immediately (optimistic)
3. Send to backend/process in background
4. Receive confirmation with server ID
5. Update UI with final state
6. Handle rollback on failure

**Key Insight**: Users prefer instant feedback over perfect accuracy. Show action immediately, correct later if needed.

---

### Local-First Architecture Pattern
When building apps with offline support or performance requirements:

- **Local storage is source of truth for UI** (instant reads)
- **Server/backend is source of truth for sync** (persistent, consistent)
- **On reconnect**: Fetch missed data, merge intelligently
- **Conflict resolution**: Last-write-wins or operational transforms

**Benefits**: Instant UI updates, offline support, reduced server load

---

### Real-Time Sync Pattern
For collaborative or real-time features:

- **WebSocket/SSE connection** for bidirectional communication
- **Subscribe to resources** on app launch
- **Broadcast updates** to all connected clients
- **Clients update** local state + UI on receive
- **Heartbeat/ping** to detect dead connections

**Key Insight**: Real-time doesn't mean no persistence. Always persist state.

---

### Deduplication Pattern
Prevent duplicate data when receiving updates:

**3-Layer Defense**:
1. **Client ID Matching**: Track client-generated IDs to recognize own updates
2. **Server ID Checking**: Check server IDs before adding to cache
3. **Content Hashing**: Last resort - check content + timestamp uniqueness

**Critical**: Always deduplicate before adding to UI state or database.

---

### Multi-Platform Adapter Pattern
When building cross-platform apps (web, desktop, mobile):

**Pattern**: Create platform adapters with unified API
```
lib/platform/
├── storage.{native|web}.ts
├── notifications.{native|web}.ts
├── filesystem.{native|web}.ts
└── index.ts (exports platform-specific version)
```

**Benefits**:
- 95%+ code sharing
- Clean separation of platform-specific code
- Easy to test and maintain
- Conditional imports prevent bundling unused platform code

**Example**: `Platform.OS === 'web' ? import('web-impl') : import('native-impl')`

---

### Performance Optimization Patterns

#### Component Memoization
```typescript
// Expensive computations
const value = useMemo(() => expensiveCalc(data), [data]);

// Callbacks passed to children
const handler = useCallback(() => doSomething(), [deps]);

// Components that render frequently
const MemoizedComponent = React.memo(Component, arePropsEqual);
```

#### List Virtualization
For long lists (100+ items):
- Use windowing (only render visible items)
- Set appropriate `windowSize` and `initialNumToRender`
- Enable `removeClippedSubviews` on native platforms
- Implement pagination (load more on scroll)

**Impact**: 10,000 items → 50 rendered = 200x improvement

#### Cache Management
- Set appropriate `staleTime` and `cacheTime`
- Avoid excessive `invalidateQueries` calls
- Use `setQueryData` for immediate updates
- Batch cache updates when possible

---

### Database Best Practices

#### Migration Strategy
- Track migrations with version numbers
- Use `CREATE TABLE IF NOT EXISTS` for safety
- Add indexes for frequently queried columns
- Enable foreign key constraints
- Test migrations on production-like data

#### Query Optimization
- Use prepared statements (SQL injection protection)
- Batch queries when possible (N+1 problem)
- Add indexes for JOIN columns and WHERE clauses
- Monitor slow queries in production

---

### Media Processing Patterns

#### Compression Strategy
Before upload/storage:
1. Resize to max dimensions (e.g., 1024px width)
2. Compress with quality setting (70-80% JPEG)
3. Validate file size (enforce limits)
4. Generate thumbnails if needed

**Impact**: 5MB image → 200KB without visible quality loss

#### Lazy Loading
- Load thumbnails first, full quality on demand
- Use progressive image formats (JPEG progressive, WebP)
- Cache aggressively (images rarely change)
- Preload next/previous items in galleries

---

### State Management Patterns

**Separation of Concerns**:
- **Server State**: React Query, SWR, Apollo
  - Remote data, caching, background updates
- **App State**: Zustand, Redux, Context
  - UI toggles, current user, navigation state
- **Form State**: React Hook Form, Formik
  - Temporary input data, validation
- **URL State**: Router params/query
  - Shareable state, deep linking

**Key Insight**: Don't put server data in app state. Use specialized tools.

---

### Error Handling Patterns

#### Graceful Degradation
```typescript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.error('Operation failed:', error);
  // Return fallback value or partial result
  return fallbackValue;
}
```

#### User-Facing Errors
- **Validation Errors**: 400 - Show inline, specific field errors
- **Auth Errors**: 401/403 - Redirect to login, clear tokens
- **Not Found**: 404 - Show helpful message, suggest alternatives
- **Rate Limit**: 429 - Show retry timer, queue requests
- **Server Errors**: 500 - Show generic message, log details

**Never show raw error messages to users.** Translate technical errors to user-friendly language.

---

### Testing Strategy Patterns

#### Testing Pyramid
1. **Unit Tests**: Pure functions, utilities, helpers
2. **Integration Tests**: Components with dependencies, API clients
3. **E2E Tests**: Critical user flows only

**Key Insight**: Test behavior, not implementation. Users don't care about internal state.

#### Manual Testing Scenarios
Always test:
1. Happy path (everything works)
2. Error path (network fails, invalid input)
3. Edge cases (empty state, max values, special characters)
4. Performance (large datasets, slow networks)
5. Cross-platform (if applicable)

---

### Deployment & Configuration Patterns

#### Environment Management
- **Development**: Verbose logging, hot reload, local services
- **Staging**: Production-like, test deployments, integration tests
- **Production**: Minimal logging, optimizations, monitoring

**Never commit secrets.** Use environment variables or secret managers.

#### Centralized Configuration
```typescript
// config.ts
export const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  features: {
    enableBeta: process.env.ENABLE_BETA === 'true',
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
};
```

**Benefits**: Single source of truth, easy to audit, type-safe

---

### Build & Development Patterns

#### Dependency Management
- Lock versions for critical dependencies
- Use package manager lock files (package-lock.json, yarn.lock)
- Review dependencies before adding (size, maintenance, alternatives)
- Keep dependencies updated (security patches)

**Critical Dependencies**: Lock exact versions. Everything else: use ranges.

#### Development Workflow
1. **Feature branches**: One feature/fix per branch
2. **Small commits**: Atomic changes with clear messages
3. **Test before commit**: Prevent broken builds
4. **Review before merge**: Catch issues early
5. **Deploy often**: Small deployments = less risk

---

### Critical Learnings from Past Projects

1. **Deploy Early, Deploy Often**: Production reveals issues faster than local debugging
2. **Type Safety Saves Time**: TypeScript strict mode catches bugs before runtime
3. **Read Errors Completely**: Don't jump to conclusions, understand the root cause
4. **Consult Latest Docs**: Platforms evolve, documentation is source of truth
5. **Working State is Sacred**: Every commit should be deployable
6. **Know When to Stop**: Document blockers instead of spinning on impossible tasks
7. **Clean As You Go**: Delete scaffolding and temporary files when done
8. **Test on Real Hardware**: Don't wait until last minute to test packaged builds
9. **Performance Matters**: Users notice lag over 100ms, optimize early
10. **Start Simple**: Get basic flow working before adding complexity

---

### Platform-Specific Patterns

#### Electron Best Practices
- Use IPC for main ↔ renderer communication
- Enable context isolation for security
- Preload scripts for safe API exposure
- Package early, test often

#### Desktop App Performance
- Lazy load heavy dependencies
- Use native modules sparingly (affect portability)
- Monitor memory usage (prevent leaks)
- Optimize bundle size (affects startup time)

#### Video Processing
- Stream processing for large files (don't load entirely into memory)
- Show progress indicators (video operations are slow)
- Test encoding early (FFmpeg can be tricky)
- Validate output format compatibility

---

## Project-Specific Patterns

### Advanced Timeline Features (Phase 5.0)

**Drag-to-Reorder Clips**
- Clips draggable anywhere on timeline via clip body (not handles)
- Excludes handles, delete button, and other controls from drag initiation
- Updates `startTime` property to reposition clip
- Visual feedback: grab cursor → grabbing cursor, elevation with `.dragging` class
- Optimistic UI: Local state updates immediately, store syncs in parallel
- Export respects timeline order (sorted by `startTime`)

**Split Functionality**
- Split button in timeline header + S keyboard shortcut
- Splits selected clip at current playhead position
- Validation: Split point must be within clip bounds (trimStart < split < trimEnd)
- Creates two new clips:
  - Clip 1: Original trimStart → split point, original startTime
  - Clip 2: Split point → original trimEnd, startTime = playhead position
- Unique IDs with timestamp to prevent collisions
- Auto-selects second clip after split for continued editing
- Original clip removed, both new clips added atomically

**Delete Functionality**
- Delete button on selected clips + Delete/Backspace keyboard shortcuts
- Removes clip from timeline, library remains intact
- Deselects clip if it was selected
- No confirmation dialog (quick workflow)

**Multi-Track Support**
- Store already supports multiple tracks (array-based)
- Add Track button creates new track with auto-incrementing name
- Clips assigned to trackId, stay on their track
- Track UI simplified: No overlapping labels (removed to avoid hiding clips)
- Export concatenates all clips in timeline order (all tracks merged)
- True overlay composition (PIP) deferred for complexity

**Real-Time Scrubbing**
- Draggable playhead handle (enhanced UX):
  - Larger size: 16px × 20px (was 12px × 12px)
  - White border for contrast
  - Positioned above timeline (-4px top) for easier access
  - Hover effect: 15% scale up, color lightens
  - Drag effect: 20% scale up, glow effect
- Calculates new position from mouse X relative to timeline container
- Updates video preview currentTime in real-time (< 100ms latency)
- Auto-switches to different clip if playhead crosses clip boundaries
- Pauses auto-sync during playback to avoid conflicts
- Uses timeline container getBoundingClientRect() for accurate positioning

**Keyboard Shortcuts**
- S: Split clip at playhead
- Delete/Backspace: Delete selected clip
- Space: Play/Pause (inherited from Phase 2)
- Input field detection: Shortcuts disabled when typing in inputs/textareas

### Recording Features (Phase 4.0)

**Screen Recording with Electron desktopCapturer**
- `desktopCapturer.getSources()` provides screen/window sources with thumbnails
- Sources include display_id for screen identification
- Thumbnails converted to data URLs for UI display
- Selected source ID passed to getUserMedia with `chromeMediaSource: 'desktop'` constraint
- MediaRecorder with VP9 codec (`video/webm;codecs=vp9`) for efficient recording

**Webcam Recording with Audio**
- `getUserMedia({ audio: true, video: {...} })` for webcam access
- Target resolution: 1280x720 (ideal constraints)
- Audio enabled by default for webcam (not for screen - avoids feedback loops)
- Separate MediaRecorder instance from screen recording

**Simultaneous Recording Pattern**
- Two independent MediaRecorder instances running in parallel
- Separate chunk arrays for screen and webcam data
- Both stopped simultaneously, processed sequentially
- Each saved to temp directory with unique timestamp
- Both auto-imported to timeline as separate clips

**WebM Duration Metadata Handling**
- MediaRecorder creates WebM files **without proper duration metadata**
- HTML5 video element returns `duration: Infinity` for these files
- Solution: Track recording duration client-side (timer in React state)
- Pass duration alongside file path to import handler
- Import handler uses provided duration when video element fails
- Fallback metadata: { width: 1920, height: 1080, codec: 'vp9', frameRate: 30 }

**Recording State Management**
- `useRef` flag to prevent duplicate save operations (when both screen and webcam chunks update)
- Capture chunks to local variables immediately, then clear state
- Reset recording time after save completes (not when recording stops)
- Timer runs during recording, paused value used for saving

**Temp File Management**
- Recordings saved to `os.tmpdir()/clipforge-recordings/`
- Filename pattern: `screen-{timestamp}.webm` or `webcam-{timestamp}.webm`
- Auto-import to timeline after save
- Files persist until OS temp cleanup (user can trim/re-export later)

### Architecture Decisions

**Custom Protocol for Video Files** (Official Electron Approach)
- Electron blocks direct `file://` URLs in renderer for security
- Solution: `protocol.handle()` with `net.fetch()` - Official Electron API (v23+)
- Custom `safe-file://` scheme registered with streaming privileges
- Uses `pathToFileURL()` for proper file URL conversion
- Provides secure local file access with proper streaming support for media

**Non-Destructive Editing**
- Store trim points (in/out timestamps) in Zustand store
- Never modify source files
- Export process reads source files and applies trims during encoding

**IPC for Heavy Operations**
- FFmpeg runs in main process (has Node.js access)
- Progress updates sent via IPC events
- Prevents UI blocking during export

**Separation of Library and Timeline**
- Library: Stores imported video files (deduplicated by filePath)
- Timeline: Stores clip instances (can have multiple instances of same video)
- Deleting clip from timeline does NOT remove from library
- Library items can be re-added to timeline multiple times

**Video Element Cleanup & Optimization**
- Single video element per import (not 3 separate ones)
- `extractAllVideoData()` gets duration, metadata, and thumbnail in one pass
- Prevents resource contention from simultaneous file loads
- Proper cleanup: `video.src = '', video.load(), video.remove()`
- 10-second timeout with duplicate-prevention flag
- Reduced thumbnail quality (0.5) to minimize base64 size

### Data Flow

**Import Flow:**
1. User drops files or uses file picker
2. Files validated (extension check)
3. Video element loads metadata (duration, dimensions)
4. Thumbnail generated (canvas screenshot at 1s)
5. Clip object created and added to Zustand store
6. UI updates automatically (reactive)

**Export Flow:**
1. User clicks Export → Dialog opens
2. Clips collected from store, sorted by startTime
3. IPC call to main process with clips + settings
4. Main process uses FFmpeg to:
   - Single clip: trim + encode directly
   - Multiple clips: process each → concat → encode
   - **New (Phase 4)**: Scale+pad all clips to consistent resolution before concat
5. Progress updates sent back to renderer
6. On completion, save dialog returns file path

**Recording Flow (Phase 4):**
1. User selects "New Recording" → Source picker modal opens
2. desktopCapturer.getSources() fetches screen/window list with thumbnails
3. User selects source + optionally enables webcam
4. Recording starts:
   - Screen: getUserMedia with selected source ID
   - Webcam (if enabled): getUserMedia with video+audio constraints
   - Both: Two MediaRecorder instances, VP9 codec
5. User stops recording:
   - Both recorders stopped simultaneously
   - Chunks converted to Blobs
   - Saved to temp directory via IPC
6. Auto-import:
   - File paths + duration sent to import handler
   - Clips added to timeline with correct metadata

### Performance Optimizations

**Thumbnail Generation:**
- Generated once on import
- Stored as base64 data URL in memory
- Prevents repeated file reads

**Timeline Rendering:**
- CSS transforms for smooth animations
- Clip width calculated: `(trimEnd - trimStart) * zoom`
- Position calculated: `startTime * zoom`

**Video Playback:**
- HTML5 video element (hardware accelerated)
- Trim enforcement via `currentTime` boundaries
- Lightweight compared to Canvas rendering

**FFmpeg Video Scaling (Phase 4):**
- Problem: Mixed resolutions (e.g., 3440×1440 ultrawide + 1920×1080 standard + 1280×720 webcam) cause stretching
- Solution: Two-step filter chain:
  1. `scale=W:H:force_original_aspect_ratio=decrease` - Fit within target resolution
  2. `pad=W:H:(ow-iw)/2:(oh-ih)/2:black` - Add centered black bars to exact dimensions
- Target resolution determined by export settings or first clip's dimensions
- All intermediate clips normalized **before** concatenation
- Result: No stretching, proper aspect ratios maintained

### Known Limitations

**Current MVP Limitations:**

1. **Video Metadata Detection**
   - Uses HTML5 video element (not FFprobe)
   - Cannot accurately detect codec, framerate, bitrate
   - Assumption: 30fps default, codec unknown
   - Impact: Minor - doesn't affect functionality

2. **Thumbnail Quality**
   - Generated from 1-second mark
   - May not be representative for short clips or fade-ins
   - Single frame capture (not middle of clip)
   - Impact: Visual only - doesn't affect editing

3. **Export Performance**
   - Multiple clips require intermediate file processing
   - Each clip encoded separately, then concatenated
   - Slower than direct stream processing
   - Impact: 3+ clips may take 2-3x longer than single export

4. **Platform Support**
   - Mac-first development (tested on macOS only)
   - Windows/Linux untested
   - FFmpeg binary paths may differ
   - Impact: May need adjustments for cross-platform

5. **File Protocol Security (FIXED)**
   - Initial implementation used `file://` protocol - blocked by Electron security
   - Solution: Custom `safe-file://` protocol using `protocol.handle()` + `net.fetch()`
   - Critical insight: URL parser treats `safe-file:///Users/...` as hostname='Users', pathname='/abdul/...'
   - Fix: Reconstruct full path: `'/' + hostname + pathname` = `/Users/abdul/...`
   - Note: macOS filesystem is case-insensitive, so lowercase 'users' works fine
   - Impact: None (resolved in current version)

6. **Drag-and-Drop Import (FIXED)**
   - HTML5 File API doesn't expose file paths by default
   - Solution: Use Electron's `webUtils.getPathForFile(file)` in preload script
   - Exposes secure file path extraction from File objects
   - Impact: None (resolved in current version)

7. **Gaps in Timeline (Current Behavior)**
   - Timeline allows gaps between clips visually
   - Export concatenates clips end-to-end (gaps removed)
   - Rationale: Simplifies MVP export logic, matches most editing use cases
   - Impact: User may be surprised gaps disappear in export
   
   **Future Enhancement Ideas (Phase 3+):**
   - **Option 1: Preserve Gaps** - Insert black frames equal to gap duration
   - **Option 2: Close Gaps** - Add button to collapse gaps (move clips left)
   - **Option 3: Gap Selection** - Click gaps to select/delete, bringing clips end-to-end
   - **Option 4: Smart Export** - Ask user on export: "Keep gaps (black frames)" or "Remove gaps"
   - User preference would be remembered for future exports

8. **Clip Repositioning (Deferred)**
   - Clips cannot be dragged to new positions
   - Clips are positioned sequentially on import
   - Workaround: Re-import files in desired order, or use trim to reorder
   - Status: Deferred to Phase 3+ (drag-and-drop repositioning)
   - Impact: Less flexible editing workflow

9. **Memory Usage**
   - Thumbnails stored as base64 in memory
   - Large number of clips (50+) may consume significant RAM
   - No thumbnail cleanup on clip removal
   - Impact: Potential memory leak with heavy usage

8. **Video Format Support**
   - Limited to common formats (MP4, MOV, AVI, MKV, WebM)
   - Exotic codecs may fail to load
   - No validation of codec compatibility
   - Impact: Some videos may not import

**Architecture Limitations:**

1. **Single Track Focus**
   - Multi-track UI exists but not fully implemented
   - Export only processes clips from first track
   - No track mixing/compositing
   - Impact: Feature incomplete (planned for Phase 4.0)

2. **No Undo/Redo**
   - State changes are immediate and permanent
   - No history tracking in Zustand store
   - Users must manually revert changes
   - Impact: Poor UX for mistakes

3. **No Auto-Save**
   - Project state lives only in memory
   - App close/crash loses all work
   - No project file format
   - Impact: High risk of data loss
