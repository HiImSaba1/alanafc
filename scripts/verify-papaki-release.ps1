$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot

if (-not (Test-Path -LiteralPath '.env.production.local')) { throw 'Run scripts/prepare-papaki-environment.ps1 first.' }
if (-not (Test-Path -LiteralPath 'start.js')) { throw 'Plesk startup file start.js is missing.' }

Write-Host '1/3 Checking production environment contract without connecting to Papaki...'
& node --env-file=.env.production.local --import=tsx scripts/check-deployment-environment.ts --production
if ($LASTEXITCODE -ne 0) { throw 'Production environment contract failed.' }

Write-Host '2/3 Confirming that the release archive excludes secrets and generated runtime folders...'
$latestArchive = Get-ChildItem -LiteralPath (Join-Path $projectRoot 'tmp') -Filter 'alanafc-papaki-*.zip' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($null -eq $latestArchive) { throw 'Run scripts/prepare-papaki-upload.ps1 before release verification.' }
$releaseInputs = @('src', 'public', 'database', 'scripts', 'package.json', 'package-lock.json', 'next.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'eslint.config.mjs', 'start.js')
$latestInput = $releaseInputs | ForEach-Object {
  $path = Join-Path $projectRoot $_
  if (Test-Path -LiteralPath $path -PathType Container) { Get-ChildItem -LiteralPath $path -Recurse -File }
  elseif (Test-Path -LiteralPath $path -PathType Leaf) { Get-Item -LiteralPath $path }
} | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
if ($null -ne $latestInput -and $latestArchive.LastWriteTimeUtc -lt $latestInput.LastWriteTimeUtc) {
  throw 'The newest release archive is older than the current source. Run npm run deploy:prepare-upload again.'
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead($latestArchive.FullName)
try {
  $unsafe = @($archive.Entries | Where-Object { $_.FullName -match '(^|/)(\.env|node_modules|\.next|test-results|artifacts|e2e)(/|$)' })
  if ($unsafe.Count) { throw 'Release archive contains a forbidden secret, dependency, build, or test path.' }
  if (-not ($archive.Entries | Where-Object { $_.FullName.TrimStart([char[]]'./') -eq 'start.js' })) { throw 'Release archive does not contain start.js.' }
} finally { $archive.Dispose() }

Write-Host '3/3 Local release verification completed.'
Write-Host 'Database migration, production build, application start, and live health verification must run inside Papaki after upload.' -ForegroundColor Yellow
Write-Host "Verified archive: $($latestArchive.FullName)" -ForegroundColor Green
