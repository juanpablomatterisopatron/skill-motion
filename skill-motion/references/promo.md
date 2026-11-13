# Comercial y demo de producto: el modo pro

Esta es la otra mitad de la skill: no hay personajes ni cómic. Hay producto real, ritmo y una promesa. Es el modo para videos «marketeros»: rápidos, vivos, con música alegre.

## Cuándo usar este modo

Cuando el público es quien va a comprar o decidir (dueño, gerente, cliente) y lo que importa es que quiera el producto. Si la película es para emocionar (familia, cumpleaños, invitación), usa las historias. Si la persona dice «marketero», «comercial», «promocional», «que venda», «pro», «lanzamiento», «demo», es este.

## Estructura que funcionó (sirve de 30 a 120 s)

| Parte | Qué hace | Regla |
|---|---|---|
| Gancho, 5 a 8 s | Una escena imposible de ignorar en la vida del comprador: «Son las once, tu tienda está cerrada y alguien acaba de comprarte» | El beneficio entra antes que el producto. Nada de logo al inicio |
| Golpe, 2 s | La promesa en una línea, sobre la primera explosión de la música | «De vender productos a vender experiencias» |
| Vitrina | Lo que ve el cliente del comprador: una función cada 1,5 a 3 s | Rótulo de una a tres palabras más una imagen real |
| Corte, 4 s | Silencio y riser: «Pero esto... es solo la vitrina» | El único momento sin música fuerte; prepara la segunda explosión |
| Plataforma | Lo que gana el comprador: una función por escena | Segunda persona: «tu stock», «cobras», «tu bot» |
| Verbos, 4 s | Una palabra por pulso a pantalla completa: VENDE, ORGANIZA, COBRA... | Es lo que más recuerda quien vio sin audio |
| Cierre | Vuelve el gancho con otro final («y sigue vendiendo»), marca, llamada a la acción, letra chica | La frase final es la promesa cumplida |

Un hilo une todo (por ejemplo un reloj que marca 23:07, 08:00, 23:07). Verifica la verdad igual que en una historia: tabla «lo que afirma y dónde se comprobó» en GUION.md; lo simulado va en una pastilla chica durante toda esa parte y en una línea al cierre. Un cliente inventado se puede usar si la letra chica dice que son datos de ejemplo. No inventes dominios, cifras de venta ni porcentajes de ahorro. Sin precios si la persona no los pidió.

## Storyboard fijo (antes de dibujar)

Un comercial de cliente parte con `assets/brief-cliente.md` y un `STORYBOARD.md` (`assets/storyboard-plantilla.md`): por escena, qué hay en pantalla, movimiento, cámara y **rango de cuadros**, y los rangos suman el total. Es la fuente de verdad: no se reordenan ni se agregan escenas sin que alguien lo pida. La tabla `E` de `pelicula.js` sale de ahí, no se arma mientras se dibuja. Sin storyboard todo se mueve a la vez. Si falta el producto en el brief, 3 preguntas cortas antes de seguir.

## Imagen: producto real y datos reales

1. **Si el producto es una web o app, fílmala:** `assets/filmar_web.py` (copiar y escribir un clip por función). La cámara, la hora o el scroll se mueven por código y se fotografía cada cuadro.
2. **GPU real, no SwiftShader:** `channel='chromium'` + `--use-angle=metal --ignore-gpu-blocklist --enable-gpu` en el Mac. WebGL pasó de 5,5 s a 0,1 s por cuadro. Mil cuadros salen en dos minutos. Comprueba con `WEBGL_debug_renderer_info` que diga Apple, no SwiftShader.
3. **Lo que la web calcula, dibújalo con sus datos:** exporta un `datos.js` desde la propia web (`pg.evaluate`) y anima barras, calendarios y comparaciones con `motor-promo.js`. Es más nítido que una captura y sigue siendo verdad. Nunca escribas esos números a mano.
4. **Interfaz en vector si la cámara se acerca.** Una captura se pixela al acercar: dibuja la interfaz con el motor (`tarjeta`, `pastilla`, texto) o importa el SVG de Figma, y úsala así en todo plano con zoom. La captura queda para pantallas que no se acercan. Dibuja el lienzo desde el centro y fija el tamaño de partida: así el mismo código sirve para los cortes 9:16 y 1:1.
5. **Pantallas fijas a dpr 2** y en ventana flotante en perspectiva (`P.ventana` + `P.plano`). Una captura plana quieta se ve a presentación; la misma, girando 10 grados mientras se acerca, se ve a comercial. Ventana a la derecha, texto en una columna libre a la izquierda: nunca encima.
6. **Si filmar el producto delata algo feo, mejóralo en el producto:** vale más que disimularlo. Prueba la web después de cambiarla.
7. **Color:** `P.grada`. Mide antes de saturar: con GPU real los colores ya vienen fuertes, y `sat` sobre 1,1 puede volverlos fosforescentes. La noche pide `bri` 1,7 y `bloom` 0,45.

## Ritmo

- Grilla: 120 BPM es 0,5 s por pulso y 2 s por compás. Todo corte, golpe y frase parte en un múltiplo de 0,5.
- Regla de la tabla `E` de `pelicula.js`: `[inicio, fin, escena]`, una función por escena. Las transiciones (`P.barrido`) van encima, centradas en el corte, porque tapan el cambio y no necesitan dibujar dos escenas.
- Al inicio de cada corte fuerte: `P.destello`, `P.estallido`, `P.sacudida`, y su golpe de sonido.
- Máscaras (`P.mascara`): el texto sube desde atrás de un borde con `outExpo`. No uses fundido en el texto de un comercial.
- Desenfoque de movimiento: `render.mjs ... 30 4 6`, cuatro veces más lento, y da el acabado de video real.

## Formatos

`MotorPromo.crear(ctx, { W, H })` usa W y H, no números fijos. Para 9:16: `W: 1080, H: 1920`, viewport de filmar 810 x 1440, ventanas apiladas arriba y texto abajo, rótulos un 20 % más grandes. Para 1:1: 1080 x 1080. En `assets/pelicula.html` cambia `.marco`, `aspect-ratio` y el tamaño del canvas. Un corte de 30 s sale de gancho + golpe + 3 funciones + verbos + cierre, sin rehacer nada.

**Zonas seguras.** Los títulos van a 5 % de cada borde y lo clave de cada toma dentro del cuadrado central de lado `min(W, H)` (1080 x 1080 en 16:9). Todo lo importante se posiciona desde el centro, no desde los bordes. Para verlo en la hoja de cuadros: `SEGURAS=1 node $R/render.mjs pelicula.html hoja.png --stills ...` dibuja el margen en rojo y el cuadrado central en verde. Ojo: un empuje de cámara agranda el cuadro, deja margen extra.

| Largo | Para qué | Funciones |
|---|---|---|
| 15 a 30 s | Reels, estado de WhatsApp, anuncio | 3 |
| 60 s | Enviar a un contacto, abrir una reunión | 6 a 8 |
| 90 a 120 s | Mostrarle todo a un comprador | 12 a 15 |

## Voz y sonido

Una sola voz de locutor con estabilidad 0,38 y estilo 0,55, acelerada 12 % (`silenceremove` + `atempo=1.12`). Detalle de música por compases y mezcla: `references/sonido.md` sección 13.

## Cursor, tecleo y movimiento continuo (motor-promo.js)

- `P.cursor(t, camino, opts)`: `camino = [{ x, y, t, clic?, pausa? }]` con t = segundo de llegada. Viaja en arco (curva con control a 15 % de la distancia), suave al salir y llegar, rebota un poco al llegar y en un clic aprieta 1, 0,96, 1 en 8 cuadros con un anillo. `dibujar: false` solo devuelve `{ x, y, esc, clic }` para que un botón se apriete con él; luego se llama otra vez dibujando, encima de todo.
- `P.cursorPro(t, ruta, clics, opts)` y `P.enArco(x0, y0, x1, y1, k)`: el puntero de un comercial pro. `ruta = [[t0, t1, x, y], ...]` = viajar a (x, y) entre t0 y t1 por un arco que siempre sube (control a 0,22 de la distancia en perpendicular), suave al salir y al llegar, y **quieto entre un tramo y el siguiente** (esa pausa es la duda antes del clic). `clics = [t, ...]`: al clic el puntero se achica a 0,8 y vuelve con rebote en 0,16 s y un anillo se expande y desvanece en 0,45 s. Opciones: `escala` (2,2 horizontal, 2,7 vertical), `inicio`, `anillo` (color), `tinta`, `a`, `dibujar: false`. **Regla: en un comercial o demo, todo viaje del puntero va en arco, con pausa antes del clic y clic animado; el movimiento recto está prohibido** (se ve a robot). Vale igual si la interfaz está dibujada con el motor o filmada con `filmar_web.py`: el puntero real de Playwright no se ve, se dibuja este encima, en el segundo que corresponde. Prueba: `node scripts/prueba-cursor.mjs` (geometría) y `assets/prueba-cursor.html` (hoja de cuadros con la estela real del puntero).
- `P.tecleo(texto, t, t0)` devuelve `{ s, caret }`: texto que se escribe con ritmo humano (tiempos fijos por semilla, sin azar real).
- `P.entra`, `P.sale`, `P.escalonar(i, 3)`, `P.deriva`, `P.empuje`: la regla de movimiento continuo de `references/motor-visual.md` sección 11.
- Acotaciones (`callout`, `dimension`, `readout`, `badge`) y plano técnico: `assets/motor-acotaciones.js`, `references/motor-visual.md` sección 12.

## Revisar antes de renderizar

- [ ] Fuente cargada antes del cuadro 0 (`render.mjs` avisa si cae a una de reemplazo; una fuente de reemplazo es un error, ver `references/entrega.md`).
- [ ] Los conteos duran cerca de 1 s y nunca saltan al valor final en un cuadro.
- [ ] Las tarjetas, filas y vistos buenos entran una por una con 2 a 4 cuadros de desfase, nunca todos juntos.
- [ ] Los vistos buenos se muestran después de que la tarjeta aterrizó, no mientras llega.
- [ ] Cada movimiento de cámara tiene suavizado de entrada y salida y dura lo bastante para leerse (un paneo de ancho completo, al menos 0,8 s).
- [ ] Nada se queda del todo quieto (deriva o empuje) y nada sale del lienzo si no es a propósito.
- [ ] Zonas seguras revisadas en la hoja (`SEGURAS=1`).
- [ ] Hoja de instantes pegados a cada corte (0,1 s antes y después de cada golpe).

## Pulidos de gusto (de a uno)

Primero se arregla lo roto, después el gusto, y una frase por mensaje. Banco de una línea:

1. El contador termina con un brillo corto al llegar a su valor.
2. El cursor duda un instante antes de ir al botón (pausa de 0,2 s y un rebote al llegar).
3. Un pulso de escala al empezar cada escena (`P.golpe`).
4. Los vistos buenos caen en cascada, uno tras otro (`P.escalonar`).
5. Al llegar el contador a cero, la cámara se aleja y queda 1,5 s de pantalla limpia.
