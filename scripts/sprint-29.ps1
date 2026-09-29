$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-29-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-29-failure.log'

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    Write-Host "`n== Generate Sprint 29 database migration ==" -ForegroundColor Cyan
    & npm run db:generate
    if ($LASTEXITCODE -ne 0) { throw "Database migration generation failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Apply Sprint 29 database migration ==" -ForegroundColor Cyan
    & npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw "Database migration failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Verify Alana editorial admin and post templates ==" -ForegroundColor Cyan
    & npm run admin-editor:verify:sprint29
    if ($LASTEXITCODE -ne 0) { throw "Admin editor verification failed with exit code $LASTEXITCODE." }

    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-28.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }

    'Sprint 29 Alana admin workspace, post editor, five editorial templates, and shared foundation verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 29 verification passed." -ForegroundColor Green
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 29 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 29 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
