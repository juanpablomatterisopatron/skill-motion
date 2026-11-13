/* motor-tech.js de skill-motion: el estilo «tech y pro». Nació de la corrección «el dibujo plano se ve básico, hazlo más tech». Sirve para piezas de marca, lanzamientos y productos con tecnología.
 * No se carga solo: se PEGA dentro del IIFE de la película, después del motor (motor-suave.js o motor-base.js). Usa W, H,
 * ctx, cv, F (con 'slam' y 'mono'), B, circ, ell, rr, fill, line, seg2, save, restore, grad, rgrad, texto, ancho, vive,
 * seg, lerp, clamp, ease, easeOut, pop y rng. La película debe cargar JetBrains Mono (la letra de máquina del HUD).
 *
 * Qué trae:
 *  - hud(t, {modo, cuenta}): la cámara del documental encima de todo. Esquinas, ● REC con código de tiempo arriba a la
 *    IZQUIERDA (a la derecha tapaba lo que pasaba en el techo), datos abajo, mira central. modo: 'RAYOS X' cambia REC
 *    por el modo en cian; cuenta: 'SERVICIOS 03/12' arriba a la derecha. Va en seek() después de la escena.
 *  - rotuloCam(s, sub, t, t0, t1, {rgbc}): rótulo de documental que se escribe solo, sub en letra de máquina.
 *  - enfoque(x, y, w, h, t, t0, t1, {rgbc, marca}): marco que se cierra sobre algo, parpadea al fijarlo y deja una cruz.
 *    Si lo dibujado está dentro de una cámara con zoom, pasa x, y, w y h ya multiplicados por el zoom.
 *  - aviso(s, t, t0, t1): alerta con triángulo que parpadea («LENTE MOJADO»).
 *  - escaneo(scanY, a, aristas, {x0, x1, rgbc}): escaneo en alambre de arriba hacia abajo. aristas() dibuja los bordes
 *    del objeto con trazos (sin rellenos); se recorta a lo que ya pasó la línea. Úsalo dentro del save() del objeto.
 *  - gotaEnLente(cx, cy, R, ph, k) y lenteMojado(t, t0, {cx, cy, cara}): agua pegada al lente con REFRACCIÓN de verdad:
 *    se copia el lienzo a un lienzo aparte y adentro de cada gota se dibuja la escena chica y dada vuelta, con borde oscuro,
 *    tinte y brillo. Llamar a lenteMojado DESPUÉS de dibujar la escena (y antes del HUD, que va «en el monitor»).
 *  - tarjetas(t, lista, {x, w, base, tope}): tarjetas de interfaz que se apilan (las viejas suben y se apagan). Cada ítem:
 *    {texto, t0, fin, titulo, ok, mal}. Reemplazan a los globos de cómic cuando la película es «pro».
 *  - tablero(t, t0, {titulo, izq: [n, 'LLAMADOS'], der: [n, 'SOLUCIONES'], tDer}): tablero de resultados con número que
 *    cuenta y el segundo que entra en rojo. Reemplaza al marcador de cómic.
 *  - sueloGrilla(t, vy, a, rgbc, bg): piso de grilla en perspectiva que avanza; bg es el color del fondo para el
 *    degradado del horizonte (si no calza con el fondo deja una franja).
 *  - textoPro(s, x, y, size, k, {color, sombra, giro, max, ab, ext}): texto grande en cursiva con extrusión y aberración de
 *    color (ab, en px, que se asienta: 16 * Math.exp(-(t - t0) * 6)). Reemplaza a los rótulos de Bangers.
 * Lo que no es genérico (la casa con volumen y escaneo, el dueño de casa con luz, la ciudad en dos capas, la sala, el
 * celular moderno) hay que dibujarlo aparte.
 */
  // ---------- colores y ayudas ----------
  const HUDC = '127,243,230', ALERTA = '255,190,60';
  const dos = n => String(n).padStart(2, '0');
  const tc = (t, inicio = 19 * 3600 + 42 * 60) => { const s = inicio + t; return `${dos(Math.floor(s / 3600) % 24)}:${dos(Math.floor(s / 60) % 60)}:${dos(Math.floor(s) % 60)}:${dos(Math.floor(t * 30) % 30)}`; };
  const txtM = (s, x, y, size, color, align = 'left', a = 1) => texto(s, x, y, { size, f: 'mono', color, align, a });
  function glow(x, y, r, rgbc, a) { if (a <= 0 || r <= 0) return; circ(x, y, r); fill(rgrad(x, y, 0, r, [[0, `rgba(${rgbc},${a})`], [1, `rgba(${rgbc},0)`]])); }
  function partirTech(s, size, max, f = 'slam') {
    const pal = s.split(' '), out = []; let act = '';
    pal.forEach(p => { const pr = act ? act + ' ' + p : p; if (ancho(pr, f, size) > max && act) { out.push(act); act = p; } else act = pr; });
    out.push(act); return out;
  }

  // ---------- la cámara del documental ----------
  function hud(t, { a = 1, modo = null, cuenta = null, inicio, datos = 'ISO 800  f/2.8  1/50  4K' } = {}) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha *= a;
    const c = 'rgba(236,250,255,.85)', L = 64, x0 = 46, y0 = 150, x1 = W - 46, y1 = H - 150, vertical = H > W;
    const yTop = vertical ? 263 : 96, yBot = vertical ? 1716 : H - 70;
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 6;
    const ya = vertical ? y0 : 40, yb = vertical ? y1 : H - 40;
    [[x0, ya, 1, 1], [x1, ya, -1, 1], [x0, yb, 1, -1], [x1, yb, -1, -1]].forEach(([x, y, dx, dy]) => { B(); ctx.moveTo(x, y + dy * L); ctx.lineTo(x, y); ctx.lineTo(x + dx * L, y); line(c, 5); });
    const et = modo || 'REC', we = ancho(et, 'mono', 30);
    ctx.shadowBlur = 0; rr(60, yTop - 27, we + 270, 54, 12); fill('rgba(6,14,28,.42)'); ctx.shadowBlur = 6;
    const on = Math.floor(t * 1.6) % 2 === 0;
    circ(86, yTop, 12); fill(on ? (modo ? `rgb(${HUDC})` : '#ff3b3b') : (modo ? `rgba(${HUDC},.3)` : 'rgba(255,59,59,.3)'));
    txtM(et, 106, yTop + 1, 30, modo ? `rgb(${HUDC})` : '#ffffff');
    txtM(tc(t, inicio), 130 + we, yTop + 1, 26, c);
    if (cuenta) { const wc = ancho(cuenta, 'mono', 26) + 40, xr = vertical ? 940 : W - 60; ctx.shadowBlur = 0; rr(xr - wc, yTop - 27, wc, 54, 12); fill('rgba(6,14,28,.5)'); ctx.shadowBlur = 6; txtM(cuenta, xr - 20, yTop + 1, 26, `rgb(${HUDC})`, 'right'); }
    txtM(datos, 84, yBot, 24, 'rgba(236,250,255,.72)');
    const xb = W - 178; rr(xb, yBot - 14, 62, 28, 6); line(c, 3); rr(xb + 64, yBot - 6, 6, 12, 2); fill(c); rr(xb + 6, yBot - 8, 40, 16, 3); fill(`rgba(${HUDC},.95)`);
    const m = 'rgba(255,255,255,.3)', cx = W / 2, cy = H / 2;
    seg2(cx - 22, cy, cx - 8, cy); line(m, 3); seg2(cx + 8, cy, cx + 22, cy); line(m, 3); seg2(cx, cy - 22, cx, cy - 8); line(m, 3); seg2(cx, cy + 8, cx, cy + 22); line(m, 3);
    ctx.restore();
  }
  function rotuloCam(s, sub, t, t0, t1, { rgbc = HUDC, x = 60, y = 306 } = {}) {
    const a = vive(t, t0, t1, 0.3); if (a <= 0) return;
    const u = t - t0, dx = (1 - easeOut(u / 0.45)) * -50, n = Math.ceil(clamp(u / 0.55) * s.length);
    const w = Math.max(ancho(s, 'slam', 48), ancho(sub, 'mono', 27)) + 76;
    ctx.save(); ctx.globalAlpha *= a;
    rr(x + dx, y, w, 132, 14); fill('rgba(6,14,28,.64)'); rr(x + dx, y, w, 132, 14); line(`rgba(${rgbc},.55)`, 2.5);
    rr(x + dx, y, 10, 132, [14, 0, 0, 14]); fill(`rgb(${rgbc})`);
    texto(s.slice(0, n), x + 36 + dx, y + 46, { size: 48, f: 'slam', color: '#ffffff', align: 'left' });
    texto(sub, x + 36 + dx, y + 100, { size: 27, f: 'mono', color: `rgba(${rgbc},.95)`, align: 'left', a: clamp((u - 0.45) * 3) });
    ctx.restore();
  }
  function enfoque(x, y, w, h, t, t0, t1, { rgbc = ALERTA, marca = '' } = {}) {
    const a = vive(t, t0, t1, 0.15); if (a <= 0) return;
    const u = t - t0, k = easeOut(seg(t, t0, t0 + 0.4)), s = lerp(1.8, 1, k);
    const parp = (u > 0.4 && u < 0.75) ? (Math.floor(u * 16) % 2 ? 0.25 : 1) : 1;
    const ww = w * s / 2, hh = h * s / 2, L = Math.min(ww, hh) * 0.4;
    ctx.save(); ctx.globalAlpha *= a * parp * (0.35 + 0.65 * k);
    ctx.shadowColor = `rgba(${rgbc},.7)`; ctx.shadowBlur = 14;
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => { const cx = x + dx * ww, cy = y + dy * hh; B(); ctx.moveTo(cx, cy - dy * L); ctx.lineTo(cx, cy); ctx.lineTo(cx - dx * L, cy); line(`rgb(${rgbc})`, 6); });
    if (k >= 1) { seg2(x - 14, y, x + 14, y); line(`rgba(${rgbc},.8)`, 3); seg2(x, y - 14, x, y + 14); line(`rgba(${rgbc},.8)`, 3); }
    if (marca && k >= 1) { const bw = ancho(marca, 'mono', 26) + 28; ctx.shadowBlur = 0; rr(x + ww - bw, y - hh - 52, bw, 40, 8); fill(`rgba(${rgbc},.92)`); texto(marca, x + ww - bw / 2, y - hh - 31, { size: 26, f: 'mono', color: '#0b1320' }); }
    ctx.restore();
  }
  function aviso(s, t, t0, t1, { y = 430 } = {}) {
    const a = vive(t, t0, t1, 0.08); if (a <= 0) return;
    const on = Math.floor((t - t0) * 6) % 2 === 0 ? 1 : 0.55, w = ancho(s, 'mono', 40) + 130, ix = W / 2 - w / 2 + 52;
    ctx.save(); ctx.globalAlpha *= a * on;
    rr(W / 2 - w / 2, y, w, 84, 12); fill('rgba(30,10,4,.74)'); line(`rgb(${ALERTA})`, 4);
    B(); ctx.moveTo(ix, y + 18); ctx.lineTo(ix + 25, y + 64); ctx.lineTo(ix - 25, y + 64); ctx.closePath(); fill(`rgb(${ALERTA})`);
    texto('!', ix, y + 48, { size: 30, f: 'slam', color: '#1a0d06' });
    texto(s, ix + 46, y + 43, { size: 40, f: 'mono', color: '#ffd27a', align: 'left' });
    ctx.restore();
  }
  // escaneo en alambre: aristas() traza los bordes del objeto (solo trazos); se ve lo que ya pasó la línea
  function escaneo(scanY, a, aristas, { x0 = -500, x1 = 500, rgbc = HUDC } = {}) {
    if (a <= 0 || scanY === null) return;
    ctx.save(); B(); ctx.rect(x0, -5000, x1 - x0, scanY + 5000); ctx.clip(); ctx.globalAlpha *= a;
    ctx.shadowColor = `rgba(${rgbc},.8)`; ctx.shadowBlur = 10; ctx.strokeStyle = `rgba(${rgbc},.95)`; ctx.lineWidth = 3; ctx.fillStyle = `rgba(${rgbc},.95)`;
    aristas();
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = grad(0, scanY - 80, 0, scanY, [[0, `rgba(${rgbc},0)`], [1, `rgba(${rgbc},.35)`]]); ctx.fillRect(x0, scanY - 80, x1 - x0, 80); seg2(x0, scanY, x1, scanY); line(`rgb(${rgbc})`, 4); ctx.restore();
  }

  // ---------- agua en el lente, con refracción ----------
  let lenteBase = null;
  function formaGota(cx, cy, R, ph, k) {
    B();
    for (let i = 0; i <= 64; i++) { const an = i / 64 * Math.PI * 2, q = R * (1 + 0.05 * Math.sin(3 * an + ph) + 0.035 * Math.sin(5 * an + ph * 2) + 0.22 * k * Math.pow(Math.max(0, Math.sin(an)), 3)); const px = cx + Math.cos(an) * q, py = cy + Math.sin(an) * q; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  }
  function gotaEnLente(cx, cy, R, ph, k) { // k 0 a 1: cuánto se estira hacia abajo al escurrir
    if (R < 2 || !lenteBase) return;
    ctx.save(); formaGota(cx, cy, R, ph, k); ctx.clip();
    ctx.translate(cx, cy); ctx.scale(0.55, -0.55); ctx.translate(-cx, -cy); ctx.drawImage(lenteBase, 0, 0, W, H);
    ctx.restore();
    ctx.save(); formaGota(cx, cy, R, ph, k); ctx.clip();
    ctx.fillStyle = 'rgba(110,180,240,.16)'; ctx.fillRect(cx - R * 1.6, cy - R * 1.6, R * 3.2, R * 3.2);
    circ(cx, cy, R * 1.3); fill(rgrad(cx, cy, R * 0.55, R * 1.2, [[0, 'rgba(8,30,70,0)'], [1, 'rgba(8,30,70,.6)']]));
    ctx.restore();
    formaGota(cx, cy, R, ph, k); line('rgba(235,248,255,.5)', Math.max(2, R * 0.012));
    ell(cx - R * 0.42, cy - R * 0.48, R * 0.24, R * 0.09, -0.7); fill('rgba(255,255,255,.75)');
    circ(cx - R * 0.15, cy - R * 0.62, R * 0.04); fill('rgba(255,255,255,.9)');
    B(); ctx.arc(cx, cy, R * 0.86, 0.5, 2.3); line('rgba(220,245,255,.35)', R * 0.03);
  }
  function lenteMojado(t, t0, { cx = W / 2, cy = H * 0.46, R0 = 320, cara = true, dur = 0.58 } = {}) {
    if (t < t0) return;
    const k = seg(t, t0, t0 + dur), g = easeOut(seg(t, t0, t0 + 0.12));
    if (!lenteBase) lenteBase = document.createElement('canvas');
    if (lenteBase.width !== cv.width || lenteBase.height !== cv.height) { lenteBase.width = cv.width; lenteBase.height = cv.height; }
    const lb = lenteBase.getContext('2d'); lb.setTransform(1, 0, 0, 1, 0, 0); lb.clearRect(0, 0, lenteBase.width, lenteBase.height); lb.drawImage(cv, 0, 0);
    ctx.save(); ctx.translate(Math.sin(t * 90) * 10 * (1 - k), Math.cos(t * 70) * 8 * (1 - k));
    ctx.fillStyle = `rgba(40,100,160,${0.14 * (1 - 0.4 * k)})`; ctx.fillRect(-20, -20, W + 40, H + 40);
    const r = rng(23);
    for (let i = 0; i < 11; i++) { const an = r() * Math.PI * 2, d = 380 + r() * 250, R = (22 + r() * 46) * g; gotaEnLente(cx + Math.cos(an) * d * 0.85, cy + Math.sin(an) * d * 1.3 + 50 * k * r(), R, r() * 6, k * 0.4); }
    const y = cy + 150 * Math.pow(k, 3), R = R0 * g;
    if (k > 0.02) { rr(cx - R * 0.28, cy - R * 0.75, R * 0.56, y - cy + R * 0.4, R * 0.28); fill('rgba(170,220,255,.12)'); line('rgba(255,255,255,.14)', 3); }
    gotaEnLente(cx, y, R, 1.3, k);
    if (cara) { // la gota mira a la cámara y parpadea una vez
      const tp = t - t0, parp = (tp > 0.28 && tp < 0.44) ? 1 - 0.9 * Math.sin((tp - 0.28) / 0.16 * Math.PI) : 1;
      [-1, 1].forEach(d => {
        const ex = cx + d * R * 0.28, ey = y - R * 0.12;
        ell(ex, ey, R * 0.18, R * 0.21 * parp); fill(grad(0, ey - R * 0.2, 0, ey + R * 0.2, [[0, '#ffffff'], [1, '#d4eafa']]));
        if (parp > 0.3) { ctx.save(); ell(ex, ey, R * 0.18, R * 0.21 * parp); ctx.clip(); circ(ex, ey + R * 0.03, R * 0.085); fill('#0b1f36'); circ(ex + R * 0.03, ey - R * 0.01, R * 0.028); fill('#ffffff'); ctx.restore(); }
      });
      B(); ctx.moveTo(cx - R * 0.28, y + R * 0.3); ctx.quadraticCurveTo(cx, y + R * 0.52, cx + R * 0.28, y + R * 0.28); line('#0f3560', R * 0.045);
    }
    ctx.restore();
  }

  // ---------- interfaz: tarjetas que se apilan y tablero de resultados ----------
  let altosTarjetas = null;
  function tarjetas(t, lista, { x = W / 2 - 40, w = 780, base = 1010, tope = 250, size = 44, sale = 0 } = {}) { // en horizontal: base ~ H - 120, tope ~ 140
    if (!altosTarjetas || altosTarjetas.length !== lista.length) altosTarjetas = lista.map(it => partirTech(it.texto, size, w - 84).length * size * 1.23 + 112);
    if (sale >= 1) return;
    lista.forEach((it, i) => {
      if (t < it.t0 - 0.05) return;
      let off = 0; for (let j = i + 1; j < lista.length; j++) off += (altosTarjetas[j] + 22) * easeOut(seg(t, lista[j].t0 - 0.05, lista[j].t0 + 0.3));
      const k = easeOut(seg(t, it.t0 - 0.05, it.t0 + 0.3)), h = altosTarjetas[i], top = base - off + (1 - k) * 70 - h;
      const a = clamp(k * 1.5) * clamp((top - tope) / 110) * (1 - sale); if (a <= 0) return;
      const fin = it.fin != null && t > it.fin + 0.25, col = fin ? '#ff4a52' : '#2fbf66', x0 = x - w / 2;
      ctx.save(); ctx.globalAlpha *= a; save(x, top + h / 2, lerp(0.9, 1, k)); ctx.translate(-x, -(top + h / 2));
      ctx.shadowColor = 'rgba(20,30,50,.28)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rr(x0, top, w, h, 28); fill('rgba(250,252,255,.95)'); ctx.shadowColor = 'transparent';
      rr(x0, top, 10, h, [28, 0, 0, 28]); fill(col);
      circ(x0 + 58, top + 48, 22); fill(col);
      texto(it.titulo || `ITEM ${i + 1}`, x0 + 94, top + 49, { size: 26, f: 'mono', color: '#5b6675', align: 'left' });
      if (!fin) { txtM(`00:${dos(Math.floor(Math.max(0, t - it.t0)))}`, x0 + w - 34, top + 49, 26, col, 'right'); for (let b = 0; b < 5; b++) { const hb = 8 + 18 * Math.abs(Math.sin(t * 9 + b * 1.7)); rr(x0 + w - 200 + b * 12, top + 49 - hb / 2, 6, hb, 3); fill(col); } }
      else { const lab = it.mal || 'SIN SOLUCIÓN', lw = ancho(lab, 'mono', 24) + 30; save(x0 + w - 30 - lw / 2, top + 49, pop(t, it.fin + 0.25, 18, 0.55)); rr(-lw / 2, -20, lw, 40, 20); fill('rgba(255,74,82,.14)'); texto(lab, 0, 1, { size: 24, f: 'mono', color: '#e0313a' }); restore(); }
      partirTech(it.texto, size, w - 84).forEach((l, n) => texto(l, x0 + 42, top + 114 + n * size * 1.23, { size, f: 'slam', color: '#14202e', align: 'left' }));
      restore(); ctx.restore();
    });
  }
  function tablero(t, t0, { x = W / 2, y = 640, titulo = 'RESULTADO', izq = [5, 'LLAMADOS'], der = [0, 'SOLUCIONES'], tDer = t0 + 1.5 } = {}) {
    if (t < t0) return;
    const kp = easeOut(seg(t, t0 - 0.05, t0 + 0.35));
    ctx.save(); ctx.globalAlpha *= kp; save(x, y, lerp(0.92, 1, kp));
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 40; rr(-420, -250, 840, 500, 36); fill('rgba(8,14,28,.92)'); ctx.shadowColor = 'transparent';
    rr(-420, -250, 840, 500, 36); line(`rgba(${HUDC},.35)`, 2.5);
    txtM(titulo, -370, -196, 26, `rgba(${HUDC},.9)`); circ(352, -196, 8); fill(Math.floor(t * 2) % 2 ? '#ff4a52' : 'rgba(255,74,82,.3)');
    seg2(-370, -160, 370, -160); line('rgba(255,255,255,.12)', 2); seg2(0, -120, 0, 210); line('rgba(255,255,255,.12)', 2);
    const n1 = Math.min(izq[0], Math.floor(seg(t, t0, t0 + 0.6) * (izq[0] + 0.999)));
    texto(String(n1), -200, 0, { size: 230, f: 'slam', color: '#ffffff' }); texto(izq[1], -200, 140, { size: 36, f: 'mono', color: 'rgba(255,255,255,.8)' });
    const k2 = pop(t, tDer, 16, 0.5);
    if (k2 > 0) { save(200, 0, k2); ctx.shadowColor = 'rgba(255,74,82,.7)'; ctx.shadowBlur = 40; texto(String(der[0]), 0, 0, { size: 230, f: 'slam', color: '#ff4a52' }); restore(); }
    texto(der[1], 200, 140, { size: 36, f: 'mono', color: 'rgba(255,255,255,.8)' });
    restore(); ctx.restore();
  }

  // ---------- piso de grilla y texto grande ----------
  function sueloGrilla(t, vy, a, rgbc = HUDC, bg = '7,13,28') {
    ctx.save(); ctx.strokeStyle = `rgba(${rgbc},${a})`; ctx.lineWidth = 2;
    for (let i = -14; i <= 14; i++) { seg2(W / 2 + i * 26, vy, W / 2 + i * 240, H + 40); ctx.stroke(); }
    for (let j = 0; j < 14; j++) { const q = (j + (t * 0.8) % 1) / 14, y = vy + (H + 40 - vy) * q * q; seg2(-40, y, W + 40, y); ctx.stroke(); }
    ctx.fillStyle = grad(0, vy - 10, 0, vy + 260, [[0, `rgba(${bg},1)`], [1, `rgba(${bg},0)`]]); ctx.fillRect(-40, vy - 10, W + 80, 270);
    ctx.restore();
  }
  function textoPro(s, x, y, size, k, { color = '#ffffff', sombra = '#ff3d8b', giro = 0, max = W * 0.82, ab = 0, ext = 10 } = {}) {
    if (k <= 0) return;
    const w = ancho(s, 'slam', size), sz = w > max ? size * max / w : size;
    save(x, y, k, giro); ctx.transform(1, 0, -0.14, 1, 0, 0);
    for (let i = ext; i > 0; i -= 2) texto(s, i * 0.5, i, { size: sz, f: 'slam', color: sombra });
    if (ab > 0.5) { ctx.globalCompositeOperation = 'lighter'; texto(s, -ab, 0, { size: sz, f: 'slam', color: 'rgba(0,229,255,.8)' }); texto(s, ab, 0, { size: sz, f: 'slam', color: 'rgba(255,40,120,.8)' }); ctx.globalCompositeOperation = 'source-over'; }
    texto(s, 0, 0, { size: sz, f: 'slam', color });
    restore();
  }
