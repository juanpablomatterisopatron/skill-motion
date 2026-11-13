# Instalar skill-motion

## Claude Code (Mac, Linux y Windows)

1. Descomprime `skill-motion-generico.zip`. Queda una carpeta `skill-motion/`.
2. Muévela dentro de la carpeta de skills de Claude Code:
   - Mac y Linux: `~/.claude/skills/skill-motion/`
   - Windows: `%USERPROFILE%\.claude\skills\skill-motion\`
3. Abre Claude Code (reinícialo si estaba abierto) y escribe: `hazme un comercial de 30 segundos de <tu producto>`.
   Claude detecta la skill por su descripción y sigue el proceso de `SKILL.md`.

En Mac o Linux, desde la terminal:
```bash
mkdir -p ~/.claude/skills && unzip skill-motion-generico.zip -d ~/.claude/skills/
```

## Claude Desktop o claude.ai

Si tu plan permite skills propias, súbela desde Personalizar, Skills, subiendo el zip. No lo probé en todos los planes: si
no aparece esa opción en tu cuenta, usa Claude Code.

## Qué necesita

| Pieza | Para qué | Cómo tenerla |
|---|---|---|
| Node 18 o más | Renderizar a MP4 | nodejs.org |
| Python 3 | Scripts de voz, música y mezcla | python.org |
| ffmpeg | Mezclar audio y armar el MP4 | `brew install ffmpeg` (Mac); ffmpeg.org en Windows |
| Google Chrome | Filmar webs y revisar | chrome.google.com |
| ElevenLabs (clave) | Voz narrada y música original | elevenlabs.io; `export ELEVENLABS_API_KEY="..."` |
| Deepgram (clave, opcional) | «Oír» el resultado y sincronizar con las palabras | deepgram.com; `export DEEPGRAM_API_KEY="..."` |
| Tesseract (opcional) | Leer texto del video final | `brew install tesseract` |

Las claves van en variables de entorno (por ejemplo en `~/.zshrc`), nunca dentro de archivos de la skill ni pegadas en
el chat. En Windows, usa `setx ELEVENLABS_API_KEY "..."` o las variables de entorno del sistema; los scripts `.sh` se
corren en WSL o Git Bash.

## Cuánto cuesta

La skill es gratis. Una película de un minuto gasta unos 900 caracteres de voz más una pista de música en ElevenLabs
(centavos de dólar con el plan de entrada) y la transcripción de Deepgram cuesta una fracción de centavo; Deepgram da
crédito de prueba. Los precios cambian: revisa la página de cada servicio.

## Primera prueba rápida

```bash
source ~/.claude/skills/skill-motion/scripts/preparar_render.sh   # instala el renderizador una vez
```
Luego pídele a Claude: «usa skill-motion y hazme un comercial de 15 segundos de una cafetería, formato vertical».

Los efectos de sonido de `sfx/` son CC0 (créditos en `sfx/LICENSES.md`). `scripts/render.mjs` parte del renderizador de
motion-graphics de Barty-Bart (github.com/Barty-Bart/motion-graphics, licencia MIT).
