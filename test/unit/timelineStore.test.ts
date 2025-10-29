import { describe, it, expect, beforeEach } from 'vitest';
import { useTimelineStore } from '../../src/store/timelineStore';
import { Clip } from '../../src/types';

describe('Timeline Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useTimelineStore.getState();
    store.clearTimeline();
    // Clear library
    useTimelineStore.setState({ library: [] });
  });

  describe('Clip Management', () => {
    it('should add a clip to the timeline', () => {
      const store = useTimelineStore.getState();
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 0,
        trimEnd: 10,
        trackId: 'track-1',
        metadata: {},
      };

      store.addClip(clip);

      const state = useTimelineStore.getState();
      expect(state.tracks[0].clips).toHaveLength(1);
      expect(state.tracks[0].clips[0]).toEqual(clip);
      expect(state.duration).toBe(10);
    });

    it('should remove a clip from the timeline', () => {
      const store = useTimelineStore.getState();
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 0,
        trimEnd: 10,
        trackId: 'track-1',
        metadata: {},
      };

      store.addClip(clip);
      expect(useTimelineStore.getState().tracks[0].clips).toHaveLength(1);

      store.removeClip('test-clip-1');
      expect(useTimelineStore.getState().tracks[0].clips).toHaveLength(0);
    });

    it('should update clip properties', () => {
      const store = useTimelineStore.getState();
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 0,
        trimEnd: 10,
        trackId: 'track-1',
        metadata: {},
      };

      store.addClip(clip);
      store.updateClip('test-clip-1', { trimStart: 2, trimEnd: 8 });

      const updatedClip = useTimelineStore.getState().tracks[0].clips[0];
      expect(updatedClip.trimStart).toBe(2);
      expect(updatedClip.trimEnd).toBe(8);
    });
  });

  describe('Split Functionality', () => {
    it('should split a clip at the specified time', () => {
      const store = useTimelineStore.getState();
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 0,
        trimEnd: 10,
        trackId: 'track-1',
        metadata: {},
      };

      store.addClip(clip);
      
      // Split at 5 seconds
      store.splitClip('test-clip-1', 5);

      const state = useTimelineStore.getState();
      const clips = state.tracks[0].clips;
      
      // Should have 2 clips now
      expect(clips).toHaveLength(2);
      
      // First clip: 0-5 seconds
      expect(clips[0].trimStart).toBe(0);
      expect(clips[0].trimEnd).toBe(5);
      expect(clips[0].startTime).toBe(0);
      
      // Second clip: 5-10 seconds
      expect(clips[1].trimStart).toBe(5);
      expect(clips[1].trimEnd).toBe(10);
      expect(clips[1].startTime).toBe(5);
    });

    it('should not split if split point is outside clip bounds', () => {
      const store = useTimelineStore.getState();
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 0,
        trimEnd: 10,
        trackId: 'track-1',
        metadata: {},
      };

      store.addClip(clip);
      
      // Try to split outside bounds
      store.splitClip('test-clip-1', -1);
      expect(useTimelineStore.getState().tracks[0].clips).toHaveLength(1);
      
      store.splitClip('test-clip-1', 15);
      expect(useTimelineStore.getState().tracks[0].clips).toHaveLength(1);
    });

    it('should handle split with trimmed clip', () => {
      const store = useTimelineStore.getState();
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 2, // Trimmed from 2s to 8s
        trimEnd: 8,
        trackId: 'track-1',
        metadata: {},
      };

      store.addClip(clip);
      
      // Split at 3 seconds timeline position (corresponds to 5s in video time)
      store.splitClip('test-clip-1', 3);

      const clips = useTimelineStore.getState().tracks[0].clips;
      
      // First clip: 2-5 seconds of source video
      expect(clips[0].trimStart).toBe(2);
      expect(clips[0].trimEnd).toBe(5);
      
      // Second clip: 5-8 seconds of source video
      expect(clips[1].trimStart).toBe(5);
      expect(clips[1].trimEnd).toBe(8);
    });
  });

  describe('Track Management', () => {
    it('should add a new track', () => {
      const store = useTimelineStore.getState();
      const newTrack = {
        id: 'track-2',
        name: 'Video Track 2',
        clips: [],
        isVisible: true,
        isMuted: false,
      };

      store.addTrack(newTrack);

      const state = useTimelineStore.getState();
      expect(state.tracks).toHaveLength(2);
      expect(state.tracks[1]).toEqual(newTrack);
    });

    it('should remove a track', () => {
      const store = useTimelineStore.getState();
      const newTrack = {
        id: 'track-2',
        name: 'Video Track 2',
        clips: [],
        isVisible: true,
        isMuted: false,
      };

      store.addTrack(newTrack);
      expect(useTimelineStore.getState().tracks).toHaveLength(2);

      store.removeTrack('track-2');
      expect(useTimelineStore.getState().tracks).toHaveLength(1);
    });
  });

  describe('Playhead Position', () => {
    it('should update playhead position', () => {
      const store = useTimelineStore.getState();
      
      store.setPlayheadPosition(5.5);
      expect(useTimelineStore.getState().playheadPosition).toBe(5.5);
      
      store.setPlayheadPosition(10);
      expect(useTimelineStore.getState().playheadPosition).toBe(10);
    });
  });

  describe('Library Management', () => {
    it('should add items to library', () => {
      const store = useTimelineStore.getState();
      const libraryItem = {
        filePath: '/path/to/video.mp4',
        name: 'Test Video',
        duration: 10,
        metadata: {},
      };

      store.addToLibrary(libraryItem);

      const state = useTimelineStore.getState();
      expect(state.library).toHaveLength(1);
      expect(state.library[0]).toEqual(libraryItem);
    });

    it('should not add duplicate items to library', () => {
      const store = useTimelineStore.getState();
      const libraryItem = {
        filePath: '/path/to/video.mp4',
        name: 'Test Video',
        duration: 10,
        metadata: {},
      };

      store.addToLibrary(libraryItem);
      store.addToLibrary(libraryItem); // Try to add again

      const state = useTimelineStore.getState();
      expect(state.library).toHaveLength(1); // Should still be 1
    });

    it('should remove items from library', () => {
      const store = useTimelineStore.getState();
      const libraryItem = {
        filePath: '/path/to/video.mp4',
        name: 'Test Video',
        duration: 10,
        metadata: {},
      };

      store.addToLibrary(libraryItem);
      expect(useTimelineStore.getState().library).toHaveLength(1);

      store.removeFromLibrary('/path/to/video.mp4');
      expect(useTimelineStore.getState().library).toHaveLength(0);
    });
  });

  describe('Project Data', () => {
    it('should export project data correctly', () => {
      const store = useTimelineStore.getState();
      
      // Add some data
      const clip: Clip = {
        id: 'test-clip-1',
        name: 'Test Video',
        filePath: '/path/to/video.mp4',
        duration: 10,
        startTime: 0,
        trimStart: 0,
        trimEnd: 10,
        trackId: 'track-1',
        metadata: {},
      };
      
      store.addClip(clip);
      store.addToLibrary({
        filePath: '/path/to/video.mp4',
        name: 'Test Video',
        duration: 10,
        metadata: {},
      });
      store.setProjectName('Test Project');

      const projectData = store.getProjectData();

      expect(projectData.name).toBe('Test Project');
      expect(projectData.version).toBe('1.0.0');
      expect(projectData.timeline.tracks).toHaveLength(1);
      expect(projectData.timeline.tracks[0].clips).toHaveLength(1);
      expect(projectData.library).toHaveLength(1);
    });

    it('should load project data correctly', () => {
      const store = useTimelineStore.getState();
      
      const projectData = {
        version: '1.0.0',
        name: 'Loaded Project',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        timeline: {
          tracks: [
            {
              id: 'track-1',
              name: 'Video Track 1',
              isVisible: true,
              isMuted: false,
              clips: [
                {
                  id: 'clip-1',
                  name: 'Test Video',
                  filePath: '/path/to/video.mp4',
                  duration: 10,
                  startTime: 0,
                  trimStart: 0,
                  trimEnd: 10,
                  trackId: 'track-1',
                  metadata: {},
                },
              ],
            },
          ],
          playheadPosition: 5,
          zoom: 30,
          duration: 10,
        },
        library: [
          {
            filePath: '/path/to/video.mp4',
            name: 'Test Video',
            duration: 10,
            metadata: {},
          },
        ],
      };

      store.loadProject(projectData);

      const state = useTimelineStore.getState();
      expect(state.projectName).toBe('Loaded Project');
      expect(state.tracks[0].clips).toHaveLength(1);
      expect(state.library).toHaveLength(1);
      expect(state.playheadPosition).toBe(5);
      expect(state.zoom).toBe(30);
    });
  });

  describe('Zoom Control', () => {
    it('should update zoom level', () => {
      const store = useTimelineStore.getState();
      
      store.setZoom(50);
      expect(useTimelineStore.getState().zoom).toBe(50);
    });

    it('should clamp zoom between 10 and 100', () => {
      const store = useTimelineStore.getState();
      
      store.setZoom(5); // Too low
      expect(useTimelineStore.getState().zoom).toBe(10);
      
      store.setZoom(150); // Too high
      expect(useTimelineStore.getState().zoom).toBe(100);
    });
  });
});


