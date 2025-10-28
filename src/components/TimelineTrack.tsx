import { Track } from '@/types'
import { TimelineClip } from './TimelineClip'
import './TimelineTrack.css'

interface TimelineTrackProps {
  track: Track
  zoom: number
}

export function TimelineTrack({ track, zoom }: TimelineTrackProps) {
  return (
    <div className="timeline-track">
      <div className="track-content">
        {track.clips.map(clip => (
          <TimelineClip key={clip.id} clip={clip} zoom={zoom} />
        ))}
      </div>
    </div>
  )
}

