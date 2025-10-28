import { Track } from '@/types'
import { TimelineClip } from './TimelineClip'
import './TimelineTrack.css'

interface TimelineTrackProps {
  track: Track
  zoom: number
  trackIndex: number
}

export function TimelineTrack({ track, zoom, trackIndex }: TimelineTrackProps) {
  return (
    <div className="timeline-track" data-track-id={track.id}>
      <div className="track-content">
        {track.clips.map(clip => (
          <TimelineClip key={clip.id} clip={clip} zoom={zoom} />
        ))}
      </div>
    </div>
  )
}

