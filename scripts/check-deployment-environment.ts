import { existsSync } from "node:fs";
import process from "node:process";
import { auditDeploymentEnvironment, type DeploymentMode } from "../src/lib/deployment-environment";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const mode: DeploymentMode = process.argv.includes("--production") ? "production" : "local";
const report = auditDeploymentEnvironment(process.env, mode);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.ok) process.exitCode = 1;
