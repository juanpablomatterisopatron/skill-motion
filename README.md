# Skill de motion para Claude Code

Un skill genérico para que Claude Code cree videos animados y comerciales de producto, de 15 segundos a 4 minutos, con código.

## Qué se puede hacer
- Comerciales de una web o app (se filma la web real cuadro a cuadro).
- Historias cortas con personajes.
- Demos para mostrarle a un cliente lo que podría tener.
- Formatos 16:9, vertical 9:16 y cuadrado 1:1.

## Qué trae
- Motores de dibujo en JavaScript, scripts de render, voz y música.
- Narración con ElevenLabs (opcional) y efectos de sonido CC0 incluidos.
- Revisión del resultado: se escucha con transcripción (Deepgram, opcional) y se mira con hojas de cuadros antes de renderizar.

## Instalar
1. Descarga `skill-motion-generico.zip` desde este repositorio.
2. Descomprime la carpeta `skill-motion/` dentro de `~/.claude/skills/` (en Windows, `%USERPROFILE%\.claude\skills\`).
3. Abre Claude Code y escribe: «Hazme un comercial de 30 segundos para…».

El zip trae un `INSTALAR.md` con el detalle. Necesitas Node, Python, ffmpeg y Chrome.

Hecho por Tu academIA (tu-academia.cl) para la comunidad IA Founders.
Licencia: MIT (ver LICENSE).
