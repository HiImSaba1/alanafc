[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:\.git)?$')]
    [string]$RepositoryUrl,

    [Parameter()]
    [ValidateNotNullOrEmpty()]
    [string]$Message = 'Sprint 78: GitHub Papaki standalone release'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$expectedRepositoryRoot = 'C:\Users\sab_j\Desktop\Projects\AlanaFCAcademy\web'

function Assert-LastCommandSucceeded {
    param([Parameter(Mandatory)][string]$Step)
    if ($LASTEXITCODE -ne 0) { throw "$Step failed with exit code $LASTEXITCODE." }
}

function Invoke-Git {
    param([Parameter(Mandatory)][string[]]$Arguments, [Parameter(Mandatory)][string]$Step)
    & git @Arguments
    Assert-LastCommandSucceeded -Step $Step
}

if ($repositoryRoot -ne $expectedRepositoryRoot) {
    throw "This script must run from the Alana FC web repository. Resolved path: $repositoryRoot"
}
if (-not (Test-Path -LiteralPath (Join-Path $repositoryRoot '.git') -PathType Container)) {
    throw "The expected Git repository was not found at $repositoryRoot."
}

Push-Location -LiteralPath $repositoryRoot
try {
    Write-Host "Repository: $repositoryRoot" -ForegroundColor Cyan
    Write-Host "Target:     $RepositoryUrl" -ForegroundColor Cyan

    Write-Host "`nRunning the complete Sprint 78 verification..." -ForegroundColor Cyan
    & powershell -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'sprint-78.ps1')
    Assert-LastCommandSucceeded -Step 'Sprint 78 verification'

    $remotes = @(& git remote)
    Assert-LastCommandSucceeded -Step 'Reading Git remotes'
    if ($remotes -notcontains 'origin') {
        Invoke-Git -Arguments @('remote', 'add', 'origin', $RepositoryUrl) -Step 'Adding the GitHub origin'
    }
    else {
        $origin = (& git remote get-url origin).Trim()
        Assert-LastCommandSucceeded -Step 'Reading origin URL'
        $normalizedOrigin = ($origin.Trim().TrimEnd('/') -replace '\.git$', '').ToLowerInvariant()
        $normalizedRepositoryUrl = ($RepositoryUrl.Trim().TrimEnd('/') -replace '\.git$', '').ToLowerInvariant()
        if ($normalizedOrigin -ne $normalizedRepositoryUrl) {
            throw "Remote 'origin' is '$origin', not '$RepositoryUrl'. No remote was changed."
        }
    }

    $branch = (& git branch --show-current).Trim()
    Assert-LastCommandSucceeded -Step 'Reading the current branch'
    if ([string]::IsNullOrWhiteSpace($branch)) { throw 'The repository is in detached HEAD state.' }
    if ($branch -eq 'master') {
        Invoke-Git -Arguments @('branch', '-M', 'main') -Step 'Renaming master to main'
        $branch = 'main'
    }

    Write-Host "`nStaging source files..." -ForegroundColor Cyan
    Invoke-Git -Arguments @('add', '--all') -Step 'Staging changes'
    $stagedFiles = @(& git diff --cached --name-only --diff-filter=ACMR)
    Assert-LastCommandSucceeded -Step 'Inspecting staged files'
    $blockedFiles = @($stagedFiles | Where-Object {
        ($_ -ne '.env.example' -and $_ -match '(^|/)(\.env(?:\..*)?|node_modules|\.next|coverage|playwright-report|blob-report|test-results|artifacts|tmp)(/|$)') -or
        $_ -match '\.(?:pem|key|pfx|p12|zip|tar|tar\.gz|tgz|sqlite|sqlite3)$' -or
        ($_ -match '\.sql$' -and $_ -notmatch '^database/migrations/')
    })
    if ($blockedFiles.Count -gt 0) {
        Write-Host 'Blocked staged files:' -ForegroundColor Red
        $blockedFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        throw 'Commit cancelled because private, generated, database-export, or archive files are staged.'
    }

    if ($stagedFiles.Count -gt 0) {
        Write-Host "`nFiles selected for commit: $($stagedFiles.Count)" -ForegroundColor Cyan
        $stagedFiles | ForEach-Object { Write-Host "  $_" }
        Invoke-Git -Arguments @('commit', '-m', $Message.Trim()) -Step 'Creating the verified commit'
    }
    else {
        Write-Host 'No new source changes were found. The already verified HEAD will be pushed.' -ForegroundColor Yellow
    }

    $upstream = (& git for-each-ref '--format=%(upstream:short)' "refs/heads/$branch").Trim()
    Assert-LastCommandSucceeded -Step 'Reading branch upstream'
    if ([string]::IsNullOrWhiteSpace($upstream)) {
        Invoke-Git -Arguments @('push', '--set-upstream', 'origin', $branch) -Step 'Publishing the branch'
    }
    else {
        Invoke-Git -Arguments @('push') -Step 'Pushing the verified commit'
    }

    $shortSha = (& git rev-parse --short=12 HEAD).Trim()
    Assert-LastCommandSucceeded -Step 'Reading the pushed revision'
    $archiveDirectory = Join-Path $repositoryRoot 'tmp'
    New-Item -ItemType Directory -Force -Path $archiveDirectory | Out-Null
    $archivePath = Join-Path $archiveDirectory "alanafc-source-$shortSha.tar.gz"
    Invoke-Git -Arguments @('archive', '--format=tar.gz', "--output=$archivePath", 'HEAD') -Step 'Creating the committed source archive'
    if (-not (Test-Path -LiteralPath $archivePath) -or (Get-Item -LiteralPath $archivePath).Length -eq 0) {
        throw 'The Git push succeeded, but source archive creation failed.'
    }

    Write-Host "`nVerified code pushed successfully." -ForegroundColor Green
    Write-Host "Remote:  $RepositoryUrl" -ForegroundColor Green
    Write-Host "Branch:  $branch" -ForegroundColor Green
    Write-Host "Commit:  $shortSha" -ForegroundColor Green
    Write-Host "Archive: $archivePath" -ForegroundColor Green
    Write-Host 'The archive contains only files committed to Git. Environment files and local production secrets are excluded.' -ForegroundColor Yellow
    Write-Host 'GitHub Actions is now building the downloadable Papaki Linux TAR. Deploy only after the workflow is green.' -ForegroundColor Yellow
}
finally {
    Pop-Location
}
