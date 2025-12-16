#Requires -Version 5.1
<#
.SYNOPSIS
    Start MongoDB Cluster with Replica Sets for High Availability

.DESCRIPTION
    Khoi dong MongoDB sharded cluster voi moi shard co 3 nodes replica set.
    Mo hinh nay ho tro high availability - khi tat 1 node van truy cap duoc data.

.PARAMETER DataRoot
    Thu muc goc chua data (mac dinh: C:\MongoDB-Dev-HA)

.PARAMETER Verbose
    Hien thi thong tin chi tiet

.EXAMPLE
    .\start-mongodb-cluster-ha.ps1
    .\start-mongodb-cluster-ha.ps1 -DataRoot "D:\MongoDB-HA" -Verbose
#>

[CmdletBinding()]
param(
    [string]$DataRoot = "C:\MongoDB-Dev-HA"
)

$ErrorActionPreference = "Stop"

# Configuration
$LogRoot = "$DataRoot\logs"
$MongoDBPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$MongosPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongos.exe"

# Color functions
function Write-Step($message) {
    Write-Host "`n[*] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "  [OK] $message" -ForegroundColor Green
}

function Write-Info($message) {
    Write-Host "  [INFO] $message" -ForegroundColor Gray
}

function Write-Error-Custom($message) {
    Write-Host "  [ERROR] $message" -ForegroundColor Red
}

# Initialize data directories
function Initialize-DataDirectories {
    Write-Step "Creating data directories..."
    
    $directories = @(
        # Config servers (3 nodes)
        "$DataRoot\data\config1", "$DataRoot\data\config2", "$DataRoot\data\config3",
        # Shard 1 replica set (3 nodes)
        "$DataRoot\data\shard1-node1", "$DataRoot\data\shard1-node2", "$DataRoot\data\shard1-node3",
        # Shard 2 replica set (3 nodes)
        "$DataRoot\data\shard2-node1", "$DataRoot\data\shard2-node2", "$DataRoot\data\shard2-node3",
        # Shard 3 replica set (3 nodes)
        "$DataRoot\data\shard3-node1", "$DataRoot\data\shard3-node2", "$DataRoot\data\shard3-node3",
        # Logs
        "$LogRoot"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Created: $dir"
        }
    }
}

# Start MongoDB process
function Start-MongoProcess($name, $arguments) {
    Write-Info "Starting $name..."
    Start-Process -FilePath $MongoDBPath -ArgumentList $arguments -WindowStyle Minimized
    Write-Success "$name started"
}

# Start mongos process
function Start-MongosProcess($arguments) {
    Write-Info "Starting mongos router..."
    Start-Process -FilePath $MongosPath -ArgumentList $arguments -WindowStyle Normal
    Write-Success "mongos router started"
}

# Wait for MongoDB to be ready
function Wait-ForMongo($port, $timeout = 30) {
    Write-Info "Waiting for MongoDB on port $port..."
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        try {
            $result = mongosh --port $port --quiet --eval "db.runCommand('ping').ok" 2>$null
            if ($result -eq "1") {
                Write-Success "MongoDB ready on port $port"
                return $true
            }
        } catch {}
        Start-Sleep 1
        $elapsed++
    }
    Write-Error-Custom "Timeout waiting for MongoDB on port $port"
    return $false
}

# Execute MongoDB command
function Invoke-MongoCommand($port, $command, $description) {
    Write-Info "$description on port $port..."
    try {
        mongosh --port $port --quiet --eval "$command" | Out-Null
        Write-Success "$description completed"
    } catch {
        Write-Error-Custom "Failed: $description - $($_.Exception.Message)"
    }
}

# Stop existing processes
function Stop-ExistingProcesses {
    Write-Step "Checking for existing MongoDB processes..."
    
    $criticalPorts = @(27017, 27019, 27020, 27021, 27022, 27023, 27024, 27025, 27026, 27027, 27028, 27029, 27030, 27031, 27032)
    $portsInUse = @()
    
    foreach ($port in $criticalPorts) {
        $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            $portsInUse += $port
        }
    }
    
    if ($portsInUse.Count -gt 0) {
        Write-Host "  [WARNING] Ports in use: $($portsInUse -join ', ')" -ForegroundColor Yellow
        Write-Host "  Stopping existing MongoDB processes..." -ForegroundColor Yellow
        
        Get-Process mongod, mongos -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep 3
        
        Write-Success "Stopped existing processes"
    } else {
        Write-Success "No port conflicts detected"
    }
}

# Main execution
try {
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "   MongoDB Sharded Cluster - High Availability Setup" -ForegroundColor Cyan
    Write-Host "   3 Shards x 3 Nodes Replica Set = 9 Shard Nodes" -ForegroundColor Cyan
    Write-Host "============================================================`n" -ForegroundColor Cyan
    
    # Verify MongoDB installation
    if (-not (Test-Path $MongoDBPath)) {
        Write-Error-Custom "MongoDB not found at: $MongoDBPath"
        Write-Host "  Please install MongoDB Community Server 8.2+`n" -ForegroundColor Yellow
        exit 1
    }
    
    Initialize-DataDirectories
    Stop-ExistingProcesses
    
    # Step 1: Start Config Servers
    Write-Step "Starting Config Servers - 3 nodes"
    
    Start-MongoProcess "ConfigServer1" "--configsvr --replSet configrs --port 27019 --dbpath `"$DataRoot\data\config1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\configsvr1.log`""
    Start-Sleep 2
    Start-MongoProcess "ConfigServer2" "--configsvr --replSet configrs --port 27020 --dbpath `"$DataRoot\data\config2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\configsvr2.log`""
    Start-Sleep 2
    Start-MongoProcess "ConfigServer3" "--configsvr --replSet configrs --port 27021 --dbpath `"$DataRoot\data\config3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\configsvr3.log`""
    Start-Sleep 5
    
    Wait-ForMongo 27019 | Out-Null
    
    # Step 2: Initialize Config Server Replica Set
    Write-Step "Initializing Config Server Replica Set"
    Invoke-MongoCommand 27019 "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: 'localhost:27019', priority: 2}, {_id: 1, host: 'localhost:27020', priority: 1}, {_id: 2, host: 'localhost:27021', priority: 1}]})" "Config RS init"
    Start-Sleep 15
    
    # Step 3: Start Shard 1 Replica Set
    Write-Step "Starting Shard 1 Replica Set - 3 nodes"
    
    Start-MongoProcess "Shard1-Node1" "--shardsvr --replSet shard1rs --port 27022 --dbpath `"$DataRoot\data\shard1-node1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1-node1.log`""
    Start-Sleep 2
    Start-MongoProcess "Shard1-Node2" "--shardsvr --replSet shard1rs --port 27023 --dbpath `"$DataRoot\data\shard1-node2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1-node2.log`""
    Start-Sleep 2
    Start-MongoProcess "Shard1-Node3" "--shardsvr --replSet shard1rs --port 27024 --dbpath `"$DataRoot\data\shard1-node3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1-node3.log`""
    Start-Sleep 5
    
    Wait-ForMongo 27022 | Out-Null
    
    # Step 4: Initialize Shard 1 Replica Set
    Write-Step "Initializing Shard 1 Replica Set"
    Invoke-MongoCommand 27022 "rs.initiate({_id: 'shard1rs', members: [{_id: 0, host: 'localhost:27022', priority: 2}, {_id: 1, host: 'localhost:27023', priority: 1}, {_id: 2, host: 'localhost:27024', priority: 1}]})" "Shard1 RS init"
    Start-Sleep 15
    
    # Step 5: Start Shard 2 Replica Set
    Write-Step "Starting Shard 2 Replica Set - 3 nodes"
    
    Start-MongoProcess "Shard2-Node1" "--shardsvr --replSet shard2rs --port 27025 --dbpath `"$DataRoot\data\shard2-node1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2-node1.log`""
    Start-Sleep 2
    Start-MongoProcess "Shard2-Node2" "--shardsvr --replSet shard2rs --port 27026 --dbpath `"$DataRoot\data\shard2-node2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2-node2.log`""
    Start-Sleep 2
    Start-MongoProcess "Shard2-Node3" "--shardsvr --replSet shard2rs --port 27027 --dbpath `"$DataRoot\data\shard2-node3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2-node3.log`""
    Start-Sleep 5
    
    Wait-ForMongo 27025 | Out-Null
    
    # Step 6: Initialize Shard 2 Replica Set
    Write-Step "Initializing Shard 2 Replica Set"
    Invoke-MongoCommand 27025 "rs.initiate({_id: 'shard2rs', members: [{_id: 0, host: 'localhost:27025', priority: 2}, {_id: 1, host: 'localhost:27026', priority: 1}, {_id: 2, host: 'localhost:27027', priority: 1}]})" "Shard2 RS init"
    Start-Sleep 15
    
    # Step 7: Start Shard 3 Replica Set
    Write-Step "Starting Shard 3 Replica Set - 3 nodes"
    
    Start-MongoProcess "Shard3-Node1" "--shardsvr --replSet shard3rs --port 27028 --dbpath `"$DataRoot\data\shard3-node1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3-node1.log`""
    Start-Sleep 2
    Start-MongoProcess "Shard3-Node2" "--shardsvr --replSet shard3rs --port 27029 --dbpath `"$DataRoot\data\shard3-node2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3-node2.log`""
    Start-Sleep 2
    Start-MongoProcess "Shard3-Node3" "--shardsvr --replSet shard3rs --port 27030 --dbpath `"$DataRoot\data\shard3-node3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3-node3.log`""
    Start-Sleep 5
    
    Wait-ForMongo 27028 | Out-Null
    
    # Step 8: Initialize Shard 3 Replica Set
    Write-Step "Initializing Shard 3 Replica Set"
    Invoke-MongoCommand 27028 "rs.initiate({_id: 'shard3rs', members: [{_id: 0, host: 'localhost:27028', priority: 2}, {_id: 1, host: 'localhost:27029', priority: 1}, {_id: 2, host: 'localhost:27030', priority: 1}]})" "Shard3 RS init"
    Start-Sleep 15
    
    # Step 9: Start mongos Router
    Write-Step "Starting mongos Router"
    Start-MongosProcess "--configdb `"configrs/localhost:27019,localhost:27020,localhost:27021`" --port 27017 --bind_ip 127.0.0.1 --logpath `"$LogRoot\mongos.log`""
    Start-Sleep 10
    
    Wait-ForMongo 27017 | Out-Null
    
    # Step 10: Add shards to cluster
    Write-Step "Configuring sharded cluster"
    
    Invoke-MongoCommand 27017 "sh.addShard('shard1rs/localhost:27022,localhost:27023,localhost:27024')" "Add shard1"
    Invoke-MongoCommand 27017 "sh.addShard('shard2rs/localhost:27025,localhost:27026,localhost:27027')" "Add shard2"
    Invoke-MongoCommand 27017 "sh.addShard('shard3rs/localhost:27028,localhost:27029,localhost:27030')" "Add shard3"
    
    Invoke-MongoCommand 27017 "sh.enableSharding('socialnetwork')" "Enable sharding"
    
    # Final status check
    Write-Step "Cluster Status"
    
    Write-Host "`n  Processes Running:" -ForegroundColor Cyan
    $processes = Get-Process mongod, mongos -ErrorAction SilentlyContinue
    Write-Host "    mongod: $(@($processes | Where-Object {$_.ProcessName -eq 'mongod'}).Count) instances" -ForegroundColor White
    Write-Host "    mongos: $(@($processes | Where-Object {$_.ProcessName -eq 'mongos'}).Count) instances" -ForegroundColor White
    
    Write-Host "`n============================================================" -ForegroundColor Green
    Write-Host "   [SUCCESS] Cluster Started Successfully!" -ForegroundColor Green
    Write-Host "============================================================`n" -ForegroundColor Green
    
    Write-Host "  Cluster Architecture:" -ForegroundColor Cyan
    Write-Host "     - Config Servers: 3 nodes on ports 27019-27021" -ForegroundColor White
    Write-Host "     - Shard 1: 3 nodes on ports 27022-27024" -ForegroundColor White
    Write-Host "     - Shard 2: 3 nodes on ports 27025-27027" -ForegroundColor White
    Write-Host "     - Shard 3: 3 nodes on ports 27028-27030" -ForegroundColor White
    Write-Host "     - Router: mongos on port 27017" -ForegroundColor White
    Write-Host "     - Total: 13 processes`n" -ForegroundColor Gray
    
    Write-Host "  High Availability Features:" -ForegroundColor Cyan
    Write-Host "     - Moi shard co 3 nodes" -ForegroundColor White
    Write-Host "     - Co the tat 1 node/shard ma van truy cap duoc data" -ForegroundColor White
    Write-Host "     - Automatic failover khi primary node down`n" -ForegroundColor White
    
    Write-Host "  Next Steps:" -ForegroundColor Cyan
    Write-Host "     1. cd backend" -ForegroundColor White
    Write-Host "     2. node script/setup-sharding.js" -ForegroundColor White
    Write-Host "     3. npm run seed" -ForegroundColor White
    Write-Host "     4. npm run test-failover`n" -ForegroundColor White
    
} catch {
    Write-Host "`n[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    exit 1
}
