import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests/integration',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    // Enable WebGL for testing
    launchOptions: {
      args: [
        '--use-gl=desktop',
        '--enable-webgl',
        '--enable-webgl2',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    }
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:9000',
    timeout: 120 * 1000,
  },
});
