$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-78-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-78-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue
try {
    Write-Host "`n== Verify migration history safety ==" -ForegroundColor Cyan
    & npm run db:migrations:verify
    if ($LASTEXITCODE -ne 0) { throw "Migration history verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Verify disposable production-state migration ==" -ForegroundColor Cyan
    & npm run db:migrations:verify:disposable
    if ($LASTEXITCODE -ne 0) { throw "Disposable production-state migration verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Verify GitHub Linux release workflow ==" -ForegroundColor Cyan
    & npm run github-release:verify:sprint78
    if ($LASTEXITCODE -ne 0) { throw "GitHub release verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Run Sprint 77 and shared foundation ==" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-77.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared verification failed with exit code $LASTEXITCODE." }
    'Sprint 78 GitHub Linux release verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 78 verification passed." -ForegroundColor Green
    Write-Host 'After pushing, wait for the GitHub Action to turn green before downloading the TAR.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 78 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 78 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
