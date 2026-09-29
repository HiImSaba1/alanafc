[CmdletBinding()]
param([int]$Port = 3000)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectDirectory 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-01-batch-b-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-01-batch-b-failure.log'
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog,$failureLog -Force -ErrorAction SilentlyContinue

function Invoke-Gate([string]$Label, [string[]]$Arguments) {
    Write-Host "`n== $Label ==" -ForegroundColor Cyan
    $output = & npm @Arguments 2>&1
    $exitCode = $LASTEXITCODE
    foreach ($line in $output) { $text = [string]$line; Write-Host $text; $text | Add-Content -LiteralPath $resultLog -Encoding utf8 }
    if ($exitCode -ne 0) { throw "$Label failed with exit code $exitCode." }
    "$Label passed." | Add-Content -LiteralPath $resultLog -Encoding utf8
}

Push-Location -LiteralPath $projectDirectory
try {
    Invoke-Gate 'Lint' @('run','lint')
    Invoke-Gate 'TypeScript' @('run','typecheck')
    Invoke-Gate 'Unit tests' @('test')
    Invoke-Gate 'Username migration generation' @('run','db:generate')
    Invoke-Gate 'Username migration application' @('run','db:migrate')
    Invoke-Gate 'Database preflight' @('run','db:preflight')
    $loginResponse = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/admin/login" -UseBasicParsing -TimeoutSec 15
    if ($loginResponse.StatusCode -ne 200) { throw "Admin login returned HTTP $($loginResponse.StatusCode)." }
    $request = [System.Net.HttpWebRequest]::Create("http://127.0.0.1:$Port/admin")
    $request.AllowAutoRedirect = $false
    $request.Timeout = 15000
    $adminResponse = $request.GetResponse()
    try {
        $adminStatus = [int]$adminResponse.StatusCode
        $adminLocation = $adminResponse.Headers['Location']
    }
    finally { $adminResponse.Close() }
    if ($adminStatus -notin @(302,303,307,308) -or $adminLocation -notlike '*/admin/login*') {
        throw "Anonymous /admin did not redirect to /admin/login; HTTP $adminStatus location $adminLocation."
    }
    'Anonymous admin protection passed.' | Add-Content -LiteralPath $resultLog -Encoding utf8
    Write-Host "`nSprint 01 Batch B static and anonymous-route verification passed." -ForegroundColor Green
    Write-Host 'Run .\scripts\bootstrap-admin.ps1 once, then verify login and logout manually.' -ForegroundColor Yellow
}
catch {
    $failure = "Sprint 01 Batch B verification failed: $($_.Exception.Message)"
    $failure | Add-Content -LiteralPath $failureLog -Encoding utf8
    Write-Host $failure -ForegroundColor Red
    exit 1
}
finally { Pop-Location }
