@echo off
echo Starting backend server...
cd /d "%~dp0backend"
node server.js
pause