@echo off
echo Starting deployment process...

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

echo Deployment completed successfully!
pause