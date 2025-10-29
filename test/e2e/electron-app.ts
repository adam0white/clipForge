import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface ElectronFixtures {
  electronApp: ElectronApplication;
  page: Page;
}

/**
 * Extended Playwright test with Electron app fixtures
 * 
 * Usage:
 *   test('my test', async ({ electronApp, page }) => {
 *     // electronApp - Electron application instance
 *     // page - Main window page
 *   });
 */
export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // Launch Electron app in development mode for testing
    // For production testing, point to the packaged app
    const appPath = path.join(__dirname, '../../');
    
    const app = await electron.launch({
      args: ['.'],
      cwd: appPath,
      env: {
        ...process.env,
        NODE_ENV: 'test',
      },
    });

    // Wait for app to be ready
    await app.firstWindow();
    
    // Use the app
    await use(app);

    // Cleanup - close the app
    await app.close();
  },

  page: async ({ electronApp }, use) => {
    // Get the first window (main window)
    const window = await electronApp.firstWindow();
    
    // Wait for app to be loaded
    await window.waitForLoadState('domcontentloaded');
    
    // Use the page
    await use(window);
  },
});

export { expect } from '@playwright/test';


