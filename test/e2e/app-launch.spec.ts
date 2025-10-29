/**
 * E2E Test: Basic App Launch and UI
 * 
 * Verifies that:
 * 1. Electron app launches successfully
 * 2. Main window is created
 * 3. All UI components are visible
 * 4. No critical errors in console
 */

import { test, expect } from './electron-app';

test.describe('App Launch', () => {
  test('should launch Electron app successfully', async ({ electronApp, page }) => {
    // Verify app launched
    expect(electronApp).toBeTruthy();
    
    // Verify main window exists
    const windows = await electronApp.windows();
    expect(windows.length).toBeGreaterThan(0);
    
    // Verify window title
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('should display main UI components', async ({ page }) => {
    // Wait for app to be loaded
    await page.waitForSelector('.app-container', { timeout: 10000 });
    
    // Verify header
    const header = page.locator('.app-header');
    await expect(header).toBeVisible();
    
    // Verify app title
    const appTitle = page.locator('.app-title');
    await expect(appTitle).toBeVisible();
    expect(await appTitle.textContent()).toBe('ClipForge');
    
    // Verify main content area
    await expect(page.locator('.app-content')).toBeVisible();
  });

  test('should display media library', async ({ page }) => {
    const mediaLibrary = page.locator('.media-library');
    await expect(mediaLibrary).toBeVisible();
  });

  test('should display video preview area', async ({ page }) => {
    const videoPreview = page.locator('.video-preview');
    await expect(videoPreview).toBeVisible();
  });

  test('should display timeline', async ({ page }) => {
    const timeline = page.locator('.timeline-container');
    await expect(timeline).toBeVisible();
  });

  test('should have all header buttons', async ({ page }) => {
    // Verify all main action buttons exist
    await expect(page.locator('button:has-text("Open Project")')).toBeVisible();
    await expect(page.locator('button:has-text("Save Project")')).toBeVisible();
    await expect(page.locator('button:has-text("Import")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('should not have console errors on launch', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit for any errors to surface
    await page.waitForTimeout(2000);
    
    // Filter out expected/harmless errors
    const criticalErrors = errors.filter(err => 
      !err.includes('DevTools') && // Ignore DevTools warnings
      !err.includes('Extension') && // Ignore extension warnings
      !err.includes('favicon') // Ignore favicon 404s
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('App Window Properties', () => {
  test('should have correct window dimensions', async ({ page }) => {
    const viewportSize = page.viewportSize();
    
    // Window should be at least 1200x700 (minimum size from main/index.ts)
    if (viewportSize) {
      expect(viewportSize.width).toBeGreaterThanOrEqual(1200);
      expect(viewportSize.height).toBeGreaterThanOrEqual(700);
    }
  });

  test('should respond to window events', async ({ page }) => {
    // Verify page is interactive
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle');
    
    // Try clicking on a button to verify interactivity
    const importButton = page.locator('button:has-text("Import")');
    await expect(importButton).toBeEnabled();
  });
});


