param(
    [int]$FromSprint = 67,
    [int]$ToSprint = 8
)

$ErrorActionPreference = 'Stop'
$scriptDirectory = $PSScriptRoot

if ($FromSprint -lt $ToSprint -or $ToSprint -lt 8) {
    throw 'Invalid flat sprint range.'
}

for ($sprint = $FromSprint; $sprint -ge $ToSprint; $sprint--) {
    $scriptPath = Join-Path $scriptDirectory ("sprint-{0:D2}.ps1" -f $sprint)
    if (-not (Test-Path -LiteralPath $scriptPath)) { continue }

    $commands = Get-Content -LiteralPath $scriptPath |
        ForEach-Object {
            if ($_ -match '^\s*&\s+npm\s+run\s+([A-Za-z0-9:_-]+)\s*$') { $Matches[1] }
        } |
        Where-Object { $_ }

    foreach ($command in $commands) {
        Write-Host "`n== Sprint $sprint contract: npm run $command ==" -ForegroundColor Cyan
        & npm run $command
        if ($LASTEXITCODE -ne 0) {
            throw "Sprint $sprint contract '$command' failed with exit code $LASTEXITCODE."
        }
    }
}
