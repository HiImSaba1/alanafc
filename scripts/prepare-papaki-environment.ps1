param(
  [string]$DatabaseHost = '127.0.0.1',
  [int]$DatabasePort = 3306,
  [string]$DatabaseName = 'next_alanafcacademy',
  [string]$SiteUrl = 'https://alanafc.gr'
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot '.env.local'
$productionPath = Join-Path $projectRoot '.env.production.local'

function Read-EnvironmentFile([string]$Path) {
  $values = [ordered]@{}
  if (-not (Test-Path -LiteralPath $Path)) { return $values }
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { continue }
    $value = $Matches[2].Trim()
    if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) { $value = $value.Substring(1, $value.Length - 2) }
    $values[$Matches[1]] = $value
  }
  return $values
}

function Read-CommentSetting([string]$Path, [string[]]$Labels) {
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  foreach ($line in Get-Content -LiteralPath $Path) {
    foreach ($label in $Labels) {
      if ($line -match "^\s*#\s*$label\s*[:=]\s*(.+?)\s*$") {
        $value = $Matches[1].Trim()
        if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
          $value = $value.Substring(1, $value.Length - 2)
        }
        if (-not [string]::IsNullOrWhiteSpace($value)) { return $value }
      }
    }
  }
  return $null
}

function Protect-EnvironmentValue([string]$Value) {
  $escaped = $Value.Replace('\', '\\').Replace('"', '\"').Replace("`r", '').Replace("`n", '\n')
  return '"' + $escaped + '"'
}

function New-RandomSecret([int]$Bytes = 48) {
  $buffer = New-Object byte[] $Bytes
  $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($buffer)
    return [Convert]::ToBase64String($buffer).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  } finally {
    $generator.Dispose()
  }
}

$settings = Read-EnvironmentFile $sourcePath
$commentDatabaseHost = Read-CommentSetting $sourcePath @('DB_HOST', '(?:Papaki\s+)?DB\s+host', 'DATABASE\s+host')
$commentDatabaseName = Read-CommentSetting $sourcePath @('DB_NAME', '(?:Papaki\s+)?DB\s+name', 'DATABASE\s+name')
$databaseUser = Read-CommentSetting $sourcePath @('DB_USERNAME', '(?:Papaki\s+)?DB\s+username', '(?:Papaki\s+)?DB\s+user', 'DATABASE\s+username')
$plainPassword = Read-CommentSetting $sourcePath @('DB_PASSWORD', '(?:Papaki\s+)?DB\s+password', 'DATABASE\s+password')
$passwordPointer = [IntPtr]::Zero

if (-not [string]::IsNullOrWhiteSpace($commentDatabaseHost)) { $DatabaseHost = $commentDatabaseHost }
if (-not [string]::IsNullOrWhiteSpace($commentDatabaseName)) { $DatabaseName = $commentDatabaseName }
if ([string]::IsNullOrWhiteSpace($databaseUser)) { $databaseUser = Read-Host 'Papaki database username' }
if ([string]::IsNullOrWhiteSpace($plainPassword)) {
  $databasePassword = Read-Host 'Papaki database password (input is hidden)' -AsSecureString
  $passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($databasePassword)
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
} else {
  Write-Host 'Papaki database credentials loaded from the private .env.local comment block. Values were not printed.' -ForegroundColor DarkGray
}

try {
  if ([string]::IsNullOrWhiteSpace($databaseUser)) { throw 'Database username cannot be empty.' }
  if ($databaseUser.ToLowerInvariant() -eq 'root') { throw 'Use a dedicated non-root production database user.' }
  if ([string]::IsNullOrWhiteSpace($plainPassword)) { throw 'Database password cannot be empty.' }
  $encodedUser = [Uri]::EscapeDataString($databaseUser)
  $encodedPassword = [Uri]::EscapeDataString($plainPassword)
  $encodedDatabaseName = [Uri]::EscapeDataString($DatabaseName)

  $settings['NODE_ENV'] = 'production'
  $settings['NEXT_PUBLIC_SITE_URL'] = $SiteUrl.TrimEnd('/')
  $settings['DATABASE_NAME'] = $DatabaseName
  $settings['DATABASE_URL'] = "mysql://${encodedUser}:${encodedPassword}@${DatabaseHost}:${DatabasePort}/${encodedDatabaseName}"
  $settings['SESSION_SECRET'] = New-RandomSecret
  $settings['NEXT_SERVER_ACTIONS_ENCRYPTION_KEY'] = New-RandomSecret 32
  if (-not $settings.Contains('ADMIN_DISPLAY_NAME') -or [string]::IsNullOrWhiteSpace([string]$settings['ADMIN_DISPLAY_NAME'])) {
    $settings['ADMIN_DISPLAY_NAME'] = 'Alana FC Owner'
  }

  $required = @('NODE_ENV', 'NEXT_PUBLIC_SITE_URL', 'DATABASE_NAME', 'DATABASE_URL', 'SESSION_SECRET', 'NEXT_SERVER_ACTIONS_ENCRYPTION_KEY', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ADMIN_DISPLAY_NAME', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM', 'MAIL_TO')
  $missing = @($required | Where-Object { -not $settings.Contains($_) -or [string]::IsNullOrWhiteSpace([string]$settings[$_]) })
  if ($missing.Count) { throw "Missing required settings: $($missing -join ', ')" }
  if ([string]$settings['SMTP_HOST'] -ne 'linux134.papaki.gr') { throw 'SMTP_HOST must match the verified Papaki mailbox host.' }

  $lines = foreach ($key in $required) { "$key=$(Protect-EnvironmentValue ([string]$settings[$key]))" }
  Set-Content -LiteralPath $productionPath -Value $lines -Encoding utf8
  Write-Host "Created ignored production environment file: $productionPath" -ForegroundColor Green
  Write-Host 'No secret values were printed. Upload this file separately to the private application root.' -ForegroundColor Yellow
} finally {
  if ($passwordPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer) }
  $plainPassword = $null
}
