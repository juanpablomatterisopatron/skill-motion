"""Genera las frases de la película con ElevenLabs (una pista mp3 por frase).

Uso (desde la carpeta audio/ de la película, con la llave en el entorno: source ../scripts/llaves.sh):
    python3 voces.py frases.json            # genera frase01.mp3, frase02.mp3, ...
    python3 voces.py frases.json --solo 4 7 # rehace solo la 4 y la 7 (para corregir una lectura)
    python3 voces.py --listar               # voces de la cuenta (id, nombre, género, edad, acento)
    python3 voces.py --buscar female young  # voces públicas en español de la biblioteca de ElevenLabs
    python3 voces.py --agregar <voice_id> "Nombre (papel)" --edad young --genero female   # la suma a la cuenta

Si tu cuenta no tiene la voz que necesitas (por ejemplo una mujer adulta en español), búscala en la biblioteca pública
con --buscar y súmala con --agregar. Para agregar una voz hay que encontrarla con el MISMO filtro de edad y género con
que salió (la API pide su public_owner_id, que solo viene en la búsqueda).

frases.json es una lista de [voice_id, texto] o de {"voz": id, "texto": ..., "estabilidad": .., "estilo": ..}.
Una frase por pista: así cada una se coloca en su tiempo (armar_narracion.py) y se puede rehacer sola.

Ajustes que funcionaron (eleven_multilingual_v2, español):
- narrador cálido o de cuento: estabilidad 0.55, estilo 0.25
- narrador de tráiler o de época: estabilidad 0.45, estilo 0.45
- rótulos gritados («¡Súper oído!»): estabilidad 0.32, estilo 0.7
- personajes mayores que hablan: estabilidad 0.45, estilo 0.4
Con un solo narrador, previous_text y next_text (la frase de antes y la de después) mantienen la entonación pareja.
"""
import argparse
import json
import os
import sys
import urllib.request

API = 'https://api.elevenlabs.io/v1'


def pedir(url, cuerpo=None, timeout=120):
    k = os.environ.get('ELEVEN')
    if not k:
        sys.exit('Falta ELEVEN en el entorno (source llaves.sh). No pegues la llave en el comando.')
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    r = urllib.request.Request(url, data=datos, method='POST' if datos else 'GET',
                               headers={'xi-api-key': k, 'Content-Type': 'application/json'})
    return urllib.request.urlopen(r, timeout=timeout).read()


def listar():
    for v in json.loads(pedir(f'{API}/voices'))['voices']:
        l = v.get('labels') or {}
        print(v['voice_id'], '|', v['name'][:40], '|', l.get('gender'), l.get('age'), l.get('accent'), l.get('language'))
    s = json.loads(pedir(f'{API}/user/subscription'))
    print(f"\nplan {s.get('tier')}: {s.get('character_count')} de {s.get('character_limit')} caracteres usados")


def buscar(genero, edad, n=15):
    import urllib.parse
    q = {'page_size': n, 'language': 'es', 'gender': genero, 'age': edad, 'sort': 'usage_character_count_1y'}
    for v in json.loads(pedir(f'{API}/shared-voices?' + urllib.parse.urlencode(q)))['voices']:
        print(v['voice_id'], '|', v['name'][:45], '|', v.get('accent'), v.get('locale'), '|', v.get('use_case'), '|', (v.get('description') or '')[:70].replace(chr(10), ' '))


def agregar(voice_id, nombre, genero, edad):
    import urllib.parse
    q = {'page_size': 100, 'language': 'es', 'gender': genero, 'age': edad, 'sort': 'usage_character_count_1y'}
    v = next((x for x in json.loads(pedir(f'{API}/shared-voices?' + urllib.parse.urlencode(q)))['voices'] if x['voice_id'] == voice_id), None)
    if not v:
        sys.exit('No la encontré con ese género y edad: búscala con --buscar y usa los mismos filtros.')
    r = json.loads(pedir(f"{API}/voices/add/{v['public_owner_id']}/{voice_id}", {'new_name': nombre}))
    print('agregada:', nombre, r.get('voice_id'))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('frases', nargs='?')
    ap.add_argument('--solo', type=int, nargs='*')
    ap.add_argument('--listar', action='store_true')
    ap.add_argument('--buscar', nargs=2, metavar=('GENERO', 'EDAD'))
    ap.add_argument('--agregar', nargs=2, metavar=('VOICE_ID', 'NOMBRE'))
    ap.add_argument('--genero', default='female')
    ap.add_argument('--edad', default='young')
    ap.add_argument('--modelo', default='eleven_multilingual_v2')
    a = ap.parse_args()
    if a.listar:
        return listar()
    if a.buscar:
        return buscar(*a.buscar)
    if a.agregar:
        return agregar(a.agregar[0], a.agregar[1], a.genero, a.edad)
    lineas = json.load(open(a.frases))
    norm = [l if isinstance(l, dict) else {'voz': l[0], 'texto': l[1]} for l in lineas]
    un_narrador = len({l['voz'] for l in norm}) == 1
    for i, l in enumerate(norm, 1):
        if a.solo and i not in a.solo:
            continue
        cuerpo = {'text': l['texto'], 'model_id': a.modelo,
                  'voice_settings': {'stability': l.get('estabilidad', 0.5), 'similarity_boost': 0.8,
                                     'style': l.get('estilo', 0.3), 'use_speaker_boost': True}}
        if un_narrador:
            cuerpo['previous_text'] = norm[i - 2]['texto'] if i > 1 else None
            cuerpo['next_text'] = norm[i]['texto'] if i < len(norm) else None
        open(f'frase{i:02d}.mp3', 'wb').write(pedir(f"{API}/text-to-speech/{l['voz']}?output_format=mp3_44100_128", cuerpo))
        print(f'frase{i:02d}.mp3', l['texto'][:60])


if __name__ == '__main__':
    main()
