#!/bin/bash
# Uso: liviano.sh pelicula.mp4   ->  pelicula-liviano.mp4 (~4 MB por minuto, para mandar por mensajería)
# Horizontal sale a 1280 de ancho; vertical (9:16, Reels) a 720 de ancho: la misma cantidad de píxeles.
# El render sale de unos 100 MB por minuto. Dos pasadas de x264 a 430 kb/s dejan la imagen nítida en dibujo plano.
set -e
E="$1"; S="${E%.mp4}-liviano.mp4"; L=$(mktemp -d)/pasada
IFS=x read -r ANCHO ALTO < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$E")
if [ "$ALTO" -gt "$ANCHO" ]; then ESC=720:-2; else ESC=1280:-2; fi
ffmpeg -v error -y -i "$E" -vf scale=$ESC -c:v libx264 -preset slow -b:v 430k -pass 1 -passlogfile "$L" -an -f mp4 /dev/null
ffmpeg -v error -y -i "$E" -vf scale=$ESC -c:v libx264 -preset slow -b:v 430k -pass 2 -passlogfile "$L" -c:a aac -b:a 96k -movflags +faststart "$S"
ls -la "$S"
