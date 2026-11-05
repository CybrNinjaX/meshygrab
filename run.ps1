$ErrorActionPreference = 'Stop'
$ExtensionDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProfileDir = Join-Path $env:TEMP 'meshygrab-chrome-profile'

$Candidates = @(
  (Get-Command chrome.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
  (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
  (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe'),
  (Get-Command chromium.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1)
) | Where-Object { $_ -and (Test-Path $_) }

if (-not $Candidates) {
  Write-Error 'Chrome or Chromium was not found. Install one, then run .\run.ps1 again.'
  exit 1
}

Start-Process -FilePath $Candidates[0] -ArgumentList @(
  "--user-data-dir=$ProfileDir",
  '--no-first-run',
  "--load-extension=$ExtensionDir",
  'https://www.meshy.ai/'
)
