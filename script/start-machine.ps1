#Requires -Version 5.1
<#
.SYNOPSIS
    Khoi dong lai cac processes cua mot "may ao"

.DESCRIPTION
    Khoi dong lai cac MongoDB processes tuong ung voi 1 may vat ly trong production.

.PARAMETER MachineNumber
    So thu tu may (1-3)
    - Machine 1: Config1 + Node1 cua 3 shards (ports 27019, 27022, 27025, 27028)
    - Machine 2: Config2 + Node2 cua 3 shards (ports 27020, 27023, 27026, 27029)
    - Machine 3: Config3 + Node3 cua 3 shards (ports 27021, 27024, 27027, 27030)

.EXAMPLE
    .\start-machine.ps1 -MachineNumber 1
    Khoi dong May 1 (Config1 + Node1 cua tat ca shards)

.EXAMPLE
    .\start-machine.ps1 2
    Khoi dong May 2 (Config2 + Node2 cua tat ca shards)
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [ValidateRange(1,3)]
    [int]$MachineNumber
)

$ErrorActionPreference = "Stop"

# Configuration
$DataRoot = "C:\MongoDB-Dev-HA"
$LogRoot = "$DataRoot\logs"
$MongoDBPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"

# Mapping processes theo machine
$machineConfig = @{
    1 = @{
        Name = "Machine 1"
        Processes = @(
            @{ Name = "Config1"; Port = 27019; Args = "--configsvr --replSet configrs --port 27019 --dbpath `"$DataRoot\data\config1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\config1.log`"" },
            @{ Name = "Shard1-Node1"; Port = 27022; Args = "--shardsvr --replSet shard1rs --port 27022 --dbpath `"$DataRoot\data\shard1-node1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1-node1.log`"" },
            @{ Name = "Shard2-Node1"; Port = 27025; Args = "--shardsvr --replSet shard2rs --port 27025 --dbpath `"$DataRoot\data\shard2-node1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2-node1.log`"" },
            @{ Name = "Shard3-Node1"; Port = 27028; Args = "--shardsvr --replSet shard3rs --port 27028 --dbpath `"$DataRoot\data\shard3-node1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3-node1.log`"" }
        )
    }
    2 = @{
        Name = "Machine 2"
        Processes = @(
            @{ Name = "Config2"; Port = 27020; Args = "--configsvr --replSet configrs --port 27020 --dbpath `"$DataRoot\data\config2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\config2.log`"" },
            @{ Name = "Shard1-Node2"; Port = 27023; Args = "--shardsvr --replSet shard1rs --port 27023 --dbpath `"$DataRoot\data\shard1-node2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1-node2.log`"" },
            @{ Name = "Shard2-Node2"; Port = 27026; Args = "--shardsvr --replSet shard2rs --port 27026 --dbpath `"$DataRoot\data\shard2-node2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2-node2.log`"" },
            @{ Name = "Shard3-Node2"; Port = 27029; Args = "--shardsvr --replSet shard3rs --port 27029 --dbpath `"$DataRoot\data\shard3-node2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3-node2.log`"" }
        )
    }
    3 = @{
        Name = "Machine 3"
        Processes = @(
            @{ Name = "Config3"; Port = 27021; Args = "--configsvr --replSet configrs --port 27021 --dbpath `"$DataRoot\data\config3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\config3.log`"" },
            @{ Name = "Shard1-Node3"; Port = 27024; Args = "--shardsvr --replSet shard1rs --port 27024 --dbpath `"$DataRoot\data\shard1-node3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1-node3.log`"" },
            @{ Name = "Shard2-Node3"; Port = 27027; Args = "--shardsvr --replSet shard2rs --port 27027 --dbpath `"$DataRoot\data\shard2-node3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2-node3.log`"" },
            @{ Name = "Shard3-Node3"; Port = 27030; Args = "--shardsvr --replSet shard3rs --port 27030 --dbpath `"$DataRoot\data\shard3-node3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3-node3.log`"" }
        )
    }
}

$config = $machineConfig[$MachineNumber]

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " START $($config.Name)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dang khoi dong 4 processes..." -ForegroundColor Yellow
Write-Host ""

$startedProcesses = @()

foreach ($proc in $config.Processes) {
    Write-Host "Starting $($proc.Name) on port $($proc.Port)..." -ForegroundColor Cyan
    
    # Check if port already in use
    $existingProcess = Get-NetTCPConnection -LocalPort $proc.Port -ErrorAction SilentlyContinue
    if ($existingProcess) {
        Write-Host "[SKIP] Port $($proc.Port) already in use" -ForegroundColor Yellow
        continue
    }
    
    # Start process
    $fullCommand = "& `"$MongoDBPath`" $($proc.Args)"
    $job = Start-Process -FilePath "powershell.exe" `
                        -ArgumentList "-NoProfile", "-Command", $fullCommand `
                        -WindowStyle Hidden `
                        -PassThru
    
    $startedProcesses += @{
        Name = $proc.Name
        Port = $proc.Port
        PID = $job.Id
    }
    
    Write-Host "[OK] Started $($proc.Name) (PID: $($job.Id))" -ForegroundColor Green
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " $($config.Name) Started Successfully" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Cho replica sets tu dong phuc hoi (10-15s)..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Processes Started:" -ForegroundColor Cyan
foreach ($proc in $startedProcesses) {
    Write-Host "  - $($proc.Name) (Port: $($proc.Port), PID: $($proc.PID))" -ForegroundColor White
}
Write-Host ""
Write-Host "Replica sets se tu dong:" -ForegroundColor Yellow
Write-Host "  1. Phat hien cac node da tro lai" -ForegroundColor White
Write-Host "  2. Dong bo du lieu tu primary" -ForegroundColor White
Write-Host "  3. Cap nhat trang thai thanh SECONDARY" -ForegroundColor White
Write-Host ""
Write-Host "Kiem tra trang thai: npm run test-failover" -ForegroundColor Cyan
Write-Host ""
