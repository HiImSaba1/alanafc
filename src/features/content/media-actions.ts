"use server";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { eq, inArray, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { z } from "zod";
import { audit, requireAdmin } from "@/features/admin-auth/session";
import { seoSlug } from "@/features/seo/content-seo";
import { db } from "@/lib/db";
import { contentEntries, mediaAssets, siteSettings } from "@/lib/db/schema";
import { mediaPublicPath, mediaStoragePaths } from "@/lib/media-storage";

const metadataSchema = z.object({
  id: z.coerce.number().int().positive(),
  altText: z.string().trim().min(3).max(500),
  caption: z.string().trim().max(1000).optional(),
  credit: z.string().trim().max(255).optional(),
});

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const uploadSchema = z.object({ altText: z.string().trim().min(3).max(500), caption: z.string().trim().max(1000).optional(), credit: z.string().trim().max(255).optional() });
const documentUploadSchema = z.object({ title: z.string().trim().min(3).max(191), description: z.string().trim().max(1000).optional() });

const publicRoot = resolve(process.cwd(), "public");
const deletableMediaRoots = [
  resolve(publicRoot, "uploads", "media"),
  resolve(publicRoot, "media"),
  resolve(publicRoot, "alana_fc_academy_images_wordpress"),
];

function deletableMediaPaths(asset: typeof mediaAssets.$inferSelect) {
  const manifest = Array.isArray(asset.derivativeManifest) ? asset.derivativeManifest as Array<{ publicPath?: string }> : [];
  const publicPaths = [asset.sourceRelativePath, ...manifest.map((item) => item.publicPath)]
    .filter((path): path is string => typeof path === "string" && path.trim().length > 0);

  return [...new Set(publicPaths.flatMap((publicPath) => {
    const candidate = resolve(publicRoot, publicPath.replace(/^\/+/, ""));
    const isApproved = deletableMediaRoots.some((root) => {
      const child = relative(root, candidate);
      return child !== "" && child !== ".." && !child.startsWith(`..${sep}`) && !isAbsolute(child);
    });
    return isApproved ? [candidate] : [];
  }))];
}

async function permanentlyDeleteUnusedMedia(ids: number[], actorUserId: number) {
  const assets = await db.select().from(mediaAssets).where(inArray(mediaAssets.id, ids));
  if (assets.length !== ids.length) throw new Error("Ένα ή περισσότερα media δεν βρέθηκαν.");
  const externalIds = new Set(assets.map((asset) => asset.externalId));
  const content = await db.select({ featured: contentEntries.featuredMediaExternalId, gallery: contentEntries.galleryMediaExternalIds }).from(contentEntries);
  const used = content.some((entry) => externalIds.has(entry.featured || "") || (Array.isArray(entry.gallery) && entry.gallery.some((externalId) => typeof externalId === "string" && externalIds.has(externalId))));
  if (used) throw new Error("Ένα ή περισσότερα media χρησιμοποιούνται σε περιεχόμενο και δεν μπορούν να διαγραφούν.");
  const settings = await db.select({ value: siteSettings.valueJson }).from(siteSettings);
  const usedInSettings = settings.some((entry) => {
    const serialized = JSON.stringify(entry.value);
    return typeof serialized === "string" && [...externalIds].some((externalId) => serialized.includes(`\"${externalId}\"`));
  });
  if (usedInSettings) throw new Error("Ένα ή περισσότερα media χρησιμοποιούνται στις ρυθμίσεις της ιστοσελίδας και δεν μπορούν να διαγραφούν.");

  const otherAssets = await db.select().from(mediaAssets).where(notInArray(mediaAssets.id, ids));
  const pathsUsedByOtherAssets = new Set(otherAssets.flatMap(deletableMediaPaths));
  const paths = [...new Set(assets.flatMap(deletableMediaPaths))].filter((path) => !pathsUsedByOtherAssets.has(path));
  await db.delete(mediaAssets).where(inArray(mediaAssets.id, ids));
  await Promise.all(paths.map((path) => unlink(path).catch(() => undefined)));
  await Promise.all(assets.map((asset) => audit("media.deleted", actorUserId, "media", asset.externalId)));
}

async function validatedPdf(file: File) {
  if (file.size === 0) throw new Error("Επιλέξτε αρχείο PDF.");
  if (file.size > MAX_DOCUMENT_BYTES) throw new Error("Το PDF δεν μπορεί να ξεπερνά τα 10 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const header = input.subarray(0, 5).toString("ascii");
  const trailer = input.subarray(Math.max(0, input.length - 2048)).toString("latin1");
  if (header !== "%PDF-" || !trailer.includes("%%EOF")) throw new Error("Το αρχείο δεν είναι έγκυρο PDF.");
  return input;
}

async function validatedImage(file: File) {
  if (file.size === 0) throw new Error("Επιλέξτε αρχείο εικόνας.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Η εικόνα δεν μπορεί να ξεπερνά τα 12 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  const metadata = await sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "error" }).rotate().metadata();
  if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "avif", "tiff"].includes(metadata.format || "")) throw new Error("Υποστηρίζονται έγκυρες εικόνες JPEG, PNG, WebP, AVIF ή TIFF.");
  return { input, width: metadata.width, height: metadata.height };
}

async function createWebpDerivatives(input: Buffer, width: number, altText: string) {
  const { uploadDirectory } = mediaStoragePaths();
  await mkdir(uploadDirectory, { recursive: true });
  const imageNumber = randomUUID().slice(0, 8);
  const base = `alanafc_${seoSlug(altText)}_img_${imageNumber}`;
  const widths = [...new Set([480, 960, 1600, width].filter((value) => value <= width))].sort((a, b) => a - b);
  const createdFiles: string[] = [];
  const derivatives: Array<{ width: number; publicPath: string; byteSize: number }> = [];
  try {
    for (const derivativeWidth of widths) {
      const filename = `${base}_${derivativeWidth}w.webp`;
      const absolutePath = resolve(uploadDirectory, filename);
      const output = await sharp(input, { limitInputPixels: MAX_IMAGE_PIXELS, failOn: "error" }).rotate().resize({ width: derivativeWidth, withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer();
      await writeFile(absolutePath, output, { flag: "wx" });
      createdFiles.push(absolutePath);
      derivatives.push({ width: derivativeWidth, publicPath: mediaPublicPath(filename), byteSize: output.length });
    }
    return { derivatives, createdFiles };
  } catch (error) {
    await Promise.all(createdFiles.map((path) => unlink(path).catch(() => undefined)));
    throw error;
  }
}

export async function uploadMediaAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = uploadSchema.safeParse(Object.fromEntries(formData));
  const file = formData.get("image");
  if (!parsed.success || !(file instanceof File) || file.size === 0) throw new Error("Επιλέξτε εικόνα και συμπληρώστε περιγραφικό alt text.");
  const { input, width, height } = await validatedImage(file);
  const unique = randomUUID();
  const { derivatives, createdFiles } = await createWebpDerivatives(input, width, parsed.data.altText);
  try {
    const largest = derivatives.at(-1)!;
    const externalId = `native-media-${unique}`;
    await db.insert(mediaAssets).values({ externalId, filename: largest.publicPath.split("/").pop()!, sourceRelativePath: largest.publicPath, sha256: null, mimeType: "image/webp", byteSize: largest.byteSize, width, height, altText: parsed.data.altText, caption: parsed.data.caption || null, credit: parsed.data.credit || null, derivativeManifest: derivatives, status: "ready" });
    await audit("media.uploaded", admin.id, "media", externalId);
  } catch (error) {
    await Promise.all(createdFiles.map((path) => unlink(path).catch(() => undefined)));
    throw error;
  }
  revalidatePath("/admin/media"); revalidatePath("/"); revalidatePath("/news");
  redirect("/admin/media?uploaded=1");
}

export async function uploadDocumentAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = documentUploadSchema.safeParse(Object.fromEntries(formData));
  const file = formData.get("document");
  if (!parsed.success || !(file instanceof File)) throw new Error("Επιλέξτε PDF και συμπληρώστε τον τίτλο του.");
  const input = await validatedPdf(file);
  const unique = randomUUID();
  const filename = `alanafc_${seoSlug(parsed.data.title)}_document_${unique.slice(0, 8)}.pdf`;
  const { uploadDirectory } = mediaStoragePaths();
  await mkdir(uploadDirectory, { recursive: true });
  const absolutePath = resolve(uploadDirectory, filename);
  await writeFile(absolutePath, input, { flag: "wx" });
  const externalId = `native-document-${unique}`;
  try {
    await db.insert(mediaAssets).values({
      externalId,
      filename,
      sourceRelativePath: mediaPublicPath(filename),
      sha256: createHash("sha256").update(input).digest("hex"),
      mimeType: "application/pdf",
      byteSize: input.length,
      width: null,
      height: null,
      altText: parsed.data.title,
      caption: parsed.data.description || null,
      credit: "Alana FC Academy",
      derivativeManifest: [],
      status: "ready",
    });
    await audit("document.uploaded", admin.id, "media", externalId);
  } catch (error) {
    await unlink(absolutePath).catch(() => undefined);
    throw error;
  }
  revalidatePath("/admin/media");
  revalidatePath("/admin/site/documents");
  redirect(formData.get("returnTo") === "documents" ? `/admin/site/documents?uploaded=1&document=${encodeURIComponent(externalId)}` : "/admin/media?uploaded=document");
}

export async function replaceMediaFileAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να αντικαταστήσει αρχεία media.");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  const file = formData.get("image");
  if (!id.success || !(file instanceof File)) throw new Error("Επιλέξτε έγκυρο αρχείο αντικατάστασης.");
  const rows = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id.data)).limit(1);
  const asset = rows[0];
  if (!asset) throw new Error("Το media δεν βρέθηκε.");
  if (!asset.externalId.startsWith("native-media-")) throw new Error("Τα legacy media προστατεύονται από αντικατάσταση.");
  const { input, width, height } = await validatedImage(file);
  const { derivatives, createdFiles } = await createWebpDerivatives(input, width, asset.altText || "alana fc academy");
  const largest = derivatives.at(-1)!;
  try {
    await db.update(mediaAssets).set({ filename: largest.publicPath.split("/").pop()!, sourceRelativePath: largest.publicPath, mimeType: "image/webp", byteSize: largest.byteSize, width, height, derivativeManifest: derivatives, status: "ready" }).where(eq(mediaAssets.id, asset.id));
  } catch (error) {
    await Promise.all(createdFiles.map((path) => unlink(path).catch(() => undefined)));
    throw error;
  }
  const uploadRoot = resolve(process.cwd(), "public", "uploads", "media");
  const previousManifest = Array.isArray(asset.derivativeManifest) ? asset.derivativeManifest as Array<{ publicPath?: string }> : [];
  const previousPaths = previousManifest.flatMap((entry) => typeof entry.publicPath === "string" ? [resolve(process.cwd(), "public", entry.publicPath.replace(/^\/+/, ""))] : []).filter((path) => { const child = relative(uploadRoot, path); return child !== "" && !child.startsWith(`..${sep}`) && child !== ".."; });
  await Promise.all(previousPaths.map((path) => unlink(path).catch(() => undefined)));
  await audit("media.file_replaced", admin.id, "media", asset.externalId);
  revalidatePath("/admin/media"); revalidatePath(`/admin/media/${asset.id}`); revalidatePath("/"); revalidatePath("/news");
  redirect(`/admin/media/${asset.id}?replaced=1`);
}

export async function updateMediaMetadataAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = metadataSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Συμπληρώστε περιγραφικό alt text τουλάχιστον 3 χαρακτήρων.");
  const existing = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.id, parsed.data.id)).limit(1);
  if (!existing[0]) throw new Error("Το media δεν βρέθηκε.");
  await db.update(mediaAssets).set({ altText: parsed.data.altText, caption: parsed.data.caption || null, credit: parsed.data.credit || null }).where(eq(mediaAssets.id, parsed.data.id));
  await audit("media.metadata_updated", admin.id, "media", String(parsed.data.id));
  revalidatePath("/"); revalidatePath("/news"); revalidatePath("/admin/media"); revalidatePath(`/admin/media/${parsed.data.id}`); revalidatePath("/sitemap.xml");
}

export async function deleteMediaAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να διαγράψει media.");
  const id = z.coerce.number().int().positive().safeParse(formData.get("id"));
  if (!id.success) throw new Error("Το media δεν είναι έγκυρο.");
  await permanentlyDeleteUnusedMedia([id.data], admin.id);
  revalidatePath("/admin/media"); revalidatePath("/"); revalidatePath("/news"); revalidatePath("/sitemap.xml");
  redirect("/admin/media");
}

export async function bulkDeleteMediaAction(formData: FormData) {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new Error("Μόνο ο ιδιοκτήτης μπορεί να διαγράψει media.");
  const parsedIds = [...new Set(formData.getAll("mediaIds").map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
  if (!parsedIds.length) throw new Error("Επιλέξτε τουλάχιστον ένα media.");
  if (parsedIds.length > 100) throw new Error("Μπορείτε να διαγράψετε έως 100 media κάθε φορά.");
  await permanentlyDeleteUnusedMedia(parsedIds, admin.id);
  revalidatePath("/admin/media"); revalidatePath("/"); revalidatePath("/news"); revalidatePath("/sitemap.xml");
  redirect("/admin/media?deleted=bulk");
}
