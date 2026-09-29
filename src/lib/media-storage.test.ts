import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { isContainedPath, mediaPublicPath, mediaStoragePaths } from "./media-storage";

describe("media storage boundaries", () => {
  it("keeps runtime uploads inside the public media directory", () => {
    const projectRoot = resolve("fixture-root");
    const paths = mediaStoragePaths(projectRoot);
    expect(paths.uploadDirectory).toBe(resolve(projectRoot, "public", "uploads", "media"));
    expect(isContainedPath(paths.publicRoot, paths.uploadDirectory)).toBe(true);
    expect(mediaPublicPath("alanafc-team-img-01.webp")).toBe("/uploads/media/alanafc-team-img-01.webp");
  });

  it("rejects traversal and nested filenames", () => {
    expect(() => mediaPublicPath("../secret.webp")).toThrow("Invalid media filename");
    expect(() => mediaPublicPath("nested/secret.webp")).toThrow("Invalid media filename");
    expect(isContainedPath(resolve("fixture-root", "public"), resolve("other-root", "file.webp"))).toBe(false);
  });
});
