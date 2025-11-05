# CT574T Social Network - Development Setup

Write-Host "🚀 Starting CT574T Social Network Full-Stack Application..." -ForegroundColor Green

# Check if MongoDB cluster is running
Write-Host "📊 Checking MongoDB cluster status..." -ForegroundColor Yellow
$mongoProcesses = Get-Process mongod, mongos -ErrorAction SilentlyContinue

if ($mongoProcesses.Count -lt 7) {
    Write-Host "⚡ Starting MongoDB cluster..." -ForegroundColor Yellow
    & ".\script\start-mongodb-cluster.ps1"
    Start-Sleep 5
} else {
    Write-Host "✅ MongoDB cluster is already running" -ForegroundColor Green
}

# Check if backend is running
Write-Host "🔧 Checking backend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend server is already running on port 3001" -ForegroundColor Green
} catch {
    Write-Host "⚡ Starting backend server..." -ForegroundColor Yellow
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd backend; npm start" -WindowStyle Normal
    Write-Host "🔄 Backend starting up..." -ForegroundColor Yellow
}

# Check if frontend is running  
Write-Host "🎨 Checking frontend server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -ErrorAction Stop  
    Write-Host "✅ Frontend server is already running on port 5173" -ForegroundColor Green
} catch {
    Write-Host "⚡ Starting frontend server..." -ForegroundColor Yellow
    Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
    Write-Host "🔄 Frontend starting up..." -ForegroundColor Yellow
}

# Wait a moment for servers to start
Start-Sleep 3

Write-Host ""
Write-Host "🎉 CT574T Social Network Application Setup Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "📱 Frontend (React):     http://localhost:5173" -ForegroundColor Yellow  
Write-Host "🔧 Backend API:          http://localhost:3001" -ForegroundColor Yellow
Write-Host "📊 Database Status:      http://localhost:5173/database" -ForegroundColor Yellow
Write-Host "🗄️  MongoDB Router:      mongodb://localhost:27017" -ForegroundColor Yellow
Write-Host "📈 Neo4j Browser:        http://localhost:7474" -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   - Visit /users to manage users" -ForegroundColor White
Write-Host "   - Visit /posts to create and view posts" -ForegroundColor White  
Write-Host "   - Visit /database to monitor system status" -ForegroundColor White
Write-Host "   - Use Ctrl+C in terminal windows to stop servers" -ForegroundColor White
Write-Host ""

# Optional: Open browser automatically
$openBrowser = Read-Host "Open application in browser? (y/N)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost:5173"
    Write-Host "🌐 Opening application in default browser..." -ForegroundColor Green
}