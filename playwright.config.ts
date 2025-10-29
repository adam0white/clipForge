import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for ClipForge Electron app E2E testing
 * 
 * Testing strategy:
 * - Launch packaged Electron app (not dev mode) for realistic testing
 * - Test critical user workflows end-to-end
 * - Validate exported files and app state
 */
export default defineConfig({
  testDir: './test/e2e',
  
  /* Maximum time one test can run for */
  timeout: 60 * 1000, // 60 seconds per test (video operations can be slow)
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Sequential for Electron tests (single app instance)
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: 1, // Electron apps can't run in parallel easily
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },
  
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'electron',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],
});

