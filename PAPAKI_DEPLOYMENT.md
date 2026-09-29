# Alana FC direct deployment to Papaki/Plesk

This runbook is for the approved direct production cutover. It does not use a staging URL. Keep the existing WordPress files and SQL backup outside the application root until the new website has passed the live checks and rollback is no longer needed.

## What must move to production

The deployment has three separate assets:

1. The application archive created in `tmp/`.
2. The private `.env.production.local` file, uploaded separately and never placed in `public/`.
3. The current Next.js application data: the `next_alanafcacademy` database and the persistent `public/uploads/media` directory.

Running migrations creates the schema but does not copy the locally imported posts, redirects, registrations, contacts, audit history, or media records. Do not switch the domain until the required application data has been transferred and reconciled. Do not import the old WordPress SQL into the new application database.

## 1. Create the local release

From the project directory, run the commands in this order:

```powershell
Set-Location -LiteralPath 'C:\Users\sab_j\Desktop\Projects\AlanaFCAcademy\web'
npm run deploy:prepare-upload
npm run deploy:prepare-environment
npm run deploy:verify-release
```

Create the archive before the Papaki environment file. This keeps the local build connected to the already verified local database. The generated archive excludes secrets, dependencies, build output, test output, and database exports.

The environment script asks for the dedicated Papaki database username and password. It reads the already verified admin and mail settings from `.env.local`, generates new production-only encryption secrets, and writes the ignored `.env.production.local` file without printing secret values.

## 2. Prepare Papaki before changing the domain

- Use the MySQL database named by the private `DB_NAME` comment in `.env.local`.
- Create a dedicated non-root database user with a strong password and grant access only to that database.
- Confirm PHP/MySQL tools can import the prepared new-application SQL backup when it is available.
- Choose a private Node application root, for example `httpdocs/alanafc-app`. Do not use `public/` as the application root.
- Keep a copy of the WordPress files and database backup outside that root for rollback.

In local phpMyAdmin, export `next_alanafcacademy` as SQL with both structure and data. This export can contain private registration and contact records: keep it outside `public/`, do not add it to Git or the application ZIP, transfer it only through the authenticated Plesk panel, and remove the transfer copy after the import and reconciliation. Import that SQL into the empty Papaki database identified by `DB_NAME` before running the production migration command.

## 3. Upload the release

- Upload and extract the newest `tmp/alanafc-papaki-*.zip` into the private application root.
- Upload `.env.production.local` separately into that same private application root.
- Transfer `public/uploads/media` without changing filenames or folder structure.
- Import the prepared `next_alanafcacademy` application-data backup. If production starts from an empty database instead, run migrations first, then use only the approved application import commands; migrations alone do not recreate the imported news content.

Never upload `.env.local`, the old WordPress SQL, local verification logs, `node_modules`, or `.next`.

## 4. Configure the Plesk Node application

Use these values in Websites & Domains -> Node.js:

- Node.js version: `22.x`
- Application mode: `production`
- Application root: the private folder containing `package.json` and `start.js`
- Document root: the `public` subdirectory of the application root
- Application startup file: `start.js`

Plesk supplies `PORT`. The startup adapter binds to that port and loads `.env.production.local` before Next.js is initialized.

## 5. Install, migrate, build, and start

Run these commands from the Plesk application root, in order:

```text
npm ci
npm run env:check:production
npm run db:preflight:production
npm run db:migrate:production
npm run admin:sync-credentials:production
npm run build
```

Then enable or restart the Node.js application in Plesk. Do not run `npm run dev` in production.

If an application-data SQL backup was imported, migrations remain necessary: the migration runner records and applies only schema changes not already present. Take a production database backup immediately before every later migration.

## 6. Live acceptance checks before declaring the cutover complete

- `https://alanafc.gr/api/health` returns `ok: true` and `database: ready`.
- `/`, `/news`, one news article, `/contact-us`, and the registrations page return successfully.
- `/admin/login` accepts the owner username and password, while `/admin` remains private when logged out.
- The news counts, redirects, media previews, and uploaded files match the local approved state.
- Submit one clearly labelled test contact and one test registration with non-personal dummy data; verify admin notifications and both configured academy recipients.
- Verify mobile scrolling, menu navigation, cookie choices, 404 behavior, robots metadata, HTTPS, canonical URLs, favicon, and social preview metadata.
- Confirm new media uploads persist after a Plesk application restart.

## Rollback boundary

If health, database reconciliation, admin access, or form delivery fails, stop the Node application and restore the previous WordPress document root and database configuration. Do not delete the WordPress backup during the launch window. Preserve the failed Next.js database and logs for diagnosis instead of repeatedly migrating or overwriting them.

## Future releases

For later releases, preserve `.env.production.local` and `public/uploads/media`, back up the production database, upload the new source archive, run `npm ci`, migrate, build, and restart. Never replace the uploads directory with an empty local directory.
