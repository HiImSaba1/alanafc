$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-68-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-68-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue
try {
    Write-Host "`n== Verify secret-safe deployment environment contract ==" -ForegroundColor Cyan
    & npm run deployment-env:verify:sprint68
    if ($LASTEXITCODE -ne 0) { throw "Deployment environment contract verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Audit current local environment without network access ==" -ForegroundColor Cyan
    & npm run env:check
    if ($LASTEXITCODE -ne 0) { throw "Local environment audit failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Run Sprint 08-67 contracts without recursive PowerShell nesting ==" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'run-flat-sprint-contracts.ps1') -FromSprint 67 -ToSprint 8
    if ($LASTEXITCODE -ne 0) { throw "Flat shared contract verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Run shared Sprint 07 foundation once ==" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-07.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }
    'Sprint 68 deployment environment audit and shared foundation verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 68 verification passed." -ForegroundColor Green
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 68 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 68 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
