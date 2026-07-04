# Post-package fix for the Asset Management .sppkg.
#
# SharePoint's "Sync to Teams" only uses a custom Teams package when it is stored
# at exactly ./teams/TeamsSPFxApp.zip inside the .sppkg (see Microsoft Learn:
# "Deployment options for SharePoint Framework solutions for Microsoft Teams").
#
# SPFx 1.21 sweeps the entire ./teams source folder into ClientSideAssets/, so the
# custom package lands at ClientSideAssets/TeamsSPFxApp.zip and is never detected --
# SharePoint then auto-generates a manifest using the 4-part solution version, which
# Teams rejects with a 400. It also sweeps build-only junk (build-package.ps1, dist/*)
# into the package.
#
# This script rewrites the built package so that:
#   * teams/TeamsSPFxApp.zip exists at the OPC root (the location SharePoint reads)
#   * build-only junk is removed from ClientSideAssets AND its relationships are pruned
#     from _rels/ClientSideAssets.xml.rels (removing a part without its relationship
#     produces an invalid package: "Specified part does not exist in the package").

param(
    [string]$Sppkg = "sharepoint/solution/asset-management.sppkg",
    [string]$TeamsZip = "teams/TeamsSPFxApp.zip"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sppkgPath = (Resolve-Path $Sppkg).Path
$teamsZipPath = (Resolve-Path $TeamsZip).Path
$relsName = '_rels/ClientSideAssets.xml.rels'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

Write-Host "Fixing Teams package placement in $Sppkg" -ForegroundColor Cyan

# ClientSideAssets parts that are build-only junk (not needed at runtime), plus any
# stale teams/ copy so the script is idempotent.
function Test-JunkEntry {
    param([string]$Name)
    $n = $Name.Replace('\', '/')
    return (
        $n -eq 'ClientSideAssets/TeamsSPFxApp.zip' -or
        $n -eq 'ClientSideAssets/build-package.ps1' -or
        $n -eq 'ClientSideAssets/dist' -or
        $n -like 'ClientSideAssets/dist/*' -or
        $n -eq 'teams/TeamsSPFxApp.zip'
    )
}

# Relationship Targets (as written in the .rels) that must be dropped when the junk is removed.
function Test-JunkTarget {
    param([string]$Target)
    $t = $Target.Replace('\', '/')
    return (
        $t -eq '/ClientSideAssets/TeamsSPFxApp.zip' -or
        $t -eq '/ClientSideAssets/build-package.ps1' -or
        $t -like '/ClientSideAssets/dist/*'
    )
}

$zip = [System.IO.Compression.ZipFile]::Open($sppkgPath, 'Update')
try {
    # 1. Remove junk parts.
    $toRemove = @($zip.Entries | Where-Object { Test-JunkEntry $_.FullName })
    foreach ($entry in $toRemove) {
        Write-Host "  - removing part $($entry.FullName)" -ForegroundColor DarkGray
        $entry.Delete()
    }

    # 2. Prune the corresponding relationships so the package stays consistent.
    $relsEntry = $zip.Entries | Where-Object { $_.FullName.Replace('\', '/') -eq $relsName } | Select-Object -First 1
    if ($relsEntry) {
        $reader = New-Object System.IO.StreamReader($relsEntry.Open())
        $relsXml = $reader.ReadToEnd()
        $reader.Close()

        [xml]$doc = $relsXml
        $removed = 0
        foreach ($rel in @($doc.Relationships.Relationship)) {
            if (Test-JunkTarget $rel.Target) {
                [void]$doc.Relationships.RemoveChild($rel)
                $removed++
            }
        }

        $relsFullName = $relsEntry.FullName
        $relsEntry.Delete()
        $newRels = $zip.CreateEntry($relsFullName)
        $writer = New-Object System.IO.StreamWriter($newRels.Open(), $utf8NoBom)
        $writer.Write($doc.OuterXml)
        $writer.Close()
        Write-Host "  ~ pruned $removed dangling relationship(s) in $relsFullName" -ForegroundColor DarkGray
    }

    # 3. Add the custom Teams package at the path Sync to Teams reads.
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $teamsZipPath, 'teams/TeamsSPFxApp.zip') | Out-Null
    Write-Host "  + added teams/TeamsSPFxApp.zip" -ForegroundColor Green
}
finally {
    $zip.Dispose()
}

# Verify integrity: teams package present, no junk parts, no dangling relationships.
$verify = [System.IO.Compression.ZipFile]::OpenRead($sppkgPath)
try {
    $entryNames = $verify.Entries | ForEach-Object { $_.FullName.Replace('\', '/') }
    if ($entryNames -notcontains 'teams/TeamsSPFxApp.zip') {
        throw "teams/TeamsSPFxApp.zip missing after fix."
    }
    $residual = @($verify.Entries | Where-Object { (Test-JunkEntry $_.FullName) -and ($_.FullName.Replace('\', '/') -ne 'teams/TeamsSPFxApp.zip') })
    if ($residual.Count -gt 0) {
        throw "Residual junk parts remain: $(($residual | ForEach-Object { $_.FullName }) -join ', ')"
    }

    $relsEntry = $verify.Entries | Where-Object { $_.FullName.Replace('\', '/') -eq $relsName } | Select-Object -First 1
    if ($relsEntry) {
        $reader = New-Object System.IO.StreamReader($relsEntry.Open())
        $relsXml = $reader.ReadToEnd()
        $reader.Close()
        [xml]$doc = $relsXml
        foreach ($rel in @($doc.Relationships.Relationship)) {
            $target = $rel.Target.Replace('\', '/').TrimStart('/')
            if ($entryNames -notcontains $target) {
                throw "Dangling relationship remains: $($rel.Target)"
            }
        }
    }
}
finally {
    $verify.Dispose()
}

Write-Host "Done. teams/TeamsSPFxApp.zip in place, ClientSideAssets clean, relationships consistent." -ForegroundColor Green
