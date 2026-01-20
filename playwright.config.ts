import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Spanish Learning App
 *
 * Projects:
 * - api: API contract testing against FastAPI backend
 * - ui: UI testing with accessibility checks for Chainlit frontend
 */
export default defineConfig({
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL for tests
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers and test types
  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        baseURL: 'http://localhost:8000',
        extraHTTPHeaders: {
          'Accept': 'application/json',
        },
      },
    },

    {
      name: 'ui',
      testDir: './tests/ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:8001',
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Run your local dev servers before starting the tests
  webServer: [
    {
      command: 'source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000',
      url: 'http://localhost:8000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'source venv/bin/activate && chainlit run app.py --port 8001 --host 0.0.0.0',
      url: 'http://localhost:8001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
