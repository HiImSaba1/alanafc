$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
Remove-Item Env:FORCE_COLOR -ErrorAction SilentlyContinue
Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue
$env:CI = '1'
$projectRoot = Split-Path -Parent $PSScriptRoot
$artifactDirectory = Join-Path $projectRoot 'artifacts\verification'
$resultLog = Join-Path $artifactDirectory 'sprint-06-result.log'
$failureLog = Join-Path $artifactDirectory 'sprint-06-failure.log'
Set-Location -LiteralPath $projectRoot
New-Item -ItemType Directory -Force -Path $artifactDirectory | Out-Null
Remove-Item -LiteralPath $resultLog -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $failureLog -Force -ErrorAction SilentlyContinue
function Invoke-Gate { param([string]$Label,[string]$Command) Write-Host "`n== $Label ==" -ForegroundColor Cyan; $previous=$ErrorActionPreference; $ErrorActionPreference='Continue'; try { $output=@(& cmd.exe /d /s /c "chcp 65001 > nul & $Command" 2>&1); $exitCode=$LASTEXITCODE } finally { $ErrorActionPreference=$previous }; foreach($line in $output){ Write-Host $line; "$line" | Add-Content -LiteralPath $resultLog -Encoding utf8 }; if($exitCode -ne 0){ "== $Label output ==" | Add-Content -LiteralPath $failureLog -Encoding utf8; foreach($line in $output){ "$line" | Add-Content -LiteralPath $failureLog -Encoding utf8 }; throw "$Label failed with exit code $exitCode. Review the command output above." }; "$Label passed." | Add-Content -LiteralPath $resultLog -Encoding utf8 }
try { Invoke-Gate 'Generate migration' 'npm run db:generate'; Invoke-Gate 'Apply migration' 'npm run db:migrate'; Invoke-Gate 'Contact database contract' 'npm run contact:verify:sprint06'; Invoke-Gate 'Lint' 'npm run lint'; Invoke-Gate 'TypeScript' 'npm run typecheck'; Invoke-Gate 'Unit tests' 'npm test'; Invoke-Gate 'Production build' 'npm run build'; Invoke-Gate 'Browser tests' 'npm run test:e2e'; 'Sprint 06 automated verification passed. A controlled contact submission is still required to certify live SMTP delivery.' | Add-Content -LiteralPath $resultLog -Encoding utf8; Write-Host "`nSprint 06 automated verification passed." -ForegroundColor Green; Write-Host 'Complete one controlled contact submission and confirm both inboxes before acceptance.' -ForegroundColor Yellow; Write-Host "Result log: $resultLog" }
catch { $message=$_.Exception.Message; if([string]::IsNullOrWhiteSpace($message)){ $message=$_.ToString() }; if([string]::IsNullOrWhiteSpace($message)){ $message='Unknown PowerShell runner error.' }; "Sprint 06 verification failed: $message" | Add-Content -LiteralPath $failureLog -Encoding utf8; Write-Host "`nSprint 06 verification failed: $message" -ForegroundColor Red; Write-Host "Failure log: $failureLog"; exit 1 }
