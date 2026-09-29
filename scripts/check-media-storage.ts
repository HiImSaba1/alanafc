import { constants, existsSync } from "node:fs";
import { access, stat, statfs } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";
import { mediaStoragePaths } from "../src/lib/media-storage";

const MINIMUM_AVAILABLE_BYTES = 256 * 1024 * 1024;

async function nearestExistingDirectory(start: string) {
  let current = start;
  while (!existsSync(current)) {
    const parent = dirname(current);
    if (parent === current) throw new Error("No existing ancestor is available for media storage.");
    current = parent;
  }
  if (!(await stat(current)).isDirectory()) throw new Error("The nearest media-storage ancestor is not a directory.");
  return current;
}

async function main() {
  const { uploadDirectory } = mediaStoragePaths();
  const writableAncestor = await nearestExistingDirectory(uploadDirectory);
  await access(writableAncestor, constants.W_OK);
  const filesystem = await statfs(writableAncestor);
  const availableBytes = Number(filesystem.bavail) * Number(filesystem.bsize);
  const enoughSpace = Number.isFinite(availableBytes) && availableBytes >= MINIMUM_AVAILABLE_BYTES;
  const report = { ok: enoughSpace, uploadDirectoryExists: existsSync(uploadDirectory), writableAncestor: true, minimumAvailableBytes: MINIMUM_AVAILABLE_BYTES, availableBytes };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  process.stderr.write(`Media storage preflight failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
