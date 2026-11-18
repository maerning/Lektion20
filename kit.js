// Gemeinsame Bausteine für die L20-Spiele (Canvas 1280×720)
(() => {
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const W = 1280, H = 720;
const F_HEAD = '"Cinzel", Georgia, serif', F_TXT = '"Nunito Sans", "Segoe UI", Arial, sans-serif';
const GOLD = '#e8b84a', CREAM = '#f3e9d2', GREEN = '#2f7a46', RED = '#8f1d22';

const IMG = {};
function load(names) { names.forEach(n => { const i = new Image(); i.src = 'img/' + n; IMG[n.split('.')[0]] = i; }); }
const ok = i => i && i.complete && i.naturalWidth > 0;

const store = {
  get(k, d) { try { const v = localStorage.getItem('l20_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('l20_' + k, JSON.stringify(v)); } catch (e) {} }
};

let AC = null, soundOn = store.get('ton', true);
function tone(f, d = 0.12, type = 'square', vol = 0.06, slide = 0) {
  if (!soundOn) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02);
  } catch (e) {}
}
const SND = {
  tap: () => tone(660, 0.05, 'triangle', 0.05),
  coin: () => { tone(988, 0.06, 'square', 0.04); setTimeout(() => tone(1319, 0.1, 'square', 0.04), 55); },
  right: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.12, 'square', 0.05), i * 70)),
  wrong: () => { tone(196, 0.25, 'sawtooth', 0.06, -80); setTimeout(() => tone(147, 0.3, 'sawtooth', 0.06, -60), 160); },
  level: () => [392, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle', 0.07), i * 90)),
  horn: () => { tone(147, 0.6, 'sawtooth', 0.05, 30); setTimeout(() => tone(196, 0.8, 'sawtooth', 0.05, 20), 350); },
};

const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function wrap(t, maxW, font) {
  ctx.font = font; const out = []; let line = '';
  for (const w of String(t).split(' ')) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { out.push(line); line = w; } else line = test; }
  if (line) out.push(line); return out;
}
function fitText(t, maxW, maxLines, size, weight = 800, fam = F_TXT) {
  let s = size, lines;
  while (s > 13) { lines = wrap(t, maxW, `${weight} ${s}px ${fam}`); if (lines.length <= maxLines && lines.every(l => ctx.measureText(l).width <= maxW)) break; s -= 2; }
  return { s, lines };
}
function txt(t, x, y, o = {}) {
  ctx.font = `${o.w || 800} ${o.s || 28}px ${o.f || F_TXT}`; ctx.textAlign = o.a || 'left'; ctx.textBaseline = o.b || 'middle';
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || 6; ctx.strokeStyle = o.stroke; ctx.strokeText(t, x, y); }
  ctx.fillStyle = o.c || '#fff'; ctx.fillText(t, x, y);
}
function txtBox(t, x, y, w, h, o = {}) {
  const ft = fitText(t, w - (o.pad ?? 24), o.lines || 2, o.s || 26, o.w || 800, o.f || F_TXT);
  const lh = ft.s * 1.15, y0 = y + h / 2 - (ft.lines.length - 1) * lh / 2;
  ft.lines.forEach((l, i) => txt(l, x + w / 2, y0 + i * lh + 1, { a: 'center', s: ft.s, c: o.c || CREAM, w: o.w, f: o.f }));
}

let buttons = [], hover = null;
function hit(p) { for (let i = buttons.length - 1; i >= 0; i--) { const b = buttons[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return b; } return null; }
function button(x, y, w, h, label, fn, o = {}) {
  const hv = !o.disabled && hover && hover.x === x && hover.y === y;
  rr(x, y, w, h, o.r ?? 12);
  ctx.fillStyle = o.fill || (hv ? '#2a2f3d' : 'rgba(18,20,28,.86)'); ctx.fill();
  ctx.lineWidth = o.lw || 2.5; ctx.strokeStyle = o.line || (hv ? GOLD : 'rgba(232,184,74,.55)'); ctx.stroke();
  if (typeof label === 'function') label(x + w / 2, y + h / 2);
  else txtBox(label, x, y, w, h, { s: o.s || 24, c: o.c || CREAM, lines: o.lines || 2, f: o.f });
  if (!o.disabled) buttons.push({ x, y, w, h, fn });
}
function toggleFull() {
  try {
    const d = document, el = d.documentElement;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else { const r = el.requestFullscreen || el.webkitRequestFullscreen; if (r) { const p = r.call(el); if (p && p.catch) p.catch(() => {}); } }
  } catch (e) {}
}
// Leiste oben rechts: Startmenü, (Pause), Ton, Vollbild
function topButtons(onPause) {
  const y = 12, s = 46; let x = W - 12 - s;
  const st = () => { ctx.strokeStyle = CREAM; ctx.fillStyle = CREAM; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; };
  button(x, y, s, s, (cx, cy) => { st(); const d = 11, e = 6; ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(cx + sx * d, cy + sy * (d - e)); ctx.lineTo(cx + sx * d, cy + sy * d); ctx.lineTo(cx + sx * (d - e), cy + sy * d); } ctx.stroke(); }, toggleFull);
  x -= s + 10;
  button(x, y, s, s, (cx, cy) => { st(); ctx.beginPath(); ctx.moveTo(cx - 12, cy - 5); ctx.lineTo(cx - 6, cy - 5); ctx.lineTo(cx + 2, cy - 12); ctx.lineTo(cx + 2, cy + 12); ctx.lineTo(cx - 6, cy + 5); ctx.lineTo(cx - 12, cy + 5); ctx.closePath(); ctx.fill();
    ctx.beginPath(); if (soundOn) { ctx.arc(cx + 4, cy, 7, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + 4, cy, 12, -0.9, 0.9); ctx.stroke(); } else { ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx + 14, cy + 6); ctx.moveTo(cx + 14, cy - 6); ctx.lineTo(cx + 6, cy + 6); ctx.stroke(); } },
    () => { soundOn = !soundOn; store.set('ton', soundOn); });
  if (onPause) { x -= s + 10; button(x, y, s, s, (cx, cy) => { st(); ctx.fillRect(cx - 8, cy - 10, 5, 20); ctx.fillRect(cx + 3, cy - 10, 5, 20); }, onPause); }
  x -= s + 10;
  button(x, y, s, s, (cx, cy) => { st(); ctx.beginPath(); ctx.moveTo(cx - 12, cy - 1); ctx.lineTo(cx, cy - 12); ctx.lineTo(cx + 12, cy - 1); ctx.moveTo(cx - 8, cy - 4); ctx.lineTo(cx - 8, cy + 11); ctx.lineTo(cx + 8, cy + 11); ctx.lineTo(cx + 8, cy - 4); ctx.stroke(); }, () => { location.href = 'index.html'; });
}
function heart(x, y, s, full) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 30, s / 30);
  ctx.beginPath(); ctx.moveTo(0, 9); ctx.bezierCurveTo(-26, -8, -12, -26, 0, -12); ctx.bezierCurveTo(12, -26, 26, -8, 0, 9); ctx.closePath();
  ctx.fillStyle = full ? '#d6333a' : 'rgba(255,255,255,.14)'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = full ? '#ffb3a8' : 'rgba(255,255,255,.35)'; ctx.stroke();
  ctx.restore();
}
function drawBg(off = 0, dark = 0) {
  const bw = 1280, o = ((off % (bw * 2)) + bw * 2) % (bw * 2);
  if (ok(IMG.bg)) {
    for (let i = -1; i < 3; i++) {
      const x = i * bw - o; if (x > W || x + bw < 0) continue;
      ctx.save(); if (((i % 2) + 2) % 2 === 1) { ctx.translate(x + bw, 0); ctx.scale(-1, 1); ctx.drawImage(IMG.bg, 0, 0, bw, 720); } else ctx.drawImage(IMG.bg, x, 0, bw, 720); ctx.restore();
    }
  } else { const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#3a1d1d'); gr.addColorStop(0.6, '#c2562a'); gr.addColorStop(1, '#14161c'); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H); }
  if (dark) { ctx.fillStyle = `rgba(6,8,12,${dark})`; ctx.fillRect(0, 0, W, H); }
}
function sprite(img, x, yBottom, h, flip = false, alpha = 1) {
  if (!ok(img)) return;
  const w = img.naturalWidth * h / img.naturalHeight;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, yBottom); if (flip) ctx.scale(-1, 1); ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
}
function shadow(x, y, r) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.25); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fill(); ctx.restore(); }

// Partikel & schwebende Texte
const FX = { parts: [], floats: [] };
function burst(x, y, c, n) { for (let i = 0; i < n; i++) FX.parts.push({ x, y, vx: rnd(-260, 260), vy: rnd(-420, 60), life: rnd(0.5, 1), c, s: rnd(3, 7) }); }
function floatText(t, x, y, c) { FX.floats.push({ t, x, y, c, life: 1.2 }); }
function fxUpdate(dt) {
  for (const p of FX.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 900 * dt; p.life -= dt; }
  FX.parts = FX.parts.filter(p => p.life > 0);
  for (const f of FX.floats) { f.y -= 50 * dt; f.life -= dt; }
  FX.floats = FX.floats.filter(f => f.life > 0);
}
function fxDraw() {
  for (const p of FX.parts) { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.s, p.s); }
  ctx.globalAlpha = 1;
  for (const f of FX.floats) { ctx.globalAlpha = Math.min(1, f.life); txt(f.t, f.x, f.y, { a: 'center', s: 30, c: f.c, stroke: '#000', sw: 5, f: F_HEAD, w: 900 }); }
  ctx.globalAlpha = 1;
}

// Eingabe
function toCanvas(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
const input = { down: false, x: 0, y: 0, keys: {} };
let onTap = null;
cv.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch') e.preventDefault();
  try { window.focus(); cv.focus(); } catch (_) {}
  const p = toCanvas(e); input.down = true; input.x = p.x; input.y = p.y;
  const b = hit(p); if (b) { b.fn(); return; }
  if (onTap) onTap(p);
}, { passive: false });
cv.addEventListener('pointermove', e => { const p = toCanvas(e); input.x = p.x; input.y = p.y; hover = hit(p); cv.style.cursor = hover ? 'pointer' : 'default'; });
window.addEventListener('pointerup', () => { input.down = false; });
window.addEventListener('pointercancel', () => { input.down = false; });
window.addEventListener('keydown', e => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault(); input.keys[e.code] = true; if (K.onKey) K.onKey(e.code); });
window.addEventListener('keyup', e => { input.keys[e.code] = false; });

function run(update, draw) {
  let last = performance.now(), t = 0;
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; t += dt;
    update(dt, t); fxUpdate(dt);
    buttons = []; ctx.clearRect(0, 0, W, H); draw(t);
    if (!document.hasFocus()) txt('Klicke ins Spiel, damit die Tastatur funktioniert', W / 2, H - 18, { a: 'center', s: 16, c: '#ffd9a0' });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  if (document.fonts && document.fonts.load) { document.fonts.load('900 40px Cinzel').catch(() => {}); document.fonts.load('800 20px "Nunito Sans"').catch(() => {}); }
}

const K = window.K = { cv, ctx, W, H, F_HEAD, F_TXT, GOLD, CREAM, GREEN, RED, IMG, load, ok, store, SND, rnd, shuffle, rr, wrap, fitText, txt, txtBox,
  button, topButtons, heart, drawBg, sprite, shadow, burst, floatText, fxDraw, FX, input, run, set onTap(f) { onTap = f; }, onKey: null };
})();
