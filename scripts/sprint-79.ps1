$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

try {
    Write-Host "`n== Verify owner page control ==" -ForegroundColor Cyan
    npm run owner-page-control:verify:sprint79
    if ($LASTEXITCODE -ne 0) { throw "Owner page control verification failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Run Sprint 78 and shared verification ==" -ForegroundColor Cyan
    powershell -ExecutionPolicy Bypass -File '.\scripts\sprint-78.ps1'
    if ($LASTEXITCODE -ne 0) { throw "Shared verification failed with exit code $LASTEXITCODE." }

    $result = Join-Path $PWD 'artifacts\verification\sprint-79-result.log'
    "Sprint 79 verification passed.`nManual check: reorder homepage and registration sections, save, and confirm the public pages update immediately without legacy parallel sections." | Set-Content -LiteralPath $result -Encoding utf8
    Write-Host "`nSprint 79 verification passed." -ForegroundColor Green
    Write-Host "Result log: $result" -ForegroundColor Green
}
catch {
    $failure = Join-Path $PWD 'artifacts\verification\sprint-79-failure.log'
    $_ | Out-String | Set-Content -LiteralPath $failure -Encoding utf8
    Write-Host "`nSprint 79 verification failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Failure log: $failure" -ForegroundColor Red
    exit 1
}
