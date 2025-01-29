@echo off
echo Building app...
npm run build

echo Deploying to server...
scp -r build root@85.215.156.84:~/

echo Deployment complete!