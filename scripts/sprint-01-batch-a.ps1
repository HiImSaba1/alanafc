[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectDirectory 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-01-batch-a-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-01-batch-a-failure.log'

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

function Write-Result {
    param([Parameter(Mandatory)][string]$Message)
    $Message | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host $Message
}

function Invoke-NpmGate {
    param(
        [Parameter(Mandatory)][string]$Label,
        [Parameter(Mandatory)][string[]]$Arguments
    )

    Write-Host "`n== $Label ==" -ForegroundColor Cyan
    $commandOutput = & npm @Arguments 2>&1
    $commandExitCode = $LASTEXITCODE
    foreach ($line in $commandOutput) {
        $renderedLine = [string]$line
        Write-Host $renderedLine
        $renderedLine | Add-Content -LiteralPath $resultLog -Encoding utf8
    }
    if ($commandExitCode -ne 0) {
        throw "$Label failed with exit code $commandExitCode. Review the result log for the command output."
    }
    Write-Result "$Label passed."
}

Push-Location -LiteralPath $projectDirectory
try {
    Invoke-NpmGate -Label 'Lint' -Arguments @('run', 'lint')
    Invoke-NpmGate -Label 'TypeScript' -Arguments @('run', 'typecheck')
    Invoke-NpmGate -Label 'Unit tests' -Arguments @('test')
    Invoke-NpmGate -Label 'Database preflight' -Arguments @('run', 'db:preflight')
    Invoke-NpmGate -Label 'Database migration' -Arguments @('run', 'db:migrate')

    $healthUri = 'http://127.0.0.1:3000/api/health'
    Write-Host "`n== Health endpoint ==" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri $healthUri -Method Get -TimeoutSec 15
    }
    catch {
        throw "Health endpoint at $healthUri is unavailable. Start the app with: npm run dev"
    }

    if ($response.ok -ne $true -or $response.database -ne 'ready') {
        throw "Health endpoint did not report ok=true and database=ready."
    }

    Write-Result 'Health endpoint passed.'
    Write-Result 'Sprint 01 Batch A verification passed.'
    Write-Host "`nSprint 01 Batch A verification passed." -ForegroundColor Green
    Write-Host "Result log: $resultLog" -ForegroundColor Green
}
catch {
    $failure = "Sprint 01 Batch A verification failed: $($_.Exception.Message)"
    $failure | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host "`n$failure" -ForegroundColor Red
    Write-Host "Failure log: $failureLog" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
