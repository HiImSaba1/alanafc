import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const composer = read("src/components/admin/editorial-html-composer.tsx");
const draft = read("src/features/content/editor-draft.ts");
const editor = read("src/components/admin/content-editor.tsx");
const editPage = read("src/app/admin/content/[id]/page.tsx");

if (!draft.includes("parseEditorialDraft") || !draft.includes("2_000_000") || !draft.includes("value.bodyHtml === currentBodyHtml")) throw new Error("Local draft validation contract is incomplete.");
if (!composer.includes("window.localStorage.setItem") || !composer.includes("700") || !composer.includes("beforeunload")) throw new Error("Timed autosave or unsaved-change warning is missing.");
if (!composer.includes("Βρέθηκε μη αποθηκευμένο τοπικό πρόχειρο") || !composer.includes("Επαναφορά") || !composer.includes("Απόρριψη")) throw new Error("Explicit recovery choice is incomplete.");
if (!editor.includes('draftKey={initial.id ? `content-${initial.id}` : "new-content"}')) throw new Error("Drafts are not isolated per content record.");
if (!editPage.includes('clearDraftKey={saved === "1" ? "new-content" : undefined}')) throw new Error("Successful content creation does not clear its temporary draft.");

console.log("Sprint 32 local draft recovery and unsaved-change protection contract passed.");
