/**
 * Test Setup
 * 
 * Runs before all tests to:
 * 1. Generate test video files
 * 2. Verify FFmpeg is available
 * 3. Clean up any leftover test artifacts
 */

import { generateTestVideos } from './helpers/test-videos.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffmpeg from '@ffmpeg-installer/ffmpeg';

const execAsync = promisify(exec);

async function setup() {
  console.log('\n🧪 Setting up test environment...\n');

  // Verify FFmpeg is available (use bundled version)
  try {
    await execAsync(`${ffmpeg.path} -version`);
    console.log('✓ FFmpeg is available');
    console.log(`  Path: ${ffmpeg.path}`);
  } catch (error) {
    console.error('❌ FFmpeg not found. Please install FFmpeg to run tests.');
    process.exit(1);
  }

  // Generate test videos
  try {
    console.log('\n📹 Generating test video files...\n');
    await generateTestVideos();
    console.log('\n✓ Test videos generated successfully\n');
  } catch (error) {
    console.error('❌ Failed to generate test videos:', error);
    process.exit(1);
  }

  console.log('✅ Test environment ready!\n');
}

// Run setup
setup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});

