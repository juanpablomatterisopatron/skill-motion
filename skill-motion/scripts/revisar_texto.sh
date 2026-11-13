#!/bin/bash
# Uso: revisar_texto.sh pelicula.mp4 "palabra1|palabra2" [cuadros_por_segundo]
# Lee con OCR lo que se VE en el MP4 final y avisa si aparece una palabra prohibida. Mirar hojas de cuadros no alcanza:
# un comercial puede seguir diciendo una palabra vieja porque el texto quedó guardado en otro archivo.
# Sirve también para buscar textos viejos de la interfaz. El OCR puede fallar con letra chica: un cero no prueba todo.
# Sin texto leído en ningún cuadro, sale con error: un OCR roto no es un video limpio (por ejemplo con TESSDATA_PREFIX mal puesto).
set -e
[ -d /opt/homebrew/share/tessdata ] && export TESSDATA_PREFIX=/opt/homebrew/share/tessdata
V="$1"; P="$2"; F="${3:-1}"; D=$(mktemp -d); LEIDOS=0
ffmpeg -v error -i "$V" -vf "fps=$F,scale=1920:-2" -q:v 2 "$D/c%05d.jpg"
L=spa; tesseract --list-langs 2>/dev/null | grep -qx spa || L=eng
for I in "$D"/c*.jpg; do
  T=$(tesseract "$I" - -l "$L" --psm 11 2>/dev/null | tr '\n' ' ')
  [ -n "${T// /}" ] && LEIDOS=$((LEIDOS + 1))
  if printf '%s' "$T" | grep -qiE "$P"; then
    N=$(basename "$I" .jpg); N=$((10#${N#c})); echo "t=$(( (N - 1) / F )) s"
  fi
done
echo "revisados $(ls "$D" | wc -l | tr -d ' ') cuadros de $V, con texto en $LEIDOS"; rm -rf "$D"
[ "$LEIDOS" -gt 0 ] || { echo "ERROR: el OCR no leyó nada" >&2; exit 2; }
