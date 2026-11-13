/* Motor suave de skill-motion: el estilo suave (trazo sin tinta, volumen con degradés,
 * grano de papel, viñeta). Copia este archivo a la carpeta de la película, cambia el nombre global del final y escribe
 * tus escenas. Para el estilo cómic (contornos de tinta, tramas, onomatopeyas) usa motor-base.js.
 *
 * Qué trae:
 *  - SAT (0 a 1): la saturación de todo lo que se pinta con C(). En 0 la escena queda en blanco y negro; subirla de a
 *    poco es «el color que vuelve» (por ejemplo, un teléfono que despierta y devuelve el color).
 *  - amigo(): dos personajes (amigo1, amigo2) que envejecen por época (0 joven, 1 adulto joven, 2 de terno, 3 maduro,
 *    4 hoy): ropa, peinado (jopo, melena, peinado, sienes), patillas, bigote, lentes (1 normales, 2 gruesos), audífono,
 *    sombrero (que se levanta), pajarita, corbata, ancho del cuerpo; sentado o de pie; cara feliz, normal, sorpresa, duda
 *    y «achina» (el que ve poco); devuelve las manos. Para otros personajes, agrega una entrada a AMIGOS.
 *  - novia(); pelota, escoba, moto, teléfono de mesa, celulares (uno de pantalla y uno con letras diminutas).
 *  - globo (diálogo suave), chatito (mensaje de chat), destello, insignia (el año arriba a la izquierda), vive, hablar.
 */
(function (global) {
  'use strict';
  const W = 1920, H = 1080, DUR = 6;
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
  const kf = keys => t => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [a, va] = keys[i - 1], [b, vb, e = ease] = keys[i];
      if (t <= b) return lerp(va, vb, e((t - a) / (b - a)));
    }
    return keys[keys.length - 1][1];
  };
  const track = (v0, keys) => t => { let v = v0, p = v0; for (const [tk, val, w, z] of keys) { v += (val - p) * spring(t - tk, w, z); p = val; } return v; };
  const rng = s => () => (s = (s + 0x6D2B79F5) | 0, s = Math.imul(s ^ (s >>> 15), 1 | s), s ^= s + Math.imul(s ^ (s >>> 7), 61 | s), ((s ^ (s >>> 14)) >>> 0) / 4294967296);
  const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * Math.PI * 2);
  const pop = (t, a, w = 16, z = 0.55) => spring(t - a, w, z);
  const BEAT = 0.5;
  const pulso = t => Math.exp(-((t % BEAT) / BEAT) * 5); // golpe en cada pulso, para que todo respire con la música

  // ---------- color (SAT 0 = blanco y negro, para 1969) ----------
  let SAT = 1;
  const cache = {};
  const rgb = h => cache[h] || (cache[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  function C(h, a = 1) {
    let [r, g, b] = rgb(h);
    if (SAT < 1) { const l = 0.3 * r + 0.59 * g + 0.11 * b; r = lerp(l, r, SAT); g = lerp(l, g, SAT); b = lerp(l, b, SAT); }
    return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  }
  const P = {
    tinta: '#1f3d40', terra: '#c0573a', terraClaro: '#e07a55', crema: '#f6efe2', mostaza: '#e3a83f', menta: '#9fd1b5',
    cielo: '#8fcbe3', rosa: '#ec9a8a', lila: '#a99bd0', piel: '#f1c09d', pielSombra: '#dc9c7a', nariz: '#e49b78',
    negro: '#16120f', blanco: '#ffffff', gris: '#8c8c8c', azul: '#2f6fb2', verde: '#5aa36b', madera: '#a86f45',
  };
  const F = { slam: "800 {s}px 'Manrope', 'Avenir Next', Arial, sans-serif", serif: "italic 400 {s}px 'Fraunces', Georgia, serif",
    mono: "500 {s}px 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace" };

  // ---------- lienzo y texturas ----------
  let cv, ctx, grano = [], vineta;
  function prepararTexturas() {
    const r = rng(17);
    for (let k = 0; k < 4; k++) {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'), im = g.createImageData(256, 256);
      for (let i = 0; i < im.data.length; i += 4) { const v = 110 + r() * 145 | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 20; }
      g.putImageData(im, 0, 0); grano.push(c);
    }
    vineta = document.createElement('canvas'); vineta.width = W; vineta.height = H;
    const g = vineta.getContext('2d'), gr = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.05);
    gr.addColorStop(0, 'rgba(20,12,8,0)'); gr.addColorStop(1, 'rgba(20,12,8,0.38)');
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
  function fillV(c, x0, y0, x1, y1, k = 1) {
    fill(c);
    ctx.fillStyle = grad(x0, y0, x1, y1, [[0, `rgba(255,248,235,${0.18 * k})`], [0.5, 'rgba(0,0,0,0)'], [1, `rgba(40,20,10,${0.22 * k})`]]);
    ctx.fill();
  }
  function sombra(x, y, rx, ry, a = 0.3) { save(x, y); ctx.scale(1, ry / rx); circ(0, 0, rx); fill(rgrad(0, 0, rx * 0.2, rx, [[0, `rgba(30,15,8,${a})`], [1, 'rgba(30,15,8,0)']])); restore(); }
  function texto(s, x, y, { size = 60, f = 'slam', color = '#000', align = 'center', a = 1, track = 0, base = 'middle' } = {}) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
    ctx.font = F[f].replace('{s}', size); if (track) ctx.letterSpacing = track + 'px';
    ctx.fillText(s, x, y); ctx.restore();
  }
  // Una palabra que entra rápido desde abajo con un poco de rebote, en su pulso.
  function slam(s, x, y, t0, t, { size = 180, color = P.tinta, f = 'slam', track = 0, desde = 120, align = 'center' } = {}) {
    if (t < t0) return;
    const k = pop(t, t0, 20, 0.6);
    save(x, y + (1 - k) * desde, 0.9 + 0.1 * k);
    texto(s, 0, 0, { size, color: C(color), f, track, a: clamp((t - t0) * 8), align });
    restore();
  }

  // ---------- el logo de ejemplo (burbuja) ----------
  function burbuja(x, y, s, { brillo = 0, barras = 1, color = P.terra, rayas = '#f6f1e7' } = {}) {
    save(x, y, s);
    if (brillo > 0) { circ(0, 0, 150); fill(rgrad(0, 0, 10, 150, [[0, `rgba(255,190,120,${0.5 * brillo})`], [1, 'rgba(255,190,120,0)']])); }
    circ(0, 0, 80); fill(C(color));
    const hs = [36, 70, 36].map(h => h * (0.55 + 0.45 * barras));
    [-30, 0, 30].forEach((dx, i) => { seg2(dx, -hs[i] / 2, dx, hs[i] / 2); line(C(rayas), 13); });
    restore();
  }


  function celular(x, y, s, tipo, r = 0, { brillo = 0 } = {}) {
    save(x, y, s, r);
    if (tipo === 'ladrillo') {
      rr(-50, -150, 100, 300, 16); fillV(C('#2b2b2e'), -50, -150, 50, 150); seg2(30, -150, 30, -230); line(C('#2b2b2e'), 14);
      rr(-36, -120, 72, 60, 6); fill(C('#9fc07a'));
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { rr(-34 + i * 24, -40 + j * 40, 20, 26, 5); fill(C('#d9d9d9')); }
    } else if (tipo === 'tapa') {
      rr(-50, -150, 100, 140, 18); fillV(C('#8fa0b8'), -50, -150, 50, -10); rr(-38, -136, 76, 100, 8); fill(C('#a9d2e8'));
      rr(-50, 0, 100, 150, 18); fillV(C('#8fa0b8'), -50, 0, 50, 150);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { rr(-34 + i * 24, 30 + j * 36, 20, 24, 5); fill(C('#eef2f6')); }
    } else {
      rr(-62, -125, 124, 250, 20); fillV(C('#22232a'), -62, -125, 62, 125); rr(-54, -112, 108, 224, 12); fill(C('#fbf3e4'));
      burbuja(0, -4, 0.4, { brillo });
    }
    restore();
  }

  function fondo(c) { ctx.fillStyle = typeof c === 'string' ? C(c) : c; ctx.fillRect(-100, -100, W + 200, H + 200); }

  // ---------- ayudas que faltan en el núcleo ----------
  const vive = (t, t0, t1, d = 0.18) => Math.min(clamp((t - t0) / d), clamp((t1 - t) / d));
  const hablar = (t, a, b, quieta = 0.3) => (t > a && t < b) ? 0.35 + 0.6 * Math.abs(Math.sin((t - a) * 13)) : quieta;
  function ancho(s, f, size) { ctx.save(); ctx.font = F[f].replace('{s}', size); const w = ctx.measureText(s).width; ctx.restore(); return w; }
  function partir(s, size, max, f = 'slam') {
    const pal = s.split(' '), out = []; let act = '';
    pal.forEach(p => { const pr = act ? act + ' ' + p : p; if (ancho(pr, f, size) > max && act) { out.push(act); act = p; } else act = pr; });
    out.push(act); return out;
  }
  // Globo de diálogo suave (sin tinta gruesa, como la primera película).
  function globo(s, x, y, colaX, colaY, { size = 40, a = 1, k = 1, max = 560, f = 'slam' } = {}) {
    if (a <= 0 || k <= 0) return;
    const lin = partir(s, size, max, f), lh = size * 1.2, mw = Math.max(...lin.map(l => ancho(l, f, size))), ex = lin.length > 1 ? 1.22 : 1;
    const w = mw * ex + size * 1.7, h = lin.length * lh * ex + size * 1.2;
    save(x, y, k); ctx.globalAlpha *= a;
    const cx = (colaX - x) / k, cy = (colaY - y) / k, ang = Math.atan2(cy, cx), bx = Math.cos(ang) * w * 0.26, by = Math.sin(ang) * h * 0.28;
    ctx.shadowColor = 'rgba(40,20,10,.22)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    B(); ctx.moveTo(bx - 30 * Math.sin(ang), by + 30 * Math.cos(ang)); ctx.lineTo(cx, cy); ctx.lineTo(bx + 30 * Math.sin(ang), by - 30 * Math.cos(ang)); ctx.closePath(); fill('#ffffff');
    ell(0, 0, w / 2, h / 2); fill('#ffffff');
    ctx.shadowColor = 'transparent';
    ell(0, 0, w / 2, h / 2); line(C(P.tinta, 0.25), 3);
    lin.forEach((l, i) => texto(l, 0, (i - (lin.length - 1) / 2) * lh, { size, f, color: C(P.tinta) }));
    restore();
  }
  function chatito(s, x, y, { verde = true, k = 1, a = 1, size = 32, max = 420, quien = '' } = {}) { // mensaje de chat
    if (k <= 0 || a <= 0) return;
    const lin = partir(s, size, max), lh = size * 1.25, w = Math.max(...lin.map(l => ancho(l, 'slam', size)), quien ? ancho(quien, 'slam', 22) : 0) + 50, h = lin.length * lh + 30 + (quien ? 26 : 0);
    save(x, y, k); ctx.globalAlpha *= a;
    ctx.shadowColor = 'rgba(40,20,10,.2)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    rr(-w / 2, -h / 2, w, h, 18); fill(C(verde ? '#dcf8c6' : '#ffffff')); ctx.shadowColor = 'transparent';
    let y0 = -h / 2 + 15 + lh / 2;
    if (quien) { texto(quien, -w / 2 + 25, y0 - 6, { size: 22, f: 'slam', color: C(P.terra), align: 'left' }); y0 += 26; }
    lin.forEach((l, i) => texto(l, -w / 2 + 25, y0 + i * lh, { size, f: 'slam', color: C(P.tinta), align: 'left' }));
    restore();
  }
  function destello(x, y, r, a = 1, color = '#fff6d0') {
    if (a <= 0 || r <= 0) return;
    save(x, y); ctx.globalAlpha *= a; B();
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, r2 = i % 2 ? r * 0.2 : r; ctx.lineTo(Math.cos(an) * r2, Math.sin(an) * r2); }
    ctx.closePath(); fill(color); restore();
  }
  function insignia(s, t, t0, t1) { // el año, arriba a la izquierda
    const a = vive(t, t0, t1, 0.3); if (a <= 0) return;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 10; texto(s, 70, 110, { size: 88, f: 'slam', color: 'rgba(250,244,232,.95)', align: 'left', a }); ctx.restore();
  }

  // ---------- dos amigos, época por época ----------
  // epoca: 0 colegio, 1 viaje, 2 matrimonio, 3 adultos, 4 hoy.
  const AMIGOS = {
    amigo1: [
      { polera: '#f4f4f4', corbata: '#1f3d40', pant: '#4a4f58', zap: '#1e1e1e', pelo: '#2b211c', peinado: 'jopo' },
      { polera: '#e3a83f', raya: '#c0573a', pant: '#3f6b9a', zap: '#6b4a32', pelo: '#3b2a20', peinado: 'melena', patillas: true },
      { polera: '#2a2a33', camisa: true, pajarita: '#16120f', pant: '#2a2a33', zap: '#16120f', pelo: '#3b2a20', peinado: 'peinado' },
      { polera: '#2f8c86', pant: '#c9b48a', zap: '#6b4a32', pelo: '#9a9a9a', peinado: 'sienes' },
      { polera: '#c0573a', pant: '#1f3d40', zap: '#ffffff', pelo: '#f4f1ea', peinado: 'sienes', audifono: true },
    ],
    amigo2: [
      { polera: '#f4f4f4', corbata: '#1f3d40', pant: '#4a4f58', zap: '#1e1e1e', pelo: '#6b4a32', peinado: 'peinado', ancho: 1.12 },
      { polera: '#8fb8d8', pant: '#c9b48a', zap: '#3a2a20', pelo: '#6b4a32', peinado: 'melena', bigote: '#5a3b26', ancho: 1.12 },
      { polera: '#5b6470', camisa: true, corbata: '#c0573a', pant: '#5b6470', zap: '#16120f', pelo: '#5a3b26', peinado: 'peinado', bigote: '#5a3b26', sombrero: '#3a3f4a', ancho: 1.15 },
      { polera: '#5aa36b', pant: '#4a4f58', zap: '#3a2a20', pelo: '#a8a8a8', peinado: 'peinado', bigote: '#9a9a9a', lentes: 1, ancho: 1.15 },
      { polera: '#2f5f7a', pant: '#5b6470', zap: '#ffffff', pelo: '#f4f1ea', peinado: 'peinado', bigote: '#f4f1ea', lentes: 2, ancho: 1.18 },
    ],
  };
  // Origen = los pies. Brazos [hombro, codo] como en heroe() (0 colgando; positivo afuera y arriba). Devuelve las manos.
  function amigo(x, y, s, { quien = 'amigo1', epoca = 4, bi = [0.15, 0.2], bd = [0.15, 0.2], paso = 0, salto = 0, cara = 'feliz', boca = 0.3, cabeza = 0, sentado = false, sombreroArriba = 0, piernas = true } = {}) {
    const R = AMIGOS[quien][epoca], an = R.ancho || 1, manos = {}, dy = sentado ? 200 : 0;
    save(x, y - salto, s);
    if (!sentado && piernas) sombra(0, 6, 120 * an, 18, 0.28);
    if (piernas && !sentado) {
      [[-1, paso], [1, -paso]].forEach(([d, a]) => {
        const hx = d * 42 * an, hy = -330, kx = hx + Math.sin(a) * 150, ky = hy + Math.cos(a) * 150, fx = kx + Math.sin(a * 0.4) * 150, fy = Math.min(ky + 150, -8);
        B(); ctx.moveTo(hx, hy); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); line(C(R.pant), 64);
        ell(fx + d * 18, -12, 56, 26); fillV(C(R.zap), fx - 38, -38, fx + 74, 14, 0.7);
      });
    }
    if (sentado && piernas) [-1, 1].forEach(d => { B(); ctx.moveTo(d * 55, -110); ctx.lineTo(d * 62, -22); line(C(R.pant), 58); ell(d * 70, -14, 50, 24); fillV(C(R.zap), d * 70 - 50, -38, d * 70 + 50, 10, 0.7); });
    // torso
    const ty = -585 + dy, tw = 216 * an;
    rr(-tw / 2, ty, tw, 280, [80, 80, 34, 34]); fillV(C(R.polera), -tw / 2, ty, tw / 2, ty + 280);
    if (R.raya) for (let k = 0; k < 3; k++) { ctx.save(); rr(-tw / 2, ty, tw, 280, [80, 80, 34, 34]); ctx.clip(); ctx.fillStyle = C(R.raya); ctx.fillRect(-tw / 2 - 10, ty + 85 + k * 70, tw + 20, 22); ctx.restore(); }
    if (R.camisa) { B(); ctx.moveTo(-46, ty + 4); ctx.lineTo(0, ty + 130); ctx.lineTo(46, ty + 4); ctx.closePath(); fill(C('#ffffff')); [-1, 1].forEach(d => { B(); ctx.moveTo(d * 46, ty + 4); ctx.lineTo(d * 12, ty + 140); ctx.lineTo(d * 74, ty + 70); ctx.closePath(); fill(C(R.polera === '#2a2a33' ? '#1d1d24' : '#4a525d')); }); }
    else if (!R.corbata) { quad(-56, ty + 4, 0, ty + 44, 56, ty + 4); line(C('#000000', 0.18), 8); }
    if (R.corbata) { if (!R.camisa) { B(); ctx.moveTo(-40, ty + 4); ctx.lineTo(0, ty + 40); ctx.lineTo(40, ty + 4); ctx.closePath(); fill(C('#ffffff')); } B(); ctx.moveTo(-12, ty + 22); ctx.lineTo(12, ty + 22); ctx.lineTo(8, ty + 150); ctx.lineTo(0, ty + 166); ctx.lineTo(-8, ty + 150); ctx.closePath(); fill(C(R.corbata)); }
    if (R.pajarita) { B(); ctx.moveTo(0, ty + 26); ctx.lineTo(-30, ty + 12); ctx.lineTo(-30, ty + 40); ctx.closePath(); ctx.moveTo(0, ty + 26); ctx.lineTo(30, ty + 12); ctx.lineTo(30, ty + 40); ctx.closePath(); fill(C(R.pajarita)); circ(0, ty + 26, 8); fill(C(R.pajarita)); }
    if (sentado && piernas) [-1, 1].forEach(d => { ell(d * 52 * an, -128, 60 * an, 44); fillV(C(R.pant), d * 52 - 60, -172, d * 52 + 60, -84); });
    // brazos
    [['bi', -1, bi], ['bd', 1, bd]].forEach(([k, d, [h, c]]) => {
      const sx = d * 100 * an, sy = -545 + dy, ex = sx + d * Math.sin(h) * 135, ey = sy + Math.cos(h) * 135;
      const wx = ex + d * Math.sin(h + c) * 125, wy = ey + Math.cos(h + c) * 125;
      B(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.lineTo(wx, wy); line(C(R.polera), 50);
      circ(wx, wy, 26); fillV(C(P.piel), wx - 26, wy - 26, wx + 26, wy + 26, 0.6);
      manos[k] = [x + wx * s, y - salto + wy * s];
    });
    // cabeza
    save(0, -700 + dy, 1, cabeza * 0.12);
    rr(-30, 70, 60, 50, 14); fill(C(P.pielSombra));
    if (R.peinado === 'melena') [-1, 1].forEach(d => { ell(d * 92, 10, 34, 74); fill(C(R.pelo)); });
    ell(-104, 10, 18, 26); fill(C(P.pielSombra)); ell(104, 10, 18, 26); fill(C(P.pielSombra));
    ell(0, 0, 102, 110); fillV(C(P.piel), -102, -110, 102, 110);
    if (R.peinado === 'sienes') {
      [[-96, 10, 38], [96, 10, 38], [-84, -36, 32], [84, -36, 32], [-70, 56, 28], [70, 56, 28]].forEach(([a, b2, r]) => { circ(a, b2, r); fill(C(R.pelo)); });
      ell(-28, -70, 30, 14, -0.3); fill('rgba(255,255,255,.3)');
    } else if (R.peinado === 'jopo') {
      B(); ctx.moveTo(-104, 0); ctx.quadraticCurveTo(-110, -120, 0, -128); ctx.quadraticCurveTo(120, -130, 106, -10); ctx.quadraticCurveTo(70, -70, -20, -76); ctx.quadraticCurveTo(-80, -70, -104, 0); fill(C(R.pelo));
      ell(30, -118, 70, 30, -0.2); fill(C(R.pelo));
    } else {
      B(); ctx.moveTo(-106, 6); ctx.quadraticCurveTo(-110, -120, -6, -122); ctx.quadraticCurveTo(110, -122, 106, 0); ctx.quadraticCurveTo(80, -74, 10, -70); ctx.quadraticCurveTo(-60, -66, -106, 6); fill(C(R.pelo));
      if (R.peinado === 'melena') { ell(-40, -96, 60, 26, -0.2); fill(C(R.pelo)); }
    }
    if (R.patillas) [-1, 1].forEach(d => { rr(d * 98 - 9, -20, 18, 66, 8); fill(C(R.pelo)); });
    // cejas y ojos
    const sorpresa = cara === 'sorpresa', duda = cara === 'duda', achina = cara === 'achina';
    [-1, 1].forEach(d => { save(d * 42, sorpresa ? -58 : -42, 1, d * (duda ? (d < 0 ? 0.3 : -0.25) : achina ? 0.2 : -0.1)); ell(0, 0, 30, 9); fill(C(R.bigote || (R.peinado === 'sienes' ? R.pelo : R.pelo))); restore(); });
    [-40, 40].forEach(cx => {
      if (cara === 'feliz') { quad(cx - 18, -4, cx, -20, cx + 18, -4); line(C('#3b2418'), 7); }
      else if (achina) { seg2(cx - 16, -6, cx + 16, -6); line(C('#3b2418'), 6); }
      else { ell(cx, -6, sorpresa ? 17 : 13, sorpresa ? 21 : 16); fill('#ffffff'); circ(cx + 2, -4, sorpresa ? 9 : 8); fill(C('#2a1a12')); circ(cx + 5, -8, 3); fill('#ffffff'); }
    });
    if (R.lentes) { const g = R.lentes === 2 ? 9 : 5; [-40, 40].forEach(cx => { rr(cx - 32, -34, 64, 54, 16); if (R.lentes === 2) fill('rgba(220,235,245,.35)'); rr(cx - 32, -34, 64, 54, 16); line(C('#3a3a3a'), g); }); seg2(-8, -10, 8, -10); line(C('#3a3a3a'), g); }
    ell(-62, 32, 20, 12); fill(C(P.rosa, 0.45)); ell(62, 32, 20, 12); fill(C(P.rosa, 0.45));
    ell(0, 24, 30, 27); fillV(C(P.nariz), -30, -3, 30, 51);
    if (boca > 0.5) { B(); ctx.moveTo(-34, 66); ctx.quadraticCurveTo(0, 66 + 46 * boca, 34, 66); ctx.closePath(); fill(C('#7a2e26')); B(); ctx.moveTo(-26, 68); ctx.lineTo(26, 68); line('#ffffff', 6); }
    else if (duda) { quad(-20, 76, 0, 70, 22, 80); line(C('#7a2e26'), 6); }
    else { quad(-26, 70, 0, 70 + 22 * (0.4 + boca), 26, 70); line(C('#7a2e26'), 7); }
    if (R.bigote) [[-28, 54], [28, 54]].forEach(([a, b2], i) => { ell(a, b2, 32, 15, i ? 0.22 : -0.22); fillV(C(R.bigote), a - 32, b2 - 15, a + 32, b2 + 15, 0.5); });
    if (R.audifono) { ell(112, 4, 11, 20, 0.2); fill(C('#e8c9a8')); line(C('#b08a68'), 3); }
    if (R.sombrero) { save(sombreroArriba * 20, -96 - sombreroArriba * 120, 1, -sombreroArriba * 0.3); ell(0, 0, 140, 22); fillV(C(R.sombrero), -140, -22, 140, 22); rr(-82, -80, 164, 82, [30, 30, 6, 6]); fillV(C(R.sombrero), -82, -80, 82, 0); ctx.fillStyle = C('#16120f'); ctx.fillRect(-82, -24, 164, 18); restore(); }
    restore();
    restore();
    return manos;
  }
  function novia(x, y, s, t) {
    save(x, y, s);
    B(); ctx.moveTo(-60, -560); ctx.lineTo(60, -560); ctx.lineTo(170, -10); ctx.lineTo(-170, -10); ctx.closePath(); fillV(C('#fbf7f0'), -170, -560, 170, -10);
    ell(0, -16, 170, 24); fill(C('#efe6d8'));
    rr(-70, -600, 140, 120, [60, 60, 20, 20]); fill(C('#fbf7f0'));
    save(0, -700); B(); ctx.moveTo(-60, -60); ctx.quadraticCurveTo(-200, 120, -150, 420); ctx.lineTo(150, 420); ctx.quadraticCurveTo(200, 120, 60, -60); ctx.closePath(); fill(C('#ffffff', 0.55));
    ell(0, 0, 96, 104); fillV(C(P.piel), -96, -104, 96, 104);
    B(); ctx.moveTo(-100, 10); ctx.quadraticCurveTo(-106, -116, 0, -118); ctx.quadraticCurveTo(106, -116, 100, 10); ctx.quadraticCurveTo(70, -60, 0, -66); ctx.quadraticCurveTo(-70, -60, -100, 10); fill(C('#4a2c1d'));
    circ(0, -120, 40); fill(C('#4a2c1d'));
    [-36, 36].forEach(cx => { quad(cx - 16, -4, cx, -18, cx + 16, -4); line(C('#3b2418'), 6); });
    ell(-56, 30, 18, 11); fill(C(P.rosa, 0.5)); ell(56, 30, 18, 11); fill(C(P.rosa, 0.5));
    quad(-22, 62, 0, 62 + 22 * (0.5 + 0.3 * Math.abs(Math.sin(t * 3))), 22, 62); line(C('#b5485a'), 7);
    restore();
    for (let i = 0; i < 5; i++) { circ(-30 + i * 15, -420 + (i % 2) * 14, 16); fill(C([P.rosa, '#ffffff', P.mostaza][i % 3])); }
    restore();
  }

  // ---------- objetos ----------
  function pelota(x, y, r, giro = 0) { save(x, y, 1, giro); circ(0, 0, r); fill('#ffffff'); line(C(P.negro, 0.6), 3); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; circ(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.22); fill(C(P.negro, 0.8)); } circ(0, 0, r * 0.25); fill(C(P.negro, 0.8)); restore(); }
  function escoba(x, y, s, r) { save(x, y, s, r); seg2(0, -260, 0, 40); line(C(P.madera), 12); rr(-50, 30, 100, 60, 12); fill(C('#d9b26a')); for (let i = 0; i < 8; i++) { seg2(-44 + i * 12.5, 80, -48 + i * 13.5, 120); line(C('#c79a4e'), 5); } restore(); }
  function moto(x, y, s, t, andando) {
    save(x, y, s);
    [-180, 180].forEach(d => { save(d, -60, 1, andando ? t * 9 : 0); circ(0, 0, 70); fill(C('#2a2a2e')); circ(0, 0, 40); fill(C('#c9c9c9')); for (let i = 0; i < 6; i++) { seg2(0, 0, Math.cos(i) * 40, Math.sin(i) * 40); line(C('#7a7a7a'), 3); } restore(); });
    B(); ctx.moveTo(-200, -90); ctx.quadraticCurveTo(-60, -170, 120, -150); ctx.lineTo(200, -90); ctx.lineTo(120, -70); ctx.lineTo(-120, -70); ctx.closePath(); fillV(C(P.terra), -200, -170, 200, -70);
    rr(-150, -190, 220, 40, 18); fill(C('#2a2a2e')); seg2(150, -150, 190, -250); line(C('#7a7a7a'), 10); seg2(170, -250, 220, -260); line(C('#2a2a2e'), 12); circ(205, -150, 18); fill(C(P.mostaza));
    seg2(-200, -70, -260, -40); line(C('#9a9a9a'), 14);
    restore();
  }
  function telefonoVintage(x, y, s, sonando, t) { // teléfono de mesa, para la llamada que no se oye
    save(x + (sonando ? Math.sin(t * 60) * 3 : 0), y, s);
    B(); ctx.moveTo(-110, 60); ctx.quadraticCurveTo(-100, -40, 0, -46); ctx.quadraticCurveTo(100, -40, 110, 60); ctx.closePath(); fillV(C(P.terra), -110, -46, 110, 60);
    rr(-130, -96, 260, 50, 25); fillV(C(P.terra), -130, -96, 130, -46);
    circ(0, 14, 34); fill(C(P.crema));
    restore();
    if (sonando) for (let i = 0; i < 3; i++) { const f = (t * 1.6 + i / 3) % 1; B(); ctx.arc(x, y - 40 * s, 80 * s + f * 120, -2.6, -0.5); line(C(P.terra, 0.7 * (1 - f)), 6); }
  }
  function celularEn(x, y, s, r, { brillo = 0, t = 0, ondas = 0 } = {}) {
    celular(x, y, s, 'pantalla', r, { brillo });
    if (ondas > 0) for (let i = 0; i < 3; i++) { const f = (t * 1.4 + i / 3) % 1; B(); ctx.arc(x, y, 60 * s / 0.6 + f * 150, -2.4, -0.7); line(C(P.azul, 0.7 * (1 - f) * ondas), 6); }
  }
  function telefonoChico(x, y, s, r = 0, { letras = true } = {}) { // el celular común, con letras diminutas
    save(x, y, s, r); rr(-62, -125, 124, 250, 20); fillV(C('#22232a'), -62, -125, 62, 125); rr(-54, -112, 108, 224, 12); fill('#ffffff');
    if (letras) { const r2 = rng(9); ctx.fillStyle = C('#9a9a9a'); for (let i = 0; i < 15; i++) ctx.fillRect(-44, -100 + i * 13, 40 + r2() * 44, 3); }
    restore();
  }


  // ---------- escena de muestra: los mismos amigos en 1965 y hoy ----------
  function fondo(c) { ctx.fillStyle = typeof c === 'string' ? C(c) : c; ctx.fillRect(-100, -100, W + 200, H + 200); }
  function seek(t) {
    t = clamp(t, 0, DUR - 1e-3);
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    SAT = t < 3 ? 1 : lerp(0, 1, seg(t, 4, 5));
    fondo(grad(0, 0, 0, 900, [[0, C('#86c5e4')], [1, C('#e8f3f6')]])); ctx.fillStyle = C('#9cc77a'); ctx.fillRect(-100, 820, W + 200, 400);
    const ep = t < 3 ? 0 : 4;
    amigo(760, 1000, 0.8, { quien: 'amigo1', epoca: ep, cara: 'feliz', boca: 0.6, bd: [2.6, 0.4] });
    amigo(1160, 1000, 0.8, { quien: 'amigo2', epoca: ep, cara: ep ? 'achina' : 'feliz', boca: 0.5 });
    insignia(t < 3 ? '1965' : 'HOY', t, 0, DUR);
    globo('¿Te acuerdas del vidrio de la dirección?', 960, 200, 1160, 450, { size: 40, a: vive(t, 1, 2.8) });
    SAT = 1;
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
