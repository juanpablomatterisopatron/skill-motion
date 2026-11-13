/* Motor base de skill-motion: una película dibujada con código en un <canvas> de 1920x1080.
 * Copia este archivo a la carpeta de la película (pelicula.js), cambia el nombre global del final y escribe tus escenas.
 *
 * La regla de oro: seek(t) dibuja CUALQUIER instante desde cero. Nada de estado entre cuadros, nada de setTimeout ni
 * de animaciones CSS; el azar va con semilla (rng). Así la película se ve igual en vivo, saltando con la barra y
 * renderizada a MP4 cuadro por cuadro.
 *
 * Qué trae (estilo cómic):
 *  - ayudas de movimiento: spring, ease, kf (cuadros clave), track, pop (rebote), wob (vaivén), seg, vive, hablar
 *  - primitivas de dibujo y «pinta» (relleno con volumen y trazo de tinta)
 *  - letras: texto, comic (estilo cómic con borde y sombra), golpe (entra golpeando), caja (narrador), globo (diálogo)
 *  - adornos: estallido (¡POW!), destello, flecha, rayos, trama de puntos, panel (viñeta), conTinta (contorno grueso
 *    y silueta negra para cualquier cosa dibujada)
 *  - burbuja y telefono: un logo de ejemplo y un teléfono (cómo dibujar «el producto»; cámbialos por el tuyo)
 *  - heroe(): acepta piel de otro color (orcos, brujas, vampiros), orejas en punta o de hobbit,
 *    colmillos, nariz larga, pies descalzos, chaleco, polera a rayas, babero, bufanda, barba blanca, lentes de sol,
 *    gorro (ver sombrero()), cara 'enojo', ojos rojos y cejas gruesas (todo opcional, por PERS u opciones)
 *  - heroe(): tata y tita (mayores), hija e hijo (adultos; el hijo con pelo largo y barba), nieta y nieto; de pie o
 *    sentados, con capa opcional, logo del producto en el pecho que se puede apagar (logo: false), lentes en la cara o en
 *    la cabeza, brazos por ángulos; devuelve dónde quedaron las manos para ponerles objetos
 *  - nube (pensamiento), mensaje (burbuja de chat, con micrófono si es dictado), microfono, aviso (notificación),
 *    etiqueta (rótulo en píldora)
 *  - lugares: salon (de día o de noche), sillón y sofá (atrás y adelante del personaje)
 * Ver references/motor-visual.md para el uso de cada pieza y las trampas.
 */
(function (global) {
  'use strict';
  const W = 1920, H = 1080, DUR = 6;
  const T = { s2: 3 };
  // ---------- ayudas de la skill ----------
  function spring(t, w = 14, z = 0.82) {
    if (t <= 0) return 0;
    if (z >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  }
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const ease = x => (x = clamp(x), x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
  const easeIn = x => Math.pow(clamp(x), 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const rng = s => () => (s = (s + 0x6D2B79F5) | 0, s = Math.imul(s ^ (s >>> 15), 1 | s), s ^= s + Math.imul(s ^ (s >>> 7), 61 | s), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
  const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * Math.PI * 2);
  const pop = (t, a, w = 16, z = 0.55) => spring(t - a, w, z);
  // la boca mientras alguien habla
  const hablar = (t, a, b, quieta = 0.3) => (t > a && t < b) ? 0.35 + 0.6 * Math.abs(Math.sin((t - a) * 13)) : quieta;
  // aparece en t0 y se va en t1 (con un fundido corto)
  const vive = (t, t0, t1, d = 0.18) => Math.min(clamp((t - t0) / d), clamp((t1 - t) / d));

  // ---------- color y letras ----------
  const cache = {};
  const rgb = h => cache[h] || (cache[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const C = (h, a = 1) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const P = {
    tinta: '#1f3d40', terra: '#c0573a', terraClaro: '#e07a55', crema: '#f6efe2', mostaza: '#e3a83f', menta: '#9fd1b5',
    cielo: '#8fcbe3', rosa: '#ec9a8a', lila: '#a99bd0', piel: '#f1c09d', pielSombra: '#dc9c7a', nariz: '#e49b78',
    negro: '#16120f', blanco: '#ffffff', azul: '#2f6fb2', verde: '#5aa36b', madera: '#a86f45', papel: '#fbf3e4',
    amarillo: '#ffd23f', rojo: '#e2463a', noche: '#141a2e', wsp: '#dcf8c6',
  };
  const K = P.negro;
  const F = {
    comic: "{s}px 'Bangers', Impact, 'Arial Black', sans-serif",
    slam: "800 {s}px 'Manrope', 'Avenir Next', Arial, sans-serif",
    medio: "600 {s}px 'Manrope', 'Avenir Next', Arial, sans-serif",
    serif: "italic 400 {s}px 'Fraunces', Georgia, serif",
    mono: "500 {s}px 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace",
  };

  // ---------- lienzo y texturas ----------
  let cv, ctx, grano = [], vineta, capaCv, capaCtx;
  function prepararTexturas() {
    const r = rng(17);
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), im = g.createImageData(256, 256);
      for (let i = 0; i < im.data.length; i += 4) { const v = 110 + r() * 145 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 16; }
      g.putImageData(im, 0, 0); grano.push(c);
    }
    vineta = document.createElement('canvas'); vineta.width = W; vineta.height = H;
    const g = vineta.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, 'rgba(20,12,8,0)'); gr.addColorStop(1, 'rgba(20,12,8,0.3)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }

  // ---------- primitivas ----------
  const B = () => ctx.beginPath();
  const circ = (x, y, r) => { B(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); };
  const ell = (x, y, rx, ry, rot = 0) => { B(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); };
  const rr = (x, y, w, h, r) => { B(); ctx.roundRect(x, y, w, h, r); };
  const fill = c => { ctx.fillStyle = c; ctx.fill(); };
  const line = (c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); };
  const seg2 = (x1, y1, x2, y2) => { B(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); };
  const quad = (x1, y1, cx, cy, x2, y2) => { B(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); };
  function save(x = 0, y = 0, s = 1, r = 0) { ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r); if (s !== 1) ctx.scale(s, s); }
  const restore = () => ctx.restore();
  function grad(x0, y0, x1, y1, stops) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function rgrad(x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  // relleno con volumen (luz arriba, sombra abajo) y su trazo de tinta
  function pinta(c, x0, y0, x1, y1, tr = 7) {
    fill(c);
    ctx.fillStyle = grad(x0, y0, x1, y1, [[0, 'rgba(255,248,235,0.16)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(40,20,10,0.2)']]);
    ctx.fill();
    if (tr) line(K, tr);
  }
  function sombra(x, y, rx, ry, a = 0.3) { save(x, y); ctx.scale(1, ry / rx); circ(0, 0, rx); fill(rgrad(0, 0, rx * 0.2, rx, [[0, `rgba(30,15,8,${a})`], [1, 'rgba(30,15,8,0)']])); restore(); }
  function fuente(f, s) { return F[f].replace('{s}', s); }
  function texto(s, x, y, { size = 60, f = 'slam', color = K, align = 'center', a = 1, track = 0, base = 'middle' } = {}) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
    ctx.font = fuente(f, size); ctx.letterSpacing = track + 'px';
    ctx.fillText(s, x, y); ctx.restore();
  }
  function ancho(s, f, size, track = 0) { ctx.save(); ctx.font = fuente(f, size); ctx.letterSpacing = track + 'px'; const w = ctx.measureText(s).width; ctx.restore(); return w; }

  // Letras de cómic: borde de tinta grueso, relleno y una sombra corrida de color.
  function comic(s, x, y, { size = 120, color = P.amarillo, borde = K, sombraC = P.rojo, rot = 0, a = 1, esc = 1, align = 'center', grosor = null, track = null } = {}) {
    if (a <= 0 || esc <= 0) return;
    save(x, y, esc, rot); ctx.globalAlpha *= a;
    ctx.font = fuente('comic', size); ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.letterSpacing = (track ?? size * 0.03) + 'px'; ctx.lineJoin = 'round';
    const g = grosor ?? Math.max(6, size * 0.11);
    if (sombraC) { const d = size * 0.06; ctx.fillStyle = sombraC; ctx.strokeStyle = sombraC; ctx.lineWidth = g; ctx.strokeText(s, d, d * 1.1); ctx.fillText(s, d, d * 1.1); }
    ctx.strokeStyle = borde; ctx.lineWidth = g; ctx.strokeText(s, 0, 0);
    ctx.fillStyle = color; ctx.fillText(s, 0, 0);
    restore();
  }
  // Una palabra de cómic que entra golpeando (escala con rebote) en su momento.
  function golpe(s, x, y, t0, t, o = {}) {
    if (t < t0) return;
    const k = pop(t, t0, 18, 0.5);
    comic(s, x, y, { ...o, esc: (o.esc ?? 1) * lerp(1.8, 1, clamp(k)) * (0.85 + 0.15 * k), a: (o.a ?? 1) * clamp((t - t0) * 10) });
  }
  // Caja del narrador (la amarilla de los cómics), anclada arriba a la izquierda.
  function caja(lineas, x, y, { size = 38, a = 1, rot = -0.012, fondoC = P.amarillo, centro = false } = {}) {
    if (a <= 0) return;
    const pad = size * 0.5, lh = size * 1.18;
    const w = Math.max(...lineas.map(l => ancho(l, 'slam', size, 1))) + pad * 2, h = lineas.length * lh + pad * 1.4;
    save(centro ? x - w / 2 : x, y, 1, rot); ctx.globalAlpha *= a;
    ctx.translate(-(1 - a) * 40, 0);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(8, 9, w, h);
    ctx.fillStyle = C(fondoC); ctx.fillRect(0, 0, w, h); ctx.strokeStyle = K; ctx.lineWidth = 5; ctx.strokeRect(0, 0, w, h);
    lineas.forEach((l, i) => texto(l, pad, pad * 0.7 + lh * (i + 0.5), { size, f: 'slam', color: K, align: 'left', track: 1 }));
    restore();
  }
  // Globo de diálogo con su cola apuntando a quien habla.
  function globo(s, x, y, colaX, colaY, { size = 44, a = 1, k = 1, max = 560 } = {}) {
    if (a <= 0 || k <= 0) return;
    // partir en líneas
    const palabras = s.split(' '), lineas = []; let actual = '';
    palabras.forEach(p => { const prueba = actual ? actual + ' ' + p : p; if (ancho(prueba, 'slam', size) > max && actual) { lineas.push(actual); actual = p; } else actual = prueba; });
    lineas.push(actual);
    const lh = size * 1.15, mw = Math.max(...lineas.map(l => ancho(l, 'slam', size))), extra = lineas.length > 1 ? 1.22 : 1;
    const w = mw * extra + size * 1.6, h = lineas.length * lh * extra + size * 1.1;
    save(x, y, k); ctx.globalAlpha *= a;
    const cx = colaX - x, cy = colaY - y, ang = Math.atan2(cy, cx), bx = Math.cos(ang) * w * 0.28, by = Math.sin(ang) * h * 0.3;
    const cola = () => { B(); ctx.moveTo(bx - 34 * Math.sin(ang), by + 34 * Math.cos(ang)); ctx.lineTo(cx / k, cy / k); ctx.lineTo(bx + 34 * Math.sin(ang), by - 34 * Math.cos(ang)); ctx.closePath(); };
    const cuerpo = () => ell(0, 0, w / 2, h / 2);
    cola(); line(K, 12); cuerpo(); line(K, 12);
    cola(); fill('#ffffff'); cuerpo(); fill('#ffffff');
    lineas.forEach((l, i) => texto(l, 0, (i - (lineas.length - 1) / 2) * lh, { size, f: 'slam', color: K }));
    restore();
  }
  // Estallido de cómic (el «¡POW!»).
  function estallido(x, y, r, color, { n = 12, rot = 0, k = 1 } = {}) {
    if (k <= 0) return;
    save(x, y, k, rot); B();
    for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n, rr2 = i % 2 ? r * 0.6 : r * (0.88 + 0.12 * ((i * 7) % 3) / 2); ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
    ctx.closePath(); fill(C(color)); line(K, 7); restore();
  }
  function destello(x, y, r, a = 1, color = '#fff6d0') {
    if (a <= 0) return;
    save(x, y); ctx.globalAlpha *= a; B();
    for (let i = 0; i < 8; i++) { const ang = i * Math.PI / 4, rr2 = i % 2 ? r * 0.2 : r; ctx.lineTo(Math.cos(ang) * rr2, Math.sin(ang) * rr2); }
    ctx.closePath(); fill(color); line(K, 3); restore();
  }
  // Flecha de cómic, de (x1,y1) a (x2,y2), curvada.
  function flecha(x1, y1, x2, y2, k = 1) {
    if (k <= 0) return;
    const mx = lerp(x1, x2, 0.5) + (y2 - y1) * 0.25, my = lerp(y1, y2, 0.5) - (x2 - x1) * 0.25;
    const ex = lerp(x1, x2, k), ey = lerp(y1, y2, k);
    quad(x1, y1, mx, my, ex, ey); line(K, 22); quad(x1, y1, mx, my, ex, ey); line(C(P.amarillo), 11);
    if (k > 0.95) { const ang = Math.atan2(y2 - my, x2 - mx); save(x2, y2, 1, ang); B(); ctx.moveTo(10, 0); ctx.lineTo(-42, -30); ctx.lineTo(-42, 30); ctx.closePath(); fill(C(P.amarillo)); line(K, 7); restore(); }
  }

  // ---------- fondos de cómic ----------
  function fondo(c) { ctx.fillStyle = typeof c === 'string' && c[0] === '#' ? C(c) : c; ctx.fillRect(-100, -100, W + 200, H + 200); }
  // Rayos de estallido alrededor de un centro.
  function rayos(cx, cy, giro, c1, c2, n = 18) {
    fondo(c1); ctx.fillStyle = C(c2); B();
    for (let k = 0; k < n; k++) { const a0 = giro + k * 2 * Math.PI / n, a1 = a0 + Math.PI / n; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a0) * 2600, cy + Math.sin(a0) * 2600); ctx.lineTo(cx + Math.cos(a1) * 2600, cy + Math.sin(a1) * 2600); ctx.closePath(); }
    ctx.fill();
  }
  // Trama de puntos de imprenta: crecen desde el centro hacia afuera (o al revés con r0 > r1).
  function trama(cx, cy, color, { paso = 24, r0 = 1, r1 = 8, x0 = 0, y0 = 0, x1 = W, y1 = H } = {}) {
    const maxd = Math.hypot(W, H) / 2; ctx.fillStyle = color; B();
    for (let y = y0 + paso / 2; y < y1; y += paso) for (let x = x0 + (Math.round((y - y0) / paso) % 2) * paso / 2; x < x1; x += paso) {
      const r = lerp(r0, r1, clamp(Math.hypot(x - cx, y - cy) / maxd)); if (r < 0.5) continue; ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  // Viñeta: marco blanco, contenido recortado (en coordenadas de la viñeta) y borde de tinta.
  function panel(x, y, w, h, { rot = 0, k = 1, a = 1, fondoC = P.papel, dibujo = null } = {}) {
    if (a <= 0 || k <= 0) return;
    save(x + w / 2, y + h / 2, k, rot); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 12, w + 20, h + 20);
    ctx.fillStyle = C(P.papel); ctx.fillRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
    ctx.save(); B(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip(); ctx.translate(-w / 2, -h / 2);
    ctx.fillStyle = C(fondoC); ctx.fillRect(0, 0, w, h); if (dibujo) dibujo(w, h);
    ctx.restore();
    B(); ctx.rect(-w / 2, -h / 2, w, h); line(K, 9);
    ctx.strokeStyle = K; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 24);
    restore();
  }
  // Dibuja algo en una capa aparte y lo pega con el contorno grueso de tinta de los cómics (y, si se pide, como
  // silueta negra encima: así aparecen los héroes antes de «encenderse»).
  function conTinta(fn, { g = 3, silueta = 0 } = {}) {
    if (!capaCv || capaCv.width !== cv.width || capaCv.height !== cv.height) {
      capaCv = document.createElement('canvas'); capaCv.width = cv.width; capaCv.height = cv.height; capaCtx = capaCv.getContext('2d');
    }
    const real = ctx, m = real.getTransform();
    capaCtx.setTransform(1, 0, 0, 1, 0, 0); capaCtx.clearRect(0, 0, capaCv.width, capaCv.height); capaCtx.setTransform(m);
    capaCtx.globalAlpha = 1; capaCtx.filter = 'none';
    ctx = capaCtx; let r; try { r = fn(); } finally { ctx = real; }
    const d = g * cv.width / W;
    real.save(); real.setTransform(1, 0, 0, 1, 0, 0);
    real.filter = `drop-shadow(${d}px 0 0 ${K}) drop-shadow(-${d}px 0 0 ${K}) drop-shadow(0 ${d}px 0 ${K}) drop-shadow(0 -${d}px 0 ${K})`;
    real.drawImage(capaCv, 0, 0); real.filter = 'none';
    if (silueta > 0) { real.globalAlpha = silueta; real.filter = 'brightness(0)'; real.drawImage(capaCv, 0, 0); real.filter = 'none'; }
    real.restore();
    return r;
  }

  // ---------- el logo de ejemplo (burbuja) y su teléfono ----------
  function burbuja(x, y, s, { brillo = 0, barras = 1, color = P.terra, rayas = '#f6f1e7' } = {}) {
    save(x, y, s);
    if (brillo > 0) { circ(0, 0, 150); fill(rgrad(0, 0, 10, 150, [[0, `rgba(255,200,120,${0.55 * brillo})`], [1, 'rgba(255,200,120,0)']])); }
    circ(0, 0, 80); fill(C(color));
    const hs = [36, 70, 36].map(h => h * (0.55 + 0.45 * barras));
    [-30, 0, 30].forEach((dx, i) => { seg2(dx, -hs[i] / 2, dx, hs[i] / 2); line(C(rayas), 13); });
    restore();
  }
  function avatar(x, y, r, c, pelo) {
    circ(x, y, r); fill(C(c)); line(K, 4);
    circ(x, y - r * 0.18, r * 0.42); fill(C(P.piel)); line(K, 3);
    B(); ctx.arc(x, y - r * 0.26, r * 0.44, Math.PI * 1.05, Math.PI * 1.95); line(C(pelo), r * 0.2);
  }
  // pantalla: logo | luna | llamando | nieta | bip | radio | familia
  function telefono(x, y, s, r = 0, { pantalla = 'logo', t = 0, brillo = 0 } = {}) {
    save(x, y, s, r);
    if (brillo > 0) { circ(0, 0, 240); fill(rgrad(0, 0, 20, 240, [[0, `rgba(255,236,170,${0.6 * brillo})`], [1, 'rgba(255,236,170,0)']])); }
    rr(-64, -128, 128, 256, 24); fill(C('#22232a')); line(K, 8);
    const oscura = pantalla === 'luna';
    rr(-55, -114, 110, 228, 14); fill(C(oscura ? '#26304f' : P.papel));
    if (pantalla === 'logo') burbuja(0, -6, 0.44, { brillo, barras: 0.7 + 0.3 * Math.abs(wob(t, 1.5)) });
    if (pantalla === 'luna') {
      circ(0, -24, 36); fill(C(P.mostaza)); circ(16, -36, 32); fill(C('#26304f'));
      texto('En silencio', 0, 50, { size: 17, f: 'slam', color: '#cfd6ea' });
    }
    if (pantalla === 'llamando' || pantalla === 'nieta') {
      avatar(0, -40, 34, pantalla === 'nieta' ? P.mostaza : P.cielo, '#5a3b26');
      texto(pantalla === 'nieta' ? 'Mi nieta' : 'Llamando...', 0, 22, { size: 18, f: 'slam', color: C(P.tinta) });
      circ(0, 74, 20); fill(C(P.verde));
    }
    if (pantalla === 'bip') {
      rr(-46, -86, 92, 120, 12); fill(C('#ffffff')); line(K, 3);
      rr(-46, -86, 92, 26, [12, 12, 0, 0]); fill(C(P.rojo));
      texto('11:00', 0, -24, { size: 26, f: 'slam', color: C(P.tinta) });
      texto('¡Hora!', 0, 70, { size: 22, f: 'slam', color: C(P.terra) });
    }
    if (pantalla === 'radio') {
      texto('RADIO', 0, -70, { size: 18, f: 'slam', color: C(P.tinta), track: 3 });
      rr(-40, -40, 80, 70, 10); fill(C(P.terra)); line(K, 3);
      [0, 1, 2, 3].forEach(i => { seg2(-26 + i * 17, -20, -26 + i * 17, 14); line(C(P.crema), 4); });
      texto('92.5', 0, 70, { size: 22, f: 'mono', color: C(P.tinta) });
    }
    if (pantalla === 'familia') {
      texto('Llamando a', 0, -80, { size: 15, f: 'medio', color: C(P.tinta) });
      texto('la familia', 0, -58, { size: 18, f: 'slam', color: C(P.tinta) });
      avatar(-24, -6, 22, P.cielo, '#5a3b26'); avatar(24, -6, 22, P.mostaza, '#2b211c'); avatar(0, 42, 22, P.menta, '#8d6b4a');
      circ(0, 88, 16); fill(C(P.verde));
    }
    restore();
  }

  // ---------- los héroes: Tata, Tita (y la nieta) ----------
  // Origen = los pies. brazos: [hombro, codo] en radianes (0 = colgando; positivo = hacia afuera y arriba).
  // sentado: el cuerpo baja 200 y se ven los muslos de frente. lentes: 'cara' | 'cabeza' | 'no'.
  // Devuelve dónde quedaron las manos, en coordenadas del cuadro.
  // tipo decide el peinado; mujer, mayor (arrugas), cejas, barba, aros y labios, los detalles de la cara.
  const PERS = {
    tata: { polera: '#c0573a', pant: '#1f3d40', zap: '#ffffff', pelo: '#f4f1ea', bigote: '#f4f1ea', capa: '#e3a83f', tipo: 'tata', mayor: true },
    tita: { polera: '#7d63b5', pant: '#2f6f8f', zap: '#ffffff', pelo: '#e8e4dc', capa: '#c0573a', tipo: 'tita', aros: '#e3a83f', labios: '#b5485a', mujer: true, mayor: true },
    nieta: { polera: '#e3a83f', pant: '#3f6b9a', zap: '#ececec', pelo: '#5a3b26', tipo: 'nieta', labios: '#c0573a', mujer: true, cejas: '#3b2418' },
    hija: { polera: '#2f6fb2', pant: '#3a3f4a', zap: '#3a2a20', pelo: '#4a2c1d', tipo: 'hija', labios: '#b5485a', aros: '#e3a83f', mujer: true, cejas: '#3b2418' },
    hijo: { polera: '#5aa36b', pant: '#3f6b9a', zap: '#ececec', pelo: '#6b4a32', tipo: 'hijo', cejas: '#4a3020', barba: '#6b4a32' },
    nieto: { polera: '#e07a55', pant: '#1f3d40', zap: '#ffffff', pelo: '#2b211c', tipo: 'nieto', cejas: '#2b211c' },
  };
  const TR = 7;
  function heroe(x, y, s, { quien = 'tata', bi = [0.15, 0.2], bd = [0.15, 0.2], paso = 0, salto = 0, cara = 'feliz', boca = 0.3, cabeza = 0,
    capa = 1, viento = 0, t = 0, lentes = 'cara', sentado = false, emblema = 0, logo = true,
    gorro = null, bufanda = null, barbaBlanca = 0, lentesSol = 0, babero = 0, mochila = 0 } = {}) {
    const Q = PERS[quien], manos = {}, dy = sentado ? 200 : 0;
    const PI_ = C(Q.piel || P.piel), PS_ = C(Q.pielSombra || P.pielSombra), NZ_ = C(Q.nariz || P.nariz);
    save(x, y - salto, s);
    if (!sentado) sombra(0, 6, 120, 18, 0.28);
    // la capa, detrás de todo
    if (capa > 0 && Q.capa) {
      const largo = sentado ? 230 : 540, f1 = wob(t, 1.1) * 26, f2 = wob(t, 1.6, 0.4) * 22, vx = viento * 160, y0 = -560 + dy;
      B(); ctx.moveTo(-92, y0); ctx.lineTo(92, y0);
      ctx.quadraticCurveTo(160 + vx * 0.5, y0 + largo * 0.5, 175 + vx + f1, y0 + largo);
      ctx.quadraticCurveTo(95 + vx * 0.9, y0 + largo - 40 + f2, 15 + vx * 0.8, y0 + largo + 12);
      ctx.quadraticCurveTo(-65 + vx * 0.7, y0 + largo - 40 - f2, -175 + vx * 0.6 - f1, y0 + largo);
      ctx.quadraticCurveTo(-160 + vx * 0.3, y0 + largo * 0.5, -92, y0);
      ctx.closePath(); pinta(C(Q.capa), -175, y0, 175, y0 + largo);
    }
    // piernas
    if (!sentado) {
      [[-1, paso], [1, -paso]].forEach(([d, a]) => {
        const hx = d * 42, hy = -330, kx = hx + Math.sin(a) * 150, ky = hy + Math.cos(a) * 150, fx = kx + Math.sin(a * 0.4) * 150, fy = Math.min(ky + 150, -8);
        B(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); line(K, 64 + TR * 2);
        B(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); line(C(Q.pant), 64);
        if (Q.descalzo) { ell(fx + d * 30, -16, 78, 30); pinta(PI_, fx + d * 30 - 78, -46, fx + d * 30 + 78, 14, TR); [0, 1, 2].forEach(k => { seg2(fx + d * (8 + k * 22), -40, fx + d * (14 + k * 22), -30); line(C(Q.pelo), 6); }); }
        else { ell(fx + d * 18, -14, 56, 26); fill(C(Q.zap)); line(K, TR);
        quad(fx + d * 18 - 30, -18, fx + d * 18, -30, fx + d * 18 + 34, -16); line(C(P.terra), 6); }
      });
    } else {
      [-1, 1].forEach(d => {
        B(); ctx.moveTo(d * 55, -110); ctx.lineTo(d * 62, -22); line(K, 58 + TR * 2);
        B(); ctx.moveTo(d * 55, -110); ctx.lineTo(d * 62, -22); line(C(Q.pant), 58);
        ell(d * 70, -14, 50, 24); fill(C(Q.zap)); line(K, TR);
      });
    }
    // torso
    const ty = -585 + dy;
    rr(-108, ty, 216, 280, [80, 80, 34, 34]); pinta(C(Q.polera), -108, ty, 108, ty + 280);
    if (Q.tipo === 'tata') { seg2(0, ty + 70, 0, ty + 268); line(C('#9d4630'), 6); quad(-60, ty + 2, 0, ty + 46, 60, ty + 2); line(C('#9d4630'), 10); }
    if (Q.tipo === 'tita') { quad(-62, ty + 4, 0, ty + 62, 62, ty + 4); line(C(P.crema), 16); quad(-62, ty + 4, 0, ty + 62, 62, ty + 4); line(K, 3); }
    if (Q.tipo === 'nieta' || Q.tipo === 'nieto') { quad(-60, ty + 2, 0, ty + 50, 60, ty + 2); line(C('#9d4630'), 10); seg2(-24, ty + 34, -24, ty + 110); line(C(P.crema), 5); seg2(24, ty + 34, 24, ty + 110); line(C(P.crema), 5); }
    if (Q.tipo === 'hija') { B(); ctx.moveTo(-46, ty + 4); ctx.lineTo(0, ty + 110); ctx.lineTo(46, ty + 4); ctx.closePath(); fill(C(P.crema)); line(K, 4); [-1, 1].forEach(d => { B(); ctx.moveTo(d * 46, ty + 4); ctx.lineTo(d * 16, ty + 120); ctx.lineTo(d * 70, ty + 60); ctx.closePath(); fill(C('#285f99')); line(K, 4); }); }
    if (Q.tipo === 'hijo') { [-1, 1].forEach(d => { B(); ctx.moveTo(0, ty + 6); ctx.lineTo(d * 52, ty + 2); ctx.lineTo(d * 30, ty + 46); ctx.closePath(); fill(C(P.crema)); line(K, 4); }); seg2(0, ty + 40, 0, ty + 270); line(C('#3f7f4f'), 5); }
    if (Q.chaleco) [-1, 1].forEach(d => { B(); ctx.moveTo(d * 30, ty + 8); ctx.lineTo(d * 104, ty + 30); ctx.lineTo(d * 104, ty + 262); ctx.lineTo(d * 26, ty + 270); ctx.closePath(); pinta(C(Q.chaleco), d * 104, ty, d * 26, ty + 270, 5); circ(d * 20, ty + 120, 7); fill(C(P.mostaza)); circ(d * 20, ty + 180, 7); fill(C(P.mostaza)); });
    if (Q.rayas) for (let k = 0; k < 5; k++) { rr(-104, ty + 60 + k * 44, 208, 16, 4); fill(C(Q.rayas)); }
    if (sentado) [-1, 1].forEach(d => { ell(d * 52, -128, 60, 44); pinta(C(Q.pant), d * 52 - 60, -172, d * 52 + 60, -84); });
    // el emblema del producto en el pecho
    if (Q.capa && logo) {
      const ey = ty + 135;
      if (emblema > 0) { circ(0, ey, 130); fill(rgrad(0, ey, 20, 130, [[0, `rgba(255,224,130,${0.8 * emblema})`], [1, 'rgba(255,224,130,0)']])); }
      circ(0, ey, 46); fill(C(P.crema)); line(K, 6);
      burbuja(0, ey, 0.38, { color: P.terra });
    }
    if (babero > 0) { save(0, ty + 10, babero); B(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-92, 150, 0, 170); ctx.quadraticCurveTo(92, 150, 70, 0); ctx.quadraticCurveTo(0, 30, -70, 0); pinta('#ffffff', -92, 0, 92, 170, 6); B(); ctx.moveTo(-60, 20); ctx.quadraticCurveTo(0, 46, 60, 20); line(C(P.rosa), 8); patito(0, 105, 0.55); restore(); }
    // brazos
    [['bi', -1, bi], ['bd', 1, bd]].forEach(([k, d, [h, c]]) => {
      const sx = d * 100, sy = -545 + dy, ex = sx + d * Math.sin(h) * 135, ey = sy + Math.cos(h) * 135;
      const wx = ex + d * Math.sin(h + c) * 125, wy = ey + Math.cos(h + c) * 125;
      B(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(wx, wy); line(K, 50 + TR * 2);
      B(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(wx, wy); line(C(Q.polera), 50);
      circ(wx, wy, 26); fill(PI_); line(K, 6);
      manos[k] = [x + wx * s, y - salto + wy * s];
    });
    // cabeza
    save(0, -700 + dy, 1, cabeza * 0.12);
    rr(-30, 70, 60, 50, 14); fill(PS_); line(K, 5);
    if (bufanda) { rr(-96, 92, 192, 54, 26); pinta(C(bufanda), -96, 92, 96, 146, 6); rr(40, 120, 46, 120, 14); pinta(C(bufanda), 40, 120, 86, 240, 6); }
    if (Q.tipo === 'nieta') {
      ell(0, 14, 120, 128); fill(C(Q.pelo)); line(K, TR);
      save(108, -40, 1, 0.45 + wob(t, 1.2) * 0.08); ell(30, 60, 34, 92, 0.15); fill(C(Q.pelo)); line(K, TR); restore();
    }
    if (Q.tipo === 'tita') { circ(0, -130, 46); fill(C(Q.pelo)); line(K, TR); quad(-30, -142, 0, -120, 30, -140); line(C('#c9c3b8'), 5); }
    if (Q.tipo === 'hija') { ell(0, -10, 126, 124); fill(C(Q.pelo)); line(K, TR); rr(-128, -20, 256, 112, [0, 0, 48, 48]); fill(C(Q.pelo)); line(K, TR); ell(0, -10, 120, 118); fill(C(Q.pelo)); }
    if (Q.tipo === 'hijo') { rr(-128, -70, 256, 230, [80, 80, 46, 46]); fill(C(Q.pelo)); line(K, TR); }
    if (Q.orejas === 'punta') [-1, 1].forEach(d => { B(); ctx.moveTo(d * 92, -18); ctx.quadraticCurveTo(d * 150, -40, d * 182, -92); ctx.quadraticCurveTo(d * 150, 30, d * 94, 40); ctx.closePath(); pinta(PS_, d * 92, -92, d * 182, 40, 5); });
    else if (Q.orejas === 'hobbit') [-1, 1].forEach(d => { B(); ctx.moveTo(d * 96, -10); ctx.quadraticCurveTo(d * 134, -40, d * 140, -70); ctx.quadraticCurveTo(d * 128, 20, d * 98, 34); ctx.closePath(); pinta(PS_, d * 96, -70, d * 140, 34, 5); });
    else { ell(-104, 10, 18, 26); fill(PS_); line(K, 5); ell(104, 10, 18, 26); fill(PS_); line(K, 5); }
    ell(0, 0, 102, 110); pinta(PI_, -102, -110, 102, 110);
    if (Q.tipo === 'tata') {
      [[-96, 10, 38], [96, 10, 38], [-84, -36, 32], [84, -36, 32], [-70, 56, 28], [70, 56, 28]].forEach(([a, b, r]) => { circ(a, b, r + 3.5); fill(K); });
      [[-96, 10, 38], [96, 10, 38], [-84, -36, 32], [84, -36, 32], [-70, 56, 28], [70, 56, 28]].forEach(([a, b, r]) => { circ(a, b, r); fill(C(Q.pelo)); });
      ell(-28, -70, 30, 14, -0.3); fill('rgba(255,255,255,.35)');
    }
    if (Q.tipo === 'tita') { // rulos alrededor de la frente y las sienes
      const rulos = []; for (let k = 0; k <= 10; k++) { const a = Math.PI * (0.98 + k * 0.104); rulos.push([Math.cos(a) * 98, Math.sin(a) * 100 - 6, k % 2 ? 30 : 34]); }
      rulos.push([-104, 34, 28], [104, 34, 28]);
      rulos.forEach(([a, b, r]) => { circ(a, b, r + 3.5); fill(K); });
      rulos.forEach(([a, b, r]) => { circ(a, b, r); fill(C(Q.pelo)); });
    }
    if (Q.tipo === 'hija') {
      B(); ctx.moveTo(-108, 18); ctx.quadraticCurveTo(-112, -126, 14, -122); ctx.quadraticCurveTo(118, -116, 108, 16); ctx.quadraticCurveTo(96, -62, 34, -76); ctx.quadraticCurveTo(-46, -66, -108, 18); fill(C(Q.pelo)); line(K, 5);
    }
    if (Q.tipo === 'hijo') { // pelo largo con partidura al medio (y barba de unos días)
      [-1, 1].forEach(d => { B(); ctx.moveTo(0, -114); ctx.quadraticCurveTo(d * 96, -116, d * 114, 30); ctx.lineTo(d * 98, 40); ctx.quadraticCurveTo(d * 82, -64, 0, -92); ctx.closePath(); fill(C(Q.pelo)); line(K, 5); });
    }
    if (Q.tipo === 'nieto') { // pelo corto y parado
      B(); ctx.moveTo(-104, -14); for (let k = 0; k <= 8; k++) { const x = -104 + k * 26, y = k % 2 ? -150 + (k % 3) * 8 : -104; ctx.lineTo(x, y); } ctx.lineTo(104, -14); ctx.quadraticCurveTo(70, -80, 0, -82); ctx.quadraticCurveTo(-70, -80, -104, -14); fill(C(Q.pelo)); line(K, 5);
    }
    if (Q.tipo === 'nieta') {
      B(); ctx.moveTo(-106, -4); ctx.quadraticCurveTo(-104, -126, 0, -120); ctx.quadraticCurveTo(112, -122, 106, 4); ctx.quadraticCurveTo(70, -66, -6, -70); ctx.quadraticCurveTo(-74, -58, -106, -4); fill(C(Q.pelo)); line(K, 5);
    }
    if (Q.tipo === 'hobbit') { const rul = []; for (let k = 0; k <= 12; k++) { const a = Math.PI * (0.95 + k * 0.092); rul.push([Math.cos(a) * 100, Math.sin(a) * 104 - 4, k % 2 ? 30 : 36]); } rul.push([-60, -96, 34], [0, -112, 36], [60, -96, 34], [-104, 30, 26], [104, 30, 26]); rul.forEach(([a, b, r]) => { circ(a, b, r + 3.5); fill(K); }); rul.forEach(([a, b, r]) => { circ(a, b, r); fill(C(Q.pelo)); }); }
    if (Q.tipo === 'orco') { B(); ctx.moveTo(-90, -40); ctx.quadraticCurveTo(-96, -120, -20, -118); ctx.lineTo(0, -150); ctx.lineTo(18, -116); ctx.quadraticCurveTo(96, -116, 90, -40); ctx.quadraticCurveTo(60, -86, 0, -84); ctx.quadraticCurveTo(-60, -86, -90, -40); fill(C(Q.pelo)); line(K, 5); }
    // cejas y ojos
    const sorpresa = cara === 'sorpresa', duda = cara === 'duda', enojo = cara === 'enojo', mujer = !!Q.mujer;
    [-1, 1].forEach(d => { save(d * 42, sorpresa ? -60 : enojo ? -34 : -44, 1, d * (enojo ? 0.45 : duda ? (d < 0 ? 0.3 : -0.25) : -0.1)); ell(0, 0, mujer ? 26 : Q.cejaGruesa ? 36 : 30, mujer ? 6 : Q.cejaGruesa ? 15 : 10); fill(C(Q.cejas || Q.bigote || '#bdb6aa')); restore(); });
    [-40, 40].forEach(cx => {
      if (cara === 'feliz') { quad(cx - 18, -4, cx, -20, cx + 18, -4); line(C('#3b2418'), 7); }
      else { ell(cx, -6, sorpresa ? 17 : 13, sorpresa ? 21 : 16); fill('#ffffff'); circ(cx + 2, -4, sorpresa ? 9 : 8); fill(C(Q.ojosRojos ? '#e2463a' : '#2a1a12')); circ(cx + 5, -8, 3); fill('#ffffff'); }
      if (mujer) { seg2(cx + Math.sign(cx) * 16, -12, cx + Math.sign(cx) * 26, -20); line(C('#3b2418'), 4); }
    });
    if (Q.mayor) [-1, 1].forEach(d => { seg2(d * 70, -2, d * 82, -8); line(PS_, 4); seg2(d * 70, 6, d * 82, 8); line(PS_, 4); });
    if (lentes === 'cara') { [-40, 40].forEach(cx => { rr(cx - 30, -32, 60, 52, 16); line(C('#3a3a3a'), 5); }); seg2(-10, -10, 10, -10); line(C('#3a3a3a'), 5); }
    ell(-62, 32, 20, 12); fill(C(P.rosa, 0.5)); ell(62, 32, 20, 12); fill(C(P.rosa, 0.5));
    if (Q.narizLarga) { B(); ctx.moveTo(-16, -4); ctx.quadraticCurveTo(34, 30, 74, 66); ctx.quadraticCurveTo(22, 52, -14, 40); ctx.closePath(); pinta(NZ_, -16, -4, 74, 66, 5); circ(50, 40, 7); fill(C('#5a7a3a')); }
    else if (mujer) { ell(0, 22, 22, 20); pinta(NZ_, -22, 2, 22, 42, 0); } else { ell(0, 24, 30, 27); pinta(NZ_, -30, -3, 30, 51, 0); }
    if (Q.barba) { ell(0, 66, 64, 32); fill(C(Q.barba, 0.25)); }
    const labio = C(Q.labios || '#7a2e26');
    if (boca > 0.5) { B(); ctx.moveTo(-34, 64); ctx.quadraticCurveTo(0, 64 + 46 * boca, 34, 64); ctx.closePath(); fill(C('#7a2e26')); line(K, 4); B(); ctx.moveTo(-26, 66); ctx.lineTo(26, 66); line('#ffffff', 6); }
    else if (enojo) { quad(-28, 84, 0, 62, 28, 84); line(labio, 7); }
    else if (duda) { quad(-20, 76, 0, 70, 22, 80); line(labio, 6); }
    else { quad(-26, 70, 0, 70 + 22 * (0.4 + boca), 26, 70); line(labio, 7); }
    if (Q.bigote) [[-28, 54], [28, 54]].forEach(([a, b], i) => { ell(a, b, 32, 15, i ? 0.22 : -0.22); pinta(C(Q.bigote), a - 32, b - 15, a + 32, b + 15, 4); });
    if (Q.aros) [-1, 1].forEach(d => { circ(d * 106, 44, 10); fill(C(Q.aros)); line(K, 4); });
    if (Q.colmillos) [-1, 1].forEach(d => { B(); ctx.moveTo(d * 18, 74); ctx.lineTo(d * 30, 40); ctx.lineTo(d * 40, 76); ctx.closePath(); fill('#fffbea'); line(K, 4); });
    if (barbaBlanca > 0) { ctx.save(); ctx.globalAlpha *= barbaBlanca; B(); ctx.moveTo(-92, 30); ctx.quadraticCurveTo(-100, 190, 0, 230); ctx.quadraticCurveTo(100, 190, 92, 30); ctx.quadraticCurveTo(50, 90, 0, 92); ctx.quadraticCurveTo(-50, 90, -92, 30); pinta('#f4f1ea', -100, 30, 100, 230, 6); [-1, 1].forEach(d => { ell(d * 28, 56, 34, 15, d * 0.22); pinta('#f4f1ea', d * 28 - 34, 41, d * 28 + 34, 71, 4); }); ctx.restore(); }
    if (lentesSol > 0) { ctx.save(); ctx.globalAlpha *= lentesSol; [-40, 40].forEach(cx => { rr(cx - 34, -30, 68, 46, 18); fill('#1d1d24'); line(K, 5); ell(cx - 12, -16, 12, 6, -0.3); fill('rgba(255,255,255,.4)'); }); seg2(-8, -12, 8, -12); line(K, 6); ctx.restore(); }
    if (gorro) sombrero(gorro, t);
    if (lentes === 'cabeza') { save(0, -96, 0.9, 0.05); [-40, 40].forEach(cx => { rr(cx - 30, -24, 60, 46, 16); fill('rgba(190,225,240,.55)'); line(C('#3a3a3a'), 6); }); seg2(-10, -4, 10, -4); line(C('#3a3a3a'), 6); restore(); }
    restore();
    restore();
    return manos;
  }
  // La mano que sostiene el teléfono: lo pone un poco más arriba que la mano, como si lo tomara de abajo.
  const enMano = ([hx, hy], s, dx = 0) => [hx + dx, hy - 92 * s];

  // ---------- muebles y lugares ----------
  function salon(noche = 0) {
    fondo(noche ? '#d8bf95' : '#f1dfbd');
    ctx.fillStyle = C(noche ? '#cdb184' : '#e8d2aa'); for (let x = 0; x < W; x += 120) ctx.fillRect(x, 0, 52, 900);
    // ventana
    rr(1390, 140, 360, 380, 8); fill(C(noche ? '#26304f' : '#a8d8ec')); line(K, 9);
    if (noche) { circ(1640, 230, 40); fill(C('#f4e7b8')); circ(1660, 220, 34); fill(C('#26304f')); const r = rng(9); for (let k = 0; k < 14; k++) destello(1410 + r() * 320, 160 + r() * 340, 7 + r() * 6, 0.8); }
    else { ell(1520, 300, 90, 40); fill('rgba(255,255,255,.8)'); }
    seg2(1570, 140, 1570, 520); line(K, 8); seg2(1390, 330, 1750, 330); line(K, 8);
    B(); ctx.moveTo(1360, 120); ctx.quadraticCurveTo(1440, 320, 1380, 560); ctx.lineTo(1340, 560); ctx.lineTo(1340, 120); ctx.closePath(); pinta(C(P.terra), 1340, 120, 1440, 560, 5);
    B(); ctx.moveTo(1780, 120); ctx.quadraticCurveTo(1700, 320, 1760, 560); ctx.lineTo(1800, 560); ctx.lineTo(1800, 120); ctx.closePath(); pinta(C(P.terra), 1700, 120, 1800, 560, 5);
    // cuadro en la pared
    rr(250, 190, 260, 190, 6); fill(C(P.madera)); line(K, 7); rr(270, 210, 220, 150, 4); fill(C(P.cielo));
    B(); ctx.moveTo(270, 360); ctx.lineTo(340, 270); ctx.lineTo(400, 330); ctx.lineTo(440, 290); ctx.lineTo(490, 360); ctx.closePath(); fill(C('#7a5f8f'));
    // piso y alfombra
    ctx.fillStyle = C('#b9875a'); ctx.fillRect(-100, 900, W + 200, 300); seg2(-100, 900, W + 100, 900); line(K, 7);
    ell(W / 2, 1000, 700, 70); fill(C(noche ? '#8d4a3a' : '#c96f55')); line(K, 5);
    // lámpara de pie
    seg2(170, 880, 170, 380); line(K, 16); seg2(170, 880, 170, 380); line(C('#c9a96e'), 8);
    B(); ctx.moveTo(100, 400); ctx.lineTo(240, 400); ctx.lineTo(205, 300); ctx.lineTo(135, 300); ctx.closePath(); pinta(C(P.mostaza), 100, 300, 240, 400, 6);
    if (noche) { circ(170, 420, 520); fill(rgrad(170, 420, 20, 520, [[0, 'rgba(255,214,140,.45)'], [1, 'rgba(255,214,140,0)']])); }
  }
  function sillonAtras(x, y, s, c) {
    save(x, y, s);
    rr(-240, -600, 480, 560, [120, 120, 20, 20]); pinta(C(c), -240, -600, 240, -40);
    rr(-215, -175, 430, 110, 30); pinta(C(c), -215, -175, 215, -65);
    rr(-215, -80, 430, 60, 16); pinta(C(c), -215, -80, 215, -20);
    [-180, 180].forEach(d => { rr(d - 16, -24, 32, 26, 6); fill(C(P.madera)); line(K, 5); });
    restore();
  }
  function sillonAdelante(x, y, s, c) {
    save(x, y, s);
    [-1, 1].forEach(d => { rr(d * 235 - 52, -360, 104, 340, [50, 50, 16, 16]); pinta(C(c), d * 235 - 52, -360, d * 235 + 52, -20); });
    restore();
  }
  function sofaAtras(x, y, s, c, ancho2 = 900) {
    save(x, y, s);
    rr(-ancho2 / 2, -600, ancho2, 560, [100, 100, 20, 20]); pinta(C(c), -ancho2 / 2, -600, ancho2 / 2, -40);
    rr(-ancho2 / 2 + 20, -175, ancho2 - 40, 110, 30); pinta(C(c), -ancho2 / 2, -175, ancho2 / 2, -65);
    rr(-ancho2 / 2 + 20, -80, ancho2 - 40, 60, 16); pinta(C(c), -ancho2 / 2, -80, ancho2 / 2, -20);
    restore();
  }
  function sofaAdelante(x, y, s, c, ancho2 = 900) {
    save(x, y, s);
    [-1, 1].forEach(d => { rr(d * ancho2 / 2 - 60, -380, 120, 360, [55, 55, 16, 16]); pinta(C(c), d * ancho2 / 2 - 60, -380, d * ancho2 / 2 + 60, -20); });
    restore();
  }




  // ---------- piezas extra (nube, mensaje de chat, micrófono, aviso, etiqueta) ----------
  // Nube de pensamiento con su texto, y las burbujitas que bajan hacia la cabeza.
  function nube(s, x, y, hx, hy, { k = 1, a = 1, size = 38, max = 480 } = {}) {
    if (k <= 0 || a <= 0) return;
    const palabras = s.split(' '), lineas = []; let act = '';
    palabras.forEach(p => { const pr = act ? act + ' ' + p : p; if (ancho(pr, 'slam', size) > max && act) { lineas.push(act); act = p; } else act = pr; });
    lineas.push(act);
    const w = Math.max(...lineas.map(l => ancho(l, 'slam', size))) + 110, h = lineas.length * size * 1.2 + 90;
    ctx.save(); ctx.globalAlpha *= a;
    [[0.25, 16], [0.55, 24]].forEach(([u, r]) => { circ(lerp(hx, x, u), lerp(hy, y + h / 2, u), r * k); fill('#ffffff'); line(K, 5); });
    save(x, y, k);
    const bultos = []; for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; bultos.push([Math.cos(an) * w / 2, Math.sin(an) * h / 2, 34 + (i % 3) * 8]); }
    bultos.forEach(([bx, by, r]) => { circ(bx, by, r + 4); fill(K); });
    ell(0, 0, w / 2 + 4, h / 2 + 4); fill(K);
    bultos.forEach(([bx, by, r]) => { circ(bx, by, r); fill('#ffffff'); });
    ell(0, 0, w / 2, h / 2); fill('#ffffff');
    lineas.forEach((l, i) => texto(l, 0, (i - (lineas.length - 1) / 2) * size * 1.2, { size, f: 'slam', color: C(P.tinta) }));
    restore(); ctx.restore();
  }
  // Mensaje de chat: verde si lo manda ella, blanco si llega; con micrófono si es dictado.
  function mensaje(s, x, y, { verde = true, mic = false, k = 1, a = 1, size = 32, max = 470, quien = '' } = {}) {
    if (k <= 0 || a <= 0) return;
    const palabras = s.split(' '), lineas = []; let act = '';
    palabras.forEach(p => { const pr = act ? act + ' ' + p : p; if (ancho(pr, 'slam', size) > max && act) { lineas.push(act); act = p; } else act = pr; });
    lineas.push(act);
    const extra = mic ? 46 : 0, lh = size * 1.25;
    const w = Math.max(...lineas.map(l => ancho(l, 'slam', size)), quien ? ancho(quien, 'slam', size * 0.75) : 0) + 56 + extra, h = lineas.length * lh + 34 + (quien ? size : 0);
    save(x, y, k); ctx.globalAlpha *= a;
    rr(-w / 2, -h / 2, w, h, 22); fill(C(verde ? P.wsp : '#ffffff')); line(K, 5);
    B(); if (verde) { ctx.moveTo(w / 2 - 24, h / 2 - 8); ctx.lineTo(w / 2 + 14, h / 2 + 12); ctx.lineTo(w / 2 - 50, h / 2 - 2); } else { ctx.moveTo(-w / 2 + 24, h / 2 - 8); ctx.lineTo(-w / 2 - 14, h / 2 + 12); ctx.lineTo(-w / 2 + 50, h / 2 - 2); }
    fill(C(verde ? P.wsp : '#ffffff'));
    let y0 = -h / 2 + 17 + lh / 2;
    if (quien) { texto(quien, -w / 2 + 28, y0 - 4, { size: size * 0.75, f: 'slam', color: C(P.terra), align: 'left' }); y0 += size; }
    if (mic) microfono(-w / 2 + 40, y0 + (lineas.length - 1) * lh / 2, 0.9);
    lineas.forEach((l, i) => texto(l, -w / 2 + 28 + extra, y0 + i * lh, { size, f: 'slam', color: C(P.tinta), align: 'left' }));
    restore();
  }
  function microfono(x, y, s) {
    save(x, y, s); rr(-9, -20, 18, 28, 9); fill(C(P.terra)); line(K, 3); B(); ctx.arc(0, -2, 15, 0.1, Math.PI - 0.1); line(K, 3); seg2(0, 13, 0, 21); line(K, 3); restore();
  }
  function aviso(titulo, cuerpo, x, y, { k = 1, a = 1, rojo = false, w = 470 } = {}) {
    if (k <= 0 || a <= 0) return;
    save(x, y, k); ctx.globalAlpha *= a;
    ctx.fillStyle = 'rgba(0,0,0,.22)'; rr(-w / 2 + 8, -48, w, 112, 20); ctx.fill();
    rr(-w / 2, -56, w, 112, 20); fill('#ffffff'); line(K, 5);
    circ(-w / 2 + 50, 0, 30); fill(C(rojo ? P.rojo : P.terra)); line(K, 4); burbuja(-w / 2 + 50, 0, 0.24, { color: '#ffffff', rayas: rojo ? P.rojo : P.terra });
    texto(titulo, -w / 2 + 96, -18, { size: 22, f: 'slam', color: C(rojo ? P.rojo : P.terra), align: 'left' });
    texto(cuerpo, -w / 2 + 96, 18, { size: 28, f: 'slam', color: C(P.tinta), align: 'left' });
    restore();
  }

  function etiqueta(s, x, y, a, derecha = false) {
    if (a <= 0) return;
    const w = ancho(s, 'slam', 26, 6) + 44;
    ctx.save(); ctx.globalAlpha *= a; rr(derecha ? x - w : x, y, w, 50, 25); fill(C(P.tinta, 0.88)); texto(s, derecha ? x - w / 2 : x + w / 2, y + 26, { size: 26, f: 'slam', color: C(P.crema), track: 6 }); ctx.restore();
  }

  // ---------- sombreros (heroe los dibuja con gorro: '...'; el centro de la cara es 0,0) ----------
  // fiesta, lana, boina, detective, casco (de soldado), gorra, bruja, calabaza (tallo de disfraz).
  function sombrero(tipo, t) {
    if (tipo === 'bruja') {
      ell(0, -96, 200, 36, -0.06); pinta(C('#2a1a3a'), -200, -132, 200, -60, 6);
      B(); ctx.moveTo(-86, -104); ctx.quadraticCurveTo(-40, -260, 60 + wob(t, 0.7) * 10, -400); ctx.quadraticCurveTo(40, -250, 92, -108); ctx.closePath(); pinta(C('#2a1a3a'), -86, -400, 92, -104, 6);
      rr(-90, -150, 180, 34, 8); fill(C('#7d63b5')); line(K, 5); rr(-22, -152, 44, 38, 6); fill(C(P.amarillo)); line(K, 4);
      return;
    }
    if (tipo === 'calabaza') { rr(-14, -150, 28, 46, 8); fill(C('#4a7a2a')); line(K, 5); ell(40, -140, 40, 16, -0.4); pinta(C(P.verde), 0, -156, 80, -124, 4); return; }
    if (tipo === 'fiesta') {
      save(14, -92, 1, 0.12 + wob(t, 0.8) * 0.03);
      const cono = () => { B(); ctx.moveTo(-74, 0); ctx.lineTo(74, 0); ctx.lineTo(0, -230); ctx.closePath(); };
      cono(); pinta(C(P.rojo), -74, -230, 74, 0, 0);
      ctx.save(); cono(); ctx.clip();
      [-30, -100, -170].forEach(y => { B(); ctx.moveTo(-80, y + 30); ctx.lineTo(80, y - 10); ctx.lineTo(80, y + 14); ctx.lineTo(-80, y + 54); ctx.closePath(); fill(C(P.amarillo)); });
      ctx.restore(); cono(); line(K, 6);
      circ(0, -236, 26); pinta(C(P.amarillo), -26, -262, 26, -210, 5);
      restore();
    }
    if (tipo === 'lana') {
      B(); ctx.moveTo(-104, -30); ctx.quadraticCurveTo(-110, -160, 0, -164); ctx.quadraticCurveTo(110, -160, 104, -30); ctx.closePath(); pinta(C(P.rojo), -110, -164, 110, -30, 6);
      rr(-112, -64, 224, 46, 20); pinta(C(P.crema), -112, -64, 112, -18, 6);
      circ(0, -170, 30); pinta(C(P.crema), -30, -200, 30, -140, 5);
    }
    if (tipo === 'boina') { ell(-14, -104, 124, 40, -0.18); pinta(C('#2b2b6b'), -138, -144, 110, -64, 6); seg2(-20, -144, -14, -166); line(K, 8); }
    if (tipo === 'detective') {
      ell(0, -86, 120, 34); pinta(C('#8a6a45'), -120, -120, 120, -52, 6);
      B(); ctx.moveTo(-98, -80); ctx.quadraticCurveTo(-100, -176, 0, -178); ctx.quadraticCurveTo(100, -176, 98, -80); ctx.closePath(); pinta(C('#a8845a'), -100, -178, 100, -80, 6);
      for (let k = -2; k <= 2; k++) { seg2(k * 34, -168, k * 40, -90); line(C('#8a6a45'), 5); }
    }
    if (tipo === 'gorra') { B(); ctx.moveTo(-102, -40); ctx.quadraticCurveTo(-104, -150, 0, -150); ctx.quadraticCurveTo(104, -150, 102, -40); ctx.closePath(); pinta(C(P.azul), -104, -150, 104, -40, 6); ell(70, -40, 90, 22, 0.08); pinta(C(P.azul), -20, -62, 160, -18, 6); }
    if (tipo === 'casco') {
      B(); ctx.moveTo(-110, -20); ctx.quadraticCurveTo(-112, -150, 0, -150); ctx.quadraticCurveTo(112, -150, 110, -20); ctx.closePath(); pinta(C('#4a4a52'), -112, -150, 112, -20, 6);
      B(); ctx.moveTo(-20, -146); ctx.lineTo(0, -230); ctx.lineTo(20, -146); ctx.closePath(); fill(C('#6a6a72')); line(K, 5);
      rr(-120, -44, 240, 30, 8); fill(C('#3a3a42')); line(K, 5);
    }
  }
  function patito(x, y, s) {
    save(x, y, s); ell(0, 10, 50, 36); fill(C(P.amarillo)); line(K, 5); circ(34, -26, 26); fill(C(P.amarillo)); line(K, 5);
    B(); ctx.moveTo(56, -26); ctx.lineTo(84, -18); ctx.lineTo(56, -12); ctx.closePath(); fill(C(P.terraClaro)); line(K, 4); circ(40, -32, 5); fill(K); restore();
  }


  // ---------- escenas de muestra (bórralas y escribe las tuyas) ----------
  function escena1(t) {
    rayos(W / 2, 620, t * 0.1, P.mostaza, P.terraClaro, 20);
    trama(W / 2, 620, 'rgba(160,60,30,.28)', { paso: 24, r0: 0.5, r1: 9 });
    const sube = easeOut(seg(t, 0.2, 1.2)), dy = (1 - sube) * 760;
    conTinta(() => {
      heroe(760, 1045 + dy, 0.9, { quien: 'tata', bi: [0.5, -1.4], bd: [0.5, -1.4], t, cara: 'feliz' });
      heroe(1160, 1045 + dy, 0.9, { quien: 'tita', bi: [0.5, -1.4], bd: [0.5, -1.4], t, cara: 'feliz', lentes: 'cara' });
    }, { silueta: 1 - ease(seg(t, 1.2, 1.8)) });
    golpe('¡SUPERPODERES!', W / 2, 150, 1.9, t, { size: 180, rot: -0.03 });
    caja(['DOS HÉROES', 'DE LARGA EXPERIENCIA'], 70, 850, { a: clamp((t - 0.6) * 5) });
  }
  function escena2(t) {
    salon(0);
    const x = 820, y = 1000, s = 0.95;
    sillonAtras(x, y, s, P.mostaza);
    const m = conTinta(() => heroe(x, y, s, { quien: 'tita', sentado: true, bi: [0.3, -1.1], bd: [0.9, 1.5], boca: hablar(t, 3.3, 5), t, lentes: 'cabeza' }));
    sillonAdelante(x, y, s, P.mostaza);
    const [fx, fy] = enMano(m.bd, 0.62, 8);
    telefono(fx, fy, 0.62, 0.12, { pantalla: 'logo', t });
    globo('¿Me leen mis mensajes?', 1290, 250, 930, 470, { size: 46, k: clamp(pop(t, 3.3, 16, 0.6)), a: vive(t, 3.3, 5.6) });
  }

  // ---------- el cuadro ----------
  const SACUDIDAS = [[3.0, 0.3, 12]];          // [segundo, duración, amplitud en px]: golpes de cámara
  const DESTELLOS = [[3.0, 0.12]];             // [segundo, duración]: fogonazo blanco al cortar de escena
  function seek(t) {
    t = clamp(t, 0, DUR - 1e-3);
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    let sx = 0, sy = 0;
    SACUDIDAS.forEach(([t0, d, amp]) => { if (t >= t0 && t < t0 + d) { const k = amp * (1 - (t - t0) / d); sx += Math.sin(t * 93) * k; sy += Math.cos(t * 71) * k; } });
    ctx.translate(sx, sy);
    if (t < T.s2) escena1(t); else escena2(t);
    ctx.restore();
    DESTELLOS.forEach(([tc, d]) => { const k = 1 - (t - tc) / d; if (t >= tc && k > 0) { ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(0, 0, W, H); } });
    ctx.globalCompositeOperation = 'overlay';
    const g = grano[Math.floor(t * 12) % 4];
    for (let x = 0; x < W; x += 256) for (let y = 0; y < H; y += 256) ctx.drawImage(g, x, y);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(vineta, 0, 0);
  }

  function montar(canvas) {
    cv = canvas; ctx = cv.getContext('2d');
    if (!grano.length) prepararTexturas();
    return { VIDEO: { w: W, h: H, duration: DUR }, seek };
  }
  global.Pelicula = { montar, W, H, DUR };
})(window);
