$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-27-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-27-failure.log'

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    Write-Host "`n== Verify navigation accessibility ==" -ForegroundColor Cyan
    & npm run navigation:verify:sprint27
    if ($LASTEXITCODE -ne 0) { throw "Navigation accessibility verification failed with exit code $LASTEXITCODE." }

    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-26.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }

    'Sprint 27 menu focus containment, background isolation, reduced motion, and shared foundation verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 27 verification passed." -ForegroundColor Green
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 27 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 27 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
