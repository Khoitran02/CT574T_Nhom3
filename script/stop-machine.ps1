#Requires -Version 5.1
<#
.SYNOPSIS
    Tat cac processes cua mot "may ao" de test failover

.DESCRIPTION
    Mo phong tat 1 may vat ly trong production cluster.
    Moi may chay Node1/2/3 cua tat ca cac shards + 1 Config Server.

.PARAMETER MachineNumber
    So thu tu may (1-3)
    - Machine 1: Config1 + Node1 cua 3 shards (ports 27019, 27022, 27025, 27028)
    - Machine 2: Config2 + Node2 cua 3 shards (ports 27020, 27023, 27026, 27029)
    - Machine 3: Config3 + Node3 cua 3 shards (ports 27021, 27024, 27027, 27030)

.EXAMPLE
    .\stop-machine.ps1 -MachineNumber 1
    Tat May 1 (Config1 + Node1 cua tat ca shards)

.EXAMPLE
    .\stop-machine.ps1 2
    Tat May 2 (Config2 + Node2 cua tat ca shards)
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateRange(1,3)]
    [int]$MachineNumber
)

$ErrorActionPreference = "Stop"

# Mapping ports theo machine
$machineConfig = @{
    1 = @{
        Name = "Machine 1"
        Ports = @(27019, 27022, 27025, 27028)
        Description = "Config1 + Node1 cua 3 shards"
    }
    2 = @{
        Name = "Machine 2"
        Ports = @(27020, 27023, 27026, 27029)
        Description = "Config2 + Node2 cua 3 shards"
    }
    3 = @{
        Name = "Machine 3"
        Ports = @(27021, 27024, 27027, 27030)
        Description = "Config3 + Node3 cua 3 shards"
    }
}

$config = $machineConfig[$MachineNumber]

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host " STOP $($config.Name)" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Se tat: $($config.Description)" -ForegroundColor Cyan
Write-Host "Ports: $($config.Ports -join ', ')" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sau khi tat, moi shard con 2/3 nodes" -ForegroundColor Yellow
Write-Host "Data van ACCESSIBLE" -ForegroundColor Green
Write-Host ""

$stoppedCount = 0

foreach ($port in $config.Ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess
    
    if ($process) {
        Stop-Process -Id $process -Force
        Write-Host "[OK] Da tat process tren port $port (PID: $process)" -ForegroundColor Green
        $stoppedCount++
    } else {
        Write-Host "[SKIP] Khong tim thay process tren port $port" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " HOAN TAT: Da tat $stoppedCount/$($config.Ports.Count) processes" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Kiem tra trang thai:" -ForegroundColor Cyan
Write-Host "  npm run test-failover" -ForegroundColor White
Write-Host ""
Write-Host "Khoi dong lai:" -ForegroundColor Cyan
Write-Host "  .\start-machine.ps1 -MachineNumber $MachineNumber" -ForegroundColor White
Write-Host ""
