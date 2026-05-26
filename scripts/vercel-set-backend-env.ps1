param(
  [string]$BackendDir = "$PSScriptRoot\..\Aura Platform Backend"
)
Set-Location $BackendDir
$lines = Get-Content ".env" | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' }
foreach ($line in $lines) {
  $parts = $line -split '=', 2
  $key = $parts[0].Trim()
  $val = $parts[1].Trim()
  if ($key -eq 'ENV') { $val = 'production' }
  if ($key -eq 'DEBUG') { $val = 'false' }
  if ($key -eq 'CORS_ORIGINS' -and $val -notmatch 'aura-frontend-mu') {
    $val = "$val,https://aura-frontend-mu.vercel.app"
  }
  Write-Host "Setting $key ..."
  $val | npx vercel@latest env add $key production --force 2>&1 | Out-Null
}
