import { Page } from '@playwright/test';

export interface TestResult {
  success: boolean;
  error?: string;
  [key: string]: any;
}

export class GlifyTestHelper {
  constructor(private page: Page) {}

  /**
   * Wait for the map and glify to be fully loaded
   */
  async waitForGlifyReady(): Promise<void> {
    await this.page.waitForFunction(() => {
      const L = window.L as any;
      return L && 
             L.map && 
             L.glify && 
             L.glify.points && 
             typeof L.glify.points === 'function';
    });
  }

  /**
   * Execute a test function in the browser context
   */
  async executeTest(testFunction: () => any): Promise<TestResult> {
    try {
      const result = await this.page.evaluate(testFunction);
      return { success: true, ...result };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }

  /**
   * Test BaseGlLayer construction with missing settings
   * This should fail without the fix
   */
  async testBaseGlLayerConstruction(): Promise<TestResult> {
    return this.executeTest(() => {
      try {
        const glify = (window as any).L.glify;
        const map = (window as any).map;
        
        // Try to create a layer without proper settings
        // This should fail without the fix because the constructor
        // calls map.project() which triggers getters that access undefined settings
        const points = glify.points({
          map: map,
          data: { features: [] },
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
  }

  /**
   * Test coordinate order functionality
   */
  async testCoordinateOrder(): Promise<TestResult> {
    return this.executeTest(() => {
      try {
        const glify = (window as any).L.glify;
        
        // Test default coordinate order
        const initialOrder = glify.getCoordinateOrder();
        if (initialOrder !== 'lngFirst') {
          throw new Error(`Expected initial order to be 'lngFirst', got '${initialOrder}'`);
        }
        
        // Test changing coordinate order
        glify.setCoordinateOrder('latFirst');
        if (glify.getCoordinateOrder() !== 'latFirst') {
          throw new Error('Failed to set coordinate order to latFirst');
        }
        
        glify.setCoordinateOrder('lngFirst');
        if (glify.getCoordinateOrder() !== 'lngFirst') {
          throw new Error('Failed to set coordinate order back to lngFirst');
        }
        
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
  }

  /**
   * Test glify.points creation
   */
  async testGlifyPoints(): Promise<TestResult> {
    return this.executeTest(() => {
      try {
        const glify = (window as any).L.glify;
        const map = (window as any).map;
        
        const points = glify.points({
          map: map,
          data: { features: [] },
          size: 5
        });
        
        return { success: true, points };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
  }

  /**
   * Test glify.lines creation
   */
  async testGlifyLines(): Promise<TestResult> {
    return this.executeTest(() => {
      try {
        const glify = (window as any).L.glify;
        const map = (window as any).map;
        
        const lines = glify.lines({
          map: map,
          data: { 
            type: "FeatureCollection", 
            features: [] 
          },
          weight: 2
        });
        
        return { success: true, lines };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
  }

  /**
   * Test glify.shapes creation
   */
  async testGlifyShapes(): Promise<TestResult> {
    return this.executeTest(() => {
      try {
        const glify = (window as any).L.glify;
        const map = (window as any).map;
        
        const shapes = glify.shapes({
          map: map,
          data: { 
            type: "FeatureCollection", 
            features: [] 
          }
        });
        
        return { success: true, shapes };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    });
  }
}
