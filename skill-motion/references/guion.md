# Guion: de qué se trata la película y cómo se escribe

## Contenido
1. La regla de la verdad
2. Elegir el concepto (estilos probados)
3. Escribir las frases para la voz
4. El reparto de voces
5. La hoja de tiempos
6. Personajes: genéricos, nunca la persona real
7. Un saludo con la voz de la persona
8. Acotaciones del guion y cifras en pantalla
9. Videos con cifras de un negocio o de algo que todavía no existe

## 1. La regla de la verdad

Todo lo que la película afirma tiene que ser cierto, y lo que dice que hace el producto tiene que estar en su código.
Antes de escribir «le lee sus mensajes» o «retoma el libro donde quedó», búscalo en el código (grep) y anota dónde
está. Si algo existe pero está apagado para el usuario real, se dice igual si es del producto, y se le avisa a la persona
la diferencia. Si algo es delicado (caídas, salud, emergencias), la escena lo muestra sobria (pictograma, no la persona
en el suelo) y lleva letra chica honesta: «No reemplaza un servicio de emergencias».

## 2. Elegir el concepto

Primero pregunta o deduce: para quién es (la reunión, el público), qué tiene que sentir, cuánto dura (45 a 65 s es lo
que aguanta una lámina de presentación). Después propón el concepto en dos o tres frases antes de producir: producir
cuesta una hora y créditos de ElevenLabs.

Tres estilos probados:

| | Emotivo | Alegre y movido | Tráiler de superhéroes |
|---|---|---|---|
| Estructura | problema real, chispa, solución, reencuentro | la vida del personaje por épocas, bloqueo, «tú puedes», producto | «En un mundo...», revelación, un poder por escena, lema, «Próximamente» |
| Ritmo | lento, vals de 3/4 | grilla de 120 BPM, cambio de escena en el pulso | rótulo gritado + escena corta, cinco veces |
| Voz | un narrador cuentacuentos | un narrador entusiasta en segunda persona | narrador de tráiler + voz de rótulos + los personajes hablan |
| Música | vals de piano y cuerdas que crece | una pieza que cambia de época, se corta en seco en el bloqueo | marcha heroica cómica, se apaga en el chiste del silencio |

Cuando la persona pide «algo para X», proponer tres conceptos distintos con una vista previa en texto de cada uno
funciona: la persona elige uno y le agrega su propio giro.

Ideas que funcionaron en todas:
- **Un hilo visual** que atraviesa la película: los mensajes (sobres grises que se vuelven globos), los aparatos de la
  vida del personaje, un emblema. Une las escenas mejor que cualquier transición.
- **Un chiste visual por escena** que la voz no explica: los anteojos que estaban en la cabeza, el «shhh» del teléfono
  en misa, la clave que pide «el nombre de su primera mascota».
- **Un silencio**: cortar la música un segundo y medio es lo que más se recuerda.
- **Mostrar al público como protagonista capaz**, no como víctima: «si manejaste equipos con mil botones...».
- **Cierre con el logo y la dirección**, escrita letra por letra con tic de teclado.

**¿No es una historia?** Si el público es un comprador, no armes personajes: usa la estructura de `references/promo.md`
(gancho, golpe, vitrina, corte, plataforma, verbos, cierre). Un mismo producto puede pedir un documental emotivo para
unos y un comercial rápido para quien decide la compra: pregunta quién mira antes de elegir el tono.

## 3. Escribir las frases para la voz

- Una frase por pista (frase01.mp3, frase02.mp3...). Se colocan una a una y se rehace solo la que salió mal.
- Cortas y habladas, de 3 a 12 palabras. Lo largo se dice en dos frases.
- Usa las palabras de casa de tu público (la palabra que él usaría, no la de un diccionario).
- Español neutro. Sin guion largo ni medio en el texto: el narrador los lee como una pausa rara.
- Los puntos suspensivos («Y ahora... la IA») le dan a ElevenLabs una pausa dramática que sí respeta.
- Las cifras, nombres de marcas y siglas se escriben como se dicen.
- Lo que dicen los personajes va entre comillas en el guion y con otra voz en el audio.

## 4. El reparto de voces

`scripts/voces.py --listar` muestra las voces de tu cuenta de ElevenLabs; `--buscar` explora la biblioteca pública y
`--agregar` suma una a tu cuenta. Haz muestras (una frase por voz, que diga su número, todas en un solo mp3) y elige: la
voz decide el tono de todo. Roles que conviene cubrir:

| Rol | Qué buscar |
|---|---|
| Narrador cálido | voz madura, cuentacuentos (estabilidad 0.55, estilo 0.25) |
| Narrador entusiasta o de comercial | voz joven, segura; rótulos gritados con estabilidad 0.32 y estilo 0.7 |
| Narrador de tráiler | voz grave (estabilidad 0.45, estilo 0.45) |
| Personajes mayores | voces de abuelo y abuela (estabilidad 0.45, estilo 0.4) |
| Voz del producto o del asistente | clara y neutra, distinta a la del narrador |

Ajustes de estabilidad y estilo: ver el encabezado de `scripts/voces.py`.

## 5. La hoja de tiempos

Va al principio del .js como comentario y en GUION.md como tabla: segundo, frase, qué se ve, qué suena.
- Los inicios de las frases salen de la narración: después de generar las voces, ajusta los inicios para que haya aire
  y luego dibuja las escenas sobre esos segundos (no al revés).
- Con Deepgram (`scripts/oir_con_deepgram.py`) sale el segundo exacto de cada palabra: así un globo aparece justo en
  la palabra que corresponde y una palabra de la frase final golpea cuando se dice.
- Película movida: grilla de 120 BPM (pulso de 0,5 s); los cortes y los golpes caen en el pulso.

## 6. Personajes: genéricos, nunca la persona real

Los personajes son caricaturas genéricas (abuelo, abuela, nieta), no retratos de clientes ni de familiares. Nada de
diagnósticos ni condiciones médicas de personas reales en una película que se va a mostrar o publicar. Si la historia
es real, se cuenta con lo que la persona ya contó en público y con su permiso.

## 7. Un saludo con la voz de la persona

Cuando la narración es una nota de voz de la persona (saludo, invitación): ver `references/sonido.md` sección 9.
- **Los gags que pide la persona, al pie de la letra**, incluida la falta de ortografía si la pide. Son el corazón del
  video; lo demás se puede inventar.
- **Los datos de un evento salen de su mensaje real** (fecha, lugar, qué traer). Si no dio dirección ni hora, no se
  ponen: se le avisa.
- **Nombres de personas reales en pantalla:** de lo que la persona escribe o dice; si dudas, como lo escribió ella. Nada
  de chistes con algo que puede ser delicado.
- **Un personaje recurrente** (un robot, una bruja) une el video; su firma puede ser el chiste final.

## 8. Acotaciones del guion y cifras en pantalla

- **Cada párrafo lleva dos capas:** `[NARRACIÓN]` lo que se lee en voz alta y `[VISUAL]` la imagen que va debajo (una
  línea). Es el puente entre el guion y las escenas de `pelicula.js`.
- **Pausas y énfasis para la voz** entre paréntesis, como `(pausa)` o `(énfasis)`. Las pausas se traducen a puntos
  suspensivos o a un hueco en `armar_narracion.py`.
- **Cada número que se dice aparece en pantalla, al ritmo de la palabra.** Con el `palabras.json` de Deepgram se toma el
  segundo de la palabra y se pasa como `t0` a `callout`, `dimension`, `readout` o `badge` (`references/motor-visual.md`
  sección 12). Máximo una o dos acotaciones a la vez; si el número no se dice, no se pone.
- **Variantes de personaje antes de fijar el estilo.** Si la película tiene personajes, no se parte con el primero: se
  muestran 3 o 4 variantes (una hoja con la misma pose en cada estilo), la persona elige y recién ahí se escribe el motor.

## 9. Videos con cifras de un negocio o de algo que todavía no existe

Un video deja fijo un número en la cabeza de quien lo ve. Si el modelo de negocio sigue cambiando, el video queda viejo
o, peor, afirma lo que no está decidido.

**Antes de escribir el guion**
1. **Una sola fuente oficial.** Pregunta de dónde salen las cifras y abre ese archivo. Si hay más de un modelo que dan
   números distintos, se para: primero se reconcilian los números y después se hace el video.
2. **Tabla de afirmaciones en `GUION.md`:** una fila por cifra o promesa, con la frase, la fuente (archivo y celda o
   línea) y el tipo: **hecho** (medido o firmado), **supuesto** (de un modelo) o **propuesta** (aún sin acordar). Lo que
   no tiene fuente no se dice.
3. **Una sola unidad.** Si el proyecto cuenta visitas, el video no explica en hogares.
4. **Palabras que comprometen.** «Garantía», «ya existe», «funciona hoy», «en segundos», «cumple la ley», «sin costo» y
   cualquier precio o plazo solo van si están decididos por escrito. Lo que es maqueta o demo se rotula como maqueta.
5. **Capturas del producto real.** Si se conversó la versión gratuita, no se filma la pagada.

**En la película**
- Cada supuesto se ve como supuesto: la palabra «supuesto» o «estimado» en pantalla junto a la cifra.
- La última escena, o la letra chica final, dice **qué falta confirmar** y con quién.
- Un cálculo que solo aparece en el video no se dice: primero va al documento.

**Después:** si cambia la fuente, el video queda viejo ese mismo día; se marca en el `LEEME` y se avisa a la persona.
