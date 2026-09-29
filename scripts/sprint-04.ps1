$ErrorActionPreference = 'Stop'

# Keep Unicode output from Node, Vitest, Playwright and Drizzle readable in
# Windows PowerShell 5 as well as newer PowerShell versions.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
Remove-Item Env:FORCE_COLOR -ErrorAction SilentlyContinue
$env:NO_COLOR = '1'

$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-04-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-04-failure.log'

Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

function Invoke-Gate {
    param([string]$Label, [string]$Command)
    Write-Host "`n== $Label ==" -ForegroundColor Cyan

    # Windows PowerShell 5 can promote native stderr (including harmless test
    # runner progress) to a terminating NativeCommandError when the parent uses
    # ErrorActionPreference=Stop. Keep native output non-terminating here and
    # use the process exit code as the gate's source of truth.
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $commandOutput = @(& cmd.exe /d /s /c "chcp 65001 > nul & $Command" 2>&1)
        $commandExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    foreach ($line in $commandOutput) {
        Write-Host $line
        "$line" | Add-Content -LiteralPath $resultLog -Encoding utf8
    }

    if ($commandExitCode -ne 0) {
        "== $Label output ==" | Add-Content -LiteralPath $failureLog -Encoding utf8
        foreach ($line in $commandOutput) {
            "$line" | Add-Content -LiteralPath $failureLog -Encoding utf8
        }
        throw "$Label failed with exit code $commandExitCode. Review the command output above."
    }
    "$Label passed." | Add-Content -LiteralPath $resultLog -Encoding utf8
}

try {
    Invoke-Gate 'Generate migration' 'npm run db:generate'
    Invoke-Gate 'Apply migration' 'npm run db:migrate'
    Invoke-Gate 'Database contract' 'npm run content:verify:sprint04'
    Invoke-Gate 'Lint' 'npm run lint'
    Invoke-Gate 'TypeScript' 'npm run typecheck'
    Invoke-Gate 'Unit tests' 'npm test'
    Invoke-Gate 'Production build' 'npm run build'
    Invoke-Gate 'Browser tests' 'npm run test:e2e'
    'Sprint 04 automated verification passed. Admin create/preview/publish/schedule/unpublish requires final owner walkthrough.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 04 automated verification passed." -ForegroundColor Green
    Write-Host 'Complete one owner admin lifecycle walkthrough before accepting Sprint 04.' -ForegroundColor Yellow
    Write-Host "Result log: $resultLog"
}
catch {
    $failureMessage = $_.Exception.Message
    if ([string]::IsNullOrWhiteSpace($failureMessage)) {
        $failureMessage = $_.ToString()
    }
    if ([string]::IsNullOrWhiteSpace($failureMessage)) {
        $failureMessage = 'Unknown PowerShell runner error.'
    }
    "Sprint 04 verification failed: $failureMessage" | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`nSprint 04 verification failed: $failureMessage" -ForegroundColor Red
    Write-Host "Failure log: $failureLog"
    exit 1
}
