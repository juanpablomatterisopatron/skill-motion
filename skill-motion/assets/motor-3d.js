/* motor-3d.js de skill-motion: 3D falso dentro del canvas 2D (mapas que se inclinan y cámara que vuela).
 * No es un archivo que se cargue solo: se PEGA dentro del IIFE de la película, después del motor base (usa W, H,
 * fondo, grad, B, fill, line, K, lerp, clamp, ease, seg, rng, texto, ancho, save, restore, rr, ell, auto, C, P).
 *
 * Qué trae:
 *  - cam3 {x, y, z, yaw, pitch, f}: x al este, y al norte, z hacia arriba; yaw 0 mira al norte y PI al sur; pitch
 *    positivo mira hacia abajo; f es la distancia focal en píxeles (1100 se ve natural a 1920 x 1080).
 *  - P3(x, y, z) -> {x, y, s, d} en pantalla (s = escala para dibujar sprites; d = profundidad) o null si queda detrás.
 *  - poly3(puntos, color, trazo) y linea3(a, b, color, ancho, pasos): la línea se dibuja en tramos para que no se rompa
 *    cuando un extremo queda detrás de la cámara.
 *  - mapa3D(t, {autoU, pin}): suelo en damero, río, montañas (pirámides con nieve) ordenadas de lejos a cerca, una
 *    ruta (RUTA) que se pinta de amarillo según autoU, letreros parados con su poste, un cubo (edificio), un auto y un
 *    alfiler que cae. Ejemplo: una ruta de la ciudad A a la ciudad B en km aproximados.
 *  - gridNeon(t): piso de neón en perspectiva con sol de franjas (para revelar al robot).
 *  - Orbita3D (al final del archivo, bloque autocontenido que solo necesita ctx, W y H): toma de cámara que ORBITA una escena
 *    de cajas o la RECORRE por un camino; suelo, cajas con caras sombreadas o en alambre (plano técnico) y proy() para anclar
 *    un callout a un punto 3D. No usa cam3 ni P3: se puede pegar solo. Detalle de uso en el comentario de ese bloque.
 * Cómo se mueve la cámara: cuadros clave con lerp (por ejemplo camMapa) y una órbita que mira siempre al punto:
 *   x = px - R*sin(yaw), y = py - R*cos(yaw). Las trampas: un poste o letrero muy cerca de la cámara se ve enorme
 *   (ocultarlo si d < 4) y los polígonos se ordenan por profundidad antes de dibujar.
 */
  // ---------- motor 3D falso (cámara, proyección, polígonos por profundidad) ----------
  const cam3 = { x: 0, y: 0, z: 20, yaw: 0, pitch: 0.5, f: 1100 };
  function P3(x, y, z) {
    const sy = Math.sin(cam3.yaw), cy = Math.cos(cam3.yaw), sp = Math.sin(cam3.pitch), cp = Math.cos(cam3.pitch);
    const dx = x - cam3.x, dy = y - cam3.y, dz = z - cam3.z;
    const xc = dx * cy - dy * sy;                                   // derecha
    const zc = dx * sy * cp + dy * cy * cp - dz * sp;               // hacia adelante
    const yc = dx * sy * sp + dy * cy * sp + dz * cp;               // arriba
    if (zc < 0.3) return null;
    return { x: W / 2 + xc * cam3.f / zc, y: H / 2 - yc * cam3.f / zc, s: cam3.f / zc, d: zc };
  }
  function poly3(pts, color, tr = 3) { const p = pts.map(q => P3(...q)); if (p.some(q => !q)) return; B(); p.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.closePath(); fill(color); if (tr) line(K, tr); }
  function linea3(a, b, color, w, pasos = 8) { ctx.strokeStyle = color; ctx.lineCap = 'round'; for (let i = 0; i < pasos; i++) { const u0 = i / pasos, u1 = (i + 1) / pasos; const p = P3(lerp(a[0], b[0], u0), lerp(a[1], b[1], u0), lerp(a[2], b[2], u0)), q = P3(lerp(a[0], b[0], u1), lerp(a[1], b[1], u1), lerp(a[2], b[2], u1)); if (!p || !q) continue; ctx.lineWidth = Math.max(1, w * (p.s + q.s) / 2); B(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); } }
  const MONTES = (() => { const r = rng(55), m = []; for (let k = 0; k < 26; k++) m.push([26 + r() * 40, 30 - k * 6.5 - r() * 3, 6 + r() * 9, 5 + r() * 4]); for (let k = 0; k < 14; k++) m.push([-34 - r() * 20, 20 - k * 9, 2 + r() * 3, 4 + r() * 3]); return m; })();
  const RUTA = [[0, 6], [0.5, -10], [-1, -25], [-2.5, -40], [-4, -55], [-6, -70], [-7.5, -82], [-6, -86], [-2, -87.5], [1.5, -88.6]];
  function enRuta(u) { const n = RUTA.length - 1, f = clamp(u) * n, i = Math.min(n - 1, Math.floor(f)), k = f - i; return [lerp(RUTA[i][0], RUTA[i + 1][0], k), lerp(RUTA[i][1], RUTA[i + 1][1], k)]; }
  function mapa3D(t, { autoU = 0, pin = 0 } = {}) {
    fondo(grad(0, 0, 0, H, [[0, '#7fc4ec'], [0.45, '#cfe9f7'], [1, '#e8f3d8']]));
    // suelo en franjas (valle) con una grilla
    for (let y = 40; y > -120; y -= 10) for (let x = -60; x < 80; x += 10) { const c = ((x + y) / 10) % 2 ? '#b9d98a' : '#aed27c'; poly3([[x, y, 0], [x + 10, y, 0], [x + 10, y - 10, 0], [x, y - 10, 0]], c, 0); }
    // río
    linea3([40, -92, 0.02], [-50, -84, 0.02], 'rgba(80,160,220,.9)', 0.8, 30);
    // montañas ordenadas de lejos a cerca
    MONTES.map(([x, y, h, r]) => ({ x, y, h, r, d: (P3(x, y, 0) || { d: -1 }).d })).filter(m => m.d > 0).sort((a, b) => b.d - a.d).forEach(m => {
      const a = [m.x - m.r, m.y - m.r, 0], b = [m.x + m.r, m.y - m.r, 0], c = [m.x + m.r, m.y + m.r, 0], d = [m.x - m.r, m.y + m.r, 0], top = [m.x, m.y, m.h];
      [[d, a, top, '#8a8f6a'], [c, d, top, '#9a9f78'], [a, b, top, '#7a7f5a'], [b, c, top, '#6a6f4a']].forEach(([p, q, r2, col]) => poly3([p, q, r2], col, 2));
      const nv = [m.x, m.y, m.h * 0.72]; poly3([[lerp(a[0], top[0], 0.72), lerp(a[1], top[1], 0.72), m.h * 0.72], [lerp(b[0], top[0], 0.72), lerp(b[1], top[1], 0.72), m.h * 0.72], top], '#ffffff', 2); void nv;
    });
    // la ruta y lo recorrido
    for (let i = 0; i < RUTA.length - 1; i++) linea3([RUTA[i][0], RUTA[i][1], 0.03], [RUTA[i + 1][0], RUTA[i + 1][1], 0.03], '#4a4a52', 0.9, 10);
    const n = RUTA.length - 1;
    for (let i = 0; i < n; i++) { const u0 = i / n, u1 = (i + 1) / n; if (autoU <= u0) break; const b = enRuta(Math.min(autoU, u1)); linea3([RUTA[i][0], RUTA[i][1], 0.05], [b[0], b[1], 0.05], '#ffd23f', 0.5, 10); }
    // pueblos (letreros en 3D)
    [['CIUDAD A', 0, 4, 6], ['PUNTO MEDIO', -9, -84, 4], ['CIUDAD B', 4, -86, 3]].forEach(([nom, x, y, h]) => { const b = P3(x, y, 0), a = P3(x, y, h); if (!a || !b || a.d < 4) return; ctx.save(); ctx.globalAlpha *= clamp((a.d - 4) / 3); seg2(b.x, b.y, a.x, a.y); line(K, clamp(0.3 * a.s, 2, 7)); const sz = clamp(a.s * 1.2, 14, 70); const w = ancho(nom, 'comic', sz) + sz; rr(a.x - w / 2, a.y - sz * 1.3, w, sz * 1.3, sz * 0.3); fill(C(P.amarillo)); line(K, 3); texto(nom, a.x, a.y - sz * 0.62, { size: sz, f: 'comic', color: C(P.tinta) }); ctx.restore(); });
    // el colegio y la casa
    const cubo = (x, y, w, d, h, c1, c2, c3) => { const A = [x, y, 0], Bq = [x + w, y, 0], Cq = [x + w, y + d, 0], D = [x, y + d, 0]; const up = q => [q[0], q[1], h]; poly3([A, Bq, up(Bq), up(A)], c1, 2); poly3([Bq, Cq, up(Cq), up(Bq)], c2, 2); poly3([up(A), up(Bq), up(Cq), up(D)], c3, 2); };
    cubo(-0.6, -88.2, 1.2, 0.7, 0.45, '#e8d2aa', '#d8c29a', '#c0573a');
    const s0 = P3(0, -88.25, 0.6); if (s0 && s0.s > 30) { const sz = clamp(s0.s * 0.22, 12, 46); texto('COLEGIO LA CRUZ', s0.x, s0.y - sz, { size: sz, f: 'comic', color: C(P.tinta) }); }
    // el auto que recorre la ruta
    if (autoU > 0 && autoU < 1) { const [ax, ay] = enRuta(autoU), q = P3(ax, ay, 0.15); if (q) { save(q.x, q.y, clamp(q.s * 0.004, 0.05, 0.6)); auto(0, 0, 1); restore(); } }
    // el alfiler de la casa
    if (pin > 0) { const q = P3(1.5, -88.6, 0); if (q) { const k = clamp(pin), cae = (1 - easeOut(k)) * 300; ctx.save(); ctx.globalAlpha *= 0.5; ell(q.x, q.y, 60 * (1 + 0.3 * wob(t, 1.5)), 18 * (1 + 0.3 * wob(t, 1.5))); line(C(P.rojo), 5); ctx.restore(); save(q.x, q.y - cae, 1.1); B(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-70, -70, -60, -120); ctx.arc(0, -120, 60, Math.PI, 0); ctx.quadraticCurveTo(70, -70, 0, 0); fill(C(P.rojo)); line(K, 6); circ(0, -120, 24); fill('#ffffff'); line(K, 4); restore(); } }
  }
  // piso de neón en perspectiva (para el robot)
  function gridNeon(t) {
    fondo(grad(0, 0, 0, H, [[0, '#0a0620'], [0.55, '#2a0f4a'], [1, '#0a0620']]));
    const sv = { ...cam3 }; Object.assign(cam3, { x: 0, y: -20 + (t * 6) % 10, z: 6, yaw: 0, pitch: 0.12, f: 1000 });
    for (let x = -60; x <= 60; x += 6) linea3([x, -10, 0], [x, 200, 0], 'rgba(255,60,200,.75)', 0.08, 20);
    for (let y = -10; y <= 200; y += 10) linea3([-60, y, 0], [60, y, 0], 'rgba(80,220,255,.7)', 0.08, 12);
    Object.assign(cam3, sv);
    circ(W / 2, H * 0.36, 230); fill(grad(0, H * 0.36 - 230, 0, H * 0.36 + 230, [[0, '#ffd23f'], [1, '#ff3fa0']]));
    for (let k = 0; k < 7; k++) { ctx.fillStyle = '#2a0f4a'; ctx.fillRect(W / 2 - 240, H * 0.36 + 40 + k * 28, 480, 6 + k * 2); }
  }
  // ===== ÓRBITA 3D (inicio) =====
  // Toma de cámara que ORBITA una escena simple de cajas, o la RECORRE por un camino, en 3D falso de canvas.
  // Es un bloque autocontenido: solo usa ctx 2D, W y H (no depende de cam3, P3 ni del motor base), así que se puede
  // pegar solo en cualquier película o sacar a un archivo (sacarlo: sed -n '/^  \/\/ ===== ÓRBITA 3D (inicio)/,/^  \/\/ ===== ÓRBITA 3D (fin)/p' motor-3d.js).
  // Misma convención de ejes que cam3: x al este, y al norte, z arriba; yaw 0 mira al norte; pitch positivo mira hacia abajo.
  // Todo es función pura de t: la cámara sale de una fórmula, nunca del cuadro anterior.
  //   const O = Orbita3D.crear(ctx, { W, H });
  //   const cam = O.orbita(t, 0.5, 4.5, { objetivo: [0, 0, 4], radio: 60, altura: 38, yaw0: 0.5, yaw1: 3.4 });
  //   O.suelo(cam); O.cajas(cam, lista, { estilo: 'solido' | 'alambre' });       lista = [{ x, y, w, d, h, col }], x e y son la esquina
  //   O.recorrido(t, 0, 4, [[x, y, z], ...], { mira: [x, y, z] })                 cámara que avanza por un camino
  //   O.proy(cam, [x, y, z]) -> { x, y, s, d } | null                             para anclar un callout a un punto 3D
  // Trampas: los polígonos se ordenan por la distancia de su centro (sirve para cajas separadas, no para cajas que
  // se cruzan); una caja muy cerca de la cámara se ve enorme (aleja el radio); sin Math.random: el color viene de la lista.
  const Orbita3D = (() => {
    const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
    const lin = (a, b, v) => clamp((v - a) / (b - a));
    const mix = (a, b, k) => a + (b - a) * k;
    const inOut = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const rgb = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const tono = (h, k) => { const c = rgb(h); return `rgb(${Math.round(clamp(c[0] * k, 0, 255))},${Math.round(clamp(c[1] * k, 0, 255))},${Math.round(clamp(c[2] * k, 0, 255))})`; };
    const NEAR = 0.3;

    function crear(x, { W, H, f = 1100 } = {}) {
      // mirarA(): fija yaw y pitch de una cámara en (cx, cy, cz) para que mire a un punto
      function mirarA(cam, p) { const dx = p[0] - cam.x, dy = p[1] - cam.y, dz = p[2] - cam.z; cam.yaw = Math.atan2(dx, dy); cam.pitch = Math.atan2(-dz, Math.hypot(dx, dy)); return cam; }
      // aCam(): punto del mundo a coordenadas de cámara [derecha, arriba, adelante]
      function aCam(cam, p) {
        const sy = Math.sin(cam.yaw), cy = Math.cos(cam.yaw), sp = Math.sin(cam.pitch), cp = Math.cos(cam.pitch), dx = p[0] - cam.x, dy = p[1] - cam.y, dz = p[2] - cam.z;
        return [dx * cy - dy * sy, dx * sy * sp + dy * cy * sp + dz * cp, dx * sy * cp + dy * cy * cp - dz * sp];
      }
      const aPant = (cam, c) => ({ x: W / 2 + c[0] * (cam.f || f) / c[2], y: H / 2 - c[1] * (cam.f || f) / c[2], s: (cam.f || f) / c[2], d: c[2] });
      function proy(cam, p) { const c = aCam(cam, p); return c[2] < NEAR ? null : aPant(cam, c); }

      // orbita(): la cámara gira alrededor de un objetivo. El giro es suave pero nunca queda del todo quieto (15 % lineal).
      function orbita(t, t0, t1, { objetivo = [0, 0, 0], radio = 60, radio1 = null, altura = 30, altura1 = null, yaw0 = 0, yaw1 = 3.14, f: ff } = {}) {
        const k = 0.85 * inOut(lin(t0, t1, t)) + 0.15 * lin(t0, t1, t), yaw = mix(yaw0, yaw1, k), R = mix(radio, radio1 ?? radio, k), Z = mix(altura, altura1 ?? altura, k);
        const cam = { x: objetivo[0] - R * Math.sin(yaw), y: objetivo[1] - R * Math.cos(yaw), z: objetivo[2] + Z, yaw: 0, pitch: 0, f: ff || f };
        return mirarA(cam, objetivo);
      }
      // recorrido(): la cámara avanza por un camino (lista de [x, y, z]) y mira a un punto fijo o un poco más adelante
      function recorrido(t, t0, t1, camino, { mira = null, adelanto = 0.08, f: ff } = {}) {
        const lon = [], tot = camino.slice(1).reduce((s, q, i) => { const d = Math.hypot(q[0] - camino[i][0], q[1] - camino[i][1], q[2] - camino[i][2]); lon.push(d); return s + d; }, 0);
        const en = u => { let r = clamp(u) * tot, i = 0; while (i < lon.length - 1 && r > lon[i]) { r -= lon[i]; i++; } const q = lon[i] ? clamp(r / lon[i]) : 0; return [0, 1, 2].map(j => mix(camino[i][j], camino[i + 1][j], q)); };
        const k = 0.85 * inOut(lin(t0, t1, t)) + 0.15 * lin(t0, t1, t), p = en(k), cam = { x: p[0], y: p[1], z: p[2], yaw: 0, pitch: 0, f: ff || f };
        return mirarA(cam, mira || en(Math.min(1, k + adelanto)));
      }
      // linea(): segmento 3D recortado contra el plano cercano (no se rompe si un extremo queda detrás de la cámara)
      function linea(cam, a, b, col, ancho = 2) {
        let p = aCam(cam, a), q = aCam(cam, b); if (p[2] < NEAR && q[2] < NEAR) return;
        if (p[2] < NEAR) p = p.map((v, j) => mix(v, q[j], (NEAR - p[2]) / (q[2] - p[2]))); else if (q[2] < NEAR) q = q.map((v, j) => mix(v, p[j], (NEAR - q[2]) / (p[2] - q[2])));
        const A = aPant(cam, p), B = aPant(cam, q); x.strokeStyle = col; x.lineWidth = ancho; x.lineCap = 'round'; x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke();
      }
      // suelo(): cuadrícula en el piso que se apaga con la distancia
      function suelo(cam, { tam = 120, paso = 10, col = '127,212,255', a = 0.35, z = 0 } = {}) {
        for (let v = -tam; v <= tam; v += paso) { const fade = a * (1 - Math.abs(v) / (tam * 1.1)); x.save(); x.globalAlpha = fade; linea(cam, [v, -tam, z], [v, tam, z], `rgb(${col})`, 1.5); linea(cam, [-tam, v, z], [tam, v, z], `rgb(${col})`, 1.5); x.restore(); }
      }
      // cajas(): dibuja las cajas con sus caras ordenadas de lejos a cerca. estilo 'solido' (caras sombreadas) o 'alambre' (plano técnico)
      function cajas(cam, lista, { estilo = 'solido', borde = null, luz = [0.45, -0.7, 0.55], relleno = 'rgba(10,29,68,.72)', ancho = 2 } = {}) {
        const caras = [];
        lista.forEach(b => {
          const x0 = b.x, x1 = b.x + b.w, y0 = b.y, y1 = b.y + b.d, h = b.h, col = b.col || '#c9d6e8';
          const defs = [[[x0, y0, 0], [x1, y0, 0], [x1, y0, h], [x0, y0, h], [0, -1, 0]], [[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h], [1, 0, 0]],
            [[x1, y1, 0], [x0, y1, 0], [x0, y1, h], [x1, y1, h], [0, 1, 0]], [[x0, y1, 0], [x0, y0, 0], [x0, y0, h], [x0, y1, h], [-1, 0, 0]], [[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h], [0, 0, 1]]];
          defs.forEach(d => {
            const n = d[4], c = [(d[0][0] + d[2][0]) / 2, (d[0][1] + d[2][1]) / 2, (d[0][2] + d[2][2]) / 2];
            if ((cam.x - c[0]) * n[0] + (cam.y - c[1]) * n[1] + (cam.z - c[2]) * n[2] <= 0) return;      // cara que mira hacia otro lado
            const pp = d.slice(0, 4).map(p => proy(cam, p)); if (pp.some(q => !q)) return;
            const sombra = 0.55 + 0.45 * Math.max(0, n[0] * luz[0] + n[1] * luz[1] + n[2] * luz[2]);
            caras.push({ pp, prof: aCam(cam, c)[2], col: tono(col, sombra) });
          });
        });
        caras.sort((a, b) => b.prof - a.prof).forEach(c => {
          x.beginPath(); c.pp.forEach((q, i) => (i ? x.lineTo(q.x, q.y) : x.moveTo(q.x, q.y))); x.closePath();
          x.fillStyle = estilo === 'alambre' ? relleno : c.col; x.fill();
          x.strokeStyle = borde || (estilo === 'alambre' ? '#7fd4ff' : 'rgba(10,14,24,.55)'); x.lineWidth = ancho; x.lineJoin = 'round'; x.stroke();
        });
      }
      return { mirarA, aCam, proy, orbita, recorrido, linea, suelo, cajas };
    }
    return { crear };
  })();
  // ===== ÓRBITA 3D (fin) =====
