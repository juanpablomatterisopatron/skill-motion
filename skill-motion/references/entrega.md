# Entrega: render, versión liviana, presentación y publicación

## Contenido
1. Render a MP4
2. Versión liviana
3. En una presentación HTML
4. Publicar y mandar
5. Guardar en git
6. Mandar por mensajería
7. Flyer
8. Tramo de prueba, armado por partes y audio nuevo sin volver a renderizar
9. Comercial con video filmado
10. Corregir una película ya entregada porque cambió el producto
11. Revisión de cliente en una línea: el bloque DATOS
12. El LEEME de estado: qué versión rige y quién la vio

## 1. Render a MP4

```bash
source ~/.claude/skills/skill-motion/scripts/preparar_render.sh       # sin tubería, si no R no queda
node $R/render.mjs mi-pelicula/pelicula.html $R/borrador.mp4 30 1 6    # 30 fps, sin desenfoque, 6 procesos
```
- Lanza el render en segundo plano y espera el aviso; no lo vigiles con `sleep`.
- Una película de un minuto a 30 fps tarda 1 a 2 minutos y pesa unos 100 MB. Con desenfoque de movimiento (`60 8 8`)
  puede tardar 20 a 60 minutos: dilo antes de lanzarlo; para una presentación el borrador basta.
- El renderizador abre la página con `?render`, espera las fuentes (avisa si una no cargó) y mete `buildAudio`: la
  página carga `audio/banda.mp3` (ver `assets/pelicula.html`).
- Deja el render en una carpeta fija y copia el resultado a la carpeta de la película.
- Comprueba: `ffprobe` (pista de video y de audio, la duración igual a DUR) y saca un cuadro con ffmpeg para mirarlo.

## 2. Versión liviana

`scripts/liviano.sh mi-pelicula/<nombre>.mp4` deja `<nombre>-liviano.mp4`: 1280 px de ancho (720 si es vertical), unos
4 MB por minuto. Los MP4 no van a git (agrega `*.mp4` y `audio/*.wav` al .gitignore).
Para un tope de peso exacto (por ejemplo 9 MB en un adjunto), calcula el bitrate: `kb/s = MB × 8000 / segundos - 112`
(audio aac a 96 kb/s) y usa dos pasadas de x264.

## 3. En una presentación HTML

- La plantilla tiene tokens que `assets/construir.py` reemplaza: `{{js:pelicula/pelicula.js}}` (el motor adentro),
  `{{mp3:pelicula/audio/banda.mp3}}` (la banda como data URI), `{{imagen.png}}` (de img/). Así funciona sin internet y
  como página publicada.
- El audio se decodifica con `atob` (no con fetch): una página publicada no deja pedir nada a la red.
- Varias películas en una presentación: cada lámina es `<section class="slide pelicula" data-peli="N">` y un solo
  controlador las maneja (`assets/pelicula-en-presentacion.html`): el reloj del audio manda el cuadro, ▶ y tecla P,
  pausa al cambiar de lámina, un cuadro de «portada» antes de empezar (elige uno lindo, no el negro del inicio).
- Fuentes: si la película usa Bangers, súmala al enlace de Google Fonts. Declara `<meta charset="utf-8">` primero (sin
  eso, en local salen acentos rotos).
- `construir.py` se niega a armar si queda un `{{` o hay guion largo o medio en el texto.
- Prueba en el navegador: cada película suena y avanza, al cambiar de lámina se pausa, y a ancho de celular no hay
  scroll horizontal.
- Captura de un panel real con datos personales: recorta antes de lo sensible (dirección, mapa, teléfonos, usuario).

## 4. Publicar y mandar

- Al terminar, dile a la persona: qué hace la película escena por escena, qué se comprobó (palabras que entiende
  Deepgram, cuadros revisados), qué no es exacto (si algo del producto está apagado) y qué decide ella (cuál usar).

## 5. Guardar en git

- Va a git: GUION.md, el .js, el .html, hoja.html, audio/*.mp3 (frases, música, banda), frases.json, tiempos.json,
  palabras.json, musica-plan.json, los scripts. No van: .wav ni .mp4.
- LEEME de la carpeta: una sección por película (qué es, cuánto dura, si está en la presentación y dónde).

## 6. Mandar por mensajería

- **Primero a la persona**, aunque el destino final sea un grupo. A un grupo o a un tercero solo con su OK al texto exacto.
- **Peso para que se vea en el chat (bajo 16 MB):** el bitrate de video según el largo, a 1280 px: 4 minutos con
  360 a 380 kb/s; 1 minuto con 900 kb/s. El audio a 96 o 128 kb/s.

## 7. Flyer

- La misma película dibuja el flyer: `W`, `H` y `DUR` con `let`, y `montar(canvas, { flyer: true })` los cambia a
  1080 x 1350 y llama a una función `eFlyer()`; la viñeta se rehace con el nuevo tamaño. Así comparte personajes y utilería.
- `flyer.html` con un canvas de 2160 x 2700 (el doble, para que quede nítido) y un script que lo guarda con
  `toDataURL('image/png')` usando el playwright del renderizador. Para mensajería, un JPG de 1620 px de alto (500 KB).
- Lo que va: título, fecha y lugar en una banda, cuatro íconos de lo que hay, la lista de qué traer y el chiste de cierre.

## 8. Tramo de prueba, armado por partes y audio nuevo sin volver a renderizar

- **Antes de rehacer toda una película, rehaz un tramo y muéstralo en movimiento.** La persona responde al video, no a las
  hojas de cuadros. Página aparte, igual a la de la película pero con `window.VIDEO = { ...peli.VIDEO, duration: 18.8 }`:
  el render corta ahí y la banda también. Liviano con fundido:
  `-vf "scale=720:-2,fade=t=out:st=18.2:d=0.6" -af "afade=t=out:st=18.0:d=0.8"`.
- **Armar por partes:** la película se escribe en `_partes/` (`cabeza.js` = el motor adaptado, `parte1.js` piezas,
  `parte2.js` y `parte3.js` escenas) y un script las pega en `pelicula.js`. Cada cambio se hace en la parte y se vuelve a
  armar; antes de un cambio grande, copia las partes a `_version2/`.
- **Si solo cambia el audio** (efectos nuevos, otra mezcla), no hace falta volver a renderizar: el render deja el video
  mudo `<nombre>_silent.mp4` y basta unirle la banda nueva con la misma normalización del renderizador:
  `ffmpeg -i <nombre>_silent.mp4 -i banda.mp3 -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:v copy -c:a aac -b:a 192k -shortest <nuevo>.mp4`.

## 9. Comercial con video filmado

- Con capturas ya hechas, 97 s a 30 fps tardaron 48 s (`30 1 6`) y 168 s con desenfoque de movimiento (`30 4 6`): en un
  comercial usa el desenfoque.
- `seek` asíncrona con `await carga(cuadro)` funciona igual en el render. Mantén un caché chico de cuadros (24) y uno
  aparte para las pantallas fijas.
- `liviano.sh` a 430 kb/s deja borroso el pasto en 3D. Con video filmado usa dos pasadas a 1150 kb/s: 97 s pesan 15,3 MB.
- Revisa los cortes con una hoja de instantes pegados (0,1 s antes y después de cada golpe), no solo el centro de cada
  escena: ahí salió un texto blanco sobre fondo blanco.

## 10. Corregir una película ya entregada porque cambió el producto

1. **Busca en todos los archivos de la película**, sin cortar las líneas: `grep` sobre GUION, subtítulos, respuestas y
   `audio/*.json`. Un `cut -c1-170` puede esconder la palabra al final de una línea.
2. **Texto del bot:** se vuelve a pedir al bot real, nunca se edita a mano si la película dice «respuesta real».
3. **Voz:** cambia en `frases.json` y rehaz con `voces.py frases.json --solo N`. Debe caber antes del inicio de la
   siguiente. Después `armar_narracion.py --inicios inicios.json`, `mezclar.py efectos.json` y Deepgram con `--comparar`.
4. **Imagen:** filma contra el sitio publicado y con GPU real. Refilma todo lo que muestra interfaz.
5. **Lo que dice el bot y lo que hace la escena deben calzar.**
6. **Render** y `scripts/revisar_texto.sh` sobre el MP4 final, antes de decir que quedó. Pruébalo también contra el video
   viejo: debe encontrar la palabra. Lee bien la interfaz, pero se le escapan subtítulos sobre imagen: esos se revisan en
   el archivo de subtítulos y en una hoja de cuadros.

## 11. Revisión de cliente en una línea: el bloque DATOS

Las cifras, textos y colores que puede pedir cambiar un cliente van juntos en un bloque `DATOS` al inicio del `.js` (con
los segundos de las palabras que las dicen). Las escenas leen de ahí y nunca llevan un número escrito a mano. «Cambia 200
por 999» queda en un cambio de una línea y un render de tramo (sección 8). Los datos que salen de la web real siguen
viniendo de un `datos.js`.

Sin audio: si la página no define `window.buildAudio`, `render.mjs` deja el MP4 sin pista de sonido con el nombre pedido.
Para revisar zonas seguras: `SEGURAS=1 node $R/render.mjs ... --stills ...`.

## 12. El LEEME de estado: qué versión rige y quién la vio

1. **Todos los videos de un proyecto en una carpeta** (`entregables/videos/`), una subcarpeta por película, con nombre
   propio y no por número de orden.
2. **Un `LEEME.md` en esa carpeta con una fila por película:** archivo que rige, versión, duración, estado (borrador,
   aprobada, enviada), **quién la vio, qué versión y qué día**, fuente de las cifras y fecha de esa fuente.
3. **Se actualiza al entregar, no después.** «La vio el socio» solo se anota si consta; si no, se escribe «no consta».
4. **Si se rehace una película que un tercero ya vio**, se le dice a la persona en el mismo mensaje de entrega: qué cifra
   o frase cambió y que el tercero tiene la anterior.
5. **Las versiones reemplazadas** se mueven a una subcarpeta `anteriores/` y se anotan.
