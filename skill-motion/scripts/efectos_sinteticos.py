"""Efectos que no están en la biblioteca CC0 incluida en sfx/, sintetizados aquí (sin licencias de por medio).

Uso:  python3 efectos_sinteticos.py timbre campana escudo shh disco modem   (o «todos»)  ->  <nombre>.wav en la carpeta actual

- timbre:  campanilla de martillo de teléfono antiguo (dos ráfagas, 0,46 s)
- campana: campana de iglesia (parciales de campana que se apagan, 2,4 s)
- escudo:  metal grande golpeado + chasquido de ruido (1 s)
- shh:     «shhh» de ruido rosado en la banda de la sibilante (0,75 s)
- disco:   clics del disco de un teléfono que vuelve (0,36 s)
- modem:   discado, silbido y chillido de un módem de 56k (1,75 s)
- vidrio:  un vidrio que se rompe: estallido de ruido agudo y tintineos que caen (1 s)
- motor:   motor de moto chica, «put put put» (3,4 s; con «put» más espaciado al final, ahogándose)
- hinchada: el ruido de un estadio, que sube como en un gol (5 s)
- silbato: el pito del árbitro con su trino (0,8 s)
Idea general: un metal o una campana = suma de senos (parciales) que se apagan cada uno a su ritmo; un mecanismo =
pulsos cortos que se repiten; un soplido = ruido filtrado con su envolvente.
"""
import math
import random
import struct
import subprocess
import sys
import wave

SR = 48000
ff = lambda *a: subprocess.run(['ffmpeg', '-v', 'error', '-y', *a], check=True)


def guardar(nombre, m):
    pico = max(abs(x) for x in m) or 1
    with wave.open(nombre, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(b''.join(struct.pack('<h', int(32000 * x / pico * 0.9)) for x in m))


def parciales(dur, lista, ataque=0.004):
    """lista de (frecuencia, amplitud, caída por segundo)."""
    return [min(1, k / (ataque * SR)) * sum(a * math.exp(-c * k / SR) * math.sin(2 * math.pi * f * k / SR) for f, a, c in lista)
            for k in range(int(dur * SR))]


def timbre():
    n, m = int(0.46 * SR), []
    for k in range(n):
        t = k / SR
        suena = (t < 0.2) or (0.26 < t)
        golpe = 1 if math.sin(2 * math.pi * 25 * t) > 0 else 0.35
        m.append(suena * golpe * (math.sin(2 * math.pi * 1320 * t) + 0.55 * math.sin(2 * math.pi * 2710 * t) + 0.25 * math.sin(2 * math.pi * 3960 * t))
                 * min(1, (0.46 - t) / 0.04))
    guardar('timbre.wav', m)


def campana(f0=262):
    guardar('campana.wav', parciales(2.4, [(f0 * 0.5, 0.5, 0.9), (f0, 1.0, 1.4), (f0 * 1.19, 0.55, 1.9), (f0 * 1.5, 0.4, 2.3),
                                            (f0 * 2.0, 0.35, 2.8), (f0 * 2.52, 0.2, 3.6), (f0 * 2.98, 0.15, 4.5)], 0.003))


def escudo():
    r = random.Random(7)
    m = parciales(1.0, [(523, 1.0, 5), (1247, 0.7, 7), (1983, 0.5, 9), (2871, 0.35, 12), (3607, 0.25, 15), (178, 0.6, 6)], 0.001)
    guardar('escudo.wav', [x + (r.random() * 2 - 1) * 1.4 * math.exp(-k / SR * 60) for k, x in enumerate(m)])


def shh():
    ff('-f', 'lavfi', '-i', 'anoisesrc=d=0.75:c=pink:a=0.6', '-af',
       'highpass=f=2600,lowpass=f=7500,afade=t=in:d=0.15,afade=t=out:st=0.3:d=0.45', '-ar', str(SR), 'shh.wav')


def disco():
    ff('-f', 'lavfi', '-i', "aevalsrc='0.9*lt(mod(t\\,0.07)\\,0.006)*sin(2*PI*2400*t)*exp(-mod(t\\,0.07)*400)':s=48000:d=0.36", 'disco.wav')


def modem():
    ff('-f', 'lavfi', '-i', "aevalsrc='if(lt(t\\,0.5)\\, 0.35*lt(mod(t\\,0.1)\\,0.07)*(sin(2*PI*(697+86*mod(floor(t*10)\\,4))*t)+sin(2*PI*(1209+137*mod(floor(t*10)\\,3))*t))\\,"
       "if(lt(t\\,0.95)\\, 0.5*sin(2*PI*2100*t)*if(lt(mod(t\\,0.45)\\,0.02)\\,0\\,1)\\, "
       "0.35*sin(2*PI*(1180+420*sin(2*PI*7*t))*t)+0.25*sin(2*PI*(2300+300*sin(2*PI*13*t))*t)+0.2*(random(0)*2-1)))':s=48000:d=1.75", 'modem.wav')


def vidrio():
    r = random.Random(11); n = int(1.0 * SR)
    m = [(r.random() * 2 - 1) * math.exp(-k / SR * 18) * 0.8 for k in range(n)]
    for _ in range(34):
        t0, f, a = r.random() * 0.6, 2200 + r.random() * 5200, 0.2 + r.random() * 0.3
        k0 = int(t0 * SR)
        for k in range(k0, min(n, k0 + int(0.25 * SR))):
            d = (k - k0) / SR; m[k] += a * math.exp(-d * 28) * math.sin(2 * math.pi * f * d)
    guardar('vidrio.wav', m)


def motor():
    r = random.Random(5); n = int(3.4 * SR); m = []
    for k in range(n):
        t = k / SR; frec = 13 if t < 2.6 else 13 - (t - 2.6) * 12   # al final se ahoga
        fase = (t * max(frec, 3)) % 1
        golpe = math.exp(-fase * 9)
        m.append(golpe * (0.7 * math.sin(2 * math.pi * 68 * t) + 0.5 * math.sin(2 * math.pi * 136 * t) + 0.5 * (r.random() * 2 - 1)))
    guardar('motor.wav', m)


def hinchada():
    ff('-f', 'lavfi', '-i', 'anoisesrc=d=5:c=pink:a=0.7', '-af',
       "highpass=f=250,lowpass=f=2600,volume='0.45+0.55*sin(PI*t/5)':eval=frame,tremolo=f=3:d=0.25,afade=t=in:d=0.6,afade=t=out:st=4.2:d=0.8", '-ar', str(SR), 'hinchada.wav')


def silbato():
    n = int(0.8 * SR)
    guardar('silbato.wav', [math.sin(2 * math.pi * (2900 * k / SR + 2.4 * math.sin(2 * math.pi * 38 * k / SR))) * min(1, k / (0.02 * SR)) * min(1, (n - k) / (0.08 * SR)) for k in range(n)])


TODOS = {'timbre': timbre, 'campana': campana, 'escudo': escudo, 'shh': shh, 'disco': disco, 'modem': modem, 'vidrio': vidrio, 'motor': motor, 'hinchada': hinchada, 'silbato': silbato}
if __name__ == '__main__':
    pedidos = sys.argv[1:] or sys.exit(__doc__)
    for p in (TODOS if pedidos == ['todos'] else pedidos):
        TODOS[p](); print(p + '.wav')
