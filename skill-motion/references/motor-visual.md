# El motor visual: dibujar la película con código

## Contenido
1. Cómo está hecho
2. Las piezas del motor base
3. Los personajes (heroe) y sus poses
4. El estilo cómic
5. Composición: reglas que salieron de corregir
6. Revisar con hojas de cuadros
7. Ideas de escenas para copiar
8. Estilos que cambian y 3D
9. El estilo «tech y pro» (marca y lanzamiento)
10. Motor comercial
11. Movimiento continuo: nada se detiene del todo
12. Acotaciones en pantalla y plano técnico (blueprint)
13. Órbita y recorrido 3D

## 1. Cómo está hecho

Un archivo `.js` con una función `seek(t)` que dibuja en un `<canvas>` de 1920x1080 el instante `t` desde cero. Por qué así:
- se puede saltar a cualquier segundo para revisar (hoja de cuadros) y renderizar cuadro por cuadro a MP4;
- la misma película corre en vivo dentro de una presentación, con su audio, sin internet;
- no hay estado: si algo depende del cuadro anterior, en el render sale distinto que en vivo.

Hay dos motores; parte del que calce con el estilo (cópialo como `peliculaN.js` y cambia el nombre global del final):
- `assets/motor-base.js`: **cómic** (contorno de tinta, tramas, onomatopeyas, globos con borde).
- `assets/motor-suave.js`: **suave** (sin tinta, volumen con degradés, como una película animada familiar). Trae `SAT`
  para apagar y devolver el color y a dos amigos (`amigo()`) que envejecen por épocas.
Página para verla: `assets/pelicula.html`; hoja de cuadros en el navegador: `assets/hoja.html?t=1,5.5,9`.

Estructura del archivo: comentario con la hoja de tiempos, constantes de tiempo (`T = {s2: 6.5, ...}`), ayudas,
dibujos reutilizables, una función por escena (`escena1(t)`...), `seek(t)` que elige la escena y agrega sacudidas,
fogonazos, grano y viñeta, y `montar(canvas)` que devuelve `{VIDEO: {w, h, duration}, seek}`.


## 2. Las piezas del motor base

Movimiento (todas puras, reciben `t`):
- `seg(t, a, b)` 0 a 1 entre a y b; `ease`, `easeOut`, `easeIn`; `lerp`.
- `pop(t, t0, w, z)` resorte que entra en t0 (con rebote): úsalo como escala `lerp(1.8, 1, clamp(k))`.
- `kf([[t, valor], ...])` cuadros clave; `track` para un valor que salta de meta en meta con resorte.
- `wob(t, frecuencia, fase)` vaivén seno; `vive(t, t0, t1)` aparece y se va con fundido corto.
- `hablar(t, a, b)` abre y cierra la boca mientras un personaje habla.
- `rng(semilla)` azar repetible (para estrellas, edificios, astillas): nunca `Math.random()`.

Dibujo: `circ`, `ell`, `rr` (rectángulo redondeado), `seg2`, `quad`, `fill`, `line`, `save/restore`,
`grad/rgrad`, `pinta(color, x0, y0, x1, y1)` (relleno con luz arriba, sombra abajo y trazo de tinta), `sombra`.

Letras: `texto`, `comic` (borde grueso y sombra de color, fuente Bangers), `golpe` (comic que entra golpeando en su
segundo), `caja` (narrador, amarilla), `globo(texto, x, y, colaX, colaY)` (diálogo con cola hacia la boca).

Adornos: `estallido` (¡POW!), `destello` (estrella de brillo), `flecha` (curva, amarilla), `rayos` (fondo de estallido
que gira), `trama` (puntos de imprenta que crecen hacia afuera), `panel` (viñeta con marco blanco y borde, dibuja
adentro en coordenadas propias), `conTinta(fn, {silueta})` (ver 4).

Producto: `burbuja` (un logo de ejemplo) y `telefono(x, y, s, giro, {pantalla})` con pantallas logo, luna, llamando,
bip, radio y familia. Para tu producto, reemplázalos por su logo y su aparato.

Lugares: `salon(noche)`, `sillonAtras/sillonAdelante`, `sofaAtras/sofaAdelante` (el mueble se dibuja en dos partes:
el respaldo antes del personaje y los brazos después, así el personaje queda «sentado adentro»).


## 3. Los personajes y sus poses

`heroe(x, y, s, opciones)`: el origen son los pies; escala 0.9 mide unos 750 px. Devuelve `{bi, bd}`: dónde quedaron
la mano izquierda y la derecha (de la pantalla), para ponerles un teléfono o un objeto.

Opciones: `quien` ('tata', 'tita', 'hija', 'hijo', 'nieta', 'nieto': abuelo, abuela, adultos y niños; el hijo trae pelo largo y barba, el nieto pelo
parado; para otro personaje, agrega una entrada a `PERS` y su peinado), `logo` (false apaga el emblema del pecho: puede aparecer recién cuando llega el producto), `bi`/`bd` brazos `[hombro, codo]` en radianes (0 = colgando; positivo =
hacia afuera y arriba), `cara` ('feliz' ojos cerrados de risa, 'normal', 'sorpresa', 'duda'), `boca` (0 a 1),
`cabeza` (inclinación), `capa` (0 la saca), `viento` (la capa vuela hacia un lado), `emblema` (brillo del logo del
pecho), `lentes` (los anteojos: 'cara', 'cabeza', 'no'), `sentado`, `salto`, `paso` (caminar o trotar), `t` (para que la capa ondee).

Poses que ya están calculadas:

| Pose | Brazo |
|---|---|
| manos en las caderas (héroe) | `[0.5, -1.4]` en los dos |
| puño arriba | `[2.8, 0.15]` |
| teléfono a la oreja o frente a la boca | `[1.2, -3.66]` (el teléfono en `mano - (18, 34)`, girado -0.25) |
| sostener el teléfono adelante, sentado | `[0.9, 1.5]` con `enMano(mano, escala)` |
| mano a la cabeza (buscando algo) | `[1.5, 1.9]` |
| manos juntas en el regazo | `[0.35, -1.1]` en los dos |
| pulgar arriba | `[1.0, 2.0]` + un dedo `rr(mano.x - 9, mano.y - 62, 22, 46)` |
| saludar o señalar el horizonte | `[2.0, 0.2]` |
| relajado | `[0.25, 0.6]` o `[0.35, 0.25]` |
| dedo arriba, opinando (al lado de la cabeza, sin taparle la cara) | `[2.4, 0.9]` + dedo |
| puño al aire, sentado («¡Mándalo!») | `[2.8, 0.15]` |
| la mano en el pelo | `[2.6, 1.6]` |
| la copa en alto, sentado | `[2.4, 0.6]` |
| tomarse una pastilla (mano a la boca) | `[1.6, 2.6]` |

Ojo con los brazos levantados: `[2.0, 2.3]` le cruza la cara. Prueba la pose en una foto antes de seguir.

Sentado: el cuerpo baja 200 y se ven los muslos de frente; la capa se acorta para no tapar el asiento. Detrás de una
mesa, sube el personaje (y menor) hasta que se le vea el pecho y el emblema sobre la mesa.

`amigo()` de `motor-suave.js` envejece por épocas con `epoca` 0 a 4: ropa, pelo, bigote, lentes. Es la misma idea de rig; úsalo si la historia recorre una vida.


## 4. El estilo cómic

- `conTinta(() => { heroe(...); heroe(...) })` dibuja en una capa aparte y la pega con un contorno de tinta grueso
  (cuatro `drop-shadow` sin desenfoque). Con `{silueta: 1}` sale negra entera: así «aparecen» los héroes y luego se
  colorean bajando la silueta a 0.
- Fondos: `rayos` + `trama` para rótulos y momentos heroicos; lugares con colores planos y trazo de tinta.
- Texto: Bangers para lo gritado (rótulos, onomatopeyas), Manrope 800 para cajas y globos (se lee mejor).
- Rótulo de cada poder: estallido de rayos en el color del poder, ícono en un círculo, «¡SÚPER» chico y la palabra
  grande; la palabra se achica sola si es larga (DISCRECIÓN). Golpe de cámara (sacudida) y fogonazo blanco al entrar.
- Onomatopeyas (¡RIIING!, ¡BIP!, DONG...) sobre un estallido amarillo, rojas, giradas.
- La caja amarilla del narrador va arriba a la izquierda y dice lo esencial de la frase (no todo).


## 5. Composición: reglas que salieron de corregir

Cada una fue un error visto en una hoja de cuadros:
- Un objeto en la mano no puede tapar la cara (teléfono, cámara): muévelo al costado o baja la mano.
- Los textos no se montan con globos, logos ni otros textos: mide con `ancho()` y separa. Los mensajes en tránsito se
  resuelven como en un chat: el nuevo entra abajo y empuja.
- Lo que tiene que leerse no puede quedar chico: agranda viñetas y pantallas de teléfono hasta que se lean (1,5 a 1,7 veces).
- Color de texto contra su fondo: crema sobre celeste no se ve.
- Nada importante cortado por el borde; con sacudidas, el fondo se pinta con margen.
- Un objeto tiene que parecer lo que es (una caja de regalo no puede parecer botiquín).
- Las poses tienen que tener sentido (escribir a máquina pide una mesa).
- Un mueble sobre el que se sienta alguien no lo puede tapar la capa.
- El cursor de una dirección escrita no parpadea antes de empezar a escribirse.
- Un globo de tres líneas necesita más margen que uno de una (la elipse corta las esquinas): el `globo` del motor ya lo
  hace; si dibujas otro, agranda ancho y alto un 22 % cuando hay más de una línea.
- Si un personaje se va de la escena, lo que lo une con otro (el hilo) también se va.
- Al achicar una escena a una ventana, encuádrala en los personajes.
- Lo que todavía no existe en la historia no se ve (el logo en el pecho antes de que llegue el producto).
- Una mesa con gente sentada: personajes grandes (0,8) y la torta o la botella al frente, no encima de alguien.

Patrones que sirven para otras películas:
- **Una vida en un minuto:** un personaje por época (`epoca` 0 a 4), un año grande arriba a la izquierda (`insignia`) y
  una anécdota por época con su chiste visual.
- **El color que se va y vuelve:** `SAT` baja a 0,15 cuando los personajes se separan y sube desde el producto cuando
  llega la solución, con un halo de luz que crece desde él.
- **Pantalla partida:** cada mitad dibuja su escena en sus propias coordenadas y con recorte; al final las dos se achican
  a ventanas. Una mitad apagada (velo oscuro) dirige la mirada a la otra.
- **Chat:** burbujas ancladas abajo; cada mensaje nuevo entra con rebote y empuja a los demás hacia arriba. Texto de 44 px
  como mínimo.

## 6. Revisar con hojas de cuadros

```bash
source ~/.claude/skills/skill-motion/scripts/preparar_render.sh
node $R/render.mjs peliculaN/peliculaN.html fotos.png --stills 0.9,2.6,4.2,5.95,6.8,8.0,9.0,10.3,11.3
```
Nueve cuadros por hoja (tres por fila), elegidos en los momentos de la hoja de tiempos: justo después de cada golpe,
en medio de cada frase y en cada chiste. Mírala con Read, corrige, y repite hasta que no haya nada que arreglar.
Revisa siempre en 3 o 4 hojas toda la película antes del render.


## 7. Ideas de escenas para copiar

El motor base trae opciones de personaje que se activan por `PERS` u opciones: piel de otro color (`piel/pielSombra/nariz`),
`orejas: 'punta' | 'hobbit'`, `colmillos`, `narizLarga`, `descalzo`, `chaleco`, `rayas`, `cejaGruesa`, `ojosRojos`,
`cara: 'enojo'`, `gorro`, `bufanda`, `barbaBlanca`, `lentesSol`, `babero`, y `sombrero()` con fiesta, lana, boina, detective,
casco, gorra, bruja y calabaza. Piezas de utilería que conviene dibujar una vez y reutilizar (no vienen hechas):
un cartel de dos caras que se da vuelta (escala x con coseno), un robot de pantalla con caras, una tarjeta de colección
con el personaje recortado, un calendario con hoja que se arranca, un sobre con timbre, una torta, confeti y fuegos
artificiales, un chat de grupo con mensajes.

Errores vistos en las hojas de cuadros (súmalos a la sección 5):
- Una tapa o un objeto que «sale volando» no puede pasar por la cara: mándalo hacia el costado.
- Los gorros de fiesta y de bruja son altos: un título arriba los pisa. Corre el texto a un lado del personaje.
- Un lugar no tiene dos lunas: si una escena dibuja su propio sol o luna, apaga la del fondo.
- Una puerta «abierta» y «cerrada» al revés solo se pilla mirando el cuadro en la palabra: revisa que el estado calce
  con lo que se dice.
- Alguien que maneja va dentro del auto: dibújalo recortado a la ventana (`ctx.clip()` con el rectángulo de la ventana).
- Dos rótulos grandes en la misma fila se montan: mide con `ancho()` o ponlos en filas distintas.
- `arc` con radio negativo hace caer el render entero: en arcos concéntricos usa `Math.max(1, r - i * w)`.

## 8. Estilos que cambian y 3D

Tres estilos en una película, cada uno con su textura, y el cambio de estilo puede ser parte del chiste:
- **Tinta japonesa:** papel con fibras y bordes tostados, sol rojo, montañas de tinta en tres capas con paralaje, texto
  que se destapa como pincelada, sello rojo que entra golpeando, un rollo que se abre al empezar, líneas de velocidad de
  anime y franjas de cine (letterbox).
- **Barrido de tinta** entre escenas y **papel que se rasga** (`rasgado(u, dibujaA)`) para pasar de un estilo a otro: la
  escena vieja se parte en dos con borde dentado y sale hacia los lados.
- **Cómic a todo color** para la parte alegre: rótulo extruido, utilería simple, emojis y casilleros con «+1».
- **3D falso** (`assets/motor-3d.js`): un mapa con una ruta que se pinta, un auto y un alfiler; y un piso de neón. **Neón:**
  `shadowBlur`.
- **Efectos de cuadro en `seek`:** golpe de impacto (dos cuadros invertidos con `difference`), falla digital (franjas de
  la propia imagen corridas con `drawImage(cv, ...)`), destellos solo en los cortes.
- **Tarjeta que se da vuelta** para revelar un remate: escala x con coseno y la otra cara dibujada con su propio estilo.
- Errores vistos: un rollo que cae justo en la cara, una órbita de cámara mal calculada (el alfiler salía de cuadro),
  siluetas negras de personas que se leen como otra cosa (mejor un recuerdo semitransparente), letreros 3D con postes
  gigantes cerca de la cámara.

## 9. El estilo «tech y pro» (marca y lanzamiento)

Pensado para piezas de marca y lanzamiento en vertical 1080 x 1920. Si el primer borrador en dibujo plano (cómic suave)
se ve básico, este estilo lo sube de nivel. Las piezas están en `assets/motor-tech.js`.

**Qué hace que se vea «pro» (lo que cambió entre el borrador y la versión aprobada):**
- **Luz y volumen en vez de trazo grueso.** Cada cara de un objeto con su degradado: el frente en sombra fresca, el lado
  y el techo al sol, luz de borde (una línea clara en la arista que da a la luz), sombra de contacto suave en el suelo,
  brillo especular en lo mojado o metálico. Sin contornos negros.
- **Profundidad:** fondo en capas con paralaje (una ciudad en dos capas que se mueven a distinta velocidad), bruma que aclara
  lo lejano y luces fuera de foco (bokeh: círculos con degradado radial y el borde un poco más claro).
- **Un hilo «tech» que une todo:** la cámara del documental (`hud`) encima de las escenas, con marcos de enfoque que se
  fijan en el sujeto, alertas y rótulos en letra de máquina. Así la escena de rayos X ya no es la única tecnológica.
- **Interfaz en vez de cómic:** tarjetas de llamada que se apilan en vez de globos, un tablero de resultados en vez del
  marcador de cómic, un celular moderno sobre un piso de grilla, texto grande en cursiva con aberración de color en vez de
  Bangers con rayos.
- **Un momento técnico que sorprende:** la gota que se estrella contra el lente con refracción de verdad (`lenteMojado`):
  se copia el lienzo y adentro de cada gota se ve la escena chica y dada vuelta. Llámala después de dibujar la escena.

| Pieza | Dónde | Para qué |
|---|---|---|
| `hud`, `rotuloCam`, `enfoque`, `aviso`, `escaneo`, `lenteMojado`, `tarjetas`, `tablero`, `sueloGrilla`, `textoPro` | `assets/motor-tech.js` | Las piezas genéricas (instrucciones en su encabezado) |

**Errores vistos en las hojas de cuadros** (súmalos a la sección 5):
- REC y la hora arriba a la derecha tapaban el elemento principal de la escena: el HUD va arriba a la izquierda y
  los rótulos debajo de él.
- Texto claro del HUD sobre una pared clara no se lee: ponle una pastilla oscura translúcida.
- La mano del personaje asoma por el borde antes de que entre: que parta más afuera.
- El degradado que esconde el horizonte del piso de grilla, si no es del color del fondo, deja una franja: pásale el color.
- Un celular chico deja media pantalla vacía bajo los subtítulos: acércalo (zoom 1,6 a 2,0) y baja su centro.
- Lo que la escena muestra encendido se lee como afirmación: no enciendas algo que el producto no hace.


## 10. Motor comercial

`assets/motor-promo.js`, con detalle de uso en `references/promo.md`. Piezas: `mascara`, `palabras`, `contador`, `grada`, `plano` (perspectiva real en canvas 2D por triángulos), `ventana`, `telefono`, `tarjeta`, `pastilla`, `barrido`, `iris`, `destello`, `sacudida`, `estallido`, `petalos`, `golpe`. `plano` proyecta [x, y, escala]: en `tri` solo se usan x e y; tomar el tercer valor por y rompe la imagen en dientes de sierra.


## 11. Movimiento continuo: nada se detiene del todo

Norma que separa «se ve a web» de «se ve a lanzamiento». Las cifras vienen de reglas de motion design probadas; las ayudas están en `motor-promo.js` (`entra`, `sale`, `escalonar`, `deriva`, `empuje`, `cursor`).

- **Nada lineal.** Todo con curva: `outExpo`, `outBack`, `inOutCubic`.
- **Entrada** de unos 0,5 s con un rebote leve (`P.entra`). **Salida** más rápida, cerca del 60 % de la entrada y sin rebote (`P.sale`).
- **Grupos bajo un padre.** Las piezas que van juntas se animan como una (un `save`/`translate`/`scale` del grupo) y no cada una por su lado.
- **Desfase** de 2 a 4 cuadros por elemento del grupo: `P.escalonar(i, 3)` da el retraso del elemento i.
- **Solapamiento.** El siguiente movimiento parte antes de que el anterior se asiente, en su último 20 %; así la escena no hace paradas.
- **Lo importante se queda** cerca de 1,5 s en pantalla. **Los conteos** duran cerca de 1 s, con salida suave; nunca saltan.
- **Lo quieto sigue vivo:** `P.deriva(t)` da una deriva lenta (escala de 1 a 1,02 o ±4 px) y `P.empuje(t, t0, t1)` un micro empuje de cámara permanente que se aplica al lienzo desde el centro.
- **Cámara:** toda panorámica o zoom con suavizado de entrada y salida, y un paneo de ancho completo de 0,8 s o más.
- **Cursor:** `P.cursor` viaja en arco, aprieta al hacer clic y rebota al llegar (`references/promo.md`).
- Todo esto es función pura de t: la deriva y el empuje salen de senos y de `lin`, nunca del cuadro anterior.


## 12. Acotaciones en pantalla y plano técnico (blueprint)

`assets/motor-acotaciones.js` es un archivo aparte, sin dependencias, que se carga junto a cualquier motor: `Acotaciones.crear(ctx, { W, H })`. Cabecera con la API completa. Para explicar cifras y mecanismos.

| Pieza | Qué hace |
|---|---|
| `callout(texto, ax, ay, bx, by, t, t0, {sub, sale})` | Etiqueta en (bx, by) con una línea guía que se dibuja desde el objeto (ax, ay) |
| `dimension(a, b, texto, t, t0, {offset})` | Cota con flechas entre dos puntos y la medida («30 m») |
| `readout(etiqueta, valor, px, py, t, t0, {unidad})` | Lectura tipo «NORMAL: 0,25 s»; si el valor es número, cuenta hasta él |
| `badge(texto, px, py, t, t0)` | Multiplicador o contador en una esquina («100x»); respira sin detenerse |
| `fondoPlano`, `trazo`, `arcoTrazo`, `rotulo` | Plano técnico: cuadrícula azul marino, trazos celestes que se dibujan, dorado para lo importante (`col: A.C.acento`, `dorado: true`), rótulos que se escriben |

- Cada una entra con rebote en ~0,5 s y sale más rápido; `t0` es el segundo en que debe aparecer. Con voz, ese t0 es el segundo de la palabra que dice la cifra (`palabras.json`), así el número aparece cuando se pronuncia.
- **Máximo una o dos acotaciones a la vez**, texto mínimo (rótulos, no frases).
- **Plano técnico:** úsalo para el momento que explica («cómo funciona», «las medidas»). Celeste para el trazo, dorado para lo que importa, y los rótulos al ritmo de la voz. Las acotaciones funcionan encima, con `col: A.C.acento` para el dorado.
- Con 3D, `Orbita3D.proy(cam, punto)` da la posición en pantalla de un punto del mundo: úsalo como ancla del `callout`.
- Si el formato es 9:16, `crear` escala tamaños con `min(W, H) / 1080`; revisa igual la hoja con `SEGURAS=1`.


## 13. Órbita y recorrido 3D

Bloque `Orbita3D` al final de `assets/motor-3d.js`. Es 3D falso de canvas con la misma convención de ejes que `cam3` (x este, y norte, z arriba, yaw 0 mira al norte), pero autocontenido: solo necesita ctx, W y H, se puede pegar solo o sacar a un archivo (el comando está en su cabecera).

- `O.orbita(t, t0, t1, { objetivo, radio, altura, yaw0, yaw1 })`: cámara que gira alrededor de un punto; el giro es suave pero tiene un 15 % lineal para que nunca se detenga. `radio1` y `altura1` hacen que se acerque o baje mientras gira.
- `O.recorrido(t, t0, t1, camino, { mira })`: la cámara avanza por una lista de puntos [x, y, z] mirando a un punto fijo o un poco más adelante.
- `O.suelo(cam)` y `O.cajas(cam, lista, { estilo })`: piso en cuadrícula y cajas `{ x, y, w, d, h, col }` con caras sombreadas (`'solido'`) o en alambre (`'alambre'`, combina con el plano técnico). Las caras se ordenan por profundidad: sirve para cajas separadas, no para cajas que se cruzan.
- Animar la entrada de una caja es cambiar su `h` por `P.entra(...)` en la lista de ese cuadro (la lista se arma en cada `seek`).
- Trampas: una caja pegada a la cámara se ve enorme y sale cortada (aleja el radio o las cajas); una órbita de 2 a 3 s ya se lee como «wow», no la alargues.
