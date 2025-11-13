# =============================================================================
# MongoDB Development Cluster Startup Script
# =============================================================================
# This script starts a complete MongoDB sharded cluster on a single Windows machine
# Architecture: 3 Config Servers + 3 Shards + 1 mongos Router
# Author: CT574T_Nhom3
# Version: 1.1 (Safe - No Emojis)
# =============================================================================

param(
    [switch]$Verbose,
    [switch]$SkipDataDirCreation
)

# Configuration
$MongoPath = "C:\Program Files\MongoDB\Server\8.2\bin"
$DataRoot = "C:\MongoDB-Dev"
$LogRoot = "$DataRoot\logs"

Write-Host "Starting MongoDB Development Cluster..." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan

# Function to write colored output
function Write-Step {
    param($Message, $Color = "Yellow")
    Write-Host ">> $Message" -ForegroundColor $Color
}

function Write-Info {
    param($Message)
    if ($Verbose) {
        Write-Host "   INFO: $Message" -ForegroundColor Gray
    }
}

# Function to check if MongoDB is installed
function Test-MongoInstallation {
    if (-not (Test-Path "$MongoPath\mongod.exe")) {
        Write-Host "ERROR: MongoDB not found at: $MongoPath" -ForegroundColor Red
        Write-Host "   Please install MongoDB Community Server 8.2+ first" -ForegroundColor Red
        Write-Host "   Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
        exit 1
    }
    Write-Info "MongoDB installation verified at: $MongoPath"
}

# Function to create data directories
function Initialize-DataDirectories {
    if ($SkipDataDirCreation) {
        Write-Info "Skipping data directory creation"
        return
    }
    
    Write-Step "Creating data directories..."
    $dirs = @(
        "$DataRoot\data\config1", "$DataRoot\data\config2", "$DataRoot\data\config3",
        "$DataRoot\data\shard1", "$DataRoot\data\shard2", "$DataRoot\data\shard3",
        "$LogRoot"
    )
    
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -Path $dir -ItemType Directory -Force | Out-Null
            Write-Info "Created: $dir"
        }
    }
}

# Function to stop existing MongoDB processes
function Stop-ExistingProcesses {
    Write-Step "Checking for existing MongoDB processes..."
    
    # Check MongoDB service status (don't try to stop it)
    try {
        $service = Get-Service MongoDB -ErrorAction SilentlyContinue
        if ($service -and $service.Status -eq "Running") {
            Write-Warning "MongoDB service is running on default port 27016"
            Write-Warning "This may conflict with our mongos router"
            Write-Host "   Consider stopping MongoDB service manually or use different ports" -ForegroundColor Yellow
        }
    } catch {
        Write-Info "No MongoDB service conflict detected"
    }
    
    # Kill any existing mongod/mongos processes (only our development ones)
    $processes = Get-Process mongod, mongos -ErrorAction SilentlyContinue | Where-Object { 
        $_.ProcessName -match "mongod|mongos" 
    }
    if ($processes) {
        try {
            $processes | Stop-Process -Force -ErrorAction SilentlyContinue
            Write-Info "Cleaned up $($processes.Count) existing MongoDB processes"
            Start-Sleep 3
        } catch {
            Write-Warning "Some processes could not be stopped - they may restart automatically"
        }
    }
}

# Function to check port availability
function Test-PortAvailable {
    param($Port)
    
    try {
        $connections = netstat -ano | Select-String ":$Port "
        if ($connections) {
            Write-Warning "Port $Port is already in use"
            $connections | ForEach-Object {
                $line = $_.Line.Trim() -split '\s+'
                if ($line.Length -ge 5) {
                    $pid = $line[4]
                    try {
                        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                        if ($process) {
                            Write-Warning "   Process: $($process.ProcessName) (PID: $pid)"
                        }
                    } catch {}
                }
            }
            return $false
        }
        return $true
    } catch {
        return $true
    }
}

# Function to start a MongoDB process
function Start-MongoProcess {
    param($Name, $Arguments, $WindowStyle = "Minimized")
    
    Write-Info "Starting $Name..."
    $process = Start-Process -FilePath "$MongoPath\mongod.exe" -ArgumentList $Arguments -WindowStyle $WindowStyle -PassThru
    
    if ($process) {
        Write-Info "$Name started with PID: $($process.Id)"
        return $process
    } else {
        Write-Host "ERROR: Failed to start $Name" -ForegroundColor Red
        exit 1
    }
}

# Function to start mongos process
function Start-MongosProcess {
    param($Arguments)
    
    Write-Info "Starting mongos router..."
    $process = Start-Process -FilePath "$MongoPath\mongos.exe" -ArgumentList $Arguments -WindowStyle Normal -PassThru
    
    if ($process) {
        Write-Info "mongos started with PID: $($process.Id)"
        return $process
    } else {
        Write-Host "ERROR: Failed to start mongos" -ForegroundColor Red
        exit 1
    }
}

# Function to execute MongoDB command
function Invoke-MongoCommand {
    param($Port, $Command, $Description)
    
    Write-Info $Description
    $result = & "$MongoPath\mongosh.exe" --port $Port --eval $Command --quiet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Info "SUCCESS: $Description"
        return $true
    } else {
        Write-Host "ERROR: $Description" -ForegroundColor Red
        Write-Host "   Command: $Command" -ForegroundColor Gray
        return $false
    }
}

# Function to wait for MongoDB process to be ready
function Wait-ForMongo {
    param($Port, $TimeoutSeconds = 30)
    
    Write-Info "Waiting for MongoDB on port $Port to be ready..."
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    
    do {
        try {
            $result = & "$MongoPath\mongosh.exe" --port $Port --eval "db.runCommand('ping')" --quiet 2>$null
            if ($LASTEXITCODE -eq 0) {
                Write-Info "SUCCESS: MongoDB on port $Port is ready"
                return $true
            }
        } catch {}
        
        Start-Sleep 2
    } while ((Get-Date) -lt $timeout)
    
    Write-Host "ERROR: Timeout waiting for MongoDB on port $Port" -ForegroundColor Red
    return $false
}

# Main execution
try {
    # Step 1: Pre-checks
    Test-MongoInstallation
    
    # Check critical ports
    Write-Step "Checking port availability..."
    $criticalPorts = @(27016, 27019, 27020, 27021, 27022, 27023, 27024)
    $conflictPorts = @()
    
    foreach ($port in $criticalPorts) {
        if (-not (Test-PortAvailable $port)) {
            $conflictPorts += $port
        }
    }
    
    if ($conflictPorts.Count -gt 0) {
        Write-Host ""
        Write-Host "ERROR: Port conflicts detected!" -ForegroundColor Red
        Write-Host "   Ports in use: $($conflictPorts -join ', ')" -ForegroundColor Red
        
        if (27016 -in $conflictPorts) {
            Write-Host ""
            Write-Host "SOLUTION: MongoDB service is running on port 27016" -ForegroundColor Yellow
            Write-Host "   Option 1: Stop MongoDB service:" -ForegroundColor Yellow
            Write-Host "     net stop MongoDB" -ForegroundColor Gray
            Write-Host "   Option 2: Run as Administrator and use -Force" -ForegroundColor Yellow
        }
        
        Write-Host ""
        exit 1
    }
    
    Initialize-DataDirectories
    Stop-ExistingProcesses
    
    # Step 2: Start Config Servers
    Write-Step "Starting Config Servers (3/3)..."
    
    $configArgs1 = "--configsvr --replSet configrs --port 27019 --dbpath `"$DataRoot\data\config1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\configsvr1.log`""
    $configArgs2 = "--configsvr --replSet configrs --port 27020 --dbpath `"$DataRoot\data\config2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\configsvr2.log`""
    $configArgs3 = "--configsvr --replSet configrs --port 27021 --dbpath `"$DataRoot\data\config3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\configsvr3.log`""
    
    Start-MongoProcess "ConfigServer1" $configArgs1
    Start-Sleep 3
    Start-MongoProcess "ConfigServer2" $configArgs2  
    Start-Sleep 3
    Start-MongoProcess "ConfigServer3" $configArgs3
    Start-Sleep 5
    
    # Wait for config servers to be ready
    Wait-ForMongo 27019 | Out-Null
    Wait-ForMongo 27020 | Out-Null
    Wait-ForMongo 27021 | Out-Null
    
    # Step 3: Initialize Config Server Replica Set
    Write-Step "Initializing Config Server Replica Set..."
    $configRsInit = "rs.initiate({_id: 'configrs', configsvr: true, members: [{_id: 0, host: 'localhost:27019'}, {_id: 1, host: 'localhost:27020'}, {_id: 2, host: 'localhost:27021'}]})"
    Invoke-MongoCommand 27019 $configRsInit "Initialize config replica set"
    Start-Sleep 15
    
    # Step 4: Start Shard Servers
    Write-Step "Starting Shard Servers (3/3)..."
    
    $shardArgs1 = "--shardsvr --replSet shard1rs --port 27022 --dbpath `"$DataRoot\data\shard1`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard1.log`""
    $shardArgs2 = "--shardsvr --replSet shard2rs --port 27023 --dbpath `"$DataRoot\data\shard2`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard2.log`""
    $shardArgs3 = "--shardsvr --replSet shard3rs --port 27024 --dbpath `"$DataRoot\data\shard3`" --bind_ip 127.0.0.1 --logpath `"$LogRoot\shard3.log`""
    
    Start-MongoProcess "Shard1" $shardArgs1
    Start-Sleep 3
    Start-MongoProcess "Shard2" $shardArgs2
    Start-Sleep 3
    Start-MongoProcess "Shard3" $shardArgs3
    Start-Sleep 5
    
    # Wait for shard servers to be ready
    Wait-ForMongo 27022 | Out-Null
    Wait-ForMongo 27023 | Out-Null
    Wait-ForMongo 27024 | Out-Null
    
    # Step 5: Initialize Shard Replica Sets
    Write-Step "Initializing Shard Replica Sets..."
    
    $shard1RsInit = "rs.initiate({_id: 'shard1rs', members: [{_id: 0, host: 'localhost:27022'}]})"
    $shard2RsInit = "rs.initiate({_id: 'shard2rs', members: [{_id: 0, host: 'localhost:27023'}]})"
    $shard3RsInit = "rs.initiate({_id: 'shard3rs', members: [{_id: 0, host: 'localhost:27024'}]})"
    
    Invoke-MongoCommand 27022 $shard1RsInit "Initialize shard1 replica set"
    Invoke-MongoCommand 27023 $shard2RsInit "Initialize shard2 replica set"  
    Invoke-MongoCommand 27024 $shard3RsInit "Initialize shard3 replica set"
    Start-Sleep 20
    
    # Step 6: Start mongos Router
    Write-Step "Starting mongos Router..."
    $mongosArgs = "--configdb `"configrs/localhost:27019,localhost:27020,localhost:27021`" --port 27016 --bind_ip 127.0.0.1 --logpath `"$LogRoot\mongos.log`""
    Start-MongosProcess $mongosArgs
    Start-Sleep 10
    
    # Wait for mongos to be ready
    Wait-ForMongo 27016 | Out-Null
    
    # Step 7: Configure Sharding
    Write-Step "Configuring Sharding..."
    
    Invoke-MongoCommand 27016 "sh.addShard('shard1rs/localhost:27022')" "Add shard1 to cluster"
    Invoke-MongoCommand 27016 "sh.addShard('shard2rs/localhost:27023')" "Add shard2 to cluster"
    Invoke-MongoCommand 27016 "sh.addShard('shard3rs/localhost:27024')" "Add shard3 to cluster"
    
    Invoke-MongoCommand 27016 "sh.enableSharding('socialnetwork')" "Enable sharding for socialnetwork database"
    Invoke-MongoCommand 27016 "sh.shardCollection('socialnetwork.users', {user_id: 1})" "Shard users collection"
    Invoke-MongoCommand 27016 "sh.shardCollection('socialnetwork.posts', {user_id: 1})" "Shard posts collection"
    Invoke-MongoCommand 27016 "sh.shardCollection('socialnetwork.comments', {post_id: 1})" "Shard comments collection"
    
    # Step 8: Final verification
    Write-Step "Final Verification..."
    
    $processes = Get-Process mongod, mongos -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "SUCCESS: MongoDB Cluster Successfully Started!" -ForegroundColor Green
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host "Running Processes: $($processes.Count)" -ForegroundColor White
    
    $processes | Format-Table Name, Id, WorkingSet, StartTime -AutoSize
    
    Write-Host "Connection Details:" -ForegroundColor White
    Write-Host "   MongoDB Cluster: mongodb://localhost:27016/socialnetwork" -ForegroundColor Cyan
    Write-Host "   Config Servers:  localhost:27019, 27020, 27021" -ForegroundColor Gray
    Write-Host "   Shards:         localhost:27022, 27023, 27024" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor White
    Write-Host "   1. Start Neo4j Desktop" -ForegroundColor Yellow
    Write-Host "   2. Run: npm start" -ForegroundColor Yellow
    Write-Host "   3. Access: http://localhost:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Management:" -ForegroundColor White
    Write-Host "   Stop cluster:    .\script\cleanup-mongodb.ps1" -ForegroundColor Gray
    Write-Host "   Check status:    mongosh --port 27016 --eval 'sh.status()'" -ForegroundColor Gray
    Write-Host ""
    
    # Quick test
    Write-Host "Quick Test:" -ForegroundColor White
    Invoke-MongoCommand 27016 "sh.status()" "Cluster status check" | Out-Null
    
} catch {
    Write-Host "ERROR during cluster startup: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running: .\script\cleanup-mongodb.ps1 then retry" -ForegroundColor Yellow
    exit 1
}