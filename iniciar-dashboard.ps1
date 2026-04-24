$port = 8766
$dir  = $PSScriptRoot

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  SAV DASHBOARD - Seleccion Argentina     " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any previous server on this port
$prev = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($prev) {
    $prev | ForEach-Object { Stop-Process -Id (Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue).Id -Force -ErrorAction SilentlyContinue }
}

Write-Host "  Iniciando servidor en http://localhost:$port ..." -ForegroundColor Yellow
Write-Host "  Carpeta: $dir" -ForegroundColor Gray
Write-Host ""
Write-Host "  Abriendo browser..." -ForegroundColor Green
Write-Host "  (Cerrá esta ventana para detener el servidor)" -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:$port/index.html"

Set-Location $dir
python -m http.server $port
