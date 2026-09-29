/* eslint-disable @typescript-eslint/no-require-imports -- Plesk executes the standalone launcher directly as CommonJS. */
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

const environmentPath = resolve(__dirname, ".env.production.local");
if (existsSync(environmentPath)) {
  if (typeof process.loadEnvFile !== "function") throw new Error("Node.js 20.12 or newer is required.");
  process.loadEnvFile(environmentPath);
}

process.env.NODE_ENV = "production";
process.env.HOSTNAME ||= "0.0.0.0";
process.env.PORT ||= "3000";
require("./server.js");
