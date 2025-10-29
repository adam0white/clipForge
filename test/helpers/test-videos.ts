import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ffmpegPath = ffmpegInstaller.path;

export const TEST_VIDEOS_DIR = path.join(__dirname, '../fixtures/videos');

/**
 * Generate test video files using FFmpeg
 * Creates simple colored videos for testing import/export workflows
 */
export async function generateTestVideos() {
  // Ensure fixtures directory exists
  if (!fs.existsSync(TEST_VIDEOS_DIR)) {
    fs.mkdirSync(TEST_VIDEOS_DIR, { recursive: true });
  }

  const videos = [
    { name: 'test-video-1.mp4', duration: 5, color: 'red', fps: 30 },
    { name: 'test-video-2.mp4', duration: 7, color: 'green', fps: 30 },
    { name: 'test-video-3.mp4', duration: 10, color: 'blue', fps: 30 },
  ];

  for (const video of videos) {
    const outputPath = path.join(TEST_VIDEOS_DIR, video.name);
    
    // Skip if video already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Test video already exists: ${video.name}`);
      continue;
    }

    // Generate video using FFmpeg
    // testsrc2 generates color bars, lavfi is the virtual input
    const command = `"${ffmpegPath}" -f lavfi -i "color=c=${video.color}:s=1280x720:d=${video.duration}:r=${video.fps}" -c:v libx264 -pix_fmt yuv420p -y "${outputPath}"`;
    
    try {
      console.log(`Generating test video: ${video.name}...`);
      await execAsync(command);
      console.log(`✓ Generated: ${video.name}`);
    } catch (error) {
      console.error(`Failed to generate ${video.name}:`, error);
      throw error;
    }
  }

  return videos.map(v => path.join(TEST_VIDEOS_DIR, v.name));
}

/**
 * Clean up generated test videos
 */
export function cleanupTestVideos() {
  if (fs.existsSync(TEST_VIDEOS_DIR)) {
    fs.rmSync(TEST_VIDEOS_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test videos');
  }
}

/**
 * Get paths to test video files
 */
export function getTestVideoPaths() {
  return [
    path.join(TEST_VIDEOS_DIR, 'test-video-1.mp4'),
    path.join(TEST_VIDEOS_DIR, 'test-video-2.mp4'),
    path.join(TEST_VIDEOS_DIR, 'test-video-3.mp4'),
  ];
}

/**
 * Verify exported video exists and is valid
 */
export async function verifyExportedVideo(filePath: string): Promise<boolean> {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  // Use ffprobe to verify video is valid (use ffmpeg binary location + probe)
  try {
    const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
    const command = `"${ffprobePath}" -v error -select_streams v:0 -show_entries stream=codec_name,width,height,duration -of json "${filePath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    
    // Check if video has valid codec and dimensions
    return (
      data.streams &&
      data.streams.length > 0 &&
      data.streams[0].codec_name &&
      data.streams[0].width > 0 &&
      data.streams[0].height > 0
    );
  } catch (error) {
    console.error('FFprobe verification failed:', error);
    return false;
  }
}

