@echo off
echo Iniciando Dashboard Argentina 2026...
cd /d "C:\Users\matic\OneDrive\Escritorio\ARGENTINA 2026"
start "" "http://localhost:8080"
python -m http.server 8080
pause
