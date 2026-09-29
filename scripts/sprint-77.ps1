$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-77-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-77-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    Write-Host "`n== Verify owner self-service controls ==" -ForegroundColor Cyan
    & npm run owner-controls:verify:sprint77
    if ($LASTEXITCODE -ne 0) { throw "Owner controls verification failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Run Sprint 76 and shared foundation ==" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-76.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared verification failed with exit code $LASTEXITCODE." }

    'Sprint 77 owner self-service verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 77 verification passed." -ForegroundColor Green
    Write-Host 'Manual check: add and reorder one homepage item, choose an image by thumbnail, and create then disable a temporary editor.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 77 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 77 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
