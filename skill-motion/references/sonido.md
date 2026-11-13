# Sonido: voces, música, efectos y cómo «oír» sin oídos

## Contenido
1. Llaves
2. Voces con ElevenLabs
3. Colocar la narración
4. Música con ElevenLabs Music
5. Efectos: biblioteca CC0 y sintetizados
6. La mezcla
7. Oír con Deepgram (y sincronizar con las palabras)
8. Trampas
9. Con la voz real de la persona
10. Cambiar una parte de la nota de voz y estirar la música
11. Voces locales, frases que se insertan y mezclas largas
12. Sonidos de cámara
13. Música por compases y mezcla de comercial

## 1. Llaves

Se leen de variables de entorno: `ELEVENLABS_API_KEY` (voces y música), `DEEPGRAM_API_KEY` (oír, opcional) y
`OPENROUTER_API_KEY` (solo si usas modelos por OpenRouter). `source scripts/llaves.sh` deja `ELEVEN` y `OPENROUTER` en el
entorno. Nunca se imprimen ni se pegan en un comando; para comprobar, `echo ${#ELEVEN}` (solo el largo). La cuenta de
ElevenLabs es de pago por uso; una película de un minuto con 17 frases gasta unos 900 caracteres de voz más la música.

## 2. Voces con ElevenLabs

```bash
cd mi-pelicula/audio && source ~/.claude/skills/skill-motion/scripts/llaves.sh
python3 ~/.claude/skills/skill-motion/scripts/voces.py frases.json          # todas
python3 ~/.claude/skills/skill-motion/scripts/voces.py frases.json --solo 5 # rehacer una
```
`frases.json`: `[["<voice_id>", "En un mundo de letras diminutas..."], ...]` o con objetos si una frase necesita su
propia estabilidad o estilo. Modelo `eleven_multilingual_v2`, salida mp3 44,1 kHz.

Después de generar: medir cada duración (`ffprobe`) y escuchar con Deepgram la narración sola. Si una frase sale con una
entonación rara o se come una palabra, se rehace solo esa (la segunda tirada casi siempre sale distinta).

## 3. Colocar la narración

`scripts/armar_narracion.py 0.8 6.8 11.5 ... --total 61.5` pone cada frase en su segundo, deja `narracion.wav` y
`tiempos.json` y se detiene si dos frases se montan. Aire entre frases: 0,2 a 0,5 s; más donde hay un chiste visual.

## 4. Música con ElevenLabs Music

`scripts/musica.py musica-plan.json` (ver el encabezado del script para la forma del plan). Las secciones siguen las
escenas y suman el largo total.

Medir el volumen por tramos antes de mezclar (la música de ElevenLabs suele partir muy baja y terminar antes):
```bash
for s in $(seq 0 3 60); do printf "%s:%s " $s $(ffmpeg -hide_banner -nostats -ss $s -t 3 -i musica.mp3 -af volumedetect -f null - 2>&1 | grep mean_volume | awk '{print $5}'); done; echo
```
(Con `-v error` ffmpeg esconde el resultado de volumedetect: va `-hide_banner -nostats`.)
La música tampoco obedece siempre los silencios: si pides «almost silent» puede venir al mismo volumen. El silencio se
abre en la mezcla (`huecos`). Si termina antes que la película, estírala en la mezcla con `"musica_tempo": 0.93` a `0.95`
(atempo, no cambia el tono). Pedirla otra vez sale igual de corta.

## 5. Efectos

**Biblioteca CC0 incluida** en `sfx/<categoría>/` (créditos y licencias en `sfx/LICENSES.md`, sin atribución
obligatoria). Los que más sirvieron:
- golpes: `impact/fs-347561-micheal-bay-hit.ogg` (tráiler), `impact/fs-177242-cinematic-impact.ogg`,
  `impact/fs-222517-dramatic-hit.ogg` (tarjeta final), `impact/kenney-impact-impactpunch-heavy-000.ogg` (rótulo de cómic)
- zumbidos: `whoosh/fs-683101-quick-woosh.ogg`, `whoosh/fs-169867-swoosh.ogg`, `kit/whoosh.ogg`
- pops y burbujas: `pop/fs-824189-pop-in-sfx.ogg`, `pop/kenney-interface-pluck-001.ogg`, `pop/fs-447910-plop.ogg`
- subidas: `riser/fs-685256-riser-sound-effect-short-wav.ogg`, `riser/kenney-digital-powerup2.ogg`
- brillo y avisos: `ding/fs-349504-triangle-open-04.ogg`, `ding/kenney-interface-glass-001.ogg`, `ui-blip/kenney-digital-threetone1.ogg`
- teclas: `kit/tick.ogg` (la dirección que se escribe al final, uno cada 0,1 a 0,12 s)
- página que pasa: `transition/kenney-interface-scroll-001.ogg`; cinta VHS: `glitch/fs-339521-vhs-rewind-forward-and-eject.ogg`

**Sintetizados** (`scripts/efectos_sinteticos.py`): timbre de teléfono antiguo, campana, escudo de metal, «shhh», disco
de teléfono, módem. Para inventar otro: suma de senos que se apagan (metal, campana), pulsos repetidos (mecanismos),
ruido filtrado con envolvente (soplidos, viento).

## 6. La mezcla

`scripts/mezclar.py efectos.json` (forma del archivo en su encabezado). Lo que hace:
- música a -8 dB bajo la voz con **sidechain** (se agacha sola cuando alguien habla);
- **huecos**: tramos donde la música baja más o se corta (el silencio del chiste);
- efectos en su segundo y su volumen; total a **-16 LUFS** con fundido final de 0,9 s.

Volúmenes que funcionaron: golpes entre frases -8 a -13 dB; zumbidos -14 a -17; pops de adorno -18 a -22; nada más
fuerte que -18 dB encima de una palabra. Pon los golpes justo antes o justo después de la palabra, no encima.

## 7. Oír con Deepgram

Claude no oye, así que no se dice nunca «suena bien»: se mide.
```bash
python3 oir_con_deepgram.py narracion.wav > palabras.json    # requiere DEEPGRAM_API_KEY en el entorno
python3 oir_con_deepgram.py banda.mp3 > banda.json
python3 oir_con_deepgram.py --comparar palabras.json banda.json
```
Meta: las mismas palabras en las dos (las marcas pueden variar solo en la ortografía). Si faltan palabras en la banda, un
efecto o la música las tapa: bájalos. Un efecto tapa una o dos palabras, no una frase.

**Deepgram también se equivoca.** Con un archivo de un minuto a veces se salta o repite un bloque entero de 10 a 25
palabras, y cada vez distinto. Si falta un bloque largo, transcribe ese tramo solo y, si ahí se entiende todo, la mezcla
está bien. `palabras.json` además trae el segundo de cada palabra: úsalo para calzar golpes, globos y textos con lo que
se dice.

## 8. Trampas

- `timeout` no existe en macOS: no envuelvas comandos con él.
- En zsh, `echo =====` falla («= not found»): usa `echo '-----'`.
- Un efecto de la biblioteca más largo de lo que parece (los golpes de cine tienen cola de 2 a 4 s) puede tapar la frase
  que viene: mira su duración con ffprobe antes de ponerlo pegado a una voz.

## 9. Con la voz real de la persona

Cuando la narración es una nota de voz de la persona (varios minutos):
- No hay frases sueltas ni `armar_narracion.py`: la nota va entera desde un segundo fijo (después del título) con
  `adelay` y `apad` hasta el largo total, más un paso alto y una compresión suave. Una función `V(n) = n + 4` pasa un
  segundo de la nota al de la película.
- Deepgram de la nota sola da el segundo de cada palabra: las escenas se cortan en esos segundos y la boca del narrador
  sigue los tramos de habla (palabras a menos de 0,18 s se juntan en un tramo).
- Con voz casi continua no hay pausas para los golpes: un script propio pone cada efecto en su segundo y lo baja solo a
  -18 dB (o -20 si dura más de 0,6 s) cuando cae sobre una palabra.
- Si Deepgram cambia una palabra, transcribe el mismo tramo de la voz sola: si sale igual, es la nota y no la mezcla.
- Efectos de dibujo animado que no están en la biblioteca se sintetizan con numpy: resorte, cornetín de fiesta, fuegos
  artificiales, pito de émbolo.
- Para mandarla por mensajería, 4 minutos a 380 kb/s de video quedan en unos 15 MB.

## 10. Cambiar una parte de la nota de voz y estirar la música

La persona puede querer regrabar un tramo. No se rehace todo:
- Un script corta la nota original en dos puntos (en silencios, mirando los segundos de Deepgram), mete la nota nueva con
  fundidos de 15 ms y 0,15 a 0,25 s de aire, iguala el volumen (medir con `ebur128`) y escribe un `palabras.json` corrido.
- En el .js: `V(n)` por tramos y las escenas se escriben con esa función, así un cambio de largo solo mueve la tabla
  `ESCENAS` (en segundos de la película) y los efectos.
- **Música más larga sin pedirla de nuevo:** repetir un tramo de la misma sección con `atrim` + `acrossfade=d=0.25`. El
  largo del bucle tiene que ser múltiplo del pulso: se mide con la autocorrelación de la envolvente de energía.
- **Deepgram no conoce los modismos locales:** una palabra de tu país puede salir cambiada. Antes de rehacer la frase,
  pásala por whisper con `initial_prompt`; si whisper la oye bien, la voz está bien. Si un efecto justo encima la cambia,
  córrelo a después de la palabra.
- **Voces de personaje:** en la biblioteca pública hay voces de la categoría «characters_animation» (por ejemplo una
  señora mayor caricaturesca): `voces.py --buscar female old` y `--agregar`.

## 11. Voces locales, frases que se insertan y mezclas largas

- **Voces con acento local de la biblioteca** (buscar con `accent=...` o `locale=...` en `/v1/shared-voices`, que
  `voces.py --buscar` no filtra). Agregar una voz de la biblioteca: `POST /v1/voices/add/<public_owner_id>/<voice_id>` con
  `new_name` (el `public_owner_id` viene en la búsqueda). **Haz muestras** y que la persona elija.
- Un apodo que la voz lee mal se escribe como se dice en la frase y en pantalla va como lo escribe la persona.
- **Insertar una frase nueva a mitad de película:** correr los archivos `frase41..47` a `42..48`, generar la nueva con
  `--solo`, rearmar la narración con los inicios nuevos, y estirar la música con un bucle en el pulso del mismo largo.
- **Frases dichas bajito** quedan tapadas por la música aunque no haya efecto encima: abre un `hueco` de -6 a -9 dB en
  ese tramo.
- Deepgram devuelve **vacío** en algunos tramos cortos de la mezcla aunque la voz esté: confirma con whisper sobre el
  mismo tramo antes de tocar nada.

## 12. Sonidos de cámara

Cuando la película tiene la cámara del documental (`hud` de `assets/motor-tech.js`), cada gesto de la cámara suena:

| Momento | Archivo (biblioteca `sfx/`) | dB en la mezcla |
|---|---|---|
| Empieza a grabar: doble pitido (0,05 y 0,17 s) | `ding/fs-634690-lil-pip.ogg` | -14 |
| Escaneo que baja (dura 2 s) | `typing/fs-511418-data-reveal-sound.ogg` | -18 |
| «Escaneo completo» | `ding/kenney-interface-confirmation-001.ogg` | -24 |
| El marco de enfoque se fija | `ui-blip/kenney-digital-twotone1.ogg` o `twotone2` | -22 bajo una palabra |
| Alerta, entre frases | `ui-blip/kenney-digital-threetone1.ogg` | -18 |

Mide el volumen propio antes de elegir los dB (`ffmpeg -i x.ogg -af volumedetect -f null -`): los de Kenney vienen 10 dB
más fuertes que los de Freesound, y el mismo número en la mezcla suena muy distinto. Lo que sí se mide es que la voz no
pierda palabras (Deepgram en la banda y en el MP4). Si el pitido se distingue, lo dice el oído de la persona.

## 13. Música por compases y mezcla de comercial

- Pide el BPM y la tonalidad en `positive_global_styles`: ElevenLabs dio 120,0 exactos. Lo que **no** respeta es dónde
  caen las secciones (pedí la explosión a los 8 s y cayó a los 16,5).
- No la pidas de nuevo: `scripts/pulso.py` entrega BPM, fase y cambios de energía, y `scripts/cortar_musica.py` la
  reordena en barras exactas. Se pueden repetir tramos para alargar. Mide dónde caen las barras (pueden caer en 0,5 + 2n).
- Haz las frases y la narración después de saber dónde están las explosiones: cada frase importante parte en un múltiplo
  de 0,5, y la que remata cae sobre la explosión.
- Música fuerte y locutor: con `musica_db -6`, Deepgram entendió una frase por otra. Con -9 y un hueco de -3 dB en el
  tramo más denso volvieron todas las palabras.
- Zumbidos 0,2 s **antes** del corte, pero nunca sobre la cola de la frase anterior: uno encima convirtió una palabra en
  otra. Si no hay hueco, bájalo a -25 dB o quítalo.
- Los golpes de cine duran 4 s, pero su cola no tapó frases a -9 dB si la primera frase parte 2 s después.
