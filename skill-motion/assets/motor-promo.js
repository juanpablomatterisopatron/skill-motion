/* motor-promo.js: piezas para un video comercial o demo de producto de ritmo alto.
   Nada de personajes ni de cómic: tipografía que entra en el pulso, ventanas flotando en perspectiva real,
   barridos, partículas y color de cine sobre capturas reales del producto.
   Todo es función pura de t. Sin Math.random ni estado: si un cuadro depende del anterior, el render sale distinto.

   Uso:  const P = MotorPromo.crear(ctx, { W: 1920, H: 1080, bpm: 120, fase: 0, sans: 'Sora, sans-serif' });
   Vertical (Reels e historias): crear con W: 1080, H: 1920; las piezas usan W y H, no números fijos.
   fps (30 por defecto) solo sirve para convertir cuadros a segundos (cuadros, escalonar, apretón del clic).
   Movimiento continuo y cursor en arco: entra, sale, deriva, empuje, escalonar, cursor, tecleo (ver motor-visual.md §11).
   Acotaciones en pantalla y plano técnico: asset aparte, motor-acotaciones.js (se incluye junto a este o a cualquier motor). */
const MotorPromo = (() => {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const k = clamp((v - a) / (b - a)); return k * k * (3 - 2 * k); };
  const lin = (a, b, v) => clamp((v - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const ease = {
    outExpo: k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k)),
    outCubic: k => 1 - Math.pow(1 - k, 3),
    inCubic: k => k * k * k,
    inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outBack: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    resorte: k => 1 - Math.exp(-6 * k) * Math.cos(11 * k)
  };
  const rng = s => { let a = (s * 2654435761) >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  function crear(x, o = {}) {
    const W = o.W || 1920, H = o.H || 1080, bpm = o.bpm || 120, fase = o.fase || 0, BEAT = 60 / bpm;
    const SANS = o.sans || '"Sora", "Avenir Next", -apple-system, sans-serif';

    /* ---------- pulso ---------- */
    // golpe(t): 1 justo en el pulso y cae a 0; sirve para que algo «respire» con la música
    const golpe = (t, cada = 1) => { const p = BEAT * cada, u = (((t - fase) % p) + p) % p; return Math.exp(-u * 7); };
    const pulsoN = t => Math.floor((t - fase) / BEAT);
    const enPulso = n => fase + n * BEAT;

    /* ---------- texto ---------- */
    function fuente(size, peso = 800) { x.font = `${peso} ${size}px ${SANS}`; }
    // línea que sube desde detrás de una máscara: el corte más limpio que hay para texto grande
    function mascara(s, px, py, size, t, t0, { col = '#fff', peso = 800, al = 'center', dur = 0.45, sale = null, salida = 0.3, track = -0.02 } = {}) {
      const k = ease.outExpo(lin(t0, t0 + dur, t)); if (k <= 0) return;
      const fu = sale != null ? ease.inCubic(lin(sale, sale + salida, t)) : 0; if (fu >= 1) return;
      x.save(); fuente(size, peso); x.letterSpacing = `${size * track}px`; x.textAlign = al; x.textBaseline = 'alphabetic'; x.fillStyle = col;
      const w = x.measureText(s).width, x0 = al === 'center' ? px - w / 2 : al === 'right' ? px - w : px;
      x.beginPath(); x.rect(x0 - size, py - size * 1.02, w + size * 2, size * 1.32); x.clip();
      x.fillText(s, px, py + (1 - k) * size * 1.2 - fu * size * 1.3); x.restore();
    }
    // palabras que entran una por una, cada una en su pulso; devuelve el ancho total
    function palabras(lista, px, py, size, t, t0, { paso = BEAT, col = '#fff', cols = null, peso = 800, gap = 0.28, al = 'center' } = {}) {
      x.save(); fuente(size, peso); x.letterSpacing = `${size * -0.02}px`;
      const an = lista.map(s => x.measureText(s).width), tot = an.reduce((a, b) => a + b, 0) + gap * size * (lista.length - 1);
      let cx = al === 'center' ? px - tot / 2 : px; x.restore();
      lista.forEach((s, i) => { mascara(s, cx, py, size, t, t0 + i * paso, { col: cols ? cols[i % cols.length] : col, peso, al: 'left' }); cx += an[i] + gap * size; });
      return tot;
    }
    // número que cuenta hasta su valor
    function contador(v, px, py, size, t, t0, { dur = 0.8, col = '#fff', fmt = n => Math.round(n).toLocaleString('es-CL'), peso = 800, al = 'center' } = {}) {
      if (t < t0) return; const k = ease.outExpo(lin(t0, t0 + dur, t));
      x.save(); fuente(size, peso); x.textAlign = al; x.fillStyle = col; x.fillText(fmt(v * k), px, py); x.restore();
    }

    /* ---------- color ---------- */
    // grada(): color de cine para una captura o un render 3D: saturación, contraste, viñeta y brillo suave
    function grada(im, { sat = 1.22, con = 1.06, bri = 1.02, bloom = 0.16, vin = 0.3 } = {}) {
      if (!im) return;
      x.save(); x.filter = `saturate(${sat}) contrast(${con}) brightness(${bri})`; x.drawImage(im, 0, 0, W, H); x.restore();
      if (bloom > 0) { x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = bloom; x.filter = 'blur(26px) brightness(1.15)'; x.drawImage(im, 0, 0, W, H); x.restore(); }
      vineta(vin);
    }
    function vineta(a = 0.3) { if (a <= 0) return; const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`); x.fillStyle = g; x.fillRect(0, 0, W, H); }

    /* ---------- perspectiva real en canvas 2D ---------- */
    // plano(): dibuja img como un plano 3D. Cada celda se proyecta con una transformación afín por triángulo.
    // cfg: { x, y, z } centro (px, z>0 se aleja), { w, h } tamaño, { rx, ry, rz } giros en grados, a alfa, cel celdas
    const FOCAL = 1400;
    function proyecta(p, cfg) {
      const rx = (cfg.rx || 0) * Math.PI / 180, ry = (cfg.ry || 0) * Math.PI / 180, rz = (cfg.rz || 0) * Math.PI / 180;
      let [a, b, c] = p;
      [a, b] = [a * Math.cos(rz) - b * Math.sin(rz), a * Math.sin(rz) + b * Math.cos(rz)];
      [b, c] = [b * Math.cos(rx) - c * Math.sin(rx), b * Math.sin(rx) + c * Math.cos(rx)];
      [a, c] = [a * Math.cos(ry) + c * Math.sin(ry), -a * Math.sin(ry) + c * Math.cos(ry)];
      const z = c + (cfg.z || 0), f = FOCAL / (FOCAL + z);
      return [(cfg.x ?? W / 2) + a * f, (cfg.y ?? H / 2) + b * f, f];
    }
    function tri(im, s0, s1, s2, d0, d1, d2) {
      const [a, b] = d0, [e, f] = d1, [h, g] = d2; // puntos en pantalla; el tercer valor de proyecta es la escala
      x.save(); x.beginPath();
      // el triángulo se agranda medio píxel para que no se vean las costuras
      const mx = (a + e + h) / 3, my = (b + f + g) / 3, en = q => { const dx = q[0] - mx, dy = q[1] - my, l = Math.hypot(dx, dy) || 1; return [q[0] + dx / l * 0.7, q[1] + dy / l * 0.7]; };
      const p0 = en(d0), p1 = en(d1), p2 = en(d2); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.closePath(); x.clip();
      const [u0, v0] = s0, [u1, v1] = s1, [u2, v2] = s2, den = (u1 - u0) * (v2 - v0) - (u2 - u0) * (v1 - v0);
      const m11 = ((e - a) * (v2 - v0) - (h - a) * (v1 - v0)) / den, m12 = ((f - b) * (v2 - v0) - (g - b) * (v1 - v0)) / den;
      const m21 = ((h - a) * (u1 - u0) - (e - a) * (u2 - u0)) / den, m22 = ((g - b) * (u1 - u0) - (f - b) * (u2 - u0)) / den;
      x.transform(m11, m12, m21, m22, a - m11 * u0 - m21 * v0, b - m12 * u0 - m22 * v0);
      x.drawImage(im, 0, 0); x.restore();
    }
    function plano(im, cfg) {
      if (!im) return; const iw = im.width, ih = im.height, w = cfg.w || iw, h = cfg.h || ih, n = cfg.cel || 8, m = cfg.celV || Math.max(4, Math.round(n * h / w));
      const P = (i, j) => proyecta([(i / n - 0.5) * w, (j / m - 0.5) * h, 0], cfg), S = (i, j) => [i / n * iw, j / m * ih];
      const es = [P(0, 0), P(n, 0), P(n, m), P(0, m)];
      if (cfg.sombra !== 0) { x.save(); x.globalAlpha = (cfg.a ?? 1) * 0.5; x.filter = `blur(${cfg.sombra || 34}px)`; x.fillStyle = '#000'; x.beginPath(); es.forEach((q, k) => { const yy = q[1] + 34; k ? x.lineTo(q[0], yy) : x.moveTo(q[0], yy); }); x.closePath(); x.fill(); x.restore(); }
      x.save(); x.globalAlpha = cfg.a ?? 1;
      for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); tri(im, S(i, j), S(i + 1, j), S(i + 1, j + 1), a, b, c); tri(im, S(i, j), S(i + 1, j + 1), S(i, j + 1), a, c, d); }
      x.restore();
    }

    /* ---------- marcos ---------- */
    // ventana(): tarjeta de navegador con barra, en un canvas propio; se guarda por clave para no rearmarla en cada cuadro
    const cache = new Map();
    function ventana(clave, im, { w = 1500, barra = 44, radio = 18, titulo = '', fondo = '#fff', recorte = null } = {}) {
      if (!im) return null; if (cache.has(clave)) return cache.get(clave);
      const r = recorte || [0, 0, im.width, im.height], h = Math.round(w * r[3] / r[2]) + barra, c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d');
      q.beginPath(); q.roundRect(0, 0, w, h, radio); q.clip(); q.fillStyle = fondo; q.fillRect(0, 0, w, h);
      q.fillStyle = '#eceae3'; q.fillRect(0, 0, w, barra); [['#ff5f57', 26], ['#febc2e', 50], ['#28c840', 74]].forEach(([k, px]) => { q.fillStyle = k; q.beginPath(); q.arc(px, barra / 2, 7, 0, 7); q.fill(); });
      if (titulo) { q.fillStyle = '#fff'; q.beginPath(); q.roundRect(w / 2 - 300, 9, 600, barra - 18, 8); q.fill(); q.fillStyle = '#5b6660'; q.font = `600 15px ${SANS}`; q.textAlign = 'center'; q.fillText(titulo, w / 2, barra / 2 + 5); }
      q.drawImage(im, r[0], r[1], r[2], r[3], 0, barra, w, h - barra);
      cache.set(clave, c); return c;
    }
    // telefono(): celular con la imagen adentro, también guardado
    function telefono(clave, im, { w = 420, h = 860, recorte = null } = {}) {
      if (!im) return null; if (cache.has(clave)) return cache.get(clave);
      const c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'), b = 16, rr = 54;
      q.fillStyle = '#0d1311'; q.beginPath(); q.roundRect(0, 0, w, h, rr); q.fill();
      q.save(); q.beginPath(); q.roundRect(b, b, w - b * 2, h - b * 2, rr - 12); q.clip(); const r = recorte || [0, 0, im.width, im.height]; q.drawImage(im, r[0], r[1], r[2], r[3], b, b, w - b * 2, h - b * 2); q.restore();
      q.fillStyle = '#0d1311'; q.beginPath(); q.roundRect(w / 2 - 58, b + 10, 116, 28, 14); q.fill();
      cache.set(clave, c); return c;
    }
    // tarjeta(): caja de interfaz clara con sombra, para datos dibujados por código
    function tarjeta(px, py, w, h, { fondo = '#fff', r = 22, a = 1, sombra = 30 } = {}) {
      x.save(); x.globalAlpha = a; x.shadowColor = 'rgba(0,0,0,.28)'; x.shadowBlur = sombra; x.shadowOffsetY = 14; x.fillStyle = fondo; x.beginPath(); x.roundRect(px, py, w, h, r); x.fill(); x.restore();
    }
    function pastilla(s, px, py, { size = 22, fondo = '#fff', col = '#111', a = 1, al = 'left', peso = 700 } = {}) {
      x.save(); x.globalAlpha = a; fuente(size, peso); const w = x.measureText(s).width + size * 1.5, h = size * 1.9, x0 = al === 'right' ? px - w : al === 'center' ? px - w / 2 : px;
      x.fillStyle = fondo; x.beginPath(); x.roundRect(x0, py, w, h, h / 2); x.fill(); x.fillStyle = col; x.textAlign = 'center'; x.fillText(s, x0 + w / 2, py + h * 0.68); x.restore(); return w;
    }

    /* ---------- transiciones ---------- */
    // barrido(): franjas de color que cruzan la pantalla y dejan ver la escena nueva. k de 0 a 1
    function barrido(k, cols = ['#e0457b', '#ffc53d', '#0e2a1f']) {
      cols.forEach((c, i) => { const d = i * 0.09, e = ease.inOutCubic(lin(d, 1 - (cols.length - 1 - i) * 0.09, k)), a = W * 1.5; const px = -W * 0.3 + (e - 0.5) * 2 * a; x.save(); x.fillStyle = c; x.beginPath(); x.moveTo(px - W * 0.1, 0); x.lineTo(px + W * 1.1, 0); x.lineTo(px + W * 0.9, H); x.lineTo(px - W * 0.3, H); x.closePath(); x.fill(); x.restore(); });
    }
    // iris con forma de círculo: revela lo de adentro; dibuja(ctx) pinta lo que se ve dentro
    function iris(k, cx, cy, dibuja) { const r = ease.inOutCubic(clamp(k)) * Math.hypot(W, H); x.save(); x.beginPath(); x.arc(cx, cy, Math.max(r, 0.1), 0, 7); x.clip(); dibuja(); x.restore(); }
    function destello(t, t0, dur = 0.22, a = 0.7) { const k = lin(t0, t0 + dur, t); if (k <= 0 || k >= 1) return; x.fillStyle = `rgba(255,255,255,${a * (1 - k)})`; x.fillRect(0, 0, W, H); }
    // sacudida: mover el lienzo unos cuadros después de un golpe
    function sacudida(t, t0, f = 16, dur = 0.3) { const k = lin(t0, t0 + dur, t); if (k <= 0 || k >= 1) return [0, 0]; const r = rng(Math.floor(t * 60)); return [(r() - 0.5) * f * (1 - k), (r() - 0.5) * f * (1 - k)]; }

    /* ---------- partículas ---------- */
    // estallido de pétalos o confeti: posición cerrada en t, sin estado
    function estallido(t, t0, { n = 90, cx = W / 2, cy = H / 2, cols = ['#e0457b', '#ffc53d', '#7b4bb3', '#fff'], vel = 1100, g = 900, dur = 2.2, tam = 16, sem = 3, forma = 'petalo' } = {}) {
      const u = t - t0; if (u <= 0 || u > dur) return; const r = rng(sem), a0 = 1 - lin(dur * 0.65, dur, u);
      for (let i = 0; i < n; i++) {
        const an = r() * 6.283, v = vel * (0.25 + r() * 0.85), k = r() * 9 - 4.5, gi = r() * 6.283, s = tam * (0.5 + r()), c = cols[Math.floor(r() * cols.length)], fr = 1.5 + r();
        const d = (1 - Math.exp(-fr * u)) / fr, px = cx + Math.cos(an) * v * d, py = cy + Math.sin(an) * v * d + 0.5 * g * u * u * 0.45;
        x.save(); x.globalAlpha = a0; x.translate(px, py); x.rotate(gi + k * u); x.fillStyle = c; x.beginPath(); if (forma === 'petalo') x.ellipse(0, 0, s, s * 0.48, 0, 0, 7); else x.rect(-s / 2, -s / 3, s, s * 0.66); x.fill(); x.restore();
      }
    }
    // lluvia lenta de pétalos a través de la pantalla, para fondos
    function petalos(t, { n = 40, cols = ['#e0457b', '#ffc53d', '#fff'], sem = 8, a = 0.9, tam = 13 } = {}) {
      const r = rng(sem); for (let i = 0; i < n; i++) { const sx = r() * W, fa = r(), v = 80 + r() * 120, am = 30 + r() * 60, s = tam * (0.6 + r()), c = cols[i % cols.length], py = ((fa * (H + 80) + t * v) % (H + 80)) - 40, px = sx + Math.sin(t * 1.4 + fa * 9) * am; x.save(); x.globalAlpha = a; x.translate(px, py); x.rotate(t * (1 + fa) + fa * 6); x.fillStyle = c; x.beginPath(); x.ellipse(0, 0, s, s * 0.48, 0, 0, 7); x.fill(); x.restore(); }
    }


    /* ---------- movimiento continuo (ayudas de tiempo, pura de t) ---------- */
    // Regla: nada se detiene del todo. Entra con rebote en ~0,5 s, sale en ~60 % de ese tiempo, lo quieto deriva un poco.
    const FPS = o.fps || 30, CUADRO = 1 / FPS;
    const cuadros = n => n * CUADRO;                                  // n cuadros en segundos
    const escalonar = (i, cuad = 3) => i * cuad * CUADRO;             // retraso del elemento i de un grupo (2 a 4 cuadros)
    // entra(): 0 a 1 con rebote (pasa de 1 y vuelve); multiplícalo por la escala o el desplazamiento
    const entra = (t, t0, dur = 0.5) => (t < t0 ? 0 : ease.outBack(lin(t0, t0 + dur, t)));
    // sale(): 1 a 0, más rápida que la entrada y sin rebote
    const sale = (t, t1, dur = 0.3) => 1 - ease.inCubic(lin(t1, t1 + dur, t));
    // deriva(): lo que está quieto sigue vivo: {dx, dy, s} con escala 1 a 1,02 y desplazamiento de ±4 px
    function deriva(t, { amp = 4, escala = 0.02, per = 6, ph = 0 } = {}) {
      const u = (t / per + ph) * 6.2832; return { dx: Math.sin(u) * amp, dy: Math.cos(u * 0.8 + 1) * amp * 0.75, s: 1 + escala * (0.5 + 0.5 * Math.sin(u * 0.9)) };
    }
    // empuje(): micro empuje de cámara permanente; devuelve la escala (1 a 1 + max) que se aplica al lienzo desde el centro
    const empuje = (t, t0, t1, max = 0.04) => 1 + max * ease.inOutCubic(lin(t0, t1, t));

    /* ---------- cursor en arco ---------- */
    // cursor(t, camino, {...}): camino = [{ x, y, t, clic?, pausa?, arco? }], con t = segundo de LLEGADA a cada punto.
    // El primer punto es donde aparece. Entre puntos viaja por una curva cuadrática cuyo punto de control se desplaza
    // 15 % de la distancia (a un lado y al otro, alternando; arco: -1 o 1 lo fuerza), suave al salir y al llegar, y al
    // llegar rebota un poco. Si el punto tiene clic, aprieta: escala 1, 0,96, 1 en 8 cuadros y deja un anillo.
    // pausa: segundos que espera en ese punto antes de partir (global en opciones, o por punto).
    // Devuelve { x, y, esc, clic } y dibuja la flecha, salvo dibujar: false (úsalo para posicionar otras cosas).
    function cursor(t, camino, { dibujar = true, size = 34, pausa = 0, ctrl = 0.15, rebote = 6, apreton = 8, a = 1 } = {}) {
      const n = camino.length; if (!n || t < camino[0].t - 0.15) return null;
      let i = 0; while (i < n - 1 && t >= camino[i + 1].t) i++;
      const p = camino[i], parte = p.t + (p.pausa ?? pausa);
      let px = p.x, py = p.y, s = t - p.t, vx = 0, vy = 0;
      if (i < n - 1 && t > parte) {
        const q = camino[i + 1], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1, lado = p.arco ?? (i % 2 ? -1 : 1);
        const cx = (p.x + q.x) / 2 - dy / d * d * ctrl * lado, cy = (p.y + q.y) / 2 + dx / d * d * ctrl * lado;
        const k = ease.inOutCubic(lin(parte, Math.max(parte + 0.05, q.t), t)), m = 1 - k;
        px = m * m * p.x + 2 * m * k * cx + k * k * q.x; py = m * m * p.y + 2 * m * k * cy + k * k * q.y;
      } else if (i > 0 && s >= 0) {
        const o0 = camino[i - 1], dx = p.x - o0.x, dy = p.y - o0.y, d = Math.hypot(dx, dy) || 1, r = rebote * Math.exp(-s * 12) * Math.sin(s * 26);
        px += dx / d * r; py += dy / d * r;
      }
      const dur = apreton * CUADRO; let esc = 1, anillo = 0;
      if (p.clic && s >= 0 && s < 0.5) { if (s < dur) esc = 1 - 0.04 * Math.sin(Math.PI * s / dur); anillo = lin(0, 0.45, s); }
      if (dibujar) {
        x.save(); x.globalAlpha = a;
        if (p.clic && anillo > 0 && anillo < 1) { x.strokeStyle = `rgba(255,255,255,${0.7 * (1 - anillo)})`; x.lineWidth = 4; x.beginPath(); x.arc(p.x, p.y, 10 + ease.outCubic(anillo) * 52, 0, 7); x.stroke(); }
        x.translate(px, py); x.scale(esc, esc); x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 8; x.shadowOffsetY = 3;
        const f = size; x.beginPath(); [[0, 0], [0, 0.95], [0.24, 0.74], [0.4, 1.12], [0.58, 1.04], [0.43, 0.68], [0.74, 0.68]].forEach(([u, v], j) => j ? x.lineTo(u * f, v * f) : x.moveTo(u * f, v * f)); x.closePath();
        x.fillStyle = '#fff'; x.fill(); x.shadowColor = 'transparent'; x.lineWidth = f * 0.07; x.lineJoin = 'round'; x.strokeStyle = '#10141c'; x.stroke(); x.restore();
      }
      return { x: px, y: py, esc, clic: !!(p.clic && s >= 0 && s < dur) };
    }
    // tecleo(): texto que se escribe solo desde t0, con ritmo humano (cada letra tiene su propio tiempo, fijo por semilla).
    // Devuelve { s, n, listo, caret }: s es lo escrito hasta t; caret dice si el cursor de texto está visible.
    function tecleo(texto, t, t0, { cps = 14, sem = 5 } = {}) {
      const r = rng(sem); let acum = 0, n = 0;
      for (let i = 0; i < texto.length; i++) { acum += (1 / cps) * (0.65 + 0.7 * r()) * (texto[i] === ' ' ? 1.3 : 1); if (t - t0 >= acum) n = i + 1; else break; }
      const listo = n >= texto.length, caret = t < t0 ? false : (!listo || Math.floor((t - t0) * 2) % 2 === 0);
      return { s: texto.slice(0, n), n, listo, caret };
    }

    return { W, H, BEAT, SANS, golpe, pulsoN, enPulso, fuente, mascara, palabras, contador, grada, vineta, plano, ventana, telefono, tarjeta, pastilla, barrido, iris, destello, sacudida, estallido, petalos, cuadros, escalonar, entra, sale, deriva, empuje, cursor, tecleo };
  }
  return { crear, clamp, ss, lin, mix, ease, rng };
})();
