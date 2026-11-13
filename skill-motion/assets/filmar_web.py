#!/usr/bin/env python3
"""Plantilla para filmar una web real cuadro a cuadro . Copiar a la carpeta de la película y escribir un clip por función.
La web corre con reloj propio: cada cuadro se mueve por código (cámara, barras, hora) y se fotografía. Nada depende del tiempo real.
Uso: python3 filmar_web.py clip [clip ...]   (sin clips: todos, de a 3)
Con GPU real del Mac: 0,1 s por cuadro con WebGL. Con SwiftShader: 5,5 s. Si la web no tiene 3D, igual sirve."""
import json, pathlib, shutil, subprocess, sys, time
from playwright.sync_api import sync_playwright
AQUI = pathlib.Path(__file__).resolve().parent
URL = 'http://127.0.0.1:8000/'          # o (AQUI / '../web/index.html').as_uri()
FPS = 30
ARGS = ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-gpu', '--allow-file-access-from-files']   # exige channel='chromium'
ESPERA = "() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))"
def nueva(br, dpr=4 / 3, alto=810):     # 1440 x 810 a 4/3 = 1920 x 1080. Vertical: width 810, height 1440
    ctx = br.new_context(viewport={'width': 1440, 'height': alto}, device_scale_factor=dpr, reduced_motion='reduce')
    pg = ctx.new_page(); pg.goto(URL); pg.wait_for_timeout(800)
    pg.add_style_tag(content='.toast{display:none!important}')   # lo que estorbe en cámara
    return ctx, pg
def carpeta(c):
    d = AQUI / 'frames' / c
    if d.exists(): shutil.rmtree(d)
    d.mkdir(parents=True); return d
def foto(pg, d, i): pg.evaluate(ESPERA); pg.screenshot(path=str(d / f'{i:04d}.jpg'), type='jpeg', quality=88)
def ss(a, b, x):
    k = max(0, min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k)

def ejemplo(pg):
    d = carpeta('ejemplo'); n = int(2 * FPS)
    for i in range(n):
        pg.evaluate("(y) => window.scrollTo(0, y)", 600 * ss(0, 1, i / n)); foto(pg, d, i)
def fijas(pg):                          # pantallas fijas a doble resolución, para ventanas en perspectiva: dpr=2 y alto=1000
    d = AQUI / 'fijas'; d.mkdir(exist_ok=True); pg.screenshot(path=str(d / 'inicio.jpg'), type='jpeg', quality=90)

TODOS = dict(ejemplo=ejemplo, fijas=fijas)
pedidos = sys.argv[1:]
if not pedidos:
    cola = list(TODOS); vivos = []
    while cola or vivos:
        while cola and len(vivos) < 3:
            c = cola.pop(0); vivos.append((c, subprocess.Popen([sys.executable, __file__, c])))
        time.sleep(2); vivos = [(c, p) for c, p in vivos if p.poll() is None]
    cl = {d.name: len(list(d.glob('*.jpg'))) for d in (AQUI / 'frames').iterdir() if d.is_dir()}
    (AQUI / 'clips.js').write_text('window.CLIPS = ' + json.dumps(cl) + ';\n', encoding='utf-8'); print(cl); sys.exit()
with sync_playwright() as p:
    br = p.chromium.launch(channel='chromium', args=ARGS)
    for c in pedidos:
        ctx, pg = nueva(br, **(dict(dpr=2, alto=1000) if c == 'fijas' else {})); t0 = time.time(); TODOS[c](pg); print(c, 'listo en', round(time.time() - t0), 's', flush=True); ctx.close()
    br.close()
