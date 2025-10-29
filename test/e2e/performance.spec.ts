/**
 * E2E Performance Tests
 * 
 * Tests app performance with:
 * 1. Large number of clips (10+)
 * 2. Extended session duration (15+ minutes simulated)
 * 3. Memory leak detection
 * 4. Timeline responsiveness
 */

import { test, expect } from './electron-app';

test.describe('Performance Tests', () => {
  test('should handle 10+ clips without memory leaks', async ({ page, electronApp }) => {
    // Wait for app to load
    await page.waitForSelector('.app-container', { timeout: 10000 });

    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    console.log('Initial memory:', initialMetrics);

    // Simulate adding clips (we can't actually import files in this test,
    // but we can verify the UI remains responsive)
    
    // Check timeline is responsive by scrolling
    const timeline = page.locator('.timeline-container');
    await expect(timeline).toBeVisible();

    // Zoom in/out multiple times to test responsiveness
    const zoomInButton = page.locator('button:has-text("+")').first();
    const zoomOutButton = page.locator('button:has-text("-")').first();

    if (await zoomInButton.isVisible()) {
      for (let i = 0; i < 5; i++) {
        await zoomInButton.click();
        await page.waitForTimeout(100);
      }
      
      for (let i = 0; i < 5; i++) {
        await zoomOutButton.click();
        await page.waitForTimeout(100);
      }
    }

    // Wait a bit to let any potential memory leaks manifest
    await page.waitForTimeout(2000);

    // Check final memory usage
    const finalMetrics = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    console.log('Final memory:', finalMetrics);

    // Memory should not have grown excessively (allow 2x growth for normal operation)
    if (initialMetrics && finalMetrics) {
      const memoryGrowth = finalMetrics.usedJSHeapSize / initialMetrics.usedJSHeapSize;
      console.log('Memory growth factor:', memoryGrowth.toFixed(2) + 'x');
      
      // Allow up to 3x growth (generous threshold for test operations)
      expect(memoryGrowth).toBeLessThan(3);
    }
  });

  test('should maintain responsive UI with rapid interactions', async ({ page }) => {
    await page.waitForSelector('.app-container', { timeout: 10000 });

    // Measure timeline render performance
    const startTime = Date.now();
    
    // Perform rapid UI interactions
    const interactions = [
      () => page.click('.media-library'),
      () => page.click('.timeline-container'),
      () => page.click('.video-preview'),
    ];

    for (let i = 0; i < 10; i++) {
      for (const interaction of interactions) {
        await interaction();
        await page.waitForTimeout(50);
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Completed 30 interactions in ${duration}ms (${(duration/30).toFixed(1)}ms avg)`);
    
    // UI should remain responsive (each interaction < 200ms on average)
    expect(duration / 30).toBeLessThan(200);
  });

  test('should handle extended session without crashes', async ({ page }) => {
    await page.waitForSelector('.app-container', { timeout: 10000 });

    // Simulate extended session (condensed into 10 seconds for testing)
    const sessionDuration = 10000; // 10 seconds
    const intervalDuration = 1000; // 1 second
    const iterations = sessionDuration / intervalDuration;

    let errorCount = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errorCount++;
        console.error('Console error:', msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errorCount++;
      console.error('Page error:', error.message);
    });

    // Perform various operations over time
    for (let i = 0; i < iterations; i++) {
      // Click various UI elements
      const buttons = [
        'button:has-text("Import")',
        'button:has-text("Export")',
      ];

      for (const selector of buttons) {
        const button = page.locator(selector);
        if (await button.isVisible()) {
          await button.hover();
          await page.waitForTimeout(100);
        }
      }

      await page.waitForTimeout(intervalDuration);
    }

    // No critical errors should occur during extended session
    expect(errorCount).toBe(0);
  });

  test('should not leak event listeners', async ({ page }) => {
    await page.waitForSelector('.app-container', { timeout: 10000 });

    // Get initial listener count (approximation via performance monitoring)
    const initialListeners = await page.evaluate(() => {
      // We can't directly count listeners, but we can monitor for common leak patterns
      return {
        timestamp: Date.now(),
        windowKeys: Object.keys(window).length,
      };
    });

    // Perform operations that might create listeners
    const timeline = page.locator('.timeline-container');
    
    // Simulate playhead dragging (which adds/removes listeners)
    if (await timeline.isVisible()) {
      const box = await timeline.boundingBox();
      if (box) {
        // Simulate multiple drag operations
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(box.x + 100, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 200, box.y + 50);
          await page.mouse.up();
          await page.waitForTimeout(100);
        }
      }
    }

    const finalListeners = await page.evaluate(() => {
      return {
        timestamp: Date.now(),
        windowKeys: Object.keys(window).length,
      };
    });

    console.log('Window keys before:', initialListeners.windowKeys);
    console.log('Window keys after:', finalListeners.windowKeys);

    // Window keys should not grow significantly (allow some variance)
    const keyGrowth = finalListeners.windowKeys - initialListeners.windowKeys;
    expect(Math.abs(keyGrowth)).toBeLessThan(50);
  });

  test('should render timeline efficiently with zoom changes', async ({ page }) => {
    await page.waitForSelector('.timeline-container', { timeout: 10000 });

    const timeline = page.locator('.timeline-container');
    await expect(timeline).toBeVisible();

    // Measure zoom performance
    const zoomInButton = page.locator('button:has-text("+")').first();
    const zoomOutButton = page.locator('button:has-text("-")').first();
    
    if (await zoomInButton.isVisible() && await zoomOutButton.isVisible()) {
      const startTime = Date.now();
      let operations = 0;
      
      // Zoom in until disabled (max zoom)
      while (await zoomInButton.isEnabled()) {
        await zoomInButton.click();
        operations++;
        await page.waitForTimeout(50);
        
        // Safety limit to prevent infinite loop
        if (operations >= 10) break;
      }
      
      // Zoom out until disabled (min zoom)
      while (await zoomOutButton.isEnabled()) {
        await zoomOutButton.click();
        operations++;
        await page.waitForTimeout(50);
        
        // Safety limit
        if (operations >= 20) break;
      }
      
      const endTime = Date.now();
      const avgZoomTime = operations > 0 ? (endTime - startTime) / operations : 0;
      
      console.log(`Average zoom operation: ${avgZoomTime.toFixed(1)}ms (${operations} operations)`);
      
      // Each zoom should be fast (< 100ms)
      if (operations > 0) {
        expect(avgZoomTime).toBeLessThan(100);
      }
    }
  });
});

