"""Mide el pulso de una música: BPM, fase, volumen por tramos y puntos donde cambia la energía.

Uso:  python3 pulso.py musica.mp3
Con el BPM y las barras se calzan cortes, golpes y frases (película movida: múltiplos de 0,5 s a 120 BPM). ElevenLabs
respeta el BPM pedido casi exacto, pero NO respeta el largo de las secciones: mira dónde cambió la energía y reordena
con cortar_musica.py en vez de pedirla de nuevo.
"""
import subprocess, sys
import numpy as np
f = sys.argv[1]; sr = 22050
x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32)
hop = 220; dt = hop / sr; e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x) - hop, hop)])
o = np.maximum(0, np.diff(np.log(e + 1e-4))); o = o - np.convolve(o, np.ones(50) / 50, 'same')
s = o - o.mean(); ac = np.correlate(s, s, 'full')[len(s) - 1:]; mejor = (0, 120)
for bpm in np.arange(70, 180, 0.1):
    p = 60 / bpm / dt; v = sum(ac[int(round(p * m))] for m in range(1, 17) if int(round(p * m)) < len(ac))
    if v > mejor[0]: mejor = (v, round(float(bpm), 1))
bpm = mejor[1]; beat = 60 / bpm; ph = np.zeros(50)
for i, v in enumerate(o): ph[int(((i * dt) % beat) / beat * 50) % 50] += v
print(f'BPM {bpm}  pulso {beat:.3f} s  fase {np.argmax(ph) / 50 * beat:.3f} s  duración {len(x) / sr:.2f} s')
rms = lambda a, b: 20 * np.log10(np.sqrt(np.mean(x[int(a * sr):int(b * sr)] ** 2)) + 1e-6)
print('dB por 4 s:', ' '.join(f'{t}:{rms(t, t + 4):.0f}' for t in range(0, int(len(x) / sr), 4)))
v = [rms(t, t + 0.5) for t in np.arange(0, len(x) / sr - 0.5, 0.5)]
print('cambios de energía (s):', [round(i * 0.5, 1) for i in range(1, len(v)) if abs(v[i] - v[i - 1]) > 6])
