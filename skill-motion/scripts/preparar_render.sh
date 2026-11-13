#!/bin/bash
# Uso: source preparar_render.sh (sin tubería: con «| tail» corre en otra shell y R no queda)  ->  deja R con la carpeta del renderizador lista (playwright + render.mjs).
# Va en una carpeta fija (para que no se borre al cerrar la app) y se rearma sola si falta algo.
# Después:
#   node $R/render.mjs pelicula.html fotos.png --stills 0.9,2.6,4.2      (hoja de cuadros para revisar)
#   node $R/render.mjs pelicula.html pelicula.mp4 30 1 6                (borrador: 30 fps, sin desenfoque, 6 procesos; ~1 min por minuto)
R=${MOTION_RENDER:-$HOME/.cache/skill-motion-render}
mkdir -p "$R"
cp "$(dirname "${BASH_SOURCE[0]:-$0}")/render.mjs" "$R/render.mjs"
if [ ! -d "$R/node_modules/playwright" ]; then
  (cd "$R" && echo '{"type":"module"}' > package.json && npm i playwright@1.64 --silent && npx playwright install chromium-headless-shell)
fi
export R
echo "renderizador listo en $R"
