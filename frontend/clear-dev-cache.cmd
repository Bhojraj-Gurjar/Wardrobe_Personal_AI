@echo off
cd /d "%~dp0"
echo Clearing Next.js dev cache...
if exist ".next" rmdir /s /q ".next"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
echo Starting Wardrobe AI frontend on http://localhost:3001
npm.cmd run dev:3001
