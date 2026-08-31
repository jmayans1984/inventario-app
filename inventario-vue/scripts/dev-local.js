// Arranca Vite apuntando el proxy /api al backend LOCAL (puerto 3000) en vez
// de producción. Se hace desde un script de Node, no con la sintaxis
// "VAR=valor comando" del shell, porque esa forma no funciona en Windows.
import { spawn } from 'node:child_process'

const child = spawn('npx', ['vite', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, VITE_API_TARGET: 'http://localhost:3000' },
})
child.on('exit', (code) => process.exit(code ?? 0))
