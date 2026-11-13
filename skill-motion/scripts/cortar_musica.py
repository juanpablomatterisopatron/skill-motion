"""Reordena una música por compases sin pedirla de nuevo: une tramos exactos con microfundidos.

Uso:  python3 cortar_musica.py entrada.mp3 salida.mp3 8.5-16.5 16.5-44.5 40.5-48.5 60.5-64.5 ...
Los bordes tienen que caer en barras (fase + n × compás; mídelos con pulso.py): así el corte no se oye y el pulso sigue
parejo. Sirve para alargar (repetir un tramo), acortar, o poner la explosión justo donde la quiere la película.
"""
import subprocess, sys
e, s, *t = sys.argv[1:]; S = [tuple(map(float, q.split('-'))) for q in t]; f = []; n = []
for i, (a, b) in enumerate(S):
    f.append(f'[0:a]atrim={a}:{b},asetpts=N/SR/TB,afade=t=in:d=0.006,afade=t=out:st={b - a - 0.006}:d=0.006[s{i}]'); n.append(f'[s{i}]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', e, '-filter_complex', ';'.join(f) + ';' + ''.join(n) + f'concat=n={len(S)}:v=0:a=1[o]', '-map', '[o]', '-q:a', '2', s], check=True)
print(s, round(sum(b - a for a, b in S), 2), 's')
