// Generador de las escenas de la sala Bushidō de museo-clawd: Ronin, Katana y Fortaleza.
// Dibujos propios, en la línea de los grabados japoneses: siluetas planas y pocos
// elementos, la banda oscura de lo alto del cielo (ichimonji bokashi), bandas de niebla
// (kasumi) y una aguada de tinta muy suave. Solo modo oscuro, con la paleta de la sala:
// negro carbón, gris pizarra, rojo carmesí, pergamino, acero frío y oro envejecido.
//
// El movimiento es lento y va en animaciones CSS dentro del <style> de cada escena, que
// la aplicación de escritorio ejecuta. Cada elemento animado tiene en sus atributos una
// posición quieta buena, la que se ve con «reducir movimiento». Las transformaciones que
// giran algo llevan su pivote escrito (trasladar, girar y deshacer el traslado), para no
// depender de transform-origin.
import { writeFileSync } from 'node:fs'

const W = 1600, H = 1000

const CARBON = '#101116'
const PIZARRA = '#373238'
const CARMESI = '#b83535'
const PERGAMINO = '#e5d9c6'
const ACERO = '#89939b'
const ORO = '#b89862'
// El negro de las siluetas, más oscuro que el fondo para que se recorten contra el sol y la niebla.
const TINTA = '#060608'

// Con «reducir movimiento» en el sistema, todo se queda en la posición de sus atributos.
const QUIETO = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'
// La niebla va y viene de lado a lado: cada banda lleva su duración y su sentido, y las
// que tienen que verse moverse, un recorrido más largo.
const CSS_NIEBLA = '.nb{animation-name:deriva;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}' +
  '@keyframes deriva{from{transform:translateX(-70px)}to{transform:translateX(70px)}}' +
  '@keyframes derivaLarga{from{transform:translateX(-150px)}to{transform:translateX(150px)}}'

function azar(semilla) {
  let s = semilla >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}
const r1 = n => Math.round(n * 10) / 10
const pt = ([x, y]) => `${r1(x)} ${r1(y)}`
const mas = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k]

// Una curva suave por unos puntos (Catmull-Rom pasada a cúbicas de Bézier).
function curva(puntos) {
  let d = `M${pt(puntos[0])}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[Math.max(i - 1, 0)], p1 = puntos[i], p2 = puntos[i + 1], p3 = puntos[Math.min(i + 2, puntos.length - 1)]
    d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`
  }
  return d
}

// --- Lo común a las tres escenas ----------------------------------------------------

// La banda oscura de lo alto del cielo, la aguada de tinta y el desenfoque de la niebla.
function comunes(semilla) {
  return `<linearGradient id="bokashi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#040406" stop-opacity=".9"/><stop offset=".5" stop-color="#040406" stop-opacity=".5"/><stop offset="1" stop-color="#040406" stop-opacity="0"/></linearGradient>
<filter id="aguada" x="0" y="0" width="1" height="1"><feTurbulence type="fractalNoise" baseFrequency="0.0014 0.0048" numOctaves="2" seed="${semilla}"/><feColorMatrix type="matrix" values="0 0 0 0 .216 0 0 0 0 .196 0 0 0 0 .22 0 0 0 1.6 -.82"/></filter>
<linearGradient id="banda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${PERGAMINO}" stop-opacity="0"/><stop offset=".18" stop-color="${PERGAMINO}"/><stop offset=".82" stop-color="${PERGAMINO}"/><stop offset="1" stop-color="${PERGAMINO}" stop-opacity="0"/></linearGradient>
<filter id="vaho" x="-5%" y="-60%" width="110%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
<linearGradient id="lado" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
}
const cielo = () => `<rect width="${W}" height="${H}" filter="url(#aguada)" opacity=".45"/><rect width="${W}" height="250" fill="url(#bokashi)"/>`

// Las bandas de niebla de los grabados: largas, con las puntas redondas. Cada una es
// [x, y, ancho, alto, opacidad, segundos, larga]: va y viene 140 unidades de lado a lado
// (300 si es larga), y tarda esos segundos en cada trayecto, hacia la derecha primero o,
// si son negativos, hacia la izquierda. Las lejanas van más despacio que las cercanas.
function nieblas(bandas) {
  return '<g fill="url(#banda)" filter="url(#vaho)">' + bandas.map(([x, y, w, h, o, s, larga], i) => {
    const dur = Math.abs(s)
    const estilo = `animation-duration:${dur}s;animation-delay:-${r1(dur * ((i * 0.37 + 0.2) % 1))}s` + (s < 0 ? ';animation-direction:alternate-reverse' : '') + (larga ? ';animation-name:derivaLarga' : '')
    return `<rect class="nb" style="${estilo}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" opacity="${o}"/>`
  }).join('') + '</g>'
}

// Una cordillera lejana, como una aguada: la cresta con ondas al azar y el cuerpo que se
// pierde hacia abajo, con su degradado.
function cordillera(id, semilla, x0, x1, base, alto, opacidad, picos = false) {
  const r = azar(semilla)
  const ondas = [...Array(4)].map((_, i) => ({ f: (0.0035 + r() * 0.004) * (i + 1), a: alto / (i + 1.4) * (0.7 + r() * 0.6), fase: r() * 6.28 }))
  // Con picos, la onda grande se dobla en crestas agudas, como los montes de las aguadas.
  const onda = (o, x, i) => picos && i < 2 ? o.a * 1.25 * Math.pow(1 - Math.abs(Math.sin(o.f * 0.5 * x + o.fase)), 1.6) : o.a * (0.5 + 0.5 * Math.sin(o.f * x + o.fase))
  const puntos = []
  for (let x = x0; x <= x1 + 0.1; x += picos ? 20 : 40) {
    puntos.push([x, base - ondas.reduce((s, o, i) => s + onda(o, x, i), 0)])
  }
  const cima = Math.min(...puntos.map(p => p[1]))
  return {
    defs: `<linearGradient id="${id}" x1="0" y1="${r1(cima)}" x2="0" y2="${base + 120}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${PIZARRA}" stop-opacity="${opacidad}"/><stop offset=".55" stop-color="${PIZARRA}" stop-opacity="${r1(opacidad * 0.45 * 100) / 100}"/><stop offset="1" stop-color="${PIZARRA}" stop-opacity="0"/></linearGradient>`,
    dibujo: `<mask id="${id}M" maskUnits="userSpaceOnUse" x="${x0}" y="0" width="${x1 - x0}" height="${H}"><rect x="${x0}" width="${x1 - x0}" height="${H}" fill="url(#lado)"/></mask><path d="${curva(puntos)}L${x1} ${base + 120}L${x0} ${base + 120}Z" fill="url(#${id})" mask="url(#${id}M)"/>`,
  }
}

// Una nube que cruza un disco, como una pincelada: gruesa donde empieza (x0) y afilada
// donde acaba (x1). Puede ir hacia la izquierda.
function nube(x0, x1, y, grueso) {
  const L = x1 - x0
  return `M${r1(x0)} ${r1(y)}C${r1(x0 + 0.2 * L)} ${r1(y - grueso)} ${r1(x0 + 0.5 * L)} ${r1(y - grueso * 0.55)} ${r1(x1)} ${r1(y)}C${r1(x0 + 0.5 * L)} ${r1(y + grueso * 0.35)} ${r1(x0 + 0.2 * L)} ${r1(y + grueso * 0.75)} ${r1(x0)} ${r1(y)}Z`
}

const abrir = estilo => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><style>${CSS_NIEBLA}${estilo}${QUIETO}</style><rect width="${W}" height="${H}" fill="${CARBON}"/>`

// Un giro alrededor de un pivote, escrito entero para que no dependa de transform-origin.
const giro = ([x, y], grados) => `translate(${x}px,${y}px) rotate(${grados}deg) translate(${-x}px,${-y}px)`

// --- Ronin ------------------------------------------------------------------------
// Un guerrero solitario de espaldas, sobre una peña, delante de un sol rojo enorme a la
// derecha. Dos nubes cruzan el sol, como en los grabados.

// El ronin en coordenadas propias: los pies en (0, 0) y la copa del sombrero arriba, a
// unas 240 unidades. Sombrero de paja (kasa), mangas anchas, la falda pantalón (hakama)
// que el viento empuja a la derecha, la vaina asomando a la izquierda y las dos cintas
// del sombrero al viento, que ondean cada una a su ritmo desde su nudo.
//
// La ropa del lado del viento se hincha con las ráfagas: el bajo de la hakama gira desde
// la cintura. Es una pieza suelta encima del cuerpo, del mismo negro, que en reposo
// coincide con su borde: quieta, la silueta es la de siempre, y al girar hacia fuera la
// ensancha sin dejar huecos. La manga se probó igual y se quitó, porque al girar dejaba
// un pico donde se junta con el cuerpo.
const NUDO1 = [12, -191], NUDO2 = [17, -186], CINTURA = [39, -90]
function figura() {
  const kasa = 'M-75 -196Q-40 -214 0 -243Q40 -214 75 -196Q38 -186 0 -185Q-38 -186 -75 -196Z'
  const cuerpo = 'M-12 -190C-26 -189 -40 -185 -46 -177C-52 -166 -56 -148 -59 -128C-60 -120 -56 -115 -48 -114L-33 -113C-35 -104 -37 -96 -39 -88C-43 -62 -48 -34 -52 -10L-44 -1L-14 0L-6 -30L6 -30L12 0L46 1C54 -2 62 -6 68 -12C56 -36 46 -62 40 -88C38 -96 36 -104 34 -113L48 -115C57 -117 61 -122 60 -129C57 -149 52 -166 46 -177C40 -185 26 -189 12 -190Z'
  const vaina = 'M-22 -112C-60 -100 -104 -82 -150 -62L-147 -55C-102 -74 -58 -92 -20 -104Z'
  const cinta1 = 'M10 -193C36 -197 58 -212 84 -213C104 -214 116 -203 134 -200C150 -197 160 -204 172 -209C162 -199 148 -193 132 -195C114 -197 102 -207 84 -207C60 -206 40 -191 14 -188Z'
  const cinta2 = 'M16 -188C40 -186 60 -193 80 -189C96 -186 106 -178 122 -176C132 -175 141 -178 150 -183C142 -173 131 -170 120 -171C104 -172 94 -181 80 -183C60 -184 42 -181 18 -183Z'
  const bajo = 'M28 -92L40 -88C46 -62 56 -36 68 -12C62 -6 54 -2 46 1L28 0Z'
  return `<path d="${kasa}"/><path d="${cuerpo}"/><path class="bajo" d="${bajo}"/><path d="${vaina}"/><path class="cinta1" d="${cinta1}"/><path class="cinta2" d="${cinta2}"/>`
}

function ronin() {
  const sx = 1240, sy = 400, R = 285
  const pie = [1240, 704]
  const lejos = cordillera('lejos', 5, -40, 1000, 690, 150, 0.38, true)
  const cerca = cordillera('cerca', 9, -40, 960, 790, 100, 0.5)
  const defs = `<defs>${comunes(11)}
<radialGradient id="halo" cx="${sx}" cy="${sy}" r="${R * 2}" gradientUnits="userSpaceOnUse"><stop offset=".49" stop-color="${CARMESI}" stop-opacity=".24"/><stop offset=".62" stop-color="${CARMESI}" stop-opacity=".07"/><stop offset="1" stop-color="${CARMESI}" stop-opacity="0"/></radialGradient>
<clipPath id="disco"><circle cx="${sx}" cy="${sy}" r="${R}"/></clipPath>
${lejos.defs}${cerca.defs}
</defs>`
  // Dos nubes cruzan el sol, del color del cielo: solo se ven sobre el disco, y cada una
  // se afila dentro de él como una pincelada. Las dos se deslizan despacio, cada una en
  // un sentido.
  const nubes = `<path class="nube1" d="${nube(sx - R - 80, sx + 95, sy - 92, 24)}"/><path class="nube2" d="${nube(sx + R + 60, sx - 60, sy - 52, 11)}"/>`
  // La peña donde está el ronin: sube desde abajo, con caras de roca, y baja hacia la derecha.
  const pena = `M820 1000L905 930L960 902L1012 860L1060 842L1102 790L1150 752L1196 716L${pie[0] - 22} ${pie[1]}L${pie[0] + 34} ${pie[1] + 1}L1300 716L1342 744L1380 742L1432 774L1500 790L1560 822L1600 830L1600 1000Z`
  // El movimiento: el viento mueve las cintas del sombrero, las nubes y la niebla, y el
  // halo del sol respira.
  const estilo = '.nube1{animation:nube 16s ease-in-out -4s infinite alternate}' +
    '.nube2{animation:nube 12s ease-in-out -9s infinite alternate-reverse}' +
    '@keyframes nube{from{transform:translateX(-30px)}to{transform:translateX(30px)}}' +
    '.halo{animation:respira 10s ease-in-out infinite}@keyframes respira{50%{opacity:.7}}' +
    '.cinta1{animation:cinta1 3.4s ease-in-out infinite}.cinta2{animation:cinta2 2.9s ease-in-out -1.2s infinite}' +
    `@keyframes cinta1{0%,100%{transform:${giro(NUDO1, 0)}}45%{transform:${giro(NUDO1, -5)}}75%{transform:${giro(NUDO1, 1.5)}}}` +
    `@keyframes cinta2{0%,100%{transform:${giro(NUDO2, 0)}}40%{transform:${giro(NUDO2, -4)}}70%{transform:${giro(NUDO2, 2)}}}` +
    // Una ráfaga cada 6 segundos: el bajo de la hakama se hincha, aletea un poco y vuelve
    // a caer.
    '.bajo{animation:bajo 6s ease-in-out infinite}' +
    `@keyframes bajo{0%,100%{transform:${giro(CINTURA, 0)}}24%{transform:${giro(CINTURA, -10)}}38%{transform:${giro(CINTURA, -5.5)}}52%{transform:${giro(CINTURA, -8.5)}}80%{transform:${giro(CINTURA, -1)}}}`
  return abrir(estilo) + defs + cielo() +
    lejos.dibujo +
    nieblas([[-60, 600, 760, 34, 0.07, 30], [140, 668, 900, 26, 0.06, -26]]) +
    cerca.dibujo +
    nieblas([[-80, 760, 820, 40, 0.06, 22]]) +
    `<g transform="translate(30 0)">` +
    `<circle class="halo" cx="${sx}" cy="${sy}" r="${R * 2}" fill="url(#halo)"/>` +
    `<circle cx="${sx}" cy="${sy}" r="${R}" fill="${CARMESI}"/>` +
    `<g clip-path="url(#disco)" fill="${CARBON}" opacity=".9">${nubes}</g>` +
    `<path d="${pena}" fill="${TINTA}"/>` +
    `<g fill="${TINTA}" transform="translate(${pie[0]} ${pie[1]})">${figura()}</g>` +
    `</g>` +
    nieblas([[640, 838, 1000, 30, 0.07, -18]]) +
    `</svg>`
}

// --- Katana -----------------------------------------------------------------------
// Una espada en primer plano que cruza el fondo en diagonal: la empuñadura con su cordón
// carmesí y la guarda de oro a la derecha, y la hoja de acero que sube hacia la izquierda
// y sale del cuadro, con el filo arriba y su línea de temple (hamon). La hoja pasa por el
// tercio de arriba y se apaga un poco en el centro, donde va la conversación.

function katana() {
  const T = [1250, 610] // el centro de la guarda (tsuba)
  const K = [-130, -160] // la punta, fuera del cuadro: es un primer plano
  const largo = Math.hypot(K[0] - T[0], K[1] - T[1])
  const u = [(K[0] - T[0]) / largo, (K[1] - T[1]) / largo] // de la guarda hacia la punta
  const nf = [-u[1], u[0]] // hacia el lado del filo, arriba a la derecha
  const ang = Math.atan2(u[1], u[0]) * 180 / Math.PI
  const s0 = 62 // donde empieza la hoja, después de la guarda y del collar (habaki)
  const lb = largo - s0
  const curvatura = 30
  const ancho = t => 54 - 10 * t
  const P = t => mas(mas(T, u, s0 + t * lb), nf, curvatura * 4 * t * (1 - t))
  const n = 90, tk = 0.95
  const ts = [...Array(n + 1)].map((_, i) => (i / n) * tk)
  const lomo = ts.map(t => mas(P(t), nf, -ancho(t) / 2))
  const filo = ts.map(t => mas(P(t), nf, ancho(t) / 2))
  const arista = ts.map(t => mas(P(t), nf, -ancho(t) / 2 + 0.36 * ancho(t)))
  const temple = ts.map(t => mas(P(t), nf, ancho(t) / 2 - (0.25 * ancho(t) + 3.4 * Math.sin(t * 52) + 2 * Math.sin(t * 117 + 1))))
  const punta = mas(P(1), nf, -ancho(1) / 2)
  const finFilo = mas(P(1), nf, ancho(1) / 2 * 0.95)
  const linea = ps => ps.map(pt).join('L')
  const hoja = `M${linea(lomo)}L${pt(punta)}Q${pt(finFilo)} ${pt(filo[n])}L${linea([...filo].reverse())}Z`
  const zonaLomo = `M${linea(lomo)}L${pt(punta)}L${linea([...arista].reverse())}Z`
  const zonaTemple = `M${linea(temple)}Q${pt(mas(finFilo, nf, -8))} ${pt(punta)}Q${pt(finFilo)} ${pt(filo[n])}L${linea([...filo].reverse())}Z`
  // Un reflejo de la luna en el filo, cerca del collar.
  const reflejo = mas(filo[Math.round(n * 0.1)], nf, -3)
  // Cada 12 segundos un destello corre por el centro de la hoja, como si girara un poco
  // bajo la luna: sale del collar, se va apagando hacia la punta y espera. Va por el
  // acero oscuro del centro y no por el filo, que es claro y no lo dejaría ver. Quieto,
  // no se ve.
  const anguloEn = t => {
    const d = mas([u[0] * lb, u[1] * lb], nf, curvatura * 4 * (1 - 2 * t))
    return Math.atan2(d[1], d[0]) * 180 / Math.PI
  }
  const tramos = 8
  let barrido = '@keyframes barrido{'
  for (let j = 0; j <= tramos; j++) {
    const t = 0.05 + 0.7 * j / tramos
    const o = j === 0 ? 0 : Math.round(95 * Math.pow(1 - j / tramos, 0.8)) / 100
    barrido += `${r1(32 * j / tramos)}%{transform:translate(${pt(P(t)).replace(' ', 'px,')}px) rotate(${r1(anguloEn(t))}deg);opacity:${o}}`
  }
  barrido += '}'
  const estilo = '.barrido{animation:barrido 12s linear infinite}' + barrido +
    '.reflejo{animation:reflejo 12s ease-in-out infinite}@keyframes reflejo{0%,18%,100%{opacity:.8}5%{opacity:1}}'
  // El collar de oro (habaki), la guarda y la empuñadura, a lo largo del eje.
  const rect = (a, b, medio) => [mas(mas(T, u, a), nf, -medio), mas(mas(T, u, b), nf, -medio), mas(mas(T, u, b), nf, medio), mas(mas(T, u, a), nf, medio)]
  const poli = ps => `M${ps.map(pt).join('L')}Z`
  const habaki = poli(rect(18, s0 + 1, 30))
  const fuchi = poli(rect(-18, -42, 31))
  const tsukaLargo = 330
  const finTsuka = -42 - tsukaLargo
  const tsuka = poli([mas(mas(T, u, -42), nf, -30), mas(mas(T, u, finTsuka), nf, -27), mas(mas(T, u, finTsuka), nf, 27), mas(mas(T, u, -42), nf, 30)])
  const kashira = poli(rect(finTsuka, finTsuka - 26, 28))
  // Los rombos de piel blanca (samegawa) que deja ver el cordón trenzado, y los cruces
  // del cordón entre rombo y rombo.
  let rombos = '', cruces = ''
  for (let k = 0; k < 7; k++) {
    const c = mas(T, u, -76 - k * 46)
    rombos += poli([mas(c, u, 15), mas(c, nf, 13), mas(c, u, -15), mas(c, nf, -13)])
    const m = mas(c, u, -23)
    if (k < 6) cruces += `M${pt(mas(mas(m, u, 8), nf, -27))}L${pt(mas(mas(m, u, -8), nf, 27))}M${pt(mas(mas(m, u, -8), nf, -27))}L${pt(mas(mas(m, u, 8), nf, 27))}`
  }
  const lejos = cordillera('lejos', 21, -40, 1040, 860, 120, 0.4)
  const defs = `<defs>${comunes(23)}
<radialGradient id="luna" cx="1420" cy="80" r="820" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${PERGAMINO}" stop-opacity=".09"/><stop offset="1" stop-color="${PERGAMINO}" stop-opacity="0"/></radialGradient>
<radialGradient id="calmaG" cx="820" cy="400" r="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".48"/><stop offset=".6" stop-color="#fff" stop-opacity=".75"/><stop offset="1" stop-color="#fff"/></radialGradient>
<mask id="calma" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#calmaG)"/></mask>
<filter id="brillo" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="destello" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="aura" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="9"/></filter>
${lejos.defs}
</defs>`
  return abrir(estilo) + defs + cielo() +
    `<rect width="${W}" height="${H}" fill="url(#luna)"/>` +
    lejos.dibujo +
    nieblas([[-60, 820, 820, 40, 0.06, 24], [200, 890, 700, 28, 0.05, -20], [1000, 90, 700, 30, 0.04, 32]]) +
    `<g mask="url(#calma)">` +
    `<path d="${hoja}" fill="${ACERO}" opacity=".2" filter="url(#brillo)"/>` +
    `<path d="${hoja}" fill="#5f686f"/>` +
    `<path d="${zonaLomo}" fill="#353b41"/>` +
    `<path d="${zonaTemple}" fill="#b9c0c5" opacity=".92"/>` +
    `<path d="M${linea(arista)}L${pt(punta)}" fill="none" stroke="#9aa3aa" stroke-width="1.6"/>` +
    `<path d="M${linea(filo)}Q${pt(finFilo)} ${pt(punta)}" fill="none" stroke="#f1ebdf" stroke-width="2"/>` +
    `<path d="M${pt(arista[n])}L${pt(filo[n])}" stroke="#8f989f" stroke-width="1.4"/>` +
    `</g>` +
    `<g class="barrido" transform="translate(${pt(P(0.05))}) rotate(${r1(anguloEn(0.05))})" opacity="0"><ellipse rx="170" ry="16" fill="${PERGAMINO}" opacity=".3" filter="url(#aura)"/><ellipse rx="115" ry="3" fill="#fffaf0" filter="url(#destello)"/></g>` +
    `<ellipse class="reflejo" cx="${pt(reflejo).split(' ')[0]}" cy="${pt(reflejo).split(' ')[1]}" rx="90" ry="4" transform="rotate(${r1(ang)} ${pt(reflejo)})" fill="${PERGAMINO}" opacity=".8" filter="url(#destello)"/>` +
    `<path d="${habaki}" fill="${ORO}"/><path d="M${pt(mas(mas(T, u, 40), nf, -30))}L${pt(mas(mas(T, u, 40), nf, 30))}" stroke="#7d6640" stroke-width="2.4"/><path d="M${pt(mas(mas(T, u, 22), nf, 26))}L${pt(mas(mas(T, u, s0 - 2), nf, 26))}" stroke="#e1c993" stroke-width="2" opacity=".7"/>` +
    `<path d="${tsuka}" fill="#7c2427"/>` +
    `<path d="${rombos}" fill="${PERGAMINO}" opacity=".9"/>` +
    `<path d="${cruces}" stroke="#4a1517" stroke-width="3"/>` +
    `<path d="${fuchi}" fill="#1b1a1f" stroke="${ORO}" stroke-width="2.4"/>` +
    `<path d="${kashira}" fill="#1b1a1f" stroke="${ORO}" stroke-width="2.4"/>` +
    `<g transform="translate(${pt(T)}) rotate(${r1(ang)})"><ellipse rx="18" ry="118" fill="#17161b" stroke="${ORO}" stroke-width="4"/><ellipse rx="12" ry="92" fill="none" stroke="${ORO}" stroke-width="1.6" opacity=".38"/></g>` +
    `</svg>`
}

// --- Fortaleza --------------------------------------------------------------------
// Un castillo japonés sobre una colina, a la derecha: la base de piedra con los lados
// curvos, cuatro pisos con sus tejados superpuestos y frontones, adornos de oro en lo
// alto, una luna pergamino con su halo y bandas de niebla que cruzan la colina.

// Un tejado: el alero, más ancho que el muro, con las puntas levantadas y los faldones
// cóncavos, como los de los castillos. Devuelve el tejado y la línea del alero, que
// recoge la luz de la luna.
function tejado(cx, y, ancho, alto, arriba, levanta = 10) {
  const L = cx - ancho / 2, D = cx + ancho / 2, a = arriba / 2
  const alero = `M${r1(L)} ${r1(y - levanta)}Q${r1(L + ancho * 0.08)} ${r1(y + 1)} ${r1(L + ancho * 0.2)} ${r1(y)}L${r1(D - ancho * 0.2)} ${r1(y)}Q${r1(D - ancho * 0.08)} ${r1(y + 1)} ${r1(D)} ${r1(y - levanta)}`
  return {
    tejado: alero + `Q${r1(cx + a + (ancho / 2 - a) * 0.3)} ${r1(y - levanta - alto * 0.12)} ${r1(cx + a)} ${r1(y - alto)}L${r1(cx - a)} ${r1(y - alto)}Q${r1(cx - a - (ancho / 2 - a) * 0.3)} ${r1(y - levanta - alto * 0.12)} ${r1(L)} ${r1(y - levanta)}Z`,
    alero,
  }
}
// Un frontón triangular (chidori-hafu), con los lados un poco cóncavos.
function fronton(cx, y, ancho, alto) {
  const L = cx - ancho / 2, D = cx + ancho / 2
  return `M${r1(L)} ${r1(y)}Q${r1(cx - ancho * 0.16)} ${r1(y - alto * 0.5)} ${r1(cx)} ${r1(y - alto)}Q${r1(cx + ancho * 0.16)} ${r1(y - alto * 0.5)} ${r1(D)} ${r1(y)}Z`
}
// Un frontón curvo (kara-hafu), con forma de campana.
function karahafu(cx, y, ancho, alto) {
  const L = cx - ancho / 2, D = cx + ancho / 2
  return `M${r1(L)} ${r1(y)}C${r1(L + ancho * 0.22)} ${r1(y)} ${r1(cx - ancho * 0.2)} ${r1(y - alto)} ${r1(cx)} ${r1(y - alto)}C${r1(cx + ancho * 0.2)} ${r1(y - alto)} ${r1(D - ancho * 0.22)} ${r1(y)} ${r1(D)} ${r1(y)}Z`
}
function fortaleza() {
  const cx = 1170
  const luna = [1420, 262], RL = 70
  const lejos = cordillera('lejos', 34, -40, 1000, 700, 150, 0.4, true)
  const cerca = cordillera('cerca', 37, -40, 860, 820, 90, 0.5)
  const defs = `<defs>${comunes(41)}
<radialGradient id="halo" cx="${luna[0]}" cy="${luna[1]}" r="560" gradientUnits="userSpaceOnUse"><stop offset=".1" stop-color="${PERGAMINO}" stop-opacity=".2"/><stop offset=".45" stop-color="${PERGAMINO}" stop-opacity=".06"/><stop offset="1" stop-color="${PERGAMINO}" stop-opacity="0"/></radialGradient>
<clipPath id="disco"><circle cx="${luna[0]}" cy="${luna[1]}" r="${RL}"/></clipPath>
<filter id="candil" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
<linearGradient id="piedra" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1c1a20"/><stop offset=".55" stop-color="#25222a"/><stop offset="1" stop-color="#34303a"/></linearGradient>
${lejos.defs}${cerca.defs}
</defs>`
  // La colina, con un hombro más lejano detrás.
  const colinaLejos = 'M640 1000C760 900 900 800 1040 772C1180 744 1320 726 1460 736C1530 741 1580 752 1600 758V1000Z'
  const colina = 'M790 1000C870 900 960 800 1040 748C1100 716 1150 712 1180 712C1230 712 1280 716 1330 734C1420 766 1520 812 1600 836V1000Z'
  // La base de piedra (ishigaki), con los lados curvos hacia dentro, y sus hiladas.
  const yb = 716, yt = 640
  const base = `M${cx - 164} ${yb}Q${cx - 134} ${yb - 6} ${cx - 128} ${yt}L${cx + 128} ${yt}Q${cx + 134} ${yb - 6} ${cx + 164} ${yb}Z`

  // Los pisos, de abajo arriba: [ancho del muro, alto del muro, ancho del alero, alto del tejado].
  const pisos = [[228, 52, 330, 44], [186, 44, 278, 38], [146, 38, 228, 34], [110, 34, 186, 52]]
  let y = yt, muros = '', luzMuros = '', tejados = '', frontones = '', aleros = '', ventanas = '', luces = '', resplandor = '', oros = '', cima = 0
  pisos.forEach(([wm, hm, wa, ht], i) => {
    const arriba = y - hm
    muros += `<rect x="${cx - wm / 2}" y="${arriba}" width="${wm}" height="${hm + 2}"/>`
    luzMuros += `M${cx + wm / 2 - 1} ${arriba + 8}V${y}`
    const nv = Math.round(wm / 36)
    for (let k = 0; k < nv; k++) {
      const x = r1(cx - wm / 2 + (wm / nv) * (k + 0.5) - 4)
      const yv = r1(arriba + hm * 0.38), hv = r1(hm * 0.3)
      const hueco = clase => `<rect${clase} x="${x}" y="${yv}" width="8" height="${hv}"/>`
      // Las ventanas encendidas tiemblan como la luz de un candil, cada una a su ritmo, con
      // un resplandor alrededor que tiembla con ellas.
      if ((i === 0 && k === 2) || (i === 1 && k === nv - 2) || (i === 3 && k === 1)) {
        const vela = ` class="vela${luces.split('<rect').length}"`
        luces += hueco(vela)
        resplandor += `<rect${vela} x="${r1(x - 6)}" y="${r1(yv - 5)}" width="20" height="${r1(hv + 10)}" rx="4" filter="url(#candil)"/>`
      } else ventanas += hueco('')
    }
    const ultimo = i === pisos.length - 1
    const t = tejado(cx, arriba + 6, wa, ht, ultimo ? 44 : pisos[i + 1][0] + 4, ultimo ? 13 : 10)
    tejados += `<path d="${t.tejado}"/>`
    aleros += t.alero
    if (i === 0) { frontones += `<path d="${karahafu(cx, arriba + 2, 96, 26)}"/>`; oros += `<circle cx="${cx}" cy="${arriba - 19}" r="3"/>` }
    if (i === 1) { frontones += `<path d="${fronton(cx, arriba - 4, 98, 44)}"/>`; oros += `<circle cx="${cx}" cy="${arriba - 41}" r="3"/>` }
    if (i === 2) {
      frontones += `<path d="${fronton(cx - 50, arriba, 54, 26)}"/><path d="${fronton(cx + 50, arriba, 54, 26)}"/>`
      oros += `<circle cx="${cx - 50}" cy="${arriba - 22}" r="2.4"/><circle cx="${cx + 50}" cy="${arriba - 22}" r="2.4"/>`
    }
    if (ultimo) cima = arriba + 6 - ht
    y = arriba + 6 - ht * 0.72
  })
  // Lo alto: el frontón grande del último tejado, el caballete y sus dos adornos de oro
  // (shachihoko), que se curvan hacia dentro.
  const remate = `<path d="${fronton(cx, cima + 30, 74, 34)}" fill="#26232b" stroke="${PERGAMINO}" stroke-opacity=".25" stroke-width="1.2"/>` +
    `<path d="M${cx - 24} ${cima}H${cx + 24}" stroke="#0e0e12" stroke-width="6"/>` +
    [-1, 1].map(l => `<path d="M${cx + l * 19} ${cima + 1}C${cx + l * 20} ${cima - 5} ${cx + l * 25} ${cima - 10} ${cx + l * 29} ${cima - 14}C${cx + l * 31} ${cima - 16} ${cx + l * 29} ${cima - 19} ${cx + l * 25} ${cima - 17}C${cx + l * 27} ${cima - 14} ${cx + l * 26} ${cima - 9} ${cx + l * 25} ${cima + 1}Z" fill="${ORO}"/>`).join('') +
    `<circle cx="${cx}" cy="${cima - 2}" r="2.6" fill="${ORO}"/>`
  // El movimiento: la niebla cruza la colina y el castillo, con un recorrido largo la de
  // delante; dos nubes pasan por la luna en sentidos contrarios y su halo respira; y las
  // ventanas encendidas tiemblan como candiles, con su resplandor.
  const estilo = '.nube1{animation:nubeLarga 16s ease-in-out -3s infinite alternate}.nube2{animation:nube 12s ease-in-out -8s infinite alternate-reverse}' +
    '@keyframes nubeLarga{from{transform:translateX(-60px)}to{transform:translateX(60px)}}@keyframes nube{from{transform:translateX(-45px)}to{transform:translateX(45px)}}' +
    '.halo{animation:respira 9s ease-in-out infinite}@keyframes respira{50%{opacity:.72}}' +
    '.vela1{animation:vela 2.6s ease-in-out infinite}.vela2{animation:vela 3.4s ease-in-out -1.1s infinite}.vela3{animation:vela 4.1s ease-in-out -2.3s infinite}' +
    '@keyframes vela{0%,100%{opacity:1}18%{opacity:.6}30%{opacity:.95}52%{opacity:.42}66%{opacity:.9}84%{opacity:.62}}'
  return abrir(estilo) + defs + cielo() +
    `<circle class="halo" cx="${luna[0]}" cy="${luna[1]}" r="560" fill="url(#halo)"/><circle cx="${luna[0]}" cy="${luna[1]}" r="${RL}" fill="${PERGAMINO}"/>` +
    `<g clip-path="url(#disco)" fill="${CARBON}" opacity=".88"><path class="nube1" d="${nube(1280, 1462, 287, 14)}"/><path class="nube2" d="${nube(1510, 1372, 238, 8)}"/></g>` +
    lejos.dibujo +
    nieblas([[-60, 520, 760, 30, 0.06, 22], [60, 610, 900, 36, 0.06, -20]]) +
    cerca.dibujo +
    `<g transform="translate(100 0)">` +
    `<path d="${colinaLejos}" fill="#0d0d11"/>` +
    nieblas([[900, 540, 700, 40, 0.09, 18, true]]) +
    `<path d="${colina}" fill="${TINTA}"/>` +
    `<g transform="translate(${cx} ${yb}) scale(1.15) translate(${-cx} ${-yb})">` +
    `<path d="${base}" fill="url(#piedra)"/>` +
    `<g fill="${PIZARRA}">${muros}</g>` +
    `<path d="${luzMuros}" stroke="${PERGAMINO}" stroke-width="1.4" opacity=".18"/>` +
    `<g fill="#e2c38f" opacity=".5">${resplandor}</g>` +
    `<g fill="#0b0b0e" opacity=".75">${ventanas}</g>` +
    `<g fill="${PERGAMINO}" opacity=".8">${luces}</g>` +
    `<g fill="#0c0c0f">${tejados}</g>` +
    `<g fill="#26232b" stroke="${PERGAMINO}" stroke-opacity=".25" stroke-width="1.2">${frontones}</g>` +
    `<path d="${aleros}" fill="none" stroke="${PERGAMINO}" stroke-width="1.5" opacity=".3"/>` +
    remate + `<g fill="${ORO}">${oros}</g>` +
    `</g>` +
    nieblas([[860, 690, 700, 46, 0.15, -14, true], [640, 780, 960, 36, 0.11, 17, true], [760, 852, 640, 26, 0.09, -12, true]]) +
    `</g>` +
    `</svg>`
}

const ESCENAS = { ronin, katana, fortaleza }
const salida = process.argv[2]
for (const [nombre, fn] of Object.entries(ESCENAS)) {
  const svg = fn()
  writeFileSync(`${salida}/${nombre}.svg`, svg)
  console.log(`${nombre}: ${svg.length} caracteres`)
}
if (process.argv[3]) {
  const cabecera = '// Generado por herramientas/genera_bushido.mjs: las escenas de la sala Bushidō, solo de noche.\n// No se edita a mano.\n'
  const cuerpo = Object.entries(ESCENAS).map(([n, fn]) => 'export const ' + n.toUpperCase() + ' = ' + JSON.stringify(fn())).join('\n')
  writeFileSync(process.argv[3], cabecera + cuerpo + '\n')
  console.log('módulo escrito')
}
