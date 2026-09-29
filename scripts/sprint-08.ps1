$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-08-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-08-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-07.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }
    $sourceLog = Join-Path $artifactDirectory 'sprint-07-result.log'
    if (Test-Path -LiteralPath $sourceLog) { Get-Content -LiteralPath $sourceLog | Add-Content -LiteralPath $resultLog -Encoding utf8 }
    'Sprint 08 homepage verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 08 homepage verification passed." -ForegroundColor Green
    Write-Host 'Manual responsive and motion review remains required.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    "Sprint 08 verification failed: $($_.Exception.Message)" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 08 verification failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
