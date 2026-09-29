# Alana FC Academy

Custom Next.js website and administration system for Alana FC Academy.

## Sprint 00: read-only WordPress inventory

The source XML exports, images, and legacy SQL dump live one directory above this application. The inspection command reads them, calculates checksums, and writes reconciliation reports without importing, changing, or publishing source content. The fresh application database is `next_alanafcacademy`; this command never connects to it.

```powershell
npm run wp:inspect
```

Generated reports:

- `artifacts/verification/sprint-00-inventory.json`
- `artifacts/verification/sprint-00-inventory.md`

Verification commands:

```powershell
npm run lint
npm run typecheck
npm test
```
## Verified GitHub publication

Create an empty private GitHub repository first. Then publish the verified source and create a secret-free TAR from the exact pushed commit:

```powershell
powershell -ExecutionPolicy Bypass -File '.\scripts\push-github-release.ps1' `
  -RepositoryUrl 'https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git' `
  -Message 'Sprint 78: GitHub Papaki standalone release'
```

The script runs the complete Sprint 78 verification before staging anything. It blocks environment files, generated builds, reports, local database exports, and archives. The resulting `tmp\alanafc-source-<commit>.tar.gz` is local and ignored by Git. GitHub Actions separately creates the verified Linux standalone TAR documented in `GITHUB_RELEASE.md`.
