# =============================================================================
# MongoDB Development Cluster Cleanup Script
# =============================================================================
# This script stops all MongoDB processes and optionally cleans data
# Use this to completely reset your development environment
# Author: CT574T_Nhom3
# Version: 1.1 (Safe - No Emojis)
# =============================================================================

param(
    [switch]$KeepData,
    [switch]$Force,
    [switch]$Verbose
)

$DataRoot = "C:\MongoDB-Dev"

Write-Host "MongoDB Cluster Cleanup" -ForegroundColor Red
Write-Host "=======================" -ForegroundColor Cyan

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

function Write-Warning {
    param($Message)
    Write-Host "WARNING: $Message" -ForegroundColor Yellow
}

# Function to confirm destructive actions
function Confirm-Action {
    param($Message)
    
    if ($Force) {
        return $true
    }
    
    Write-Host ""
    Write-Warning $Message
    $response = Read-Host "Continue? (y/N)"
    return ($response -eq 'y' -or $response -eq 'Y')
}

# Function to stop MongoDB processes safely
function Stop-MongoProcesses {
    Write-Step "Stopping MongoDB processes..."
    
    # Stop MongoDB service if running
    try {
        $service = Get-Service MongoDB -ErrorAction SilentlyContinue
        if ($service -and $service.Status -eq "Running") {
            Write-Info "Stopping MongoDB service..."
            Stop-Service MongoDB -Force
            Write-Info "SUCCESS: MongoDB service stopped"
        }
    } catch {
        Write-Info "No MongoDB service found or already stopped"
    }
    
    # Get all MongoDB processes
    $processes = Get-Process mongod, mongos -ErrorAction SilentlyContinue
    
    if (-not $processes) {
        Write-Info "SUCCESS: No MongoDB processes found"
        return
    }
    
    Write-Info "Found $($processes.Count) MongoDB processes to stop"
    
    # Display processes before stopping
    if ($Verbose) {
        $processes | Format-Table Name, Id, ProcessName, StartTime -AutoSize
    }
    
    # Try graceful shutdown first
    Write-Info "Attempting graceful shutdown..."
    foreach ($process in $processes) {
        try {
            $process.CloseMainWindow() | Out-Null
            Write-Info "Sent close signal to $($process.Name) (PID: $($process.Id))"
        } catch {
            Write-Info "Could not send close signal to $($process.Name)"
        }
    }
    
    # Wait a few seconds for graceful shutdown
    Start-Sleep 5
    
    # Force kill remaining processes
    $remainingProcesses = Get-Process mongod, mongos -ErrorAction SilentlyContinue
    if ($remainingProcesses) {
        Write-Info "Force killing remaining processes..."
        $remainingProcesses | Stop-Process -Force
        Write-Info "SUCCESS: Force killed $($remainingProcesses.Count) processes"
    } else {
        Write-Info "SUCCESS: All processes shut down gracefully"
    }
    
    # Final verification
    Start-Sleep 2
    $finalCheck = Get-Process mongod, mongos -ErrorAction SilentlyContinue
    if ($finalCheck) {
        Write-Host "ERROR: Some processes still running:" -ForegroundColor Red
        $finalCheck | Format-Table Name, Id -AutoSize
        
        if (Confirm-Action "Force kill these processes?") {
            $finalCheck | Stop-Process -Force
            Write-Info "SUCCESS: All processes terminated"
        }
    } else {
        Write-Info "SUCCESS: All MongoDB processes stopped successfully"
    }
}

# Function to clean data directories
function Remove-DataDirectories {
    if ($KeepData) {
        Write-Step "Keeping data directories (--KeepData specified)" "Green"
        return
    }
    
    if (-not (Test-Path $DataRoot)) {
        Write-Info "SUCCESS: Data directory does not exist: $DataRoot"
        return
    }
    
    $dataSize = (Get-ChildItem $DataRoot -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB
    $dataSizeMB = [math]::Round($dataSize, 2)
    
    if (-not (Confirm-Action "Delete all MongoDB data? ($dataSizeMB MB in $DataRoot)")) {
        Write-Step "Data directories preserved" "Green"
        return
    }
    
    Write-Step "Cleaning data directories..."
    
    try {
        # Remove data directories
        if (Test-Path "$DataRoot\data") {
            Remove-Item "$DataRoot\data" -Recurse -Force
            Write-Info "SUCCESS: Removed data directories"
        }
        
        # Remove log files
        if (Test-Path "$DataRoot\logs") {
            Remove-Item "$DataRoot\logs" -Recurse -Force  
            Write-Info "SUCCESS: Removed log files"
        }
        
        # Remove empty parent directory if it exists
        if ((Test-Path $DataRoot) -and ((Get-ChildItem $DataRoot -Force | Measure-Object).Count -eq 0)) {
            Remove-Item $DataRoot -Force
            Write-Info "SUCCESS: Removed empty MongoDB directory"
        }
        
        Write-Step "Data cleanup completed" "Green"
        
    } catch {
        Write-Host "ERROR: Error cleaning data: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Some files might be locked. Try running as Administrator." -ForegroundColor Yellow
    }
}

# Function to check for port availability
function Test-PortAvailability {
    Write-Step "Checking port availability..."
    
    $mongoPorts = @(27016, 27019, 27020, 27021, 27022, 27023, 27024)
    $usedPorts = @()
    
    foreach ($port in $mongoPorts) {
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connection) {
            $usedPorts += $port
        }
    }
    
    if ($usedPorts.Count -eq 0) {
        Write-Info "SUCCESS: All MongoDB ports are available"
    } else {
        Write-Warning "Ports still in use: $($usedPorts -join ', ')"
        Write-Info "These may be held by other processes or Windows networking stack"
        Write-Info "Wait 30 seconds or restart PowerShell if needed"
    }
}

# Function to display system status after cleanup
function Show-SystemStatus {
    Write-Step "System Status After Cleanup" "Green"
    
    # Check processes
    $mongoProcesses = Get-Process mongod, mongos -ErrorAction SilentlyContinue
    if ($mongoProcesses) {
        Write-Warning "MongoDB processes still running:"
        $mongoProcesses | Format-Table Name, Id, StartTime -AutoSize
    } else {
        Write-Info "SUCCESS: No MongoDB processes running"
    }
    
    # Check services
    $mongoService = Get-Service MongoDB -ErrorAction SilentlyContinue
    if ($mongoService) {
        Write-Info "MongoDB service status: $($mongoService.Status)"
    }
    
    # Check data size
    if (Test-Path $DataRoot) {
        $remainingSize = (Get-ChildItem $DataRoot -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
        $remainingSizeMB = [math]::Round($remainingSize, 2)
        Write-Info "Remaining data size: $remainingSizeMB MB"
    } else {
        Write-Info "SUCCESS: MongoDB data directory removed"
    }
    
    Test-PortAvailability
}

# Main execution
try {
    Write-Host ""
    Write-Host "Cleanup Options:" -ForegroundColor White
    Write-Host "   Keep data: $($KeepData)" -ForegroundColor Gray
    Write-Host "   Force mode: $($Force)" -ForegroundColor Gray
    Write-Host "   Verbose: $($Verbose)" -ForegroundColor Gray
    Write-Host ""
    
    if (-not $Force) {
        Write-Warning "This will stop all MongoDB processes"
        if (-not $KeepData) {
            Write-Warning "This will DELETE all MongoDB data and logs"
        }
        Write-Host ""
    }
    
    # Step 1: Stop all MongoDB processes
    Stop-MongoProcesses
    
    # Step 2: Clean data directories
    Remove-DataDirectories
    
    # Step 3: Show final status
    Write-Host ""
    Show-SystemStatus
    
    Write-Host ""
    Write-Host "SUCCESS: MongoDB Cluster Cleanup Completed!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor White
    Write-Host "   Start fresh cluster: .\script\start-mongodb-cluster.ps1" -ForegroundColor Yellow
    Write-Host "   Check status:       Get-Process mongod,mongos -ErrorAction SilentlyContinue" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "ERROR during cleanup: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Try running as Administrator if file access errors occurred" -ForegroundColor Yellow
    exit 1
}

Write-Host "Cleanup script finished" -ForegroundColor Green