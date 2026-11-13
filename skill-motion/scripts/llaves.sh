# Uso: source llaves.sh  ->  deja ELEVEN (ElevenLabs) y OPENROUTER en el entorno, sin imprimirlas.
# Solo lee variables de entorno:
#   ELEVENLABS_API_KEY   (obligatoria para voces y música)
#   OPENROUTER_API_KEY   (opcional: solo si usas modelos de imagen o texto por OpenRouter)
#   DEEPGRAM_API_KEY     (opcional: para «oír» el audio con oir_con_deepgram.py)
# En Mac o Linux, ponlas en ~/.zshrc o ~/.bashrc:  export ELEVENLABS_API_KEY="..."
# Nunca hagas echo de estas variables: para comprobar, muestra solo el largo (${#ELEVEN}).
ELEVEN=${ELEVENLABS_API_KEY:-}
OPENROUTER=${OPENROUTER_API_KEY:-}
[ -n "$ELEVEN" ] || echo "Falta ELEVENLABS_API_KEY en el entorno (necesaria para voces y música)." >&2
export ELEVEN OPENROUTER
