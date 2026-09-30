import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const actions = read("src/features/content/media-actions.ts");
const queries = read("src/features/content/queries.ts");
const settings = read("src/features/site-settings/document-settings.ts");
const settingsAction = read("src/features/site-settings/document-actions.ts");
const admin = read("src/app/admin/site/documents/page.tsx");
const library = read("src/app/admin/media/page.tsx");
const detail = read("src/app/admin/media/[id]/page.tsx");
const publicPage = read("src/app/useful-documents/page.tsx");
const enhancer = read("src/components/admin/dynamic-settings-list-enhancer.tsx");
const site = read("src/lib/site.ts");
const gitignore = read(".gitignore");
const artifactBuilder = read("scripts/deploy/build-artifact.sh");

if (!actions.includes('header !== "%PDF-"') || !actions.includes('trailer.includes("%%EOF")') || !actions.includes("MAX_DOCUMENT_BYTES") || !actions.includes('mimeType: "application/pdf"')) throw new Error("PDF content validation or type persistence is incomplete.");
if (!actions.includes('createHash("sha256")') || !actions.includes("alanafc_${seoSlug(parsed.data.title)}_document_${unique.slice(0, 8)}.pdf") || !actions.includes('{ flag: "wx" }')) throw new Error("Document naming, checksum or collision-safe storage is incomplete.");
if (!actions.includes("usedInSettings") || !actions.includes("siteSettings.valueJson")) throw new Error("Site-setting media cannot be proven protected from deletion.");
if (!queries.includes("adminDocumentLibrary") || !queries.includes("publicDocumentsByExternalIds") || !queries.includes('like(mediaAssets.mimeType, "image/%")')) throw new Error("Image/PDF query separation is incomplete.");
if (!settings.includes('documentSettingsKey = "useful_documents_page"') || !settings.includes("native-document-") || !settingsAction.includes('revalidatePath("/useful-documents")')) throw new Error("Useful-document settings are incomplete.");
if (!admin.includes("uploadDocumentAction") || !admin.includes("documentCount") || !admin.includes("mediaExternalId") || !enhancer.includes("documentCount")) throw new Error("Document administration or ordering controls are incomplete.");
if (!library.includes("FileText") || !detail.includes("isPdf") || !publicPage.includes("publicDocumentsByExternalIds") || !publicPage.includes("EditorialButton")) throw new Error("PDF library/public rendering is incomplete.");
if (!site.includes('/useful-documents')) throw new Error("The useful documents route is missing from the sitemap contract.");
if (actions.includes("application/octet-stream") || actions.includes("file.type ===")) throw new Error("PDF trust must be based on file content, not a browser-provided MIME value.");
if (!gitignore.includes("/public/uploads/media/*") || !gitignore.includes("!/public/uploads/media/.gitkeep")) throw new Error("Runtime media uploads are not safely excluded from Git.");
const trackedUploads = execFileSync("git", ["ls-files", "--", "public/uploads/media/**"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
if (trackedUploads.some((path) => path !== "public/uploads/media/.gitkeep")) throw new Error(`Tracked runtime upload must be removed before release: ${trackedUploads.join(", ")}`);
if (!artifactBuilder.includes("Tracked runtime upload found in release source") || !artifactBuilder.includes("public/uploads/media") || !artifactBuilder.includes("! -name '.gitkeep'")) throw new Error("The Linux artifact builder does not fail closed on tracked runtime uploads.");

process.stdout.write(`${JSON.stringify({ ok: true, pdfSignatureValidation: true, safeStorage: true, publicDocumentsPage: true, ownerOrderingAndVisibility: true, settingsDeletionProtection: true, runtimeUploadsExcludedFromRelease: true, trackedUploadFiles: trackedUploads, writesPerformed: false }, null, 2)}\n`);
