# Build Asset Management Teams app package
# Zips manifest.json and icons. Teams resolves {teamSiteDomain}/{teamSitePath}
# at channel-tab install time so one package can work across different team sites.

param(
    [switch]$IncludeM365
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDir = Join-Path $scriptDir "dist"
$zipPath = Join-Path $distDir "asset-management-teams.zip"
$syncToTeamsZipPath = Join-Path $scriptDir "TeamsSPFxApp.zip"
$repoRoot = Split-Path -Parent $scriptDir
$m365Manifest = Join-Path $repoRoot "m365\manifest.json"
$m365ZipPath = Join-Path $distDir "asset-management-m365.zip"
$sourceManifest = Join-Path $scriptDir "manifest.json"
$resolvedManifest = Join-Path $distDir "manifest.json"

function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Value
    )

    $encoding = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Value, $encoding)
}

function Assert-StoreNeutralManifest {
    param(
        [string]$Content,
        [string]$Name
    )

    $forbiddenPatterns = @(
        'chronodat\.sharepoint\.com',
        'contoso\.sharepoint\.com',
        '/sites/Chronodat',
        '/sites/dev',
        'SitePages/AssetManagement',
        'SitePages/AssetManagement',
        'SitePages/AssetManagement',
        '\{(pagePath|destPath|configurationUrl|outlookUrl)\}'
    )

    foreach ($pattern in $forbiddenPatterns) {
        if ($Content -match $pattern) {
            Write-Error "$Name contains a site-specific or obsolete value matching '$pattern'. Store packages must remain site-neutral."
        }
    }
}

Write-Host "Asset Management Teams package builder" -ForegroundColor Cyan
Write-Host "Source: $scriptDir"
Write-Host "Mode: personal app + configurable channel tab"

$requiredFiles = @(
    @{ Name = "color.png"; Path = Join-Path $scriptDir "color.png"; Required = $true },
    @{ Name = "outline.png"; Path = Join-Path $scriptDir "outline.png"; Required = $true }
)

$missingIcons = @()
$filesToZip = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file.Path) {
        $filesToZip += $file.Path
        Write-Host "  [OK] $($file.Name)" -ForegroundColor Green
    } else {
        $missingIcons += $file.Name
        Write-Host "  [MISSING] $($file.Name)" -ForegroundColor Yellow
    }
}

if ($missingIcons.Count -gt 0) {
    Write-Host ""
    Write-Host "NOTE: Teams requires color.png (192x192) and outline.png (32x32) at the zip root." -ForegroundColor Yellow
    Write-Host "      Missing: $($missingIcons -join ', ')" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Cannot create a valid Teams package without all required files." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir -Force | Out-Null
}

if (-not (Test-Path $sourceManifest)) {
    Write-Error "manifest.json not found in $scriptDir"
}

$manifestContent = Get-Content $sourceManifest -Raw -Encoding UTF8
Assert-StoreNeutralManifest -Content $manifestContent -Name "teams/manifest.json"
Write-Utf8NoBom -Path $resolvedManifest -Value $manifestContent
Write-Host "  [OK] manifest.json" -ForegroundColor Green

$filesToZip = @($resolvedManifest) + $filesToZip

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Compress-Archive -Path $filesToZip -DestinationPath $zipPath -Force
Copy-Item -Path $zipPath -Destination $syncToTeamsZipPath -Force

Write-Host ""
Write-Host "Created: $zipPath" -ForegroundColor Green
Write-Host "Created: $syncToTeamsZipPath for SharePoint Sync to Teams" -ForegroundColor Green

if ($IncludeM365) {
    Write-Host ""
    Write-Host "Building Microsoft 365 unified package..." -ForegroundColor Cyan

    if (-not (Test-Path $m365Manifest)) {
        Write-Error "m365/manifest.json not found at $m365Manifest"
    }

    $m365StagingDir = Join-Path $distDir "m365-staging"
    if (Test-Path $m365StagingDir) {
        Remove-Item $m365StagingDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $m365StagingDir -Force | Out-Null

    $m365Content = Get-Content $m365Manifest -Raw -Encoding UTF8
    Assert-StoreNeutralManifest -Content $m365Content -Name "m365/manifest.json"
    Write-Utf8NoBom -Path (Join-Path $m365StagingDir "manifest.json") -Value $m365Content
    Copy-Item -Path (Join-Path $scriptDir "color.png") -Destination (Join-Path $m365StagingDir "color.png") -Force
    Copy-Item -Path (Join-Path $scriptDir "outline.png") -Destination (Join-Path $m365StagingDir "outline.png") -Force

    if (Test-Path $m365ZipPath) {
        Remove-Item $m365ZipPath -Force
    }

    Compress-Archive -Path (Join-Path $m365StagingDir "*") -DestinationPath $m365ZipPath -Force
    Remove-Item $m365StagingDir -Recurse -Force

    Write-Host "Created: $m365ZipPath" -ForegroundColor Green
}
