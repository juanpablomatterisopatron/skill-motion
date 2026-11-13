"""Arma presentacion.html (la que se publica) desde la plantilla, con las imágenes de img/ adentro como data URI."""
import base64, re
from pathlib import Path
A = Path(__file__).resolve().parent
TIPOS = {'.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg'}
# {{logo.svg}} = imagen de img/ como data URI; {{js:ruta}} = el texto de ese archivo adentro (la película);
# {{mp3:ruta}} = el audio como data URI (la banda sonora de la película). Así se presenta sin internet.
t = (A / 'presentacion.plantilla.html').read_text()
def uri(m):
    clave = m.group(1)
    if clave.startswith('js:'):
        return (A / clave[3:]).read_text()
    if clave.startswith('mp3:'):
        return 'data:audio/mpeg;base64,' + base64.b64encode((A / clave[4:]).read_bytes()).decode()
    f = A / 'img' / clave
    return f'data:{TIPOS[f.suffix]};base64,' + base64.b64encode(f.read_bytes()).decode()
salida = re.sub(r'\{\{([\w.:/-]+)\}\}', uri, t)
assert '{{' not in salida and '\u2014' not in salida and '\u2013' not in salida
(A / 'presentacion.html').write_text(salida)
print(f'presentacion.html: {len(salida) // 1024} KB, {salida.count("class=\"slide")} láminas')
