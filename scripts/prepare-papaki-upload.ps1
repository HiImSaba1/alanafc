$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$releaseRoot = Join-Path $projectRoot "tmp\papaki-release-$timestamp"
$archivePath = Join-Path $projectRoot "tmp\alanafc-papaki-$timestamp.zip"
$productionEnvironmentPath = Join-Path $projectRoot '.env.production.local'
$heldEnvironmentPath = Join-Path $projectRoot "tmp\.env.production.local-$timestamp.hold"

Set-Location -LiteralPath $projectRoot
Write-Host 'Creating a fresh production build before packaging...'
New-Item -ItemType Directory -Path (Join-Path $projectRoot 'tmp') -Force | Out-Null
$environmentHeld = $false
try {
  if (Test-Path -LiteralPath $productionEnvironmentPath) {
    Move-Item -LiteralPath $productionEnvironmentPath -Destination $heldEnvironmentPath
    $environmentHeld = $true
  }
  & npm run build
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed. No upload archive was created.' }
} finally {
  if ($environmentHeld -and (Test-Path -LiteralPath $heldEnvironmentPath)) {
    Move-Item -LiteralPath $heldEnvironmentPath -Destination $productionEnvironmentPath
  }
}

New-Item -ItemType Directory -Path $releaseRoot -Force | Out-Null
$directories = @('src', 'public', 'database', 'scripts')
$files = @('.node-version', 'package.json', 'package-lock.json', 'next.config.ts', 'postcss.config.mjs', 'tsconfig.json', 'next-env.d.ts', 'eslint.config.mjs', 'start.js')

foreach ($directory in $directories) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination $releaseRoot -Recurse
}

$registrationHeroPath = Join-Path $projectRoot 'public\alana_fc_academy_images_wordpress\alanafc-eggrafes-2026-hero.jpg'
if (-not (Test-Path -LiteralPath $registrationHeroPath)) {
  throw 'The ASCII-safe registration hero image is missing. Create it before packaging.'
}
foreach ($file in $files) {
  Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $releaseRoot
}

if (Test-Path -LiteralPath $archivePath) { Remove-Item -LiteralPath $archivePath -Force }
Add-Type -AssemblyName System.IO.Compression
$archiveStream = $null
$archive = $null
$archiveFailure = $null
try {
  $archiveStream = [System.IO.File]::Open($archivePath, [System.IO.FileMode]::CreateNew, [System.IO.FileAccess]::Write, [System.IO.FileShare]::None)
  $archive = New-Object System.IO.Compression.ZipArchive($archiveStream, [System.IO.Compression.ZipArchiveMode]::Create, $false)
  $releaseFiles = Get-ChildItem -LiteralPath $releaseRoot -Recurse -File
  foreach ($releaseFile in $releaseFiles) {
    $entryName = $releaseFile.FullName.Substring($releaseRoot.Length).TrimStart([char[]]'\/').Replace('\', '/')
    $entry = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $inputStream = $null
    try {
      for ($attempt = 1; $attempt -le 12; $attempt++) {
        try {
          $sharing = [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete
          $inputStream = [System.IO.File]::Open($releaseFile.FullName, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, $sharing)
          break
        } catch {
          if ($attempt -eq 12) { throw "Unable to archive '$entryName' after 12 attempts: $($_.Exception.Message)" }
          Start-Sleep -Milliseconds 150
        }
      }
      $inputStream.CopyTo($entryStream)
    } finally {
      if ($null -ne $inputStream) { $inputStream.Dispose() }
      $entryStream.Dispose()
    }
  }
  $archive.Dispose()
  $archive = $null
  $archiveStream.Dispose()
  $archiveStream = $null
} catch {
  $archiveFailure = $_.Exception
} finally {
  if ($null -ne $archive) { $archive.Dispose() }
  if ($null -ne $archiveStream) { $archiveStream.Dispose() }
}
if ($null -ne $archiveFailure) {
  Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
  throw $archiveFailure.Message
}
if (-not (Test-Path -LiteralPath $archivePath) -or (Get-Item -LiteralPath $archivePath).Length -eq 0) {
  Remove-Item -LiteralPath $archivePath -Force -ErrorAction SilentlyContinue
  throw 'ZIP creation failed. No upload archive is available.'
}
Write-Host "Papaki application archive created: $archivePath" -ForegroundColor Green
Write-Host 'The private production environment was excluded from the build archive and restored locally.' -ForegroundColor DarkGray
Write-Host 'Secrets, environment files, node_modules, .next, tests, logs, reports, references, and local database exports were not included.'
Write-Host 'Upload .env.production.local separately to the private application root.' -ForegroundColor Yellow
