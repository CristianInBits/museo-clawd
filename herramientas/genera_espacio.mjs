// Generador de las escenas de la familia Espacio profundo de museo-clawd: Singularidad,
// Anillos y Teselado. Dibujos propios: un agujero negro con su disco de luz, un planeta
// gigante con anillos y unos marcos de luz en perspectiva. Solo modo oscuro.
import { writeFileSync } from 'node:fs'

const W = 1600, H = 1000

function azar(semilla) {
  let s = semilla >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}
const r1 = n => Math.round(n * 10) / 10

// Estrellas al azar, menos en el centro, donde va la conversación.
function estrellas(semilla, cuantas, evitar) {
  const r = azar(semilla)
  let s = ''
  for (let i = 0; i < cuantas; i++) {
    const x = r() * W, y = r() * H
    const enCentro = Math.abs(x - W / 2) < 330 && Math.abs(y - H / 2) < 320
    if (enCentro && r() < 0.7) continue
    if (evitar && evitar(x, y)) continue
    const tam = r() < 0.92 ? 0.6 + r() * 0.9 : 1.6 + r() * 0.8
    const color = r() < 0.15 ? '#ffd9a8' : r() < 0.2 ? '#bcd0ff' : '#e6ebff'
    s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(tam)}" fill="${color}" opacity="${r1(0.35 + r() * 0.6)}"/>`
  }
  return s
}

const abrir = (fondo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><rect width="${W}" height="${H}" fill="${fondo}"/>`

// --- Singularidad ------------------------------------------------------------------
// Curva cúbica muestreada, para construir bandas que se ensanchan.
function cubica(p0, p1, p2, p3, n) {
  return [...Array(n + 1)].map((_, i) => {
    const t = i / n, u = 1 - t
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]
  })
}
// Una banda alrededor de una línea central, con el grosor que diga `grosor(x)`.
function banda(centro, grosor) {
  const arriba = [], abajo = []
  centro.forEach((p, i) => {
    const q = centro[Math.min(i + 1, centro.length - 1)], o = centro[Math.max(i - 1, 0)]
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, g = grosor(p[0]) / 2
    arriba.push([p[0] + nx * g, p[1] + ny * g]); abajo.push([p[0] - nx * g, p[1] - ny * g])
  })
  const pts = arriba.concat(abajo.reverse())
  return 'M' + pts.map(([x, y]) => r1(x) + ' ' + r1(y)).join('L') + 'Z'
}
function singularidad() {
  const cx = 1190, cy = 420, R = 140
  const defs = `<defs>
<radialGradient id="halo" cx="${cx}" cy="${cy}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".32"/><stop offset=".45" stop-color="#ff9a4a" stop-opacity=".08"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
<radialGradient id="niebla" cx="250" cy="820" r="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#14254a" stop-opacity=".45"/><stop offset="1" stop-color="#14254a" stop-opacity="0"/></radialGradient>
<linearGradient id="disco" x1="200" y1="0" x2="1700" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff7a2e" stop-opacity="0"/><stop offset=".25" stop-color="#ff8a3d" stop-opacity=".3"/><stop offset=".5" stop-color="#ffa95c" stop-opacity=".85"/><stop offset=".66" stop-color="#ffe9c8"/><stop offset=".82" stop-color="#ffcf96"/><stop offset="1" stop-color="#ff9a4a" stop-opacity=".75"/></linearGradient>
<linearGradient id="nucleo" x1="200" y1="0" x2="1700" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff8ec" stop-opacity="0"/><stop offset=".45" stop-color="#fff8ec" stop-opacity=".25"/><stop offset=".64" stop-color="#ffffff" stop-opacity=".95"/><stop offset="1" stop-color="#fff3dd" stop-opacity=".6"/></linearGradient>
<radialGradient id="arco" cx="${cx}" cy="${cy}" r="${1.8 * R}" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#ffe7c2" stop-opacity="0"/><stop offset=".575" stop-color="#fff3dd" stop-opacity=".95"/><stop offset=".64" stop-color="#ffd59c" stop-opacity=".7"/><stop offset=".78" stop-color="#ff9a4a" stop-opacity=".22"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
<linearGradient id="mitadArriba" x1="0" y1="${cy - 1.8 * R}" x2="0" y2="${cy + 0.35 * R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="arribaM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#mitadArriba)"/></mask>
<linearGradient id="mitadAbajo" x1="0" y1="${cy + 0.15 * R}" x2="0" y2="${cy + 1.6 * R}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#000"/><stop offset=".25" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient>
<mask id="abajoM" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#mitadAbajo)"/></mask>
<filter id="brillo" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="brilloFino" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="vetas" x="-10%" y="-40%" width="120%" height="180%"><feTurbulence type="fractalNoise" baseFrequency="0.0022 0.07" numOctaves="3" seed="7" result="ruido"/><feColorMatrix in="ruido" type="matrix" values="0 0 0 0 1 0 0 0 0 .84 0 0 0 0 .6 0 0 0 1.7 -.6" result="hilos"/><feComposite in="hilos" in2="SourceGraphic" operator="in" result="dentro"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dentro"/></feMerge></filter>
</defs>`
  // La luz del lado de atrás del disco, curvada por encima y por debajo de la sombra.
  const arriba = `M${cx - 1.3 * R} ${cy + 0.15 * R}C${cx - 1.28 * R} ${cy - 1.62 * R} ${cx + 1.28 * R} ${cy - 1.62 * R} ${cx + 1.3 * R} ${cy + 0.15 * R}`
  const arribaInterior = `M${cx - 1.1 * R} ${cy + 0.1 * R}C${cx - 1.06 * R} ${cy - 1.36 * R} ${cx + 1.06 * R} ${cy - 1.36 * R} ${cx + 1.1 * R} ${cy + 0.1 * R}`
  const abajo = `M${cx - 1.12 * R} ${cy + 0.25 * R}C${cx - 1.0 * R} ${cy + 1.32 * R} ${cx + 1.0 * R} ${cy + 1.32 * R} ${cx + 1.12 * R} ${cy + 0.25 * R}`
  // El lado de delante: una banda que nace fina a la izquierda y se ensancha junto a la sombra.
  const centro = cubica([180, 660], [700, 560], [cx - 2 * R, cy + 0.45 * R], [1730, cy - 0.15 * R], 80)
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
  const ancho = (x, max) => max * Math.pow(suave(180, cx + 160, x), 1.3) * (1 - 0.28 * suave(cx, 1730, x))
  const disco = banda(centro, x => ancho(x, 120)), nucleo = banda(centro, x => ancho(x, 16))
  return abrir('#040509') + defs +
    `<rect width="${W}" height="${H}" fill="url(#niebla)"/>` + estrellas(11, 260) +
    `<rect width="${W}" height="${H}" fill="url(#halo)"/>` +
    `<g filter="url(#vetas)"><circle cx="${cx}" cy="${cy}" r="${1.8 * R}" fill="url(#arco)" mask="url(#arribaM)"/></g>` +
    `<circle cx="${cx}" cy="${cy}" r="${1.8 * R}" fill="url(#arco)" mask="url(#abajoM)" transform="translate(${cx} ${cy}) scale(.82) translate(${-cx} ${-cy})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${R * 1.03}" fill="none" stroke="#ffeacb" stroke-width="8" opacity=".35" filter="url(#brilloFino)"/><circle cx="${cx}" cy="${cy}" r="${R * 1.03}" fill="none" stroke="#fff4e2" stroke-width="2" opacity=".9"/>` +
    `<path d="${disco}" fill="url(#disco)" opacity=".85" filter="url(#brillo)"/>` +
    `<g filter="url(#vetas)"><path d="${disco}" fill="url(#disco)" opacity=".7"/></g>` +
    `<path d="${nucleo}" fill="url(#nucleo)" filter="url(#brilloFino)"/>` +
    `<circle cx="560" cy="300" r="9" fill="#101219"/><path d="M552 295A9 9 0 0 1 568 300" stroke="#ffcf8a" stroke-width="1.4" fill="none" opacity=".8"/>` +
    `</svg>`
}

// --- Anillos -----------------------------------------------------------------------
function anillos() {
  const cx = 1340, cy = 330, R = 300, rot = -16
  const defs = `<defs>
<radialGradient id="sol" cx="140" cy="130" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff0d2" stop-opacity=".55"/><stop offset=".12" stop-color="#ffcf8a" stop-opacity=".2"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient>
<linearGradient id="planeta" x1="${cx - R}" y1="${cy - R * 0.4}" x2="${cx + R * 0.7}" y2="${cy + R * 0.3}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e2c393"/><stop offset=".14" stop-color="#9c7c58"/><stop offset=".34" stop-color="#3a2f27"/><stop offset=".55" stop-color="#121218"/><stop offset="1" stop-color="#07070b"/></linearGradient>
<clipPath id="disco"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
<filter id="suave" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>
</defs>`
  // Las bandas de nubes del planeta, inclinadas como sus anillos.
  let bandas = ''
  for (let i = -5; i <= 5; i++) {
    const y = cy + i * 52
    bandas += `<path d="M${cx - R} ${y}Q${cx} ${y + 30} ${cx + R} ${y}" stroke="${i % 2 ? '#e8d2a6' : '#000'}" stroke-width="${14 + ((i + 6) * 7) % 11}" fill="none" opacity="${i % 2 ? 0.06 : 0.14}"/>`
  }
  // Los anillos: la mitad de atrás va antes del planeta y la de delante después.
  const radios = [[700, 1.2, '#cdb48c', 0.35], [655, 6, '#e9d3a8', 0.6], [620, 2, '#f3e2c0', 0.85], [590, 9, '#d8bf96', 0.5], [545, 1.4, '#bfa47c', 0.45], [515, 4, '#a88f6c', 0.35]]
  const arco = (rx, mitad) => {
    const ry = rx * 0.17
    return mitad === 'atras' ? `M${cx - rx} ${cy}A${rx} ${ry} 0 0 1 ${cx + rx} ${cy}` : `M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`
  }
  const anillo = mitad => `<g transform="rotate(${rot} ${cx} ${cy})">` + radios.map(([rx, w, c, o]) => `<path d="${arco(rx, mitad)}" stroke="${c}" stroke-width="${w}" fill="none" opacity="${o}"/>`).join('') + `</g>`
  return abrir('#05060b') + defs + estrellas(23, 240, (x, y) => Math.hypot(x - cx, y - cy) < R + 4) +
    `<rect width="${W}" height="${H}" fill="url(#sol)"/><circle cx="140" cy="130" r="5" fill="#fff6e6"/>` +
    anillo('atras') +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#planeta)"/><g clip-path="url(#disco)"><g transform="rotate(${rot} ${cx} ${cy})" filter="url(#suave)">${bandas}</g></g>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#f0d9ae" stroke-width="2" opacity=".25"/>` +
    anillo('delante') +
    `<circle cx="470" cy="760" r="6" fill="#16161d"/><path d="M465 756A6 6 0 0 1 476 760" stroke="#e9d3a8" stroke-width="1.2" fill="none" opacity=".8"/>` +
    `</svg>`
}

// --- Teselado ----------------------------------------------------------------------
function teselado() {
  const vx = 1270, vy = 470
  const defs = `<defs>
<radialGradient id="fondoLuz" cx="${vx}" cy="${vy}" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".42"/><stop offset=".35" stop-color="#ff9a4a" stop-opacity=".1"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
<linearGradient id="calmaG" x1="0" y1="0" x2="${W}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset=".7" stop-color="#fff"/></linearGradient>
<mask id="calma" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#calmaG)"/></mask>
<filter id="brillo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>
</defs>`
  // Marcos que se encogen hacia el punto de fuga, cada uno un 70 % del anterior.
  const base = { x1: 340, y1: -140, x2: 2050, y2: 1120 }
  const hacia = (x, y, s) => [vx + (x - vx) * s, vy + (y - vy) * s]
  let marcos = '', aristas = '', baldas = ''
  const escalas = [...Array(11)].map((_, k) => Math.pow(0.7, k))
  escalas.forEach((s, k) => {
    const [a, b] = hacia(base.x1, base.y1, s), [c, d] = hacia(base.x2, base.y2, s)
    const o = Math.min(0.85, 0.16 + k * 0.07)
    marcos += `<rect x="${r1(a)}" y="${r1(b)}" width="${r1(c - a)}" height="${r1(d - b)}" fill="none" stroke="#ffb866" stroke-width="${r1(1 + s * 1.5)}" opacity="${r1(o)}"/>`
  })
  for (const [x, y] of [[base.x1, base.y1], [base.x2, base.y1], [base.x1, base.y2], [base.x2, base.y2], [base.x1, (base.y1 + base.y2) / 2], [(base.x1 + base.x2) / 2, base.y2], [(base.x1 + base.x2) / 2, base.y1]]) {
    const [a, b] = hacia(x, y, escalas[escalas.length - 1])
    aristas += `<path d="M${x} ${y}L${r1(a)} ${r1(b)}" stroke="#ffb866" stroke-width="1" opacity=".22"/>`
  }
  // Las baldas: líneas verticales en las paredes, más juntas cuanto más lejos.
  for (let k = 0; k < 7; k++) {
    const s = Math.pow(0.7, k + 0.5)
    for (const lado of [base.x1, base.x2]) {
      const [x] = hacia(lado, 0, s), [, ya] = hacia(0, base.y1, s), [, yb] = hacia(0, base.y2, s)
      baldas += `<path d="M${r1(x)} ${r1(ya)}V${r1(yb)}" stroke="#ffe2b8" stroke-width="${r1(0.6 + s)}" opacity="${r1(0.12 + (6 - k) * 0.03)}"/>`
    }
  }
  return abrir('#060504') + defs + `<rect width="${W}" height="${H}" fill="url(#fondoLuz)"/>` +
    `<g mask="url(#calma)"><g filter="url(#brillo)" opacity=".7">${marcos}</g>${marcos}${aristas}${baldas}</g>` +
    `<circle cx="${vx}" cy="${vy}" r="3" fill="#fff3dd"/>` +
    `</svg>`
}

const ESCENAS = { singularidad, anillos, teselado }
const salida = process.argv[2]
for (const [nombre, fn] of Object.entries(ESCENAS)) {
  const svg = fn()
  writeFileSync(`${salida}/${nombre}.svg`, svg)
  console.log(`${nombre}: ${svg.length} caracteres`)
}
if (process.argv[3]) {
  const cabecera = '// Generado por herramientas/genera_espacio.mjs: las escenas de la familia Espacio profundo, solo de noche.\n// No se edita a mano.\n'
  const cuerpo = Object.entries(ESCENAS).map(([n, fn]) => 'export const ' + n.toUpperCase() + ' = ' + JSON.stringify(fn())).join('\n')
  writeFileSync(process.argv[3], cabecera + cuerpo + '\n')
  console.log('módulo escrito')
}
