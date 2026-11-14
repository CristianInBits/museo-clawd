// Generador de las escenas de la familia Cartografía de museo-clawd, de estilo plóter: curvas de nivel calculadas
// sobre un relieve hecho de bultos gaussianos y ondas suaves (marching squares),
// suavizadas (Chaikin) y simplificadas (Ramer-Douglas-Peucker).
import { writeFileSync } from 'node:fs'

const W = 1600, H = 1000

function azar(semilla) {
  let s = semilla >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}

function relieve(def) {
  const r = azar(def.semilla)
  const ondas = [...Array(5)].map(() => ({ fx: 0.0025 + r() * 0.005, fy: 0.0025 + r() * 0.005, p: r() * 6.28, q: r() * 6.28, a: (0.015 + r() * 0.025) * (def.ruido ?? 1) }))
  return (x, y) => {
    let v = 0
    for (const b of def.bultos) {
      const dx = x - b.x, dy = y - b.y, c = Math.cos(b.rot ?? 0), s = Math.sin(b.rot ?? 0)
      const u = dx * c + dy * s, w = -dx * s + dy * c
      v += b.a * Math.exp(-(u * u / (2 * b.sx * b.sx) + w * w / (2 * b.sy * b.sy)))
    }
    for (const o of ondas) v += o.a * Math.sin(x * o.fx + o.p) * Math.cos(y * o.fy + o.q)
    return v
  }
}

// Rejilla que sobresale de la ventana: las curvas se cierran fuera de la vista.
function rejilla(f, paso, margen) {
  const x0 = -margen, y0 = -margen
  const nx = Math.ceil((W + 2 * margen) / paso) + 1, ny = Math.ceil((H + 2 * margen) / paso) + 1
  const v = new Float64Array(nx * ny)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const borde = i === 0 || j === 0 || i === nx - 1 || j === ny - 1
    v[j * nx + i] = borde ? -1e3 : f(x0 + i * paso, y0 + j * paso)
  }
  return { v, nx, ny, X: i => x0 + i * paso, Y: j => y0 + j * paso }
}

function segmentos(g, nivel) {
  const { v, nx, ny, X, Y } = g, segs = []
  const cruce = (x1, y1, v1, x2, y2, v2) => { const t = (nivel - v1) / (v2 - v1); return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)] }
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = v[j * nx + i], b = v[j * nx + i + 1], c = v[(j + 1) * nx + i + 1], d = v[(j + 1) * nx + i]
    let k = 0
    if (a > nivel) k |= 8; if (b > nivel) k |= 4; if (c > nivel) k |= 2; if (d > nivel) k |= 1
    if (k === 0 || k === 15) continue
    const xa = X(i), ya = Y(j), xb = X(i + 1), yb = Y(j + 1)
    const T = () => cruce(xa, ya, a, xb, ya, b), R = () => cruce(xb, ya, b, xb, yb, c)
    const B = () => cruce(xa, yb, d, xb, yb, c), L = () => cruce(xa, ya, a, xa, yb, d)
    const m = (a + b + c + d) / 4
    switch (k) {
      case 1: case 14: segs.push([L(), B()]); break
      case 2: case 13: segs.push([B(), R()]); break
      case 3: case 12: segs.push([L(), R()]); break
      case 4: case 11: segs.push([T(), R()]); break
      case 6: case 9: segs.push([T(), B()]); break
      case 7: case 8: segs.push([L(), T()]); break
      case 5: if (m > nivel) { segs.push([L(), T()]); segs.push([B(), R()]) } else { segs.push([L(), B()]); segs.push([T(), R()]) } break
      case 10: if (m > nivel) { segs.push([T(), R()]); segs.push([L(), B()]) } else { segs.push([L(), T()]); segs.push([B(), R()]) } break
    }
  }
  return segs
}

function encadenar(segs) {
  const k = p => p[0].toFixed(3) + ',' + p[1].toFixed(3)
  const mapa = new Map()
  segs.forEach((s, i) => { for (const p of s) { const kk = k(p); if (!mapa.has(kk)) mapa.set(kk, []); mapa.get(kk).push(i) } })
  const usado = new Uint8Array(segs.length), lineas = []
  for (let i = 0; i < segs.length; i++) {
    if (usado[i]) continue
    usado[i] = 1
    let linea = [segs[i][0], segs[i][1]]
    for (let lado = 0; lado < 2; lado++) {
      for (;;) {
        const fin = linea[linea.length - 1], n = (mapa.get(k(fin)) ?? []).find(c => !usado[c])
        if (n === undefined) break
        usado[n] = 1
        const s = segs[n]
        linea.push(k(s[0]) === k(fin) ? s[1] : s[0])
      }
      linea.reverse()
    }
    lineas.push({ pts: linea, cerrada: k(linea[0]) === k(linea[linea.length - 1]) })
  }
  return lineas
}

function chaikin(p, cerrada, veces) {
  for (let n = 0; n < veces; n++) {
    const q = [], m = cerrada ? p.length - 1 : p.length
    for (let i = 0; i < m - (cerrada ? 0 : 1); i++) {
      const a = p[i], b = p[(i + 1) % m]
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    if (cerrada) q.push(q[0]); else { q.unshift(p[0]); q.push(p[p.length - 1]) }
    p = q
  }
  return p
}

function rdp(p, eps) {
  if (p.length < 3) return p
  const a = p[0], b = p[p.length - 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy)
  let dmax = 0, idx = 0
  for (let i = 1; i < p.length - 1; i++) {
    const d = L < 1e-6 ? Math.hypot(p[i][0] - a[0], p[i][1] - a[1]) : Math.abs(dy * p[i][0] - dx * p[i][1] + b[0] * a[1] - b[1] * a[0]) / L
    if (d > dmax) { dmax = d; idx = i }
  }
  if (dmax > eps) return rdp(p.slice(0, idx + 1), eps).slice(0, -1).concat(rdp(p.slice(idx), eps))
  return [a, b]
}

const visible = p => p.some(([x, y]) => x > -20 && x < W + 20 && y > -20 && y < H + 20)
const largo = p => p.reduce((s, q, i) => i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0, 0)

function camino(p, cerrada) {
  const r = n => Math.round(n)
  return 'M' + p.map(([x, y]) => r(x) + ' ' + r(y)).join('L') + (cerrada ? 'Z' : '')
}

// Las curvas de un nivel, listas para el SVG.
function curvas(g, nivel, { min = 60 } = {}) {
  return encadenar(segmentos(g, nivel))
    .map(l => ({ ...l, pts: rdp(chaikin(l.pts, l.cerrada, 2), 0.9) }))
    .filter(l => visible(l.pts) && largo(l.pts) > min)
}

// Los colores de cada modo, aplicados con clases para que la noche pueda cambiarlos.
const PAPEL = {
  dia: { papel: '#f2ede3', l1: '#a9aebb', l2: '#6f7688', l3: '#2f3647', acento: '#d0552c', tierra: '#ecdccb', tinta: '#1f2533', punto: '#1f2a4a' },
  noche: { papel: '#141a26', l1: '#3c4560', l2: '#68718e', l3: '#a6aec7', acento: '#e3804e', tierra: '#221c25', tinta: '#d9dde9', punto: '#b9c1d9' },
}
function reglas(c) {
  return `.papel{fill:${c.papel}}.l1{stroke:${c.l1}}.l2{stroke:${c.l2}}.l3{stroke:${c.l3}}.acento{stroke:${c.acento}}.relleno{fill:${c.acento}}.tierra{fill:${c.tierra}}.tinta{fill:${c.tinta}}.punto{fill:${c.punto}}`
}
function estilo(modo) {
  if (modo === 'noche') return `<style>${reglas(PAPEL.noche)}</style>`
  if (modo === 'dia') return `<style>${reglas(PAPEL.dia)}</style>`
  return `<style>${reglas(PAPEL.dia)}@media (prefers-color-scheme: dark){${reglas(PAPEL.noche)}}</style>`
}

const DEFS = `<pattern id="rayado" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)"><line class="acento" x1="0" y1="0" x2="0" y2="9" stroke-width="1.3" opacity=".75"/></pattern>`
const abrir = noche => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${estilo(noche)}`

// Dibuja una isla o una montaña: curvas por debajo de `cima`, y la cima rayada.
function relieveDibujado(g, niveles, cima, discontinuas) {
  let s = ''
  niveles.forEach((n, i) => {
    const clase = i < niveles.length * 0.35 ? 'l1' : i < niveles.length * 0.7 ? 'l2' : 'l3'
    for (const c of curvas(g, n)) {
      const corte = discontinuas && i < 3 ? ` stroke-dasharray="${180 + i * 40} ${50 + i * 15}"` : ''
      s += `<path class="${clase}" fill="none" stroke-width="1.6"${corte} d="${camino(c.pts, c.cerrada)}"/>`
    }
  })
  const tierras = curvas(g, cima, { min: 30 })
  const d = tierras.map(c => camino(c.pts, c.cerrada)).join('')
  s += `<clipPath id="cima"><path d="${d}"/></clipPath>`
  s += `<path class="tierra" d="${d}"/><rect width="${W}" height="${H}" fill="url(#rayado)" clip-path="url(#cima)"/>`
  s += `<path class="acento" fill="none" stroke-width="1.8" d="${d}"/>`
  return s
}

function entre(a, b, paso) { const r = []; for (let n = a; n <= b + 1e-9; n += paso) r.push(+n.toFixed(4)); return r }

// --- Marea: una costa por abajo a la izquierda, una isla grande a la derecha y islotes.
function marea(noche) {
  const f = relieve({ semilla: 7, ruido: 0.55, bultos: [
    { x: 120, y: 1060, sx: 420, sy: 210, a: 1.05, rot: -0.18 },
    { x: 1640, y: 330, sx: 230, sy: 300, a: 1.0, rot: 0.3 },
    { x: 1300, y: 900, sx: 70, sy: 55, a: 0.78 },
    { x: 1430, y: 980, sx: 50, sy: 45, a: 0.7 },
    { x: 260, y: 140, sx: 220, sy: 40, a: 0.3, rot: 0.25 },
  ] })
  const g = rejilla(f, 7, 160)
  return abrir(noche) + `<defs>${DEFS}</defs><rect class="papel" width="${W}" height="${H}"/>` +
    relieveDibujado(g, entre(0.2, 0.62, 0.06), 0.68, true) +
    `<circle class="punto" cx="610" cy="842" r="5"/><path class="l3" fill="none" stroke-width="1.6" d="M610 842C640 860 652 900 650 940"/>` +
    `<circle class="relleno" cx="1288" cy="900" r="4"/></svg>`
}

// --- Cumbres: una cordillera arriba a la derecha y un pico solitario abajo a la izquierda,
// con triángulos de cumbre, su cota y un sendero discontinuo.
function cumbres(noche) {
  const picos = [
    { x: 1080, y: 60, sx: 80, sy: 70, a: 1.0, cota: '2.417' },
    { x: 1290, y: 140, sx: 75, sy: 65, a: 0.92, cota: '2.230' },
    { x: 1500, y: 80, sx: 95, sy: 80, a: 1.05, cota: '2.508' },
    { x: 180, y: 900, sx: 150, sy: 120, a: 1.15, cota: '1.986' },
  ]
  const f = relieve({ semilla: 21, ruido: 0.8, bultos: [
    ...picos,
    { x: 1300, y: 60, sx: 420, sy: 170, a: 0.25 },
    { x: 120, y: 980, sx: 360, sy: 200, a: 0.35, rot: -0.3 },
  ] })
  const g = rejilla(f, 6, 160)
  const marcas = picos.map(p => {
    const y = Math.max(p.y, 70)
    return `<path class="relleno" d="M${p.x} ${y - 9}L${p.x + 8} ${y + 5}L${p.x - 8} ${y + 5}Z"/><text class="tinta" x="${p.x + 12}" y="${y + 5}" font-family="Consolas, monospace" font-size="15">${p.cota}</text>`
  }).join('')
  return abrir(noche) + `<defs>${DEFS}</defs><rect class="papel" width="${W}" height="${H}"/>` +
    relieveDibujado(g, entre(0.2, 1.12, 0.08), 1.18, false) +
    `<path class="acento" fill="none" stroke-width="1.6" stroke-dasharray="7 9" d="M1080 90C1150 170 1220 180 1290 150S1420 95 1500 105"/>` +
    marcas + `</svg>`
}

// --- Isobaras: una borrasca (B) abajo a la izquierda y un anticiclón (A) arriba a la
// derecha, con un frente frío de triángulos y uno cálido de semicírculos.
function frente(puntos, tipo, clase) {
  // Los símbolos van a lo largo del trazo, cada 46 unidades, hacia su lado izquierdo.
  let s = `<path class="${tipo === 'frio' ? 'l3' : 'acento'}" fill="none" stroke-width="2.2" d="${camino(puntos, false)}"/>`
  let acumulado = 0, siguiente = 26
  for (let i = 1; i < puntos.length; i++) {
    const [x1, y1] = puntos[i - 1], [x2, y2] = puntos[i], l = Math.hypot(x2 - x1, y2 - y1)
    while (acumulado + l >= siguiente) {
      const t = (siguiente - acumulado) / l, x = x1 + t * (x2 - x1), y = y1 + t * (y2 - y1)
      const ux = (x2 - x1) / l, uy = (y2 - y1) / l, nx = uy, ny = -ux
      if (tipo === 'frio') s += `<path class="${clase}" d="M${(x - ux * 9).toFixed(1)} ${(y - uy * 9).toFixed(1)}L${(x + ux * 9).toFixed(1)} ${(y + uy * 9).toFixed(1)}L${(x + nx * 13).toFixed(1)} ${(y + ny * 13).toFixed(1)}Z"/>`
      else s += `<path class="${clase}" d="M${(x - ux * 9).toFixed(1)} ${(y - uy * 9).toFixed(1)}A9 9 0 0 1 ${(x + ux * 9).toFixed(1)} ${(y + uy * 9).toFixed(1)}Z"/>`
      siguiente += 46
    }
    acumulado += l
  }
  return s
}
function bezier(p0, p1, p2, p3, n = 60) {
  return [...Array(n + 1)].map((_, i) => {
    const t = i / n, u = 1 - t
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]
  })
}
function isobaras(noche) {
  const f = relieve({ semilla: 5, ruido: 1.2, bultos: [
    { x: 230, y: 830, sx: 330, sy: 280, a: -1.0, rot: 0.3 },
    { x: 1430, y: 190, sx: 420, sy: 340, a: 1.0, rot: -0.2 },
  ] })
  const g = rejilla(f, 8, 200)
  let s = ''
  entre(-0.88, 0.88, 0.11).forEach((n, i, todos) => {
    const borde = Math.abs(n) > 0.5 ? 'l3' : Math.abs(n) > 0.2 ? 'l2' : 'l1'
    for (const c of curvas(g, n, { min: 120 })) s += `<path class="${borde}" fill="none" stroke-width="${Math.abs(n) > 0.5 ? 1.7 : 1.4}" mask="url(#calma)" d="${camino(c.pts, c.cerrada)}"/>`
  })
  const frio = bezier([300, 700], [450, 560], [520, 420], [560, 260])
  const calido = bezier([300, 700], [430, 740], [560, 760], [700, 860])
  return abrir(noche) +
    `<defs><radialGradient id="calmaG" cx="50%" cy="48%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff"/></radialGradient><mask id="calma" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#calmaG)"/></mask></defs>` +
    `<rect class="papel" width="${W}" height="${H}"/>` + s +
    frente(frio, 'frio', 'tinta') + frente(calido, 'calido', 'relleno') +
    `<text class="relleno" x="205" y="855" font-family="Segoe UI, sans-serif" font-weight="700" font-size="58">B</text>` +
    `<text class="tinta" x="1405" y="215" font-family="Segoe UI, sans-serif" font-weight="700" font-size="58">A</text>` +
    `<text class="tinta" x="1160" y="470" font-family="Consolas, monospace" font-size="15" opacity=".7">1024</text>` +
    `<text class="tinta" x="470" y="930" font-family="Consolas, monospace" font-size="15" opacity=".7">996</text></svg>`
}

const ESCENAS = { marea, cumbres, isobaras }
const salida = process.argv[2]
const resumen = []
for (const [nombre, fn] of Object.entries(ESCENAS)) {
  const ambos = fn('ambos')
  writeFileSync(`${salida}/${nombre}.svg`, ambos)
  writeFileSync(`${salida}/${nombre}-dia.svg`, fn('dia'))
  writeFileSync(`${salida}/${nombre}-noche.svg`, fn('noche'))
  resumen.push(`${nombre}: ${ambos.length} caracteres`)
}
console.log(resumen.join('\n'))

// Con un segundo argumento, escribe también el módulo del mod con las tres escenas (día y noche).
if (process.argv[3]) {
  const cabecera = '// Generado por herramientas/genera_cartografia.mjs: las escenas de la familia Cartografía, con el papel de día\n// y, dentro de @media (prefers-color-scheme: dark), el de noche. No se edita a mano.\n'
  const cuerpo = Object.entries(ESCENAS).map(([n, fn]) => 'export const ' + n.toUpperCase() + ' = ' + JSON.stringify(fn('ambos'))).join('\n')
  writeFileSync(process.argv[3], cabecera + cuerpo + '\n')
  console.log('módulo escrito')
}
