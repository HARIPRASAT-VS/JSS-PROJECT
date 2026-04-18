@echo off
echo Starting JSS Project...

REM Check and install server dependencies if needed
if not exist "server\node_modules\" (
    echo Installing Server dependencies...
    cd server && npm install && cd ..
) else (
    echo Server dependencies already installed.
)

REM Check and install client dependencies if needed
if not exist "client\node_modules\" (
    echo Installing Client dependencies...
    cd client && npm install --legacy-peer-deps && cd ..
) else (
    echo Client dependencies already installed.
)

echo.
echo Cleaning up existing connections...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

echo Starting Server...
start "Server" cmd /k "cd server && node server.js"

echo Starting Client and Opening Browser...
start "Client" cmd /k "cd client && npm run dev -- --open"

echo Done! The server and client are starting in separate windows.
