"""Genera la música original con ElevenLabs Music a partir de un plan por secciones.

Uso (desde audio/, con source llaves.sh):  python3 musica.py musica-plan.json   ->  musica.mp3

El plan es un composition_plan de ElevenLabs:
{
 "positive_global_styles": ["original superhero movie trailer score", "playful and comedic", "instrumental"],
 "negative_global_styles": ["vocals", "singing", "sad"],
 "sections": [
  {"section_name": "In a world", "positive_local_styles": ["dark tense trailer opening", "big hit at the end"],
   "negative_local_styles": ["happy"], "duration_ms": 11000, "lines": []},
  ...
 ]
}
- Las secciones duran lo que duran las escenas: la suma = largo total de la película. Mínimo 3000 ms por sección.
- Siempre "instrumental" en positivo y "vocals", "singing" en negativo: una voz cantando tapa al narrador.
- Nombrar el CAMBIO que se quiere oír ("big hit at the end", "ends on a warm sustained chord that fades out"): la
  música lo hace cerca del borde de la sección y eso permite calzar golpes con escenas.
- No pidas «al estilo de» una película o un compositor con nombre: pide el tono (cálido, vals, tráiler cómico).
- Tarda 1 a 3 minutos. Después medir el volumen por tramos (ver references/sonido.md) antes de mezclar.
"""
import json
import os
import sys
import urllib.request

if len(sys.argv) < 2:
    sys.exit(__doc__)
k = os.environ.get('ELEVEN') or sys.exit('Falta ELEVEN en el entorno (source llaves.sh).')
plan = json.load(open(sys.argv[1]))
total = sum(s['duration_ms'] for s in plan['sections'])
assert all(s['duration_ms'] >= 3000 for s in plan['sections']), 'cada sección dura al menos 3000 ms'
r = urllib.request.Request('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128',
                           data=json.dumps({'composition_plan': plan}).encode(), method='POST',
                           headers={'xi-api-key': k, 'Content-Type': 'application/json'})
open('musica.mp3', 'wb').write(urllib.request.urlopen(r, timeout=400).read())
print(f'musica.mp3 lista ({total / 1000:.1f} s pedidos)')
