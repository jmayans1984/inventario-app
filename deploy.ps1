param(
    [string]$mensaje = "deploy"
)

Write-Host "Construyendo..." -ForegroundColor Cyan
Set-Location inventario-vue
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build fallido" -ForegroundColor Red; exit 1 }
Set-Location ..

Write-Host "Commiteando y pusheando..." -ForegroundColor Cyan
git add inventario-vue/ completa/
git diff --staged --quiet
if ($LASTEXITCODE -ne 0) {
    git commit -m $mensaje
    git pull origin main --rebase
    git push origin main
    Write-Host "Listo. GitHub Pages actualiza en ~20 segundos." -ForegroundColor Green
} else {
    Write-Host "Sin cambios para commitear." -ForegroundColor Yellow
}
