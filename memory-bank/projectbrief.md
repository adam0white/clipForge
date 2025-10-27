# Project Brief: ClipForge

## What We're Building
A production-grade desktop video editor in 72 hours that handles screen recording, webcam capture, clip import, timeline editing, and video export.

## Timeline
- **MVP**: Tuesday, October 28th at 10:59 PM CT - Hard gate
- **Final**: Wednesday, October 29th at 10:59 PM CT
- **Project Start**: Monday morning, October 27th

## MVP Must-Haves (Tuesday 10:59 PM CT)
1. Desktop app that launches (Electron or Tauri)
2. Basic video import (drag & drop or file picker for MP4/MOV)
3. Simple timeline view showing imported clips
4. Video preview player that plays imported clips
5. Basic trim functionality (set in/out points on a single clip)
6. Export to MP4 (even if just one clip)
7. Built and packaged as a native app (not just dev mode)

## Core Features (Full Submission)
- Screen recording (full screen or window selection)
- Webcam recording with simultaneous screen + webcam
- Timeline editor with drag, trim, split, delete
- Multi-track support (2+ tracks)
- Real-time preview with scrubbing
- Export to MP4 with resolution options

## Philosophy
*"Simple + working + shippable > feature-rich + crashes"*

The core loop is sacred: Record → Import → Arrange → Export.

## Development Principles
- **Specify what and why, not how** - Trust implementation decisions, focus on outcomes
- **Working state is sacred** - Every commit must be deployable; test before committing
- **Debug deeply** - Understand the problem before fixing; read errors completely
- **Consult latest docs** - Platforms evolve; check documentation when stuck
- **Clean as you go** - Delete scaffolding docs when done; keep only what's useful
- **Know when to stop** - Document blockers instead of spinning on impossible tasks
