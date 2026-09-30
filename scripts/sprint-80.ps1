$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

try {
    Write-Host "`n== Verify secure PDF library and useful documents ==" -ForegroundColor Cyan
    npm run useful-documents:verify:sprint80
    if ($LASTEXITCODE -ne 0) { throw "Useful documents verification failed with exit code $LASTEXITCODE." }

    Write-Host "`n== Run Sprint 79 and shared verification ==" -ForegroundColor Cyan
    powershell -ExecutionPolicy Bypass -File '.\scripts\sprint-79.ps1'
    if ($LASTEXITCODE -ne 0) { throw "Shared verification failed with exit code $LASTEXITCODE." }

    $result = Join-Path $PWD 'artifacts\verification\sprint-80-result.log'
    "Sprint 80 verification passed.`nManual check: upload one test PDF, add it to Useful Documents, move it with the Up/Down buttons, publish, and confirm the public link opens the PDF." | Set-Content -LiteralPath $result -Encoding utf8
    Write-Host "`nSprint 80 verification passed." -ForegroundColor Green
    Write-Host "Result log: $result" -ForegroundColor Green
}
catch {
    $failure = Join-Path $PWD 'artifacts\verification\sprint-80-failure.log'
    $_ | Out-String | Set-Content -LiteralPath $failure -Encoding utf8
    Write-Host "`nSprint 80 verification failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Failure log: $failure" -ForegroundColor Red
    exit 1
}
