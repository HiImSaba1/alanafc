import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const start = read("start.js");
const config = read("next.config.ts");
const upload = read("scripts/prepare-papaki-upload.ps1");
const environment = read("scripts/prepare-papaki-environment.ps1");
const release = read("scripts/verify-papaki-release.ps1");
const guide = read("PAPAKI_DEPLOYMENT.md");
const packageJson = read("package.json");
const sprint = read("scripts/sprint-73.ps1");

if (start.indexOf("process.loadEnvFile") > start.indexOf('require("next")')) throw new Error("Production environment must load before Next.js starts.");
if (!start.includes('process.env.PORT || "3000"') || !start.includes('process.env.HOSTNAME || "0.0.0.0"')) throw new Error("Plesk host and port handling is incomplete.");
if (!start.includes('process.once("SIGTERM"') || !start.includes('process.once("SIGINT"')) throw new Error("The startup adapter lacks graceful shutdown handling.");
if (!config.includes("cpus: 1") || !config.includes('bodySizeLimit: "14mb"')) throw new Error("Shared-hosting build or upload limits are missing.");
if (!packageJson.includes('"build": "next build --webpack"')) throw new Error("Papaki builds must use the bounded webpack path.");
const packagedFiles = upload.match(/\$files\s*=\s*@\(([\s\S]*?)\)/)?.[1] ?? "";
if (!packagedFiles.includes("'start.js'") || packagedFiles.includes("'.env.local'") || packagedFiles.includes("'.env.production.local'")) throw new Error("The upload archive contract is unsafe or incomplete.");
if (!upload.includes("$productionEnvironmentPath = Join-Path $projectRoot '.env.production.local'") || !upload.includes("$heldEnvironmentPath")) throw new Error("The private production environment hold/restore contract is missing.");
if (!upload.includes("System.IO.Compression.ZipArchive") || !upload.includes("FileShare]::ReadWrite") || !upload.includes("after 12 attempts") || !upload.includes("Remove-Item -LiteralPath $archivePath")) throw new Error("The upload archive does not use the Windows lock-resilient ZIP path.");
if (!upload.includes("heldEnvironmentPath") || !upload.includes("Move-Item -LiteralPath $heldEnvironmentPath -Destination $productionEnvironmentPath")) throw new Error("Local packaging does not protect and restore the private production environment.");
if (!environment.includes("Use a dedicated non-root production database user") || !environment.includes("NEXT_SERVER_ACTIONS_ENCRYPTION_KEY") || !environment.includes("linux134.papaki.gr") || !environment.includes("RandomNumberGenerator]::Create()") || !environment.includes("generator.Dispose()") || !environment.includes("Alana FC Owner")) throw new Error("Production environment generation lacks required safety boundaries, defaults, or Windows PowerShell-compatible secret generation.");
if (!environment.includes("Read-CommentSetting") || !environment.includes("DB_HOST") || !environment.includes("DB_NAME") || !environment.includes("DB_USERNAME") || !environment.includes("DB_PASSWORD") || !environment.includes("Values were not printed") || !environment.includes("[IntPtr]::Zero")) throw new Error("Private Papaki database comment values are not loaded without disclosure and safe prompt fallback.");
if (!release.includes("forbidden secret, dependency, build, or test path") || !release.includes("must run inside Papaki after upload") || !release.includes("archive is older than the current source")) throw new Error("Release verification does not preserve the local/live or source-freshness boundary.");
if (!guide.includes("migrations alone do not recreate the imported news content") || !guide.includes("public/uploads/media") || !guide.includes("Rollback boundary")) throw new Error("The direct-cutover guide omits data, media, or rollback requirements.");
if (!packageJson.includes('"deploy:prepare-upload"') || !packageJson.includes('"deploy:prepare-environment"') || !packageJson.includes('"deploy:verify-release"')) throw new Error("Owner-run deployment commands are missing.");
if (!packageJson.includes('"db:migrate:production": "node --env-file=.env.production.local') || !packageJson.includes('"db:preflight:production": "node --env-file=.env.production.local') || !packageJson.includes('"admin:sync-credentials:production": "node --env-file=.env.production.local')) throw new Error("Papaki database commands do not explicitly load the private production environment.");
if (!sprint.includes("run-flat-sprint-contracts.ps1") || sprint.includes("deploy:prepare-upload") || sprint.includes("deploy:prepare-environment")) throw new Error("Sprint 73 must remain deterministic and must not package or create secrets.");

console.log("Sprint 73 Papaki/Plesk direct-deployment contract passed.");
