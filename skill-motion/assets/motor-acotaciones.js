/* motor-acotaciones.js de skill-motion: acotaciones en pantalla y modo «plano técnico» (blueprint).
   Es un archivo aparte que se carga junto a cualquier motor (promo, tech, base o 3D): solo necesita un ctx 2D.
   Todo es función pura de t: sin Math.random, sin setTimeout, sin estado entre cuadros.

   Uso:  const A = Acotaciones.crear(ctx, { W: 1920, H: 1080 });
   Cada pieza recibe el segundo en que debe entrar (t0). Si hay narración, ese t0 es el segundo de la palabra
   que dice la cifra (palabras.json de Deepgram), así el número aparece cuando se pronuncia. Opcional: sale (segundo
   en que se retira; sale más rápido de lo que entró). Máximo una o dos acotaciones a la vez.

   Acotaciones (cada una entra con rebote, ~0,5 s):
     callout(texto, ax, ay, bx, by, t, t0, { sub, sale, col })       etiqueta en (bx, by) con una línea guía que se dibuja hasta (ax, ay)
     dimension(a, b, texto, t, t0, { offset, sale, col })            cota entre dos puntos [x, y], con flechas y la medida («30 m»)
     readout(etiqueta, valor, px, py, t, t0, { fmt, desde, sale })   lectura tipo «NORMAL: 0,25 s»; si valor es número, cuenta hasta él
     badge(texto, px, py, t, t0, { sale, size })                     multiplicador o contador en una esquina («100x»), respira sin detenerse
   Plano técnico:
     fondoPlano(t, { paso })                                         cuadrícula azul marino que deriva muy lento
     trazo(puntos, t, t0, dur, { col, ancho, cerrar })               línea que se dibuja sola; devuelve el avance de 0 a 1
     arcoTrazo(cx, cy, r, a0, a1, t, t0, dur, { col, ancho })        arco (puertas, giros) que se dibuja sola
     rotulo(texto, px, py, t, t0, { dorado, al, size })              rótulo que se escribe a la velocidad de la voz
   Colores por defecto del plano: celeste para el trazo, dorado para lo importante (dorado: true). */
const Acotaciones = (() => {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lin = (a, b, v) => clamp((v - a) / (b - a));
  const mix = (a, b, k) => a + (b - a) * k;
  const ease = {
    outCubic: k => 1 - Math.pow(1 - k, 3),
    inCubic: k => k * k * k,
    inOutCubic: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    outBack: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  };

  function crear(x, o = {}) {
    const W = o.W || 1920, H = o.H || 1080, u = Math.min(W, H) / 1080;       // u escala los tamaños al formato
    const SANS = o.sans || '"Avenir Next", "Sora", -apple-system, sans-serif', MONO = o.mono || '"JetBrains Mono", Menlo, monospace';
    const C = Object.assign({ texto: '#ffffff', linea: '#7fd4ff', acento: '#ffc53d', fondo: 'rgba(8,22,48,.88)', plano: '#0a1d44', plano2: '#06122e' }, o.col || {});

    // vida(): entrada con rebote (0,5 s) y salida más rápida (60 %); null si todavía no entra o ya salió
    function vida(t, t0, sale, dur = 0.5) {
      if (t < t0) return null;
      const fu = sale != null ? ease.inCubic(lin(sale, sale + dur * 0.6, t)) : 0; if (fu >= 1) return null;
      return { k: ease.outBack(lin(t0, t0 + dur, t)), a: clamp((t - t0) / 0.18) * (1 - fu), fu };
    }
    const fuente = (px, peso = 700, mono = false) => { x.font = `${peso} ${px}px ${mono ? MONO : SANS}`; };
    function caja(cx, cy, w, h, k, a, fondo, borde) {                          // caja que escala desde su centro
      x.save(); x.globalAlpha *= a; x.translate(cx, cy); x.scale(k, k);
      x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = 18 * u; x.shadowOffsetY = 6 * u;
      x.fillStyle = fondo; x.beginPath(); x.roundRect(-w / 2, -h / 2, w, h, 12 * u); x.fill(); x.shadowColor = 'transparent';
      if (borde) { x.strokeStyle = borde; x.lineWidth = 2.5 * u; x.stroke(); } x.restore();
    }
    function flecha(px, py, ang, tam, col) {
      x.save(); x.translate(px, py); x.rotate(ang); x.fillStyle = col; x.beginPath(); x.moveTo(0, 0); x.lineTo(-tam, -tam * 0.38); x.lineTo(-tam, tam * 0.38); x.closePath(); x.fill(); x.restore();
    }

    /* ---------- callout: etiqueta con línea guía ---------- */
    function callout(texto, ax, ay, bx, by, t, t0, { sub = '', sale = null, col = C.linea, size = 34 } = {}) {
      const v = vida(t, t0, sale); if (!v) return; const s = size * u;
      const g = ease.outCubic(lin(t0, t0 + 0.4, t));                            // la línea se dibuja del objeto a la etiqueta
      x.save(); x.globalAlpha = v.a; x.strokeStyle = col; x.lineWidth = 3 * u; x.lineCap = 'round';
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(mix(ax, bx, g), mix(ay, by, g)); x.stroke();
      const ping = lin(t0, t0 + 0.6, t); x.fillStyle = col; x.beginPath(); x.arc(ax, ay, 7 * u, 0, 7); x.fill();
      if (ping < 1) { x.globalAlpha = v.a * (1 - ping); x.beginPath(); x.arc(ax, ay, (7 + 30 * ping) * u, 0, 7); x.stroke(); }
      x.restore();
      fuente(s, 800); const w1 = x.measureText(texto).width; fuente(s * 0.62, 600, true); const w2 = sub ? x.measureText(sub).width : 0;
      const w = Math.max(w1, w2) + s * 1.1, h = s * (sub ? 2.35 : 1.6), kk = ease.outBack(lin(t0 + 0.2, t0 + 0.7, t));
      caja(bx, by, w, h, Math.max(0, kk), v.a, C.fondo, col);
      x.save(); x.globalAlpha = v.a * clamp(kk); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = C.texto; fuente(s, 800);
      x.fillText(texto, bx, by - (sub ? s * 0.4 : 0)); if (sub) { fuente(s * 0.62, 600, true); x.fillStyle = col; x.fillText(sub, bx, by + s * 0.62); } x.restore();
    }

    /* ---------- dimension: cota con flechas y medida ---------- */
    function dimension(a, b, texto, t, t0, { offset = 46, sale = null, col = C.acento, size = 34 } = {}) {
      const v = vida(t, t0, sale); if (!v) return; const s = size * u, off = offset * u;
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ex = dx / L, ey = dy / L, nx = -ey, ny = ex;
      const A = [a[0] + nx * off, a[1] + ny * off], B = [b[0] + nx * off, b[1] + ny * off], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
      const g = ease.outCubic(lin(t0, t0 + 0.5, t)), ang = Math.atan2(ey, ex);
      x.save(); x.globalAlpha = v.a; x.strokeStyle = col; x.lineWidth = 3 * u; x.lineCap = 'round';
      [[a, A], [b, B]].forEach(([p, q]) => { x.beginPath(); x.moveTo(p[0] + nx * 6 * u, p[1] + ny * 6 * u); x.lineTo(q[0] + nx * 14 * u, q[1] + ny * 14 * u); x.stroke(); });   // líneas de referencia
      const p1 = [mix(m[0], A[0], g), mix(m[1], A[1], g)], p2 = [mix(m[0], B[0], g), mix(m[1], B[1], g)];                                            // la cota crece desde el centro
      x.beginPath(); x.moveTo(p1[0], p1[1]); x.lineTo(p2[0], p2[1]); x.stroke();
      if (g > 0.05) { flecha(p1[0], p1[1], ang + Math.PI, 20 * u, col); flecha(p2[0], p2[1], ang, 20 * u, col); }
      x.restore();
      fuente(s, 800, true); const w = x.measureText(texto).width + s * 1.2, kk = ease.outBack(lin(t0 + 0.25, t0 + 0.75, t));
      caja(m[0], m[1], w, s * 1.6, Math.max(0, kk), v.a, C.fondo, col);
      x.save(); x.globalAlpha = v.a * clamp(kk); x.fillStyle = col; fuente(s, 800, true); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, m[0], m[1] + 1); x.restore();
    }

    /* ---------- readout: lectura tipo «NORMAL: 0,25 s» ---------- */
    function readout(etiqueta, valor, px, py, t, t0, { fmt = n => n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unidad = '', desde = 0, sale = null, col = C.linea, size = 40 } = {}) {
      const v = vida(t, t0, sale); if (!v) return; const s = size * u;
      const cuenta = typeof valor === 'number' ? fmt(mix(desde, valor, ease.outCubic(lin(t0 + 0.1, t0 + 1.0, t)))) : String(valor), txt = `${cuenta}${unidad ? ' ' + unidad : ''}`;
      fuente(s * 0.6, 700, true); const w1 = x.measureText(etiqueta.toUpperCase() + ':').width; fuente(s, 800, true); const w2 = x.measureText(txt).width;
      const w = w1 + w2 + s * 1.6, h = s * 1.7, cx = px + w / 2, cy = py - (1 - Math.min(1, v.k)) * 24 * u;            // sube al entrar
      caja(cx, cy, w, h, 1, v.a, C.fondo, null);
      x.save(); x.globalAlpha = v.a; x.fillStyle = col; x.beginPath(); x.roundRect(cx - w / 2, cy - h / 2, 8 * u, h, [12 * u, 0, 0, 12 * u]); x.fill();
      x.textBaseline = 'middle'; x.textAlign = 'left'; fuente(s * 0.6, 700, true); x.fillStyle = col; x.fillText(etiqueta.toUpperCase() + ':', cx - w / 2 + s * 0.8, cy + 1);
      fuente(s, 800, true); x.fillStyle = C.texto; x.fillText(txt, cx - w / 2 + s * 0.8 + w1 + s * 0.3, cy + 1); x.restore();
    }

    /* ---------- badge: multiplicador o contador en una esquina ---------- */
    function badge(texto, px, py, t, t0, { sale = null, size = 64, col = C.acento, tinta = '#1a1204' } = {}) {
      const v = vida(t, t0, sale); if (!v) return; const s = size * u;
      const resp = 1 + 0.03 * Math.sin((t - t0) * 5);                                                                  // respira: nunca queda quieto
      fuente(s, 800, true); const w = x.measureText(texto).width + s * 1.1, h = s * 1.5;
      caja(px, py, w, h, Math.max(0, v.k * resp), v.a, col, null);
      x.save(); x.globalAlpha = v.a * clamp(v.k); x.translate(px, py); x.scale(resp, resp); x.fillStyle = tinta; fuente(s, 800, true); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(texto, 0, 2); x.restore();
    }

    /* ---------- plano técnico (blueprint) ---------- */
    function fondoPlano(t, { paso = 60, a = 1 } = {}) {
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, C.plano); g.addColorStop(1, C.plano2); x.save(); x.globalAlpha = a; x.fillStyle = g; x.fillRect(0, 0, W, H);
      const p = paso * u, dx = (t * 3 * u) % p, dy = (t * 1.5 * u) % p;                                               // la cuadrícula deriva despacio
      x.lineWidth = 1; for (let i = -1; i * p / 4 < W + p; i++) { const px = i * p / 4 + dx; x.strokeStyle = `rgba(127,212,255,${i % 4 === 0 ? 0.2 : 0.07})`; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, H); x.stroke(); }
      for (let j = -1; j * p / 4 < H + p; j++) { const py = j * p / 4 + dy; x.strokeStyle = `rgba(127,212,255,${j % 4 === 0 ? 0.2 : 0.07})`; x.beginPath(); x.moveTo(0, py); x.lineTo(W, py); x.stroke(); }
      const v = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.4, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); x.fillStyle = v; x.fillRect(0, 0, W, H); x.restore();
    }
    // trazo(): polilínea que se dibuja sola con un punto brillante en la punta. Devuelve el avance (0 a 1).
    function trazo(pts, t, t0, dur, { col = C.linea, ancho = 4, cerrar = false } = {}) {
      const k = ease.inOutCubic(lin(t0, t0 + dur, t)); if (k <= 0) return 0;
      const P = cerrar ? pts.concat([pts[0]]) : pts, seg = [], tot = P.slice(1).reduce((s, q, i) => { const d = Math.hypot(q[0] - P[i][0], q[1] - P[i][1]); seg.push(d); return s + d; }, 0);
      let rest = tot * k, cx = P[0][0], cy = P[0][1];
      x.save(); x.strokeStyle = col; x.lineWidth = ancho * u; x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = col; x.shadowBlur = 10 * u; x.beginPath(); x.moveTo(cx, cy);
      for (let i = 0; i < seg.length && rest > 0; i++) { const f = Math.min(1, rest / seg[i]); cx = mix(P[i][0], P[i + 1][0], f); cy = mix(P[i][1], P[i + 1][1], f); x.lineTo(cx, cy); rest -= seg[i]; }
      x.stroke(); if (k < 1) { x.fillStyle = '#fff'; x.beginPath(); x.arc(cx, cy, 6 * u, 0, 7); x.fill(); } x.restore(); return k;
    }
    function arcoTrazo(cx, cy, r, a0, a1, t, t0, dur, { col = C.linea, ancho = 4 } = {}) {
      const k = ease.inOutCubic(lin(t0, t0 + dur, t)); if (k <= 0) return 0;
      x.save(); x.strokeStyle = col; x.lineWidth = ancho * u; x.lineCap = 'round'; x.shadowColor = col; x.shadowBlur = 10 * u; x.beginPath(); x.arc(cx, cy, r, a0, mix(a0, a1, k)); x.stroke(); x.restore(); return k;
    }
    // rotulo(): se escribe letra por letra; el ritmo por defecto (22 letras por segundo) alcanza a una voz tranquila
    function rotulo(texto, px, py, t, t0, { dorado = false, al = 'left', size = 30, cps = 22, sale = null } = {}) {
      const v = vida(t, t0, sale, 0.3); if (!v) return; const n = Math.min(texto.length, Math.ceil((t - t0) * cps)), col = dorado ? C.acento : C.linea;
      x.save(); x.globalAlpha = v.a; fuente(size * u, 700, true); x.textAlign = al; x.textBaseline = 'middle'; x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 8 * u;
      x.fillText(texto.slice(0, n), px, py); if (n < texto.length) { const w = x.measureText(texto.slice(0, n)).width; x.fillRect(al === 'left' ? px + w + 4 * u : al === 'center' ? px + w / 2 + 4 * u : px + 4 * u, py - size * u * 0.45, 3 * u, size * u * 0.9); } x.restore();
    }

    return { W, H, C, callout, dimension, readout, badge, fondoPlano, trazo, arcoTrazo, rotulo, vida };
  }
  return { crear, ease, lin, clamp, mix };
})();
