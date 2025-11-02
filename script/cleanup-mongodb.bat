@echo off
REM =============================================================================
REM Quick MongoDB Cluster Cleanup - Batch File Wrapper
REM =============================================================================
REM This batch file provides easy access to the PowerShell cleanup script
REM Double-click to run or execute from command prompt
REM =============================================================================

echo.
echo ========================================
echo   MongoDB Development Cluster Cleanup
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
if not exist "%~dp0cleanup-mongodb.ps1" (
    echo ERROR: cleanup-mongodb.ps1 not found
    echo Please ensure the script exists in the same directory
    pause
    exit /b 1
)

echo WARNING: This will stop all MongoDB processes
echo WARNING: This will DELETE all MongoDB data and logs
echo.
set /p "confirm=Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Cleanup cancelled
    pause
    exit /b 0
)

echo.
echo Cleaning up MongoDB cluster...
echo.

REM Execute PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "%~dp0cleanup-mongodb.ps1" -Verbose

if errorlevel 1 (
    echo.
    echo ========================================
    echo   Cleanup encountered errors!
    echo ========================================
    echo.
    echo Some files may be locked or require Administrator privileges
    echo Try running as Administrator
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   MongoDB Cluster Cleanup Completed!
echo ========================================
echo.
echo Next steps:
echo - Start fresh cluster: start-mongodb-cluster.bat
echo - Check processes: tasklist | findstr mongo
echo.
pause