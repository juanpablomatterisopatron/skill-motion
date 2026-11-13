---
name: skill-motion
description: Hacer películas y videos con código, de 15 segundos a 4 minutos, y renderizarlos a MP4. Dos modos. Historias (personajes, cómic o estilo suave, narración, música y efectos) para emocionar, saludar o invitar. Comercial (producto real o web filmada, ritmo, promesa) para demos, anuncios, Reels y videos que venden. Usa ElevenLabs para voz y música, Deepgram para oír el resultado y hojas de cuadros para verlo. Úsala cuando pidan una película, un corto, un video animado, un tráiler, un explainer, un comercial, una demo de producto, un video para Reels (vertical) o cuadrado, o «un video como el de...», aunque no nombren la skill.
---

# skill-motion: películas animadas con código

Una película de este tipo es un archivo JavaScript que dibuja cualquier segundo en un `<canvas>` (`seek(t)`), una
banda sonora (`banda.mp3`: voces + música + efectos) y un MP4 renderizado de los dos. Sale en unas dos horas de
trabajo, cuesta unos centavos de ElevenLabs, se puede corregir cuadro por cuadro y corre en vivo dentro de una
presentación sin internet.

**Dos modos.** Historias (personajes, cómic o suave, para emocionar) y comercial (producto real, ritmo, promesa, para que
quieran comprar). Antes de nada decide cuál: si dicen «marketero», «comercial», «pro», «demo» o «para mostrarle al
cliente», lee `references/promo.md` y usa `assets/motor-promo.js`.

| Pedido | Motor | Lee |
|---|---|---|
| Cumpleaños, familia, invitación, historia con personajes | `motor-base.js` (cómic) o `motor-suave.js` | `guion.md`, `chispa.md` |
| Comercial, demo de web o app, video para un comprador, Reels | `motor-promo.js` + `filmar_web.py` | `promo.md` |
| Marca o lanzamiento con look técnico, cámara de documental | `motor-tech.js` | `motor-visual.md` sección 9 |
| Mapas que se inclinan, cámara que vuela sin web real | `motor-3d.js` | `chispa.md` |
| Explicar cifras o mecanismos: cotas, etiquetas, lecturas, plano técnico | `motor-acotaciones.js` (junto a cualquier motor) | `motor-visual.md` sección 12 |
| Toma de cámara que orbita o recorre una escena 3D | `Orbita3D` al final de `motor-3d.js` | `motor-visual.md` sección 13 |

Lo que la hace funcionar no es la técnica sino tres hábitos: **todo lo que dice es verdad**, **se escucha con
Deepgram en vez de suponer** y **se mira con hojas de cuadros antes de renderizar**. Claude no ve el video ni lo oye
mientras corre; esos dos controles son sus ojos y sus oídos.

## Qué necesita

Node 18 o más, Python 3, ffmpeg y Chrome. Para voz y música, una cuenta de ElevenLabs (`ELEVENLABS_API_KEY`). Para «oír»
el resultado, una cuenta de Deepgram (`DEEPGRAM_API_KEY`, opcional). Ver `INSTALAR.md`.

## Dónde está cada cosa

| Necesito | Archivo |
|---|---|
| **La chispa: lista de control para que salga «wow» y no solo «bien» (leer antes del guion)** | `references/chispa.md` |
| Concepto, estilos probados, frases, reparto de voces, hoja de tiempos | `references/guion.md` |
| Voces, música, efectos, mezcla, oír con Deepgram | `references/sonido.md` |
| El motor de dibujo, personajes y poses, estilo cómic, reglas de composición | `references/motor-visual.md` |
| Render, versión liviana, presentación, publicar, git | `references/entrega.md` |
| Punto de partida del .js: estilo cómic o estilo suave | `assets/motor-base.js` (cómic), `assets/motor-suave.js` (suave, con personajes que envejecen) |
| Página para verla y hoja de cuadros | `assets/pelicula.html`, `assets/hoja.html` |
| Película dentro de una presentación (lámina + controlador) y constructor | `assets/pelicula-en-presentacion.html`, `assets/construir.py` |
| Scripts | `scripts/` (llaves, voces, música, narración, efectos, mezcla, Deepgram, render, liviano) |
| Efectos de sonido CC0 incluidos | `sfx/` (créditos en `sfx/LICENSES.md`) |
| 3D falso en canvas (mapas que se inclinan, cámara que vuela, piso de neón) | `assets/motor-3d.js` |
| Estilo «tech y pro» para marcas y lanzamientos: cámara de documental (HUD), marco de enfoque, alertas, escaneo, tarjetas de interfaz, tablero, piso de grilla | `assets/motor-tech.js` y `references/motor-visual.md` sección 9 |
| **Comercial pro, demo de producto, formatos 16:9, 9:16 y 1:1** | `references/promo.md`, `assets/motor-promo.js` |
| Filmar una web real cuadro a cuadro con GPU | `assets/filmar_web.py` |
| Brief del cliente y storyboard fijo con rangos de cuadros (antes de dibujar un comercial) | `assets/brief-cliente.md`, `assets/storyboard-plantilla.md`, `references/promo.md` |
| Cursor en arco con clic, tecleo, entradas con rebote, desfase, deriva y empuje de cámara. Todo viaje del puntero en un comercial va en arco con pausa antes del clic (`cursorPro`); el movimiento recto está prohibido | `motor-promo.js` (`cursorPro`, `cursor`, `tecleo`, `entra`, `escalonar`, `deriva`, `empuje`), `references/motor-visual.md` sección 11 |
| Zonas seguras, interfaz en vector, lista «Revisar antes de renderizar» y banco de pulidos | `references/promo.md` |
| Cifras del guion en un bloque `DATOS` para revisiones de una línea; render sin audio | `references/entrega.md` sección 11 |
| Acotaciones del guion (`[VISUAL]`, pausas), cada número en pantalla con su palabra | `references/guion.md` sección 8 |
| Vocabulario de tomas con proporciones y el congelado del tiempo | `references/chispa.md` |
| Medir BPM y reordenar la música por compases | `scripts/pulso.py`, `scripts/cortar_musica.py`, `references/sonido.md` sección 13 |
| Tramo de prueba, armado por partes y audio nuevo sin volver a renderizar | `references/entrega.md` sección 8 |
| Corregir una película ya entregada porque cambió el producto | `references/entrega.md` sección 10 |
| Saludo con la voz de la persona e invitación con flyer | `references/sonido.md` sección 9, `references/entrega.md` sección 7 |

## El proceso

Sigue los pasos en orden; cada uno tiene su control antes de pasar al siguiente.

**0. ¿Conviene un video ahora?** Si la película va a decir cifras de un negocio (utilidad, precio, clientes, plazos), antes
de escribir el guion tiene que existir **una fuente declarada oficial** de esas cifras. Si hay dos modelos que dan números
distintos, o el número se está discutiendo, no se hace el video: se le dice a la persona y se propone mostrar la planilla
abierta y conversar. Un video cuesta dos horas y deja fijo un número en la cabeza de quien lo ve. Detalle en
`references/guion.md` sección 9.

**1. Concepto (con la persona).** Decide el modo (arriba). Primero `references/chispa.md`: formato con reglas que se
rompen, un giro, las personas por su nombre, un personaje que vuelve y un momento «wow». Para quién, qué tiene que sentir,
cuánto dura, dónde se va a mostrar. Propón tres conceptos, cada uno en dos o tres frases y con una vista previa en texto, y
el tono (los estilos probados están en `references/guion.md`). Si la persona dio una idea, síguela al pie de la letra: cada
elemento de su pedido es una escena.

**2. Verificar lo que se va a afirmar.** Cada cosa que la película dice del producto se busca en su código. Lo que no
está, no se dice; lo que está pero apagado, se dice y se le avisa a la persona. Vale igual para un negocio o un proyecto
que todavía no existe: cada cifra se anota en `GUION.md` con su fuente y como **hecho, supuesto o propuesta**, y las
palabras que comprometen («garantía», «ya existe», «en segundos», «cumple la ley», un precio) solo van si están
decididas y escritas en alguna parte (`references/guion.md` sección 9).

**3. Guion.** `GUION.md` en la carpeta de la película: pedido textual de la persona, voces, música, una tabla con
segundo, quién habla, la frase y qué se ve. Frases cortas, una por pista, español neutro, sin guion largo.

**4. Voces.** `source scripts/llaves.sh` y `scripts/voces.py frases.json`. Escúchalas con Deepgram; rehaz las que
salieron mal con `--solo`. Si la narración es una nota de voz de la persona, no hay frases: `references/sonido.md`
secciones 9 y 10.

**5. Tiempos.** `scripts/armar_narracion.py <inicios> --total <s>`: deja aire entre frases y huecos donde la imagen
cuenta sola. Con Deepgram saca `palabras.json` (segundo de cada palabra) para sincronizar.

**6. Música.** Plan por secciones que siguen las escenas (`scripts/musica.py`); mide pulso y volumen con
`scripts/pulso.py`. Si las secciones cayeron en otro lado, reordénala con `scripts/cortar_musica.py`.

**7. Mezcla.** Efectos de la biblioteca CC0 incluida (`sfx/`) y sintetizados (`scripts/efectos_sinteticos.py`),
`scripts/mezclar.py efectos.json` a -16 LUFS. **Control:** `oir_con_deepgram.py --comparar` entre la narración sola y
la banda: no se pierde ninguna palabra. Si se pierde, baja el efecto que suena en ese segundo o abre un hueco en la
música.

**8. Dibujo.** En comercial, primero brief y storyboard fijo (`assets/brief-cliente.md`), y filma el producto
(`references/promo.md`). Copia el motor del estilo (`assets/motor-base.js` cómic, `assets/motor-suave.js` suave o
`assets/motor-promo.js` comercial) como `mi-pelicula/pelicula.js`, cambia el nombre global, escribe una función por
escena siguiendo la hoja de tiempos. Página `pelicula.html` y `hoja.html` desde `assets/` (cambia el nombre del .js y
del global; agrega fuentes si usas otras). Personajes genéricos, nunca la persona real.

**9. Hojas de cuadros.** `source scripts/preparar_render.sh` y `node $R/render.mjs pelicula.html fotos.png --stills ...`
con 9 instantes por hoja, toda la película. Míralas, corrige lo que esté tapado, cortado, chico, montado o ilegible
(lista de errores típicos en `references/motor-visual.md`) y vuelve a mirar. En comercial, `SEGURAS=1` dibuja las zonas
seguras y `promo.md` trae la lista «Revisar antes de renderizar».

**10. Render.** `node $R/render.mjs pelicula.html <ruta>.mp4 30 1 6` en segundo plano; copia el MP4 a la carpeta de
la película; `scripts/liviano.sh` para mandarlo por mensajería. Mira un cuadro del liviano. Si el cambio de estilo es
grande, rehaz primero un tramo y renderiza solo ese tramo para que la persona lo vea en movimiento
(`references/entrega.md` sección 8). Si solo cambió el audio, no renderices: une la banda nueva al video mudo.

**10.b Leer el video.** `scripts/revisar_texto.sh <ruta>.mp4 "palabra1|palabra2"`: OCR a 1 cuadro por segundo sobre el
MP4 final, con cada palabra retirada del producto (requiere `tesseract`). El texto de un bot queda guardado en archivos de
la película: si cambió el vocabulario del producto, se vuelve a pedir y a filmar (`references/entrega.md` sección 10).

**11. Entregar.** MP4 con resumen escena por escena, qué se comprobó y qué decide la persona. Un flyer sale de la misma
película (`references/entrega.md` secciones 6 y 7). Si va a una presentación: lámina `data-peli`, controlador, fuentes,
`construir.py` y prueba en el navegador.

**12. Guardar.** GUION, .js, páginas, audio mp3 y json a git (wav y mp4 fuera); sección en el LEEME de la carpeta.

## Reglas que no se negocian

- **Verdad:** nada inventado sobre el producto ni sobre personas reales. Lo delicado (caídas, salud) va sobrio y con
  letra chica honesta.
- **Llaves:** se leen de variables de entorno con `llaves.sh` y nunca se imprimen ni se escriben en archivos.
- **No copiar obras:** se puede pedir el tono de una película famosa («como Up», «tráiler de superhéroes»), nunca sus
  personajes, escenas, música o nombres.
- **Pura de tiempo:** `seek(t)` sin estado, sin `Math.random()` (usa `rng`), sin setTimeout. Si un cuadro depende del
  anterior, el render sale distinto de lo que se ve en vivo.
- **Un video fija un número:** sin fuente oficial de las cifras no hay video. Cada película lleva su estado (borrador,
  aprobada, quién la vio y qué versión) en el `LEEME` de la carpeta, y si se rehace después de que un tercero la vio, se
  le avisa a la persona qué cifra cambió (`references/entrega.md` sección 12).
- **Medir, no suponer:** «suena bien» y «se ve bien» solo después de Deepgram y de las hojas de cuadros.

## Tiempos de referencia (película de un minuto)

Guion y voces 20 min; tiempos, música y mezcla 20 min; dibujo 40 a 60 min; hojas de cuadros y correcciones 20 min;
render y liviano 5 min; presentación y publicación 15 min. Las correcciones visuales son normales: cada película
tiene entre 5 y 10. Un comercial de 97 s filmado de la web: 48 s de render, 3 min con desenfoque de movimiento. Si un
arreglo llega después del render, vuelve a renderizar.

## Si la app se cierra a mitad de camino

Lo que importa ya está en la carpeta de la película (audio, .js, GUION) y el renderizador se rearma solo con
`preparar_render.sh` en `~/.cache/skill-motion-render`. Anota en qué paso ibas antes de cada tarea larga.
