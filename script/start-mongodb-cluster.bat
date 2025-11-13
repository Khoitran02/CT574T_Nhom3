@echo off
REM =============================================================================
REM MongoDB Cluster Startup - Batch File Wrapper  
REM =============================================================================
REM This batch file provides easy access to the PowerShell startup script
REM Double-click to run or execute from command prompt
REM =============================================================================

echo.
echo ========================================
echo   MongoDB Development Cluster Startup
echo ========================================
echo.

REM Check if PowerShell is available
powershell -Command "Write-Host 'PowerShell available' -ForegroundColor Green" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell not available
    echo Please ensure PowerShell 5.1+ is installed
    pause
    exit /b 1
)

REM Check if script exists
if not exist "%~dp0start-mongodb-cluster.ps1" (
    echo ERROR: start-mongodb-cluster.ps1 not found
    echo Please ensure the script exists in the same directory
    pause
    exit /b 1
)

echo Starting MongoDB cluster...
echo This may take 60-90 seconds...
echo.

REM Execute PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0start-mongodb-cluster.ps1" -Verbose

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Startup failed! 
    echo ========================================
    echo.
    echo Troubleshooting:
    echo 1. Run cleanup: cleanup-mongodb.bat
    echo 2. Check if MongoDB is installed
    echo 3. Run as Administrator if needed
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   MongoDB Cluster Started Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Start Neo4j Desktop
echo 2. Run: npm start
echo 3. Access: http://localhost:3000
echo.
echo Management:
echo - Stop cluster: cleanup-mongodb.bat  
echo - Check status: mongosh --port 27016 --eval "sh.status()"
echo.
pause