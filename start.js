/* eslint-disable @typescript-eslint/no-require-imports -- Plesk executes this startup adapter directly as CommonJS. */
const http = require("node:http");
const { existsSync } = require("node:fs");
const { resolve } = require("node:path");

// Plesk/Passenger launches this file directly from the private application root.
// Values supplied by Plesk take precedence over the optional production env file.
const productionEnvironmentPath = resolve(__dirname, ".env.production.local");
if (existsSync(productionEnvironmentPath)) {
  if (typeof process.loadEnvFile !== "function") {
    throw new Error("Node.js 20.12 or newer is required to load .env.production.local.");
  }
  process.loadEnvFile(productionEnvironmentPath);
}

const next = require("next");
const development = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");

const application = next({ dev: development, hostname, port });
const requestHandler = application.getRequestHandler();

application.prepare().then(() => {
  const server = http.createServer((request, response) => requestHandler(request, response));
  server.listen(port, hostname, () => console.log(`ALANA FC ACADEMY is running on port ${port}.`));

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
}).catch(() => {
  console.error("Unable to start ALANA FC ACADEMY. Review the private Plesk application log.");
  process.exit(1);
});
