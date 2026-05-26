# Starts AuRA API + ngrok tunnel for Vercel production frontend
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$backend = Join-Path $root "Aura Platform Backend"
$vercelUrl = "https://aura-frontend-mu.vercel.app"

# ngrok authtoken from draft.py (line with 3E5Q...) — do not commit token elsewhere
$draft = Join-Path $root "draft.py"
$token = $null
if (Test-Path $draft) {
  $m = Select-String -Path $draft -Pattern '^[A-Za-z0-9_]{20,}$' | Select-Object -First 1
  if ($m) { $token = $m.Line.Trim() }
  if (-not $token) {
    $lines = Get-Content $draft
    foreach ($line in $lines) {
      $t = $line.Trim()
      if ($t -match '^[A-Za-z0-9_]{30,}$' -and $t -notmatch '^ghp_') { $token = $t; break }
    }
  }
}
if (-not $token -and $env:NGROK_AUTHTOKEN) { $token = $env:NGROK_AUTHTOKEN }
if (-not $token) { throw "NGROK authtoken not found in draft.py or NGROK_AUTHTOKEN env" }

& ngrok config add-authtoken $token 2>$null | Out-Null

$env:CORS_ORIGINS = "$vercelUrl,http://localhost:3000"
Set-Location $backend
pip install -q -r requirements.txt 2>$null

Start-Process -WindowStyle Hidden -FilePath "python" -ArgumentList "-m","uvicorn","main:app","--host","0.0.0.0","--port","8000" -WorkingDirectory $backend
Start-Sleep -Seconds 4
Start-Process -WindowStyle Hidden -FilePath "ngrok" -ArgumentList "http","8000","--log=stdout"
Start-Sleep -Seconds 5

$tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -ErrorAction SilentlyContinue
$public = ($tunnels.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1).public_url
if (-not $public) { throw "ngrok tunnel not ready - open http://127.0.0.1:4040" }
Write-Output $public
