[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 3000
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectDirectory 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-01-batch-a-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-01-health-failure.log'
$healthUri = "http://127.0.0.1:$Port/api/health"

New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue

Push-Location -LiteralPath $projectDirectory
try {
    Write-Host "Checking $healthUri ..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri $healthUri -Method Get -TimeoutSec 15
    $response | ConvertTo-Json | Write-Host

    if ($response.ok -ne $true -or $response.database -ne 'ready') {
        throw 'Health endpoint did not report ok=true and database=ready.'
    }

    'Health endpoint passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    'Sprint 01 Batch A verification passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host 'Sprint 01 Batch A verification passed.' -ForegroundColor Green
    Write-Host "Result log: $resultLog" -ForegroundColor Green
}
catch {
    $failure = "Sprint 01 health verification failed: $($_.Exception.Message)"
    $failure | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host $failure -ForegroundColor Red
    Write-Host 'Keep the development server running with: npm run dev' -ForegroundColor Yellow
    Write-Host "Failure log: $failureLog" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
