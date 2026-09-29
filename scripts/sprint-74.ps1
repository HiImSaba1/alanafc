$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-74-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-74-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

try {
    Write-Host "`n== Verify media SEO accordion and suggestions ==" -ForegroundColor Cyan
    & npm run media-seo-accordion:verify:sprint74
    if ($LASTEXITCODE -ne 0) { throw "Media SEO accordion verification failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Run Sprint 08-73 contracts without recursive PowerShell nesting ==" -ForegroundColor Cyan
    & (Join-Path $PSScriptRoot 'run-flat-sprint-contracts.ps1') -FromSprint 73 -ToSprint 8
    if ($LASTEXITCODE -ne 0) { throw "Flat shared contract verification failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Run shared Sprint 07 foundation once ==" -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-07.ps1')
    if ($LASTEXITCODE -ne 0) { throw "Shared foundation verification failed with exit code $LASTEXITCODE." }

    'Sprint 74 media SEO accordion and shared foundation verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 74 verification passed." -ForegroundColor Green
    Write-Host 'SEO suggestions remain editable and are saved only when the owner submits an image accordion.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    $message = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($message)) { $message = $_.ToString() }
    "Sprint 74 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 74 verification failed: $message" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
