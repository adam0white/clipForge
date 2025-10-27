# Product Context: ClipForge

## Why This Exists
CapCut transformed video editing by making it accessible and intuitive. We're building that experience from scratch for desktop - a native application where creators can record, import, arrange, and export professional videos.

## Core Problem
Build a desktop video editor that:
- Handles media streams and file processing reliably
- Provides a performant timeline interface
- Renders real-time preview smoothly
- Exports videos without crashes
- Works as a native app (not just dev mode)

## Testing Scenarios
1. Recording 30-second screen capture → timeline
2. Importing 3 video clips → arranging in sequence
3. Trimming clips and splitting at various points
4. Exporting 2-minute video with multiple clips
5. Webcam recording overlay on screen recording
6. Testing on Mac (and Windows if possible)

## Performance Targets
- Timeline UI responsive with 10+ clips
- Preview playback smooth (30 fps minimum)
- Export completes without crashes
- App launch under 5 seconds
- No memory leaks during 15+ minute sessions
- Exported videos maintain quality (not bloated)
