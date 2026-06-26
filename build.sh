#!/bin/bash
set -e
cd inventario-vue
npm ci
npm run build
cd ..
mkdir -p public
cp index.html public/
cp -r assets public/
cp -r light public/
cp -r completa public/
echo "Build complete"
