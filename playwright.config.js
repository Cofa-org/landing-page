import { defineConfig } from '@playwright/test';

const phoneUA = 'Mozilla/5.0 (Linux; Android 14; Synthetic) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0.0.0 Mobile Safari/537.36';
export default defineConfig({
  testDir: './e2e', testMatch: 'dni-camera.spec.js', fullyParallel: false, workers: 1,
  timeout: 35000, expect: { timeout: 8000 },
  outputDir: './test-results/dni', reporter: [['list'], ['json', { outputFile: './test-results/dni/results.json' }]],
  use: { baseURL: 'http://127.0.0.1:4179', trace: 'retain-on-failure', screenshot: 'only-on-failure', serviceWorkers: 'block' },
  projects: ['chromium', 'firefox', 'webkit'].flatMap(browserName => [
    { name: `${browserName}-desktop`, use: { browserName, viewport: { width: 1440, height: 900 }, hasTouch: true } },
    { name: `${browserName}-phone`, use: { browserName, viewport: { width: 390, height: 844 }, userAgent: phoneUA, hasTouch: true } },
  ]),
  webServer: { command: 'npm exec vite -- --config e2e/vite.config.js --host 127.0.0.1 --port 4179 --strictPort', url: 'http://127.0.0.1:4179/e2e/harness.html', reuseExistingServer: false },
});
