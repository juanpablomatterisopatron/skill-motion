"""Pone cada frase en su segundo y deja narracion.wav y tiempos.json.

Uso (desde audio/):  python3 armar_narracion.py 0.8 6.8 11.5 13.0 ... --total 61.5
   o con el archivo:  python3 armar_narracion.py --inicios inicios.json   ({"inicios": [...], "total": 61.5})

- Lee frase01.mp3, frase02.mp3, ... en orden; tiene que haber un inicio por frase.
- Avisa (y se detiene) si una frase se monta sobre la siguiente: entonces se corre el inicio o se rehace la frase.
- Con grilla de pulso (película movida a 120 BPM), los inicios caen en múltiplos de 0,5 s.
- Deja aire: unos 0,2 a 0,5 s entre frases, y más donde la imagen tiene que lucirse sola (un chiste, un silencio).
"""
import argparse
import json
import subprocess

ap = argparse.ArgumentParser()
ap.add_argument('inicios', nargs='*', type=float)
ap.add_argument('--total', type=float)
ap.add_argument('--inicios', dest='archivo')
a = ap.parse_args()
if a.archivo:
    d = json.load(open(a.archivo)); INICIOS, TOTAL = d['inicios'], d['total']
else:
    INICIOS, TOTAL = a.inicios, a.total
assert INICIOS and TOTAL, 'faltan los inicios o el total'
dur = lambda f: float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f],
                                     capture_output=True, text=True).stdout)
marcas, entradas, filtros = [], [], []
for k, t0 in enumerate(INICIOS):
    f = f'frase{k + 1:02d}.mp3'
    marcas.append({'frase': k + 1, 'inicio': t0, 'fin': round(t0 + dur(f), 3)})
    entradas += ['-i', f]
    ms = int(t0 * 1000)
    filtros.append(f'[{k}]aresample=48000,aformat=channel_layouts=mono,adelay={ms}|{ms}[a{k}]')
for x, y in zip(marcas, marcas[1:]):
    assert x['fin'] <= y['inicio'] + 0.05, f"la frase {x['frase']} (termina {x['fin']}) se monta sobre la {y['frase']} ({y['inicio']})"
assert marcas[-1]['fin'] <= TOTAL, f"la última frase termina en {marcas[-1]['fin']}, después del total {TOTAL}"
mezcla = ';'.join(filtros) + ';' + ''.join(f'[a{k}]' for k in range(len(marcas))) + \
    f'amix=inputs={len(marcas)}:normalize=0,apad=whole_dur={TOTAL},atrim=0:{TOTAL}[o]'
subprocess.run(['ffmpeg', '-v', 'error', '-y', *entradas, '-filter_complex', mezcla, '-map', '[o]', '-ar', '48000', '-ac', '1',
                'narracion.wav'], check=True)
json.dump({'duracion': TOTAL, 'frases': marcas}, open('tiempos.json', 'w'), indent=1)
for m in marcas:
    print(m)
