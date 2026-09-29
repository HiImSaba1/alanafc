$ErrorActionPreference='Stop'
$utf8=New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding=$utf8; [Console]::OutputEncoding=$utf8; $OutputEncoding=$utf8
Remove-Item Env:FORCE_COLOR -ErrorAction SilentlyContinue; Remove-Item Env:NO_COLOR -ErrorAction SilentlyContinue; $env:CI='1'
$root=Split-Path -Parent $PSScriptRoot; $dir=Join-Path $root 'artifacts\verification'; $result=Join-Path $dir 'sprint-07-result.log'; $failure=Join-Path $dir 'sprint-07-failure.log'
Set-Location -LiteralPath $root; New-Item -ItemType Directory -Force -Path $dir | Out-Null; Remove-Item $result,$failure -Force -ErrorAction SilentlyContinue
function Gate([string]$label,[string]$command){ Write-Host "`n== $label ==" -ForegroundColor Cyan; $old=$ErrorActionPreference; $ErrorActionPreference='Continue'; try{$output=@(& cmd.exe /d /s /c "chcp 65001 > nul & $command" 2>&1);$code=$LASTEXITCODE}finally{$ErrorActionPreference=$old}; foreach($line in $output){Write-Host $line;"$line"|Add-Content $result -Encoding utf8}; if($code -ne 0){foreach($line in $output){"$line"|Add-Content $failure -Encoding utf8};throw "$label failed with exit code $code."}; "$label passed."|Add-Content $result -Encoding utf8}
function ClearGeneratedRouteTypes {
    $generatedTypes = Join-Path $root '.next\types'
    if (Test-Path -LiteralPath $generatedTypes) {
        Remove-Item -LiteralPath $generatedTypes -Recurse -Force
        'Removed stale generated Next.js route types.' | Add-Content $result -Encoding utf8
    }
}
try{Gate 'Generate migration' 'npm run db:generate';Gate 'Apply migration' 'npm run db:migrate';Gate 'Notification and mail routing contract' 'npm run operations:verify:sprint07';Gate 'Lint' 'npm run lint';ClearGeneratedRouteTypes;Gate 'TypeScript' 'npm run typecheck';Gate 'Unit tests' 'npm test';Gate 'Production build' 'npm run build:verify';Gate 'Browser tests' 'npm run test:e2e';'Sprint 07 automated verification passed.'|Add-Content $result -Encoding utf8;Write-Host "`nSprint 07 automated verification passed." -ForegroundColor Green;Write-Host "Result log: $result"}catch{$message=$_.Exception.Message;if([string]::IsNullOrWhiteSpace($message)){$message=$_.ToString()};"Sprint 07 verification failed: $message"|Add-Content $failure -Encoding utf8;Write-Host "`nSprint 07 verification failed: $message" -ForegroundColor Red;Write-Host "Failure log: $failure";exit 1}
