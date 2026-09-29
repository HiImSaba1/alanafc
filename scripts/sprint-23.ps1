$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-23-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-23-failure.log'

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    Write-Host "`n== Verify sitemap and structured-data contract ==" -ForegroundColor Cyan
    & npm run seo:verify:sprint23
    if ($LASTEXITCODE -ne 0) { throw "SEO verification failed with exit code $LASTEXITCODE." }

    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-22.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }

    'Sprint 23 canonical sitemap, structured data, indexing boundaries, and shared foundation verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 23 verification passed." -ForegroundColor Green
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 23 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 23 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
