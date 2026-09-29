import { basename, isAbsolute, relative, resolve, sep } from "node:path";

export const MEDIA_PUBLIC_PREFIX = "/uploads/media";

export function isContainedPath(root: string, candidate: string, allowRoot = false) {
  const child = relative(root, candidate);
  if (child === "") return allowRoot;
  return child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

export function mediaStoragePaths(projectRoot = process.cwd()) {
  const publicRoot = resolve(projectRoot, "public");
  const uploadDirectory = resolve(publicRoot, "uploads", "media");
  if (!isContainedPath(publicRoot, uploadDirectory)) throw new Error("Media upload directory must remain inside the public root.");
  return { publicRoot, uploadDirectory, publicPrefix: MEDIA_PUBLIC_PREFIX };
}

export function mediaPublicPath(filename: string) {
  if (!filename || basename(filename) !== filename || filename === "." || filename === "..") throw new Error("Invalid media filename.");
  return `${MEDIA_PUBLIC_PREFIX}/${filename}`;
}
