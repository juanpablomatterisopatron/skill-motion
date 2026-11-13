# La chispa: lo que hace que una película diga «wow» y no solo «estuvo bien»

Este archivo se lee ANTES de escribir el guion y se repasa con la hoja de cuadros.

## Por qué una película queda en «bien» y otra en «muy buena»

| | «Muy buena» | Solo «bien» |
|---|---|---|
| Idea central | Un formato reconocible y exagerado (tráiler de superhéroes, leyenda épica) | Una lista de datos con dibujos |
| Personas | Cada una con su nombre, su tarjeta y su chiste | Nadie con nombre: «los niños», «ustedes» |
| Sorpresa | Un cartel que se da vuelta, un desertor de las líneas del mal | Lo esperable |
| Voz | La real de la persona o un narrador de tráiler con rótulos gritados | Voces correctas pero neutras |
| Ritmo | Algo cambia cada 1,5 a 3 s, cortes en la palabra | Escenas de 4 a 8 s quietas |

## Lista de control antes de producir (el guion no pasa si falla alguna)

1. **Un formato con reglas** que el público reconoce y que se puede romper: leyenda, tráiler, noticiero, documental de
   naturaleza, reality, anime, western. Romperlo es el chiste más grande.
2. **Un giro** que nadie espera, preparado con seriedad: cuanto más solemne la preparación, más fuerte el remate.
   Silencio de 1 a 1,5 s antes o después del remate.
3. **Las personas por su nombre**, cada una con su talla. Una tarjeta, un rótulo y un dibujo por persona.
4. **Un personaje que vuelve** (callback): aparece al principio, en el medio y en el cierre con un chiste distinto.
5. **Un momento «wow» técnico** por película: un vuelo de cámara en 3D, un mapa que se inclina, un rótulo que se arma en
   el pulso, un cambio total de estilo.
6. **Ritmo:** nada quieto más de 3 s. Cada frase trae algo que entra, se mueve o explota. Los cortes caen en la palabra
   o en el pulso de la música.
7. **Escala:** de un detalle a algo gigante, de una persona a la multitud.
8. **Textura de cada estilo:** papel y tinta para lo antiguo, tramas y rayos para lo cómico, luces y neón para lo
   moderno. Cambiar de textura marca el cambio de parte.
9. **El cierre con firma:** un chiste final con el personaje que vuelve.
10. **Verdad:** los datos (fecha, lugar, qué traer) son los de la persona; los chistes, todos los que quieras.

## Recursos que suben la energía (con su receta)

- **Golpe de impacto (impact frame):** 2 a 3 cuadros invertidos o en blanco y negro puro en el golpe
  (`globalCompositeOperation = 'difference'` con un rectángulo blanco), más sacudida y zumbido.
- **Líneas de velocidad estilo anime:** rayas desde el borde hacia el centro, que cambian cada cuadro (con `rng` por
  cuadro, nunca `Math.random`).
- **Zoom dramático** a la cara antes de una frase importante (escala 1 a 1,6 con `easeOut`), con franjas negras arriba
  y abajo (letterbox) en lo épico.
- **Paralaje:** fondo, medio y frente que se mueven a velocidades distintas con la cámara.
- **3D falso en canvas** (`assets/motor-3d.js`): cámara con posición, giro e inclinación, proyección en perspectiva,
  polígonos ordenados por profundidad; sirve para mapas que se inclinan, montañas, caminos, letreros que se paran solos.
- **Tipografía cinética:** cada palabra importante entra en su segundo (`palabras.json`), con rebote; los números cuentan.
- **Transiciones con forma:** un círculo que se cierra (iris), un barrido de tinta, una página que se da vuelta, un
  pergamino que se enrolla. Mejor que el fogonazo blanco repetido.
- **El silencio y el disco rayado:** cortar la música con un rayón justo en el remate.

## Vocabulario de tomas (con proporciones)

Para que una película no sea una sola distancia de cámara. Proporciones aproximadas del tiempo en pantalla:

| Toma | Proporción | Para qué |
|---|---|---|
| Plano general de establecimiento | 10 % | Abre cada escena nueva, lento; a veces en 3D |
| Plano medio de dos | 25 % | Conversación y acción |
| Sobre el hombro | 10 % | Una silueta grande y borrosa al frente, la otra nítida |
| Primerísimo plano | 10 a 15 % | Reacciones |
| Insert o macro (manos, pantalla, objeto) | 10 % | Un detalle grande con fondo borroso |
| Vista cenital o diagrama | 5 % | Trayectorias, medidas |
| Tiempo congelado | 1 a 3 por video | El momento firma (abajo) |
| Órbita o recorrido 3D | cerca de 1 por minuto | Espacios grandes (`motor-3d.js`, `Orbita3D`) |
| Tarjeta de dato o interfaz | las que haga falta | Cada número que se dice (`motor-acotaciones.js`) |
| Plano técnico (blueprint) | el tramo que explica | Cómo funciona, medidas |
| Título y cierre | 1 cada uno | Marca y llamada a la acción |

**El congelado del tiempo como momento firma** (1 a 3 por película): todo se detiene salvo el héroe; partículas
suspendidas en el aire (desplazamiento mínimo con senos, nunca azar), tinte frío, un `badge` en la esquina («100x»),
anillos lentos y un giro lento de cámara. Entra con destello blanco (`P.destello`) y un golpe de sonido; sale con otro.

## Qué aprendió cada tipo de película

- **Tráiler de superhéroes:** rótulo gritado + escena corta, cinco veces; el silencio de «sabe quedarse callado».
- **Saludo con la voz real:** las tarjetas con los nombres, el cartel que se da vuelta en la palabra exacta.
- **Invitación a un evento:** quedó «bien» al ser una lista de datos sin personas ni giro; mejoró con un formato con
  reglas (una leyenda solemne que se rompe con un garabato), cada amigo con su tarjeta y su talla, un personaje que vuelve y un mapa en 3D.
- **Demo de una web real:** documental solemne sobre el cliente y el giro final (la película se rebobina con la propia
  barra de la web). `seek` puede ser asíncrona, así que se dibujan capturas reales y encima rótulos con fondo. Con
  interfaz en cuadro, sin franjas de cine, y subtítulos y rótulos nunca sobre los controles.
- **Comercial para quien compra:** la chispa también existe sin personajes: un gancho que es el sueño del comprador, un
  corte de silencio antes de la segunda explosión y el mismo gancho al final con otro remate. Filmar con GPU cambia el
  método: render y refilmar tardan segundos, así que se corrige viendo.
- **Video para un niño que expone:** el video le habla en vivo, hay pausas con aro que se acaba y, si el niño calla, el
  personaje dice la palabra solo.
