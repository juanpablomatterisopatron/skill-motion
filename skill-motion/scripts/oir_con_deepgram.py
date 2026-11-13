"""Claude no oye: este script «oye» por él. Transcribe con Deepgram y compara lo que se entiende en la narración
sola contra la mezcla final. Cada palabra que se pierde en la mezcla es un efecto o una música que la tapa.

Uso:
    python3 oir_con_deepgram.py narracion.wav > palabras.json       # palabras con su segundo (sirve para sincronizar)
    python3 oir_con_deepgram.py banda.mp3 > banda.json
    python3 oir_con_deepgram.py --comparar palabras.json banda.json  # lista lo que cambió

La llave va en la variable de entorno DEEPGRAM_API_KEY (deepgram.com, tiene crédito de prueba).
"""
import difflib
import json
import os
import subprocess
import sys
import tempfile
import urllib.request


def transcribir(ruta):
    k = os.environ.get('DEEPGRAM_API_KEY') or sys.exit('Falta DEEPGRAM_API_KEY en el entorno.')
    tmp = tempfile.mktemp(suffix='.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', ruta, '-ac', '1', '-b:a', '64k', tmp], check=True)
    r = urllib.request.Request('https://api.deepgram.com/v1/listen?model=nova-2&language=es&punctuate=true', data=open(tmp, 'rb').read(),
                               headers={'Authorization': 'Token ' + k, 'Content-Type': 'audio/mpeg'})
    os.remove(tmp)
    a = json.loads(urllib.request.urlopen(r, timeout=120).read())['results']['channels'][0]['alternatives'][0]
    return [[x['punctuated_word'], round(x['start'], 2), round(x['end'], 2)] for x in a['words']]


def comparar(a, b):
    norm = lambda w: w.lower().strip('.,¡!¿?…').replace('super', 'súper')
    sa, sb = [norm(x[0]) for x in a], [norm(x[0]) for x in b]
    print(f'{len(sa)} palabras en la narración, {len(sb)} en la mezcla')
    malos = 0
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, sa, sb).get_opcodes():
        if op != 'equal':
            malos += 1
            seg = a[i1][1] if i1 < len(a) else '?'
            print(f'  {op}: {sa[i1:i2]} -> {sb[j1:j2]}  (segundo {seg})')
            if max(i2 - i1, j2 - j1) >= 6:
                print(f'    bloque largo: casi seguro es Deepgram, no la mezcla (un efecto tapa una o dos palabras, no una frase).'
                      f' Confírmalo transcribiendo ese tramo solo.')
    print('sin pérdidas' if not malos else f'{malos} diferencias: revisar qué suena en esos segundos (marcas y nombres propios pueden variar solo en la ortografía)')


if __name__ == '__main__':
    if sys.argv[1:2] == ['--comparar']:
        comparar(json.load(open(sys.argv[2])), json.load(open(sys.argv[3])))
    elif len(sys.argv) == 2:
        print(json.dumps(transcribir(sys.argv[1]), ensure_ascii=False))
    else:
        sys.exit(__doc__)
