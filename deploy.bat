@echo off
echo Starting deployment process...

echo Preparing icons...
call npm run prepare-icons
if %ERRORLEVEL% NEQ 0 (
    echo Icon preparation failed!
    exit /b %ERRORLEVEL%
)

echo Building the React application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo Build successful! Copying files to server...
scp -r build root@85.215.156.84:~/moving-assistant/
if %ERRORLEVEL% NEQ 0 (
    echo File transfer failed!
    exit /b %ERRORLEVEL%
)

echo Copying server files...
scp -r server/server.js root@85.215.156.84:~/moving-assistant/server/
if %ERRORLEVEL% NEQ 0 (
    echo Server file transfer failed!
    exit /b %ERRORLEVEL%
)

echo Restarting server...
ssh root@85.215.156.84 "pm2 restart moving-assistant"
if %ERRORLEVEL% NEQ 0 (
    echo Server restart failed!
    exit /b %ERRORLEVEL%
)

echo Deployment completed successfully!
pause