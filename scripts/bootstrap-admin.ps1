[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectDirectory
try {
    & npm run admin:bootstrap
    if ($LASTEXITCODE -ne 0) { throw 'Owner bootstrap failed.' }
    Write-Host 'Owner created from ADMIN_USERNAME and ADMIN_PASSWORD in .env.local.' -ForegroundColor Green
}
finally { Pop-Location }
