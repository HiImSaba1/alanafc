import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: { 
    baseURL: "http://127.0.0.1:3104", 
    trace: "retain-on-failure",
    channel: "chrome",
  },
  projects: [
    { name: "mobile-chromium", use: { ...devices["Pixel 5"], channel: "chrome" } },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: {
    command: "npm run start -- --port 3104",
    url: "http://127.0.0.1:3104",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});