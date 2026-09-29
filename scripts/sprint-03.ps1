$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-03-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-03-failure.log'

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

function Invoke-Gate {
    param([string]$Label, [string]$Command)
    Write-Host "`n== $Label ==" -ForegroundColor Cyan
    & powershell -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE." }
    "$Label passed." | Add-Content -LiteralPath $resultLog -Encoding utf8
}

try {
    Invoke-Gate 'Lint' 'npm run lint'
    Invoke-Gate 'TypeScript' 'npm run typecheck'
    Invoke-Gate 'Unit tests' 'npm test'
    Invoke-Gate 'Production build' 'npm run build'
    'Sprint 03 automated verification passed. Manual responsive, keyboard, menu, and reduced-motion review remains required.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 03 automated verification passed." -ForegroundColor Green
    Write-Host 'Manual responsive, keyboard, menu, and reduced-motion review remains required.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    "Sprint 03 verification failed: $($_.Exception.Message)" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 03 verification failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
