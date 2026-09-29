$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-75-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-75-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    Write-Host "`n== Verify editable registration page and groups ==" -ForegroundColor Cyan
    & npm run registration-settings:verify:sprint75
    if ($LASTEXITCODE -ne 0) { throw "Registration settings verification failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Apply local database migration ==" -ForegroundColor Cyan
    & npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw "Database migration failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Run Sprint 74 and shared foundation ==" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-74.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared verification failed with exit code $LASTEXITCODE." }

    'Sprint 75 editable registration settings verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 75 verification passed." -ForegroundColor Green
    Write-Host 'Manual check: add K7 in the admin settings, save, then confirm it appears in both the public tab and form dropdown.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 75 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 75 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
