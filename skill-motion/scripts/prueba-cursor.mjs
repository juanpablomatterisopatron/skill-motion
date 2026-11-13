// Prueba de cursorPro sin navegador: node scripts/prueba-cursor.mjs  (usa un canvas simulado y comprueba la geometría)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aquí = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(aquí, '..', 'assets', 'motor-promo.js'), 'utf8') + '\n;globalThis.MotorPromo = MotorPromo;';
(0, eval)(src);
const ctx = new Proxy({}, { get: (o, k) => (k in o ? o[k] : () => {}), set: (o, k, v) => { o[k] = v; return true; } });
const P = MotorPromo.crear(ctx, { W: 1280, H: 720 });
let fallas = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALLA'), m); if (!c) fallas++; };
// 1) enArco: extremos exactos, curva hacia arriba (y menor) y no recta
const a = P.enArco(0, 500, 400, 500, 0), b = P.enArco(0, 500, 400, 500, 1), m = P.enArco(0, 500, 400, 500, 0.5);
ok(Math.hypot(a[0], a[1] - 500) < 1e-9 && Math.hypot(b[0] - 400, b[1] - 500) < 1e-9, 'enArco parte y llega a los puntos pedidos');
ok(m[1] < 500 - 20, 'enArco curva hacia arriba (mitad a ' + (500 - m[1]).toFixed(1) + ' px sobre la recta)');
const m2 = P.enArco(400, 500, 0, 500, 0.5); ok(m2[1] < 500 - 20, 'enArco también sube si el viaje es de derecha a izquierda');
// 2) cursorPro: no existe antes de ruta[0], pausa quieta entre tramos, llega a destino, curvatura real
const RUTA = [[0.2, 1.1, 260, 560], [1.8, 2.8, 700, 220]], CL = [1.15, 2.85];
ok(P.cursorPro(0, RUTA, CL) === null, 'no aparece antes del primer tramo');
const p0 = P.cursorPro(1.3, RUTA, CL, { dibujar: false }), p1 = P.cursorPro(1.7, RUTA, CL, { dibujar: false });
ok(Math.hypot(p0.x - 260, p0.y - 560) < 1e-6 && Math.hypot(p1.x - 260, p1.y - 560) < 1e-6, 'queda quieto entre un tramo y el siguiente (pausa)');
const fin = P.cursorPro(3, RUTA, CL, { dibujar: false }); ok(Math.hypot(fin.x - 700, fin.y - 220) < 1e-6, 'llega al destino y se queda');
let dev = 0; for (let t = 1.8; t <= 2.8; t += 0.02) { const p = P.cursorPro(t, RUTA, CL, { dibujar: false }); const dx = 700 - 260, dy = 220 - 560, l = Math.hypot(dx, dy); dev = Math.max(dev, Math.abs(((p.x - 260) * dy - (p.y - 560) * dx) / l)); }
ok(dev > 30, 'el recorrido se aparta de la recta hasta ' + dev.toFixed(1) + ' px (no es recto)');
// 3) clic: achique a 0,8 y vuelta
const c0 = P.cursorPro(1.15, RUTA, CL, { dibujar: false }), c1 = P.cursorPro(1.15 + 0.16, RUTA, CL, { dibujar: false });
ok(c0.esc < 0.85 && c0.clic, 'al clic el puntero se achica (' + c0.esc.toFixed(2) + ')'); ok(c1.esc > 0.97, 'y vuelve a su tamaño en 0,16 s');
// 4) lo existente sigue igual
const q = P.cursor(1, [{ x: 100, y: 100, t: 0 }, { x: 500, y: 300, t: 2, clic: true }], { dibujar: false }); ok(q && typeof q.x === 'number', 'cursor() sigue funcionando');
process.exit(fallas ? 1 : 0);
