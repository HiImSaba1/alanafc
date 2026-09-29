$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-72-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-72-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue
try {
    Write-Host "`n== Verify explicitly confirmed SMTP smoke-test contract ==" -ForegroundColor Cyan
    & npm run mail-smoke:verify:sprint72
    if ($LASTEXITCODE -ne 0) { throw "Mail smoke-test contract verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Run Sprint 08-71 contracts without recursive PowerShell nesting ==" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'run-flat-sprint-contracts.ps1') -FromSprint 71 -ToSprint 8
    if ($LASTEXITCODE -ne 0) { throw "Flat shared contract verification failed with exit code $LASTEXITCODE." }
    Write-Host "`n== Run shared Sprint 07 foundation once ==" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-07.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }
    'Sprint 72 SMTP smoke-test safety and shared foundation verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 72 verification passed." -ForegroundColor Green
    Write-Host "Optional one-message delivery: npm run smtp:send-smoke:confirmed" -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 72 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 72 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
