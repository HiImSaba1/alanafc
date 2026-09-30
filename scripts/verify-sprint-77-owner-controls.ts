import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");
const site = read("src/app/admin/site/page.tsx");
const registration = read("src/app/admin/site/registrations/page.tsx");
const registrationSettings = read("src/features/site-settings/registration-settings.ts");
const repeater = read("src/components/admin/dynamic-settings-list-enhancer.tsx");
const picker = read("src/components/admin/media-path-picker.tsx");
const pages = read("src/app/admin/site/pages/page.tsx");
const users = read("src/app/admin/users/page.tsx");
const userActions = read("src/features/admin-auth/user-management-actions.ts");
const guide = read("src/app/admin/guide/page.tsx");
const shell = read("src/components/admin/admin-workspace-shell.tsx");

if (!site.includes("DynamicSettingsListEnhancer") || !repeater.includes("Προσθήκη slide") || !repeater.includes("data-repeat-remove") || !repeater.includes("data-repeat-up") || !repeater.includes("data-repeat-down") || repeater.includes("dragstart")) throw new Error("Accessible add/delete/up/down ordering controls are incomplete or legacy drag handling remains.");
if (!site.includes("MediaPickerEnhancer") || !registration.includes("MediaPickerEnhancer") || !picker.includes("Επιλογή από πολυμέσα") || !picker.includes("showModal")) throw new Error("The visual media picker is not connected to site settings.");
if (!pages.includes("about-us") || !pages.includes("coaching-staff") || !pages.includes("our-facilities") || !pages.includes("sportclub-alana") || !pages.includes("contact-us") || !site.includes('/admin/site/pages')) throw new Error("Structured internal-page shortcuts are incomplete.");
if (!registrationSettings.includes("isOpen") || !registrationSettings.includes("closedMessage") || !registrationSettings.includes("guardianEmailMessage") || !registrationSettings.includes("notificationRecipients") || !registration.includes("Λειτουργία φόρμας & email")) throw new Error("Owner-facing registration controls are incomplete.");
if (!users.includes("Νέος editor") || !userActions.includes('role: "editor"') || !userActions.includes("hashAdminPassword") || !userActions.includes("adminSessions") || !shell.includes('/admin/users')) throw new Error("Owner-managed limited editor accounts are incomplete.");
if (!guide.includes("Προσθήκη δημιουργείτε νέο στοιχείο") || !guide.includes("Χρήστες admin") || !guide.includes("SMTP κωδικοί δεν εμφανίζονται")) throw new Error("The Greek admin guide does not explain the new controls.");
if (site.includes("SMTP_PASSWORD") || registration.includes("SMTP_PASSWORD") || users.includes("ADMIN_PASSWORD")) throw new Error("A private credential name is exposed in the admin UI.");

process.stdout.write(`${JSON.stringify({ ok: true, dynamicLists: true, visualMediaPicker: true, structuredPageCards: 5, registrationControls: true, ownerManagedEditors: true, guideUpdated: true, writesPerformed: false }, null, 2)}\n`);
