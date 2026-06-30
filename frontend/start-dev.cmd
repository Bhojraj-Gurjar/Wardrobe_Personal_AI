@echo off
cd /d "%~dp0"
echo Starting Wardrobe AI frontend on http://localhost:3001
echo Backend should be running at http://localhost:3000
npm.cmd run dev -- -p 3001
