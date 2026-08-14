#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$PackageVersion = "latest",
  [string]$InstallPrefix = $(if ($env:IMAGE_STUDIO_NPM_PREFIX) { $env:IMAGE_STUDIO_NPM_PREFIX } else { Join-Path ([Environment]::GetFolderPath("LocalApplicationData")) "Image-studio\npm" }),
  [string]$SkillUrl = $(if ($env:IMAGE_STUDIO_SKILL_URL) { $env:IMAGE_STUDIO_SKILL_URL } else { "__SITE_ORIGIN__/SKILL.md" }),
  [switch]$NoPathUpdate,
  [switch]$NoNodeInstall
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$PackageName = "image-studio-codex-skill"
$MinimumNodeMajor = 20

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = (@($machinePath, $userPath) | Where-Object { $_ }) -join ";"
}

function Get-NodeMajor {
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) { $node = Get-Command node -ErrorAction SilentlyContinue }
  if (-not $node) { return $null }
  $version = (& $node.Source --version).Trim()
  if ($LASTEXITCODE -ne 0 -or $version -notmatch '^v(\d+)') { return $null }
  return [int]$Matches[1]
}

function Install-NodeLts {
  if ($NoNodeInstall) {
    throw "Node.js $MinimumNodeMajor+ is required. Install the current Node.js LTS release from https://nodejs.org/ and run this installer again."
  }

  $winget = Get-Command winget.exe -ErrorAction SilentlyContinue
  if (-not $winget) { $winget = Get-Command winget -ErrorAction SilentlyContinue }
  if (-not $winget) {
    throw "Node.js $MinimumNodeMajor+ was not found and winget is unavailable. Install the current Node.js LTS release from https://nodejs.org/ and run this installer again."
  }

  Write-Step "Installing the current Node.js LTS release with winget"
  & $winget.Source install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements --silent
  if ($LASTEXITCODE -ne 0) {
    throw "winget could not install Node.js (exit code $LASTEXITCODE). Install Node.js $MinimumNodeMajor+ from https://nodejs.org/ and run this installer again."
  }
  Refresh-ProcessPath
}

function Add-UserPath([string]$Directory) {
  if ($NoPathUpdate) {
    if (($env:Path -split ';') -notcontains $Directory) { $env:Path = "$Directory;$env:Path" }
    return
  }

  $current = [Environment]::GetEnvironmentVariable("Path", "User")
  $parts = @($current -split ';' | Where-Object { $_ })
  if ($parts -notcontains $Directory) {
    $next = (@($Directory) + $parts) -join ";"
    [Environment]::SetEnvironmentVariable("Path", $next, "User")
  }
  if (($env:Path -split ';') -notcontains $Directory) { $env:Path = "$Directory;$env:Path" }
}

Write-Step "Checking Node.js"
$nodeMajor = Get-NodeMajor
if ($null -eq $nodeMajor -or $nodeMajor -lt $MinimumNodeMajor) {
  Install-NodeLts
  $nodeMajor = Get-NodeMajor
}
if ($null -eq $nodeMajor -or $nodeMajor -lt $MinimumNodeMajor) {
  throw "Node.js $MinimumNodeMajor+ is required, but the active Node.js version is $(if ($null -eq $nodeMajor) { 'unavailable' } else { $nodeMajor }). Install or activate a current LTS release and try again."
}
Write-Host "Node.js $(& node --version)"

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
if (-not $npm) { throw "npm was not found after Node.js setup." }
Write-Host "npm v$(& $npm.Source --version)"

Write-Step "Installing $PackageName@$PackageVersion into the current user account"
New-Item -ItemType Directory -Path $InstallPrefix -Force | Out-Null
& $npm.Source install --global --prefix $InstallPrefix "$PackageName@$PackageVersion"
if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE." }

$cli = Join-Path $InstallPrefix "image-studio.cmd"
if (-not (Test-Path -LiteralPath $cli)) { throw "Installation completed but the CLI was not found at $cli." }
Add-UserPath $InstallPrefix

Write-Step "Installing the Image-studio Skill for Codex"
& $cli install-skill
if ($LASTEXITCODE -ne 0) { throw "image-studio install-skill failed with exit code $LASTEXITCODE." }

$codexHome = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path ([Environment]::GetFolderPath("UserProfile")) ".codex" }
$skillFile = Join-Path $codexHome "skills\image-studio\SKILL.md"
if (-not (Test-Path -LiteralPath $skillFile)) { throw "Skill verification failed: $skillFile was not created." }

$unresolvedOrigin = "__SITE" + "_ORIGIN__"
if ($SkillUrl.StartsWith($unresolvedOrigin)) {
  $SkillUrl = "https://raw.githubusercontent.com/ding-1988/image-studio-skill/main/SKILL.md"
}
Write-Step "Synchronizing the current Skill instructions"
$skillContent = [string](Invoke-RestMethod -Uri $SkillUrl)
if ($skillContent -notmatch '(?m)^---\r?\nname:\s*image-studio\r?\n') {
  throw "The downloaded Skill did not pass frontmatter validation: $SkillUrl"
}
[System.IO.File]::WriteAllText($skillFile, $skillContent, [System.Text.UTF8Encoding]::new($false))

Write-Step "Verifying the CLI"
& $cli --help | Out-Null
if ($LASTEXITCODE -ne 0) { throw "The CLI was installed but its self-check failed." }

Write-Host "`nImage-studio installation succeeded." -ForegroundColor Green
Write-Host "CLI:   $cli"
Write-Host "Skill: $skillFile"
Write-Host "`nRestart Codex so it can discover the new Skill. Configure the API key locally afterward; never paste it into an AI chat."
