// Generador de las escenas de la familia Espacio profundo de museo-clawd: Singularidad,
// Anillos y Teselado. Dibujos propios: un agujero negro con su disco de luz, un planeta
// gigante con anillos y unos marcos de luz en perspectiva. Solo modo oscuro.
//
// El movimiento es lento y va en animaciones CSS dentro del <style> de cada escena, que
// la aplicación de escritorio ejecuta. Cada elemento animado tiene en sus atributos una
// posición quieta buena, la que se ve con «reducir movimiento».
import { writeFileSync } from 'node:fs'

const W = 1600, H = 1000

function azar(semilla) {
  let s = semilla >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}
const r1 = n => Math.round(n * 10) / 10
const r3 = n => Math.round(n * 1000) / 1000

// Con «reducir movimiento» en el sistema, todo se queda en la posición de sus atributos.
const QUIETO = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'
// Algunas estrellas titilan: bajan de su brillo propio a casi nada y vuelven, a tres ritmos.
const CSS_ESTRELLAS = '.c1{animation:titila 3.4s ease-in-out infinite}.c2{animation:titila 4.7s ease-in-out -1.6s infinite}.c3{animation:titila 6.2s ease-in-out -3.1s infinite}' +
  '@keyframes titila{50%{opacity:.12}}'

// Estrellas al azar, menos en el centro, donde va la conversación. Una de cada siete de
// las más grandes titila.
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
    const clase = i % 7 === 3 && tam >= 1 ? ` class="c${1 + (i % 3)}"` : ''
    s += `<circle${clase} cx="${r1(x)}" cy="${r1(y)}" r="${r1(tam)}" fill="${color}" opacity="${r1(0.35 + r() * 0.6)}"/>`
  }
  return s
}

const abrir = (fondo, estilo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><style>${estilo}${QUIETO}</style><rect width="${W}" height="${H}" fill="${fondo}"/>`

// Un patrón de granos al azar para los anillos: rayas muy cortas, que con la punta
// redonda son puntos, y huecos, que suman exactamente `total`.
function granos(semilla, total) {
  const r = azar(semilla), v = []
  let suma = 0
  while (suma < total) { const a = 0.5 + r() * 4, b = 3 + r() * 18; v.push(a, b); suma += a + b }
  const k = total / suma
  const redondos = v.map(x => r1(x * k))
  redondos[redondos.length - 1] = r1(total - redondos.slice(0, -1).reduce((s, x) => s + x, 0))
  return redondos.join(' ')
}

// Un trazo que corre: su patrón de rayas avanza por el camino `largo` unidades en `seg`
// segundos, hacia el final del camino (`haciaElFinal`) o hacia el principio.
const corre = (seg, retraso, haciaElFinal) => `style="animation:${haciaElFinal ? 'avanza' : 'retrocede'} ${seg}s linear -${retraso}s infinite"`
const CSS_CORRE = largo => `@keyframes avanza{to{stroke-dashoffset:-${largo}}}@keyframes retrocede{to{stroke-dashoffset:${largo}}}`

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
<filter id="hilo" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.3"/></filter>
<linearGradient id="flujo" x1="200" y1="0" x2="1700" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe2b8" stop-opacity="0"/><stop offset=".3" stop-color="#ffe2b8" stop-opacity=".2"/><stop offset=".6" stop-color="#fff6e6" stop-opacity=".9"/><stop offset=".82" stop-color="#fff0d8" stop-opacity=".7"/><stop offset="1" stop-color="#ffd9a8" stop-opacity=".3"/></linearGradient>
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
  // El movimiento: la luz corre por el disco. Delante, de izquierda a derecha, por
  // carriles paralelos a su línea central, más deprisa cuanto más cerca del agujero; en
  // el arco de arriba, que es la parte de atrás del disco curvada por la gravedad, al
  // revés. El patrón de rayas de todos los carriles mide 532 unidades.
  const carril = f => 'M' + centro.map((p, i) => {
    const q = centro[Math.min(i + 1, centro.length - 1)], o = centro[Math.max(i - 1, 0)]
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, g = f * ancho(p[0], 120) / 2
    return r1(p[0] - dy / l * g) + ' ' + r1(p[1] + dx / l * g)
  }).join('L')
  const carriles = [[-0.55, 1.4, 0.5, 12, 3], [-0.2, 2.2, 0.45, 14, 9], [0.15, 1.8, 0.4, 16.5, 5], [0.5, 1.2, 0.35, 19, 13]]
    .map(([f, grueso, o, seg, retraso]) => `<path d="${carril(f)}" stroke-width="${grueso}" opacity="${o}" stroke-dasharray="90 40 25 70 160 55 12 80" ${corre(seg, retraso, true)}/>`).join('')
  const arcoCarril = rho => {
    const x = r1(0.9659 * rho), y = r1(0.2588 * rho)
    return `M${r1(cx - x)} ${r1(cy + y)}A${r1(rho)} ${r1(rho)} 0 1 1 ${r1(cx + x)} ${r1(cy + y)}`
  }
  const arcos = [[1.1, 2.6, 0.3, 15, 4], [1.24, 2, 0.22, 18, 11], [1.4, 1.6, 0.15, 22, 7]]
    .map(([k, grueso, o, seg, retraso]) => `<path d="${arcoCarril(k * R)}" stroke-width="${grueso}" opacity="${o}" stroke-dasharray="70 60 24 100 130 80 18 50" ${corre(seg, retraso, false)}/>`).join('')
  const estilo = CSS_ESTRELLAS + CSS_CORRE(532) + '.aro{animation:aro 7s ease-in-out infinite}@keyframes aro{50%{opacity:.6}}'
  return abrir('#040509', estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#niebla)"/>` + estrellas(11, 260) +
    `<rect width="${W}" height="${H}" fill="url(#halo)"/>` +
    `<g filter="url(#vetas)"><circle cx="${cx}" cy="${cy}" r="${1.8 * R}" fill="url(#arco)" mask="url(#arribaM)"/></g>` +
    `<g mask="url(#arribaM)" fill="none" stroke="#fff3dd" stroke-linecap="round" filter="url(#hilo)">${arcos}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${1.8 * R}" fill="url(#arco)" mask="url(#abajoM)" transform="translate(${cx} ${cy}) scale(.82) translate(${-cx} ${-cy})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#000"/>` +
    `<circle class="aro" cx="${cx}" cy="${cy}" r="${R * 1.03}" fill="none" stroke="#ffeacb" stroke-width="8" opacity=".35" filter="url(#brilloFino)"/><circle cx="${cx}" cy="${cy}" r="${R * 1.03}" fill="none" stroke="#fff4e2" stroke-width="2" opacity=".9"/>` +
    `<path d="${disco}" fill="url(#disco)" opacity=".85" filter="url(#brillo)"/>` +
    `<g filter="url(#vetas)"><path d="${disco}" fill="url(#disco)" opacity=".7"/></g>` +
    `<g fill="none" stroke="url(#flujo)" stroke-linecap="round">${carriles}</g>` +
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
  // El movimiento: los anillos giran despacio. Sobre tres de ellos corre un patrón de
  // granos claros de 300 unidades, como partículas del anillo, por delante de izquierda
  // a derecha y por detrás al revés, más deprisa cuanto más dentro.
  const flujos = [[655, 3.6, 0.26, 31, 15], [590, 5, 0.22, 37, 12], [515, 2.6, 0.24, 41, 10]]
  const gira = mitad => `<g transform="rotate(${rot} ${cx} ${cy})" fill="none" stroke="#fff2d6" stroke-linecap="round">` +
    flujos.map(([rx, w, o, semilla, seg], i) => `<path d="${arco(rx, mitad)}" stroke-width="${w}" opacity="${o}" stroke-dasharray="${granos(semilla, 300)}" ${corre(seg, r1((i * 3.7) % seg), mitad === 'delante')}/>`).join('') + `</g>`
  return abrir('#05060b', CSS_ESTRELLAS + CSS_CORRE(300)) + defs + estrellas(23, 240, (x, y) => Math.hypot(x - cx, y - cy) < R + 4) +
    `<rect width="${W}" height="${H}" fill="url(#sol)"/><circle cx="140" cy="130" r="5" fill="#fff6e6"/>` +
    anillo('atras') + gira('atras') +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#planeta)"/><g clip-path="url(#disco)"><g transform="rotate(${rot} ${cx} ${cy})" filter="url(#suave)">${bandas}</g></g>` +
    `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#f0d9ae" stroke-width="2" opacity=".25"/>` +
    anillo('delante') + gira('delante') +
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
</defs>`
  // Marcos que se encogen hacia el punto de fuga, cada uno un 70 % del anterior, y en las
  // paredes las baldas: líneas verticales, más juntas cuanto más lejos.
  const base = { x1: 340, y1: -140, x2: 2050, y2: 1120 }
  const hacia = (x, y, s) => [vx + (x - vx) * s, vy + (y - vy) * s]
  // El movimiento: el corredor avanza hacia ti. Cada marco nace en el punto de fuga, crece
  // 1/0,7 veces cada `paso` segundos y sale del cuadro, y nace uno nuevo en cada paso, así
  // que el corredor no se acaba. Las baldas viajan igual, medio paso por detrás. Todos
  // dibujan el marco más grande y lo encogen con una escala hacia el punto de fuga; m es
  // la potencia de 0,7 de esa escala. Quietos, están donde estaban antes: un marco por
  // cada m de 0 a 10. El grosor se divide por la escala, para que la escala no lo encoja.
  const N = 12, paso = 5
  const S = m => Math.pow(0.7, m)
  const num = v => Number(v.toPrecision(4))
  const escala = (m, css) => css ? `translate(${vx}px,${vy}px) scale(${num(S(m))}) translate(${-vx}px,${-vy}px)` : `translate(${vx} ${vy}) scale(${num(S(m))}) translate(${-vx} ${-vy})`
  // Los marcos lejanos brillan más; nacen y se van con un fundido.
  const oMarco = m => m >= 11 || m <= -1 ? 0 : m > 10 ? 0.85 * (11 - m) : m < 0 ? 0.16 * (m + 1) : Math.min(0.85, 0.16 + m * 0.07)
  const oBalda = m => m >= 9 || m <= -1 ? 0 : m > 6.5 ? 0.12 * (9 - m) / 2.5 : m < -0.5 ? 0.33 * (m + 1) / 0.5 : 0.12 + (6.5 - m) * 0.03
  const pinta = {
    marco: m => [(1 + 1.5 * S(m)) / S(m), oMarco(m)],
    aura: m => [7 / S(m), oMarco(m) * 0.22],
    balda: m => [(0.6 + S(m)) / S(m), oBalda(m)],
  }
  // Una regla de fotogramas por tipo, con uno en cada paso (m de 11 a -1). Dentro de cada
  // paso, la curva de tiempo hace que la escala crezca casi como una exponencial, sin
  // tirones al pasar de un paso al siguiente.
  let fotogramas = ''
  for (const [tipo, f] of Object.entries(pinta)) {
    fotogramas += `@keyframes ${tipo}{`
    for (let j = 0; j <= N; j++) {
      const m = 11 - j, [grueso, o] = f(m)
      fotogramas += `${Math.round(j / N * 100000) / 1000}%{transform:${escala(m, true)};stroke-width:${num(grueso)}px;opacity:${num(o)}}`
    }
    fotogramas += '}'
  }
  const curva = 'cubic-bezier(.333,.277,.667,.604)'
  const estilo = `.ta{animation:aura ${N * paso}s ${curva} infinite}.tm{animation:marco ${N * paso}s ${curva} infinite}.tb{animation:balda ${N * paso}s ${curva} infinite}` + fotogramas +
    // El punto de fuga y su luz laten una vez por paso, cuando nace un marco.
    `.fuga{animation:fuga ${paso}s ease-in-out infinite}@keyframes fuga{50%{opacity:.45}}.luz{animation:luz ${paso}s ease-in-out infinite}@keyframes luz{50%{opacity:.82}}`
  const pieza = (clase, retraso, m, forma) => {
    const [grueso, o] = pinta[{ ta: 'aura', tm: 'marco', tb: 'balda' }[clase]](m)
    return `<${forma} class="${clase}" style="animation-delay:-${retraso}s" transform="${escala(m, false)}" stroke-width="${num(grueso)}" opacity="${num(o)}"/>`
  }
  const rect = `rect x="${base.x1}" y="${base.y1}" width="${base.x2 - base.x1}" height="${base.y2 - base.y1}"`
  const pared = `path d="M${base.x1} ${base.y1}V${base.y2}M${base.x2} ${base.y1}V${base.y2}"`
  let auras = '', marcos = '', baldas = ''
  for (let i = 0; i < N; i++) {
    auras += pieza('ta', i * paso, 11 - i, rect)
    marcos += pieza('tm', i * paso, 11 - i, rect)
    baldas += pieza('tb', i * paso + paso / 2, 10.5 - i, pared)
  }
  let aristas = ''
  for (const [x, y] of [[base.x1, base.y1], [base.x2, base.y1], [base.x1, base.y2], [base.x2, base.y2], [base.x1, (base.y1 + base.y2) / 2], [(base.x1 + base.x2) / 2, base.y2], [(base.x1 + base.x2) / 2, base.y1]]) {
    const [a, b] = hacia(x, y, S(10))
    aristas += `<path d="M${x} ${y}L${r1(a)} ${r1(b)}" stroke="#ffb866" stroke-width="1" opacity=".22"/>`
  }
  return abrir('#060504', estilo) + defs + `<rect class="luz" width="${W}" height="${H}" fill="url(#fondoLuz)"/>` +
    `<g mask="url(#calma)" fill="none"><g stroke="#ffb866">${auras}${marcos}</g>${aristas}<g stroke="#ffe2b8">${baldas}</g></g>` +
    `<circle class="fuga" cx="${vx}" cy="${vy}" r="3" fill="#fff3dd"/>` +
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
