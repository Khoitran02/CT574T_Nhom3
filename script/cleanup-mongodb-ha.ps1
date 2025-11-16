#Requires -Version 5.1
<#
.SYNOPSIS
    Cleanup MongoDB HA cluster processes and optionally data

.DESCRIPTION
    Don dep MongoDB cluster voi replica sets (13 processes).

.PARAMETER KeepData
    Giu lai data, chi stop processes

.PARAMETER Force
    Khong confirm, thuc thi ngay

.EXAMPLE
    .\cleanup-mongodb-ha.ps1
    .\cleanup-mongodb-ha.ps1 -KeepData -Force
#>

param(
    [switch]$KeepData,
    [switch]$Force
)

$DataRoot = "C:\MongoDB-Dev-HA"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Cleanup MongoDB HA Cluster              " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Count processes
$processes = Get-Process mongod, mongos -ErrorAction SilentlyContinue
$count = $processes.Count

if ($count -eq 0) {
    Write-Host "[OK] Khong co MongoDB processes dang chay" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[*] Tim thay $count MongoDB processes" -ForegroundColor Yellow
    
    if (-not $Force) {
        Write-Host "    Nhan Enter de stop, Ctrl+C de huy..." -ForegroundColor Gray
        Read-Host
    }
    
    Write-Host "    Dang stop processes..." -ForegroundColor Gray
    $processes | Stop-Process -Force
    Start-Sleep 3
    Write-Host "[OK] Da stop tat ca processes" -ForegroundColor Green
    Write-Host ""
}

# Cleanup data
if (-not $KeepData) {
    if (Test-Path $DataRoot) {
        if (-not $Force) {
            Write-Host "[*] Xoa data directory: $DataRoot" -ForegroundColor Yellow
            Write-Host "    Nhan Enter de xoa, Ctrl+C de huy..." -ForegroundColor Gray
            Read-Host
        }
        
        Write-Host "    Dang xoa data..." -ForegroundColor Gray
        Remove-Item -Path $DataRoot -Recurse -Force
        Write-Host "[OK] Da xoa data directory" -ForegroundColor Green
        Write-Host ""
    }
} else {
    Write-Host "[OK] Giu lai data directory" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Done!"
Write-Host ""
