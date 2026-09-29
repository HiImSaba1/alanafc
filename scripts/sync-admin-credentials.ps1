[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[Console]::InputEncoding = $utf8NoBom
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom

$projectDirectory = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectDirectory
try {
    & npm run admin:sync-credentials
    if ($LASTEXITCODE -ne 0) { throw 'Owner credential synchronization failed.' }
    Write-Host 'Admin login credentials now match .env.local.' -ForegroundColor Green
    Write-Host 'Old admin sessions and login lockouts were cleared.' -ForegroundColor Yellow
}
finally {
    Pop-Location
}
