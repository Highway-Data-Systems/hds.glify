import { test, expect } from '@playwright/test';

test.describe('BaseGlLayer Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to our test page
    await page.goto('/test-page.html');
    
    // Wait for the map to be ready
    await page.waitForSelector('#map');
    
    // Wait for glify to be loaded
    await page.waitForFunction(() => {
      return (window as any).glifyLoaded === true;
    }, { timeout: 30000 });
    
    // Additional wait to ensure everything is ready
    await page.waitForTimeout(1000);
  });

  test('should not fail during BaseGlLayer construction with missing settings', async ({ page }) => {
    // This test should fail without the fix because the constructor
    // calls map.project() which triggers getters that access undefined settings
    
    // Click the test button to trigger the problematic code path
    await page.click('text=Test BaseGlLayer Construction');
    
    // Wait for the test to complete and check the result
    await page.waitForSelector('.test-result', { timeout: 10000 });
    
    // Get the test result
    const resultElement = await page.locator('.test-result').first();
    const resultText = await resultElement.textContent();
    
    // The test should pass (no errors) because we have the fix
    expect(resultText).toContain('BaseGlLayer construction test passed');
    
    // Verify no error messages
    const errorElements = await page.locator('.test-error').count();
    expect(errorElements).toBe(0);
  });

  test('should handle glify.points creation without errors', async ({ page }) => {
    // Test the actual glify.points method that would be used in real applications
    
    // Click the test button
    await page.click('text=Test Glify Points Creation');
    
    // Wait for the test to complete
    await page.waitForSelector('.test-result', { timeout: 10000 });
    
    // Check the result
    const resultElement = await page.locator('.test-result').first();
    const resultText = await resultElement.textContent();
    
    expect(resultText).toContain('Glify points creation test passed');
    
    // Verify no errors
    const errorElements = await page.locator('.test-error').count();
    expect(errorElements).toBe(0);
  });

  test('should handle glify.lines creation without errors', async ({ page }) => {
    // Test the actual glify.lines method
    
    await page.click('text=Test Glify Lines Creation');
    
    await page.waitForSelector('.test-result', { timeout: 10000 });
    
    const resultElement = await page.locator('.test-result').first();
    const resultText = await resultElement.textContent();
    
    expect(resultText).toContain('Glify lines creation test passed');
    
    const errorElements = await page.locator('.test-error').count();
    expect(errorElements).toBe(0);
  });

  test('should handle glify.shapes creation without errors', async ({ page }) => {
    // Test the actual glify.shapes method
    
    await page.click('text=Test Glify Shapes Creation');
    
    await page.waitForSelector('.test-result', { timeout: 10000 });
    
    const resultElement = await page.locator('.test-result').first();
    const resultText = await resultElement.textContent();
    
    expect(resultText).toContain('Glify shapes creation test passed');
    
    const errorElements = await page.locator('.test-error').count();
    expect(errorElements).toBe(0);
  });

  test('should execute JavaScript directly without constructor errors', async ({ page }) => {
    // Test the problematic code path directly in the browser context
    // This is what would actually fail without the fix
    
    // Wait for map to be fully ready before testing
    await page.waitForFunction(() => {
      const map = (window as any).map;
      return map && 
             map.getCenter() && 
             map.getZoom() && 
             map.getCenter().lat === 0 && 
             map.getCenter().lng === 0;
    }, { timeout: 10000 });
    
    const result = await page.evaluate(() => {
      try {
        // Get the glify instance
        const glify = (window as any).L.glify;
        
        // Try to create a layer without proper settings
        // This should fail without the fix because the constructor
        // calls map.project() which triggers getters that access undefined settings
        const points = glify.points({
          map: (window as any).map,
          data: { 
            type: "FeatureCollection", 
            features: [] 
          },
          // Intentionally omit longitudeKey/latitudeKey to trigger the error
          size: 5,
          vertexShaderSource: " ",
          fragmentShaderSource: " "
        });
        
        return { success: true, points };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
    
    // This should succeed because we have the fix
    expect(result.success).toBe(true);
    expect(result.points).toBeDefined();
  });

  test('should handle coordinate order methods correctly', async ({ page }) => {
    // Test the coordinate order functionality in a real browser environment
    
    const result = await page.evaluate(() => {
      try {
        const glify = (window as any).L.glify;
        
        // Test coordinate order methods
        const initialOrder = glify.getCoordinateOrder();
        if (initialOrder !== 'lngFirst') {
          throw new Error(`Expected initial order to be 'lngFirst', got '${initialOrder}'`);
        }
        
        // Change to latitude first
        glify.setCoordinateOrder('latFirst');
        if (glify.getCoordinateOrder() !== 'latFirst') {
          throw new Error('Failed to set coordinate order to latFirst');
        }
        
        // Change back to longitude first
        glify.setCoordinateOrder('lngFirst');
        if (glify.getCoordinateOrder() !== 'lngFirst') {
          throw new Error('Failed to set coordinate order back to lngFirst');
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
    
    expect(result.success).toBe(true);
  });
});
