param(
    [switch]$ImportDrafts
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-02-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-02-failure.log'

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

function Invoke-Gate {
    param([string]$Label, [string]$Command)
    Write-Host "`n== $Label ==" -ForegroundColor Cyan
    & powershell -NoProfile -Command $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE."
    }
    "$Label passed." | Add-Content -LiteralPath $resultLog -Encoding utf8
}

try {
    Invoke-Gate 'Lint' 'npm run lint'
    Invoke-Gate 'TypeScript' 'npm run typecheck'
    Invoke-Gate 'Unit tests' 'npm test'
    Invoke-Gate 'Database migration' 'npm run db:migrate'
    Invoke-Gate 'Sprint 02 dry run' 'npm run wp:migrate:dry'

    $reportPath = Join-Path $artifactDirectory 'sprint-02-migration.json'
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    if ($report.mode -ne 'dry_run') { throw 'Sprint 02 report is not a dry run.' }
    if ($report.guarantees.productionWrites -ne $false) { throw 'Production-write guarantee failed.' }
    if ($report.guarantees.importedPublicationStatus -ne 'draft_or_quarantined') { throw 'Draft-only guarantee failed.' }
    if ($report.totals.contents -lt 1 -or $report.totals.media -lt 1) { throw 'Migration report contains no content or media.' }
    'Migration report contract passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8

    if ($ImportDrafts) {
        Write-Host "`n== Confirmed local draft import ==" -ForegroundColor Yellow
        Invoke-Gate 'Draft import' 'npm run wp:migrate:draft'
        Invoke-Gate 'Draft import database verification' 'npm run wp:migrate:verify'
    }

    'Sprint 02 verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 02 verification passed." -ForegroundColor Green
    Write-Host "Result log: $resultLog"
}
catch {
    "Sprint 02 verification failed: $($_.Exception.Message)" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 02 verification failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
