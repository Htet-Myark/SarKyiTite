const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30000,
  retries: 0,
  globalTeardown: './global-teardown.js',
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  projects: [
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.js',
      use: {},
    },
    {
      name: 'ui',
      testMatch: '**/ui/**/*.spec.js',
      use: {
        baseURL: 'http://localhost:5173',
        ...devices['Desktop Chrome'],
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
      },
    },
  ],
});
