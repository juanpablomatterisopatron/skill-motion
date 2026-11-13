"""Arma banda.mp3: narración + música (que se agacha sola cuando hablan) + efectos, a -16 LUFS.

Uso (desde audio/, después de armar_narracion.py):  python3 mezclar.py efectos.json
efectos.json:
{
 "musica_db": -8,                       # volumen de la música bajo la voz (-8 a -9 funcionó en las tres películas)
 "musica_tempo": 0.95,                   # opcional: estira (<1) o acorta (>1) la música sin cambiarle el tono. La de
                                        # ElevenLabs suele terminar 3 a 6 s antes de lo pedido: 0.93 a 0.95 la calza
 "huecos": [[42.7, 43.9, -14]],         # tramos donde la música baja más (o se corta con -60): un chiste, un silencio
 "efectos": [[0.1, "impact/fs-347561-micheal-bay-hit.ogg", -12],
             [24.05, "timbre.wav", -13]]  # [segundo, archivo, dB]; con «/» es de la biblioteca sfx/ de esta skill,
}                                         # sin «/» es un archivo de esta carpeta (los sintetizados)

Reglas de volumen que salieron de medir con Deepgram (ver references/sonido.md):
- golpes e impactos entre frases: -8 a -13 dB; bajo una palabra, nunca más fuerte que -18 dB.
- zumbidos y pops de adorno: -14 a -22 dB.
- Un efecto encima de un verbo corto lo borra («lo entrenes, le enseñes» desapareció con pops a -9; a -22 volvió).
"""
import json
import subprocess
import sys
from pathlib import Path

SFX = Path(__file__).resolve().parent.parent / 'sfx'   # biblioteca CC0 incluida en esta skill (ver sfx/LICENSES.md)
cfg = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'efectos.json'))
E = sorted(cfg['efectos'])
total = json.load(open('tiempos.json'))['duracion']
args = ['ffmpeg', '-v', 'error', '-y', '-i', 'narracion.wav', '-i', 'musica.mp3']
for _, f, _ in E:
    ruta = Path(f) if '/' not in f else SFX / f
    assert ruta.exists(), f'no existe {ruta}'
    args += ['-i', str(ruta)]
musica = f"[1]aresample=48000,volume={cfg.get('musica_db', -8)}dB"
if cfg.get('musica_tempo'):
    musica += f",atempo={cfg['musica_tempo']}"
for a, b, db in cfg.get('huecos', []):
    musica += f",volume={db}dB:enable='between(t,{a},{b})'"
filtros = ['[0]aformat=channel_layouts=stereo,aresample=48000,asplit=2[voz][llave]', musica + '[mus0]',
           '[mus0][llave]sidechaincompress=threshold=0.03:ratio=4:attack=30:release=350[mus]']
for k, (seg, _, db) in enumerate(E):
    ms = int(seg * 1000)
    filtros.append(f'[{k + 2}]aresample=48000,aformat=channel_layouts=stereo,volume={db}dB,adelay={ms}|{ms}[e{k}]')
filtros.append(f"[voz][mus]{''.join(f'[e{k}]' for k in range(len(E)))}amix=inputs={len(E) + 2}:normalize=0,atrim=0:{total},"
               f"afade=t=out:st={total - 0.9}:d=0.9,loudnorm=I=-16:TP=-1.5:LRA=11[o]")
args += ['-filter_complex', ';'.join(filtros), '-map', '[o]', '-ar', '48000', '-b:a', '128k', 'banda.mp3']
subprocess.run(args, check=True)
print('banda.mp3 lista:', total, 's,', len(E), 'efectos')
