# GitHub Linux release for Papaki

Every push to `main` runs **Build Alana FC Papaki standalone release** in GitHub Actions. It uses Ubuntu 22.04 and Node.js 22.23.2, verifies tests/lint/TypeScript/build, checks native binaries against Papaki's GLIBC 2.28 ceiling, starts the standalone server, and verifies `/api/health/live`.

After the Action is green, open its run and download the artifact named `alanafc-papaki-linux-release`. It contains:

- `alanafc-papaki-next-build.tar.gz`
- `alanafc-papaki-next-build.tar.gz.sha256`
- `alanafc-papaki-next-build.tar.gz.manifest.json`

The TAR contains a Linux-built standalone application and `start.js`. It never contains `.env.production.local`, database exports, Git metadata, tests, or reports.

Deployment remains manual: preserve the live `.env.production.local` and `public/uploads/media`, keep a rollback copy of the active release, extract the verified TAR into a new release directory, then switch/restart through Plesk or the documented SSH promotion procedure. The GitHub workflow never connects to Papaki.
