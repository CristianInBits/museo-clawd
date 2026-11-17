// Generador de las escenas de la sala Kemet de museo-clawd: Faraón, Anubis y Jeroglíficos.
// Dibujos propios, inspirados en la identidad visual del Antiguo Egipto y no solo en las
// pirámides: las pinturas de las tumbas, los relieves de los templos, las máscaras de los
// faraones, los jeroglíficos y los dioses. Figuras de perfil, ornamentación geométrica,
// oro envejecido, lapislázuli y arenisca, como un mural egipcio visto con ojos de ahora,
// sencillo y limpio. Solo modo oscuro, con la paleta de la sala: negro profundo, oro
// faraónico, azul lapislázuli, turquesa egipcio y arenisca.
//
// El movimiento va en animaciones CSS dentro del <style> de cada escena. Cada elemento
// animado tiene en sus atributos una posición quieta buena, la que se ve con «reducir
// movimiento». Lo que se mueve es pequeño y tiene bordes o brillo; lo grande se queda
// quieto y sin desenfoque, para que la aplicación llegue a pintar a tiempo también en
// pantalla completa.
import { H, W, abrir, azar, banda, curva, escribir, giro, horizontal, mas, poli, pt, quiebra, r1, r2, radial, vertical } from './comun.mjs'

const NEGRO = '#101820'
const ORO = '#c9a052'
const LAPIS = '#174a75'
const TURQUESA = '#1c807c'
const ARENISCA = '#d9c49a'
// El negro de las siluetas, más oscuro que el fondo, y el rojo de la cornalina.
const SOMBRA = '#0a0f15'
const CORNALINA = '#b4492f'

// Un círculo hecho con cuatro curvas, para que se pueda escalar distinto a lo ancho y a
// lo alto, como los jeroglíficos que rodean una columna.
const circulo = (cx, cy, r) => {
  const k = r * 0.5523
  return `M${cx - r} ${cy}C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r}C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy}` +
    `C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r}C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy}Z`
}

// Los jeroglíficos, trazados en una caja de 20 × 24 solo con M, L, C, Q y Z en absoluto,
// para poder moverlos y escalarlos número a número.
const JEROGLIFOS = {
  ankh: 'M10 24L10 11M3 11L17 11M10 11C5 11 5 1 10 1C15 1 15 11 10 11',
  djed: 'M10 24L10 4M5 4L15 4M5 8L15 8M5 12L15 12M5 16L15 16M7 24L13 24',
  was: 'M10 24L10 5M10 5L14 2M10 5L7 3M8 24L10 21L12 24',
  ojo: 'M2 8C6 3 14 3 18 8C14 11 6 11 2 8Z' + circulo(10, 7.5, 1.6) + 'M8 10L6 18M12 10Q15 16 18 15',
  ra: circulo(10, 12, 7) + circulo(10, 12, 1.5),
  agua: 'M1 12L4 9L7 12L10 9L13 12L16 9L19 12',
  pan: 'M3 16C3 8 17 8 17 16Z',
  boca: 'M2 12C6 8 14 8 18 12C14 16 6 16 2 12Z',
  cesta: 'M2 10C2 18 18 18 18 10ZM15 10C17 6 20 8 18 10',
  junco: 'M10 24C6 16 7 6 12 1C11 6 12 14 10 24',
  pluma: 'M8 24C8 14 9 6 14 1C16 6 14 14 10 24ZM10 24L12 4',
  vibora: 'M2 18C5 18 6 14 9 14C12 14 12 18 15 18C17 18 18 15 18 13L19 11M17 13L18 10',
  ave: 'M3 22L6 14C4 10 6 6 10 6C12 3 16 4 16 7L19 8L16 9C17 14 14 18 10 19L8 22',
  escarabajo: 'M10 4C14 4 15 9 14 13C13 18 7 18 6 13C5 9 6 4 10 4ZM6 9L2 7M6 13L2 15M14 9L18 7M14 13L18 15M10 4L10 2',
  loto: 'M10 24L10 14M10 14C6 12 4 6 6 2C8 6 9 9 10 14C11 9 12 6 14 2C16 6 14 12 10 14',
  estera: 'M3 8L17 8L17 16L3 16ZM3 12L17 12',
}
const NOMBRES = Object.keys(JEROGLIFOS)

// Pone un trazado en la escena: lo escala por ex a lo ancho y ey a lo alto y lo mueve a
// (x, y). Los números van por parejas, x e y, porque los trazados solo usan M, L, C y Q.
function coloca(d, x, y, ex, ey = ex) {
  let par = 0
  return d.replace(/-?\d*\.?\d+/g, n => r1(par++ % 2 === 0 ? x + Number(n) * ex : y + Number(n) * ey))
}

// Una estrella de cinco puntas, como las del techo azul de las tumbas.
function estrella5(cx, cy, r) {
  let d = ''
  for (let k = 0; k < 10; k++) {
    const a = (-90 + k * 36) * Math.PI / 180, rr = k % 2 ? r * 0.42 : r
    d += `${k ? 'L' : 'M'}${r1(cx + rr * Math.cos(a))} ${r1(cy + rr * Math.sin(a))}`
  }
  return d + 'Z'
}

// Un contorno hecho de tramos suaves que se juntan en esquinas: cada tramo es una lista
// de puntos, y empieza donde acaba el anterior.
function contorno(tramos) {
  let d = `M${pt(tramos[0][0])}`
  for (const t of tramos) d += t.length > 2 ? curva(t).replace(/^M[^C]*/, '') : `L${pt(t[1])}`
  return d + 'Z'
}

// Motas de polvo dorado que suben y derivan, cada una a su ritmo.
function motas(semilla, n, x0, x1, y0, y1, sube, deriva) {
  const r = azar(semilla)
  let s = ''
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), d = r1(8 + r() * 9), dx = r1((r() - 0.3) * deriva)
    s += `<circle class="mota" style="animation-duration:${d}s;animation-delay:-${r1(r() * d)}s;--dx:${dx}px;--sube:${-sube}px" cx="${r1(x)}" cy="${r1(y)}" r="${r1(1 + r() * 1.7)}" opacity="0"/>`
  }
  return s
}
const CSS_MOTAS = '.mota{animation-name:mota;animation-timing-function:linear;animation-iteration-count:infinite}' +
  '@keyframes mota{0%{transform:translate(0px,0px);opacity:0}15%{opacity:.85}75%{opacity:.6}100%{transform:translate(var(--dx),var(--sube));opacity:0}}'

// --- Faraón -----------------------------------------------------------------------
// El perfil monumental de un faraón, mirando a la izquierda: la cara, el cuello y el
// pecho en silueta oscura, el tocado nemes con franjas de oro y lapislázuli, la diadema
// con la cobra, la barba postiza trenzada y el collar ancho de cuentas. Detrás, un disco
// solar de oro, del que bajan los rayos de Atón, que acaban en manos, como en los
// relieves de Amarna. Arriba, el techo azul con estrellas de las tumbas.

// La cabeza en coordenadas propias: la barbilla en (0, 0), mirando a la izquierda.
const CARA = contorno([
  [[-56, -194], [-57, -174], [-59, -160], [-60, -150]],
  [[-60, -150], [-86, -114]],
  [[-86, -114], [-90, -108], [-86, -102], [-73, -100]],
  [[-73, -100], [-71, -91], [-77, -85], [-70, -78], [-76, -72], [-67, -62], [-71, -44], [-59, -26], [-36, -20]],
  [[-36, -20], [-20, -40], [10, -100], [24, -170], [-10, -200], [-56, -194]],
])
const PECHO = 'M-36 -24C-22 0 -18 20 -24 50C-44 84 -64 120 -70 170C-74 220 -74 300 -76 420L170 420L150 -40L20 -40Z'
const NEMES = 'M-58 -194C-56 -222 -30 -252 20 -262C70 -270 130 -258 160 -228C186 -200 198 -140 204 -80L214 30L150 36C110 40 80 40 62 44L60 236L10 240L18 -104C22 -140 22 -156 14 -164C-6 -172 -34 -184 -58 -194Z'
const OREJA = 'M6 -156C-4 -154 -8 -138 -4 -126C0 -114 8 -108 14 -112C18 -120 18 -150 6 -156Z'
const BARBA = 'M-63 -30L-38 -26L-34 82C-40 88 -52 88 -58 82Z'
const COBRA = 'M-50 -196C-62 -206 -64 -226 -54 -238C-46 -246 -36 -238 -40 -228C-44 -218 -42 -208 -38 -200Z'

function faraon() {
  const barbilla = [1214, 520], e = 1.22
  const disco = [1300, 440], R = 300
  // Los rayos de Atón: líneas de oro que bajan del disco en abanico y acaban en manos.
  let rayos = '', manos = '', luces = ''
  for (let k = 0; k < 13; k++) {
    const a = ((24 + k * 11) * Math.PI) / 180
    const p0 = [disco[0] + (R + 14) * Math.cos(a), disco[1] + (R + 14) * Math.sin(a)]
    const p1 = [disco[0] + (R + 190) * Math.cos(a), disco[1] + (R + 190) * Math.sin(a)]
    rayos += `M${pt(p0)}L${pt(p1)}`
    luces += `<path class="rayo" style="animation-delay:-${r2(k * 0.37)}s" d="M${pt(p0)}L${pt(p1)}"/>`
    // La mano: la palma y el pulgar, girados en la dirección del rayo.
    manos += `<path transform="translate(${pt(p1)}) rotate(${r1((a * 180) / Math.PI - 90)})" d="M-3.4 0C-4.6 6 -4 12 0 15C4 12 4.6 6 3.4 0ZM3.2 3C6.4 3 7.6 6 6.4 8L3.6 6.6Z"/>`
  }
  // El techo de las tumbas: estrellas de oro sobre lapislázuli, arriba del todo.
  const re = azar(173)
  let estrellas = '', titilan = ''
  for (let i = 0; i < 46; i++) {
    const x = (i % 23) * 72 + (Math.floor(i / 23) % 2 ? 36 : 0) + 14, y = 40 + Math.floor(i / 23) * 64 + (re() - 0.5) * 6
    if (i % 5 === 2) titilan += `<path class="estrella" style="animation-delay:-${r1(re() * 4)}s" d="${estrella5(x, y, 9)}"/>`
    else estrellas += estrella5(x, y, 9)
  }
  // El collar ancho: bandas de cuentas alrededor del cuello, de oro, turquesa, lapislázuli
  // y cornalina, que se ven por delante, sobre el pecho.
  const bandas = [[46, ORO, 10], [60, TURQUESA, 10], [74, '#2a5f9a', 10], [87, ORO, 6], [99, CORNALINA, 9], [111, ORO, 6]]
  const collar = bandas.map(([r, c, g]) => {
    const a0 = (95 * Math.PI) / 180, a1 = (212 * Math.PI) / 180, o = [6, 26]
    return `<path d="M${pt([o[0] + r * Math.cos(a0), o[1] + r * Math.sin(a0)])}A${r} ${r} 0 0 1 ${pt([o[0] + r * Math.cos(a1), o[1] + r * Math.sin(a1)])}" stroke="${c}" stroke-width="${g}" fill="none"/>`
  }).join('')
  const defs = `<defs>
${radial('fondoF', disco[0], disco[1], 900, [[0, '#1a2430'], [0.6, NEGRO], [1, '#0b1117']])}
${radial('disco', disco[0] - 60, disco[1] - 70, R * 1.3, [[0, '#fbe2a0'], [0.45, '#e3bd6a'], [0.8, ORO], [1, '#8f6c2e']])}
${radial('halo', disco[0], disco[1], R + 160, [[0.75, '#e3bd6a', 0.32], [0.86, '#c9a052', 0.12], [1, ORO, 0]])}
${vertical('techo', 0, 150, [[0, '#123c63'], [1, '#0e2a44', 0]])}
<pattern id="rayas" patternUnits="userSpaceOnUse" width="400" height="26" patternTransform="rotate(-7)"><rect width="400" height="14" fill="#d8b25e"/><rect y="14" width="400" height="12" fill="#1d5389"/></pattern>
<linearGradient id="relieve" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8" stop-opacity=".35"/><stop offset=".5" stop-color="#fff2c8" stop-opacity="0"/><stop offset="1" stop-color="${SOMBRA}" stop-opacity=".45"/></linearGradient>
<linearGradient id="barrido" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff6dc" stop-opacity="0"/><stop offset=".5" stop-color="#fff6dc" stop-opacity=".55"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></linearGradient>
<clipPath id="nemesC"><path d="${NEMES}"/></clipPath>
<clipPath id="pechoC"><path d="${PECHO}"/></clipPath>
</defs>`
  const estilo =
    '.rayo{animation:rayo 4.4s linear infinite}@keyframes rayo{from{stroke-dashoffset:200}to{stroke-dashoffset:-60}}' +
    '.estrella{animation:estrella 3.6s ease-in-out infinite}@keyframes estrella{50%{opacity:.25}}' +
    '.barre{animation:barre 7s ease-in-out infinite}@keyframes barre{0%{transform:translateX(-360px)}24%{transform:translateX(360px)}100%{transform:translateX(360px)}}' +
    '.uraeus{animation:uraeus 3s ease-in-out infinite}@keyframes uraeus{0%,70%,100%{opacity:0}82%{opacity:1}}'
  return abrir(NEGRO, estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#fondoF)"/>` +
    `<rect width="${W}" height="150" fill="url(#techo)"/><g fill="${ORO}" opacity=".55">${titilan}<path d="${estrellas}"/></g>` +
    // El disco solar, con su halo y sus anillos, y los rayos con sus manos.
    `<circle cx="${disco[0]}" cy="${disco[1]}" r="${R + 160}" fill="url(#halo)"/>` +
    `<g stroke="${ORO}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".75"><path d="${rayos}"/></g>` +
    `<g stroke="#fff1c2" stroke-width="3" stroke-linecap="round" fill="none" stroke-dasharray="40 220" stroke-dashoffset="200">${luces}</g>` +
    `<g fill="${ORO}">${manos}</g>` +
    `<circle cx="${disco[0]}" cy="${disco[1]}" r="${R}" fill="url(#disco)"/>` +
    `<g fill="none" stroke="#8f6c2e" opacity=".35"><circle cx="${disco[0]}" cy="${disco[1]}" r="${R - 26}" stroke-width="2"/><circle cx="${disco[0]}" cy="${disco[1]}" r="${R - 70}" stroke-width="1.4"/></g>` +
    // El faraón: el pecho y la cara en silueta, el collar, la barba, la oreja, el nemes con
    // sus franjas y su relieve, la diadema con la cobra y el ojo pintado.
    `<g transform="translate(${barbilla[0]} ${barbilla[1]}) scale(${e})">` +
    `<path d="${PECHO}" fill="${SOMBRA}"/><g clip-path="url(#pechoC)">${collar}</g>` +
    `<path d="${CARA}" fill="${SOMBRA}"/>` +
    `<path d="${BARBA}" fill="${SOMBRA}"/><path d="${[0, 1, 2, 3, 4, 5, 6, 7].map(k => `M${r1(-62 + k * 0.5)} ${-16 + k * 12}L${r1(-36 + k * 0.25)} ${-14 + k * 12}`).join('')}" stroke="${ORO}" stroke-width="1.6" opacity=".7"/>` +
    `<path d="M-38 -26C-20 -50 -6 -90 2 -112" stroke="${ORO}" stroke-width="1.4" fill="none" opacity=".55"/>` +
    `<path d="${OREJA}" fill="${SOMBRA}"/><path d="M8 -150C0 -146 -2 -134 2 -124C5 -118 9 -116 12 -118" stroke="${ORO}" stroke-width="1.6" fill="none" opacity=".6"/>` +
    `<path d="${NEMES}" fill="url(#rayas)"/><path d="${NEMES}" fill="url(#relieve)"/>` +
    `<path d="${banda([[-61, -191], [-34, -180], [-8, -170], [13, -163]], () => 12)}" fill="#e6c272"/><path d="M-60 -185L-34 -174L-8 -164L13 -157" stroke="#8f6c2e" stroke-width="1.4" fill="none"/>` +
    `<g clip-path="url(#nemesC)"><g transform="rotate(20)"><rect class="barre" x="-50" y="-500" width="100" height="1000" fill="url(#barrido)" transform="translate(-360 0)"/></g></g>` +
    `<path d="${COBRA}" fill="${SOMBRA}"/><path d="${COBRA}" stroke="#f0cf86" stroke-width="2" fill="none"/><path d="M-50 -204C-56 -214 -56 -226 -50 -232" stroke="#3a7fbf" stroke-width="3" fill="none"/><circle class="uraeus" cx="-52" cy="-232" r="3" fill="#fff6dc" opacity="0"/>` +
    `<path d="M-66 -146C-56 -154 -40 -154 -30 -146C-40 -140 -56 -140 -66 -146Z" fill="${ARENISCA}"/><circle cx="-46" cy="-146.5" r="4.6" fill="${SOMBRA}"/>` +
    `<path d="M-66 -146C-56 -154 -40 -154 -30 -146L-8 -150M-66 -158C-50 -166 -30 -166 -10 -160" stroke="${ORO}" stroke-width="2.4" stroke-linecap="round" fill="none"/>` +
    `<path d="${CARA}" stroke="#f0cf86" stroke-width="1.6" fill="none" opacity=".35"/>` +
    `</g>` +
    `</svg>`
}

// --- Anubis -----------------------------------------------------------------------
// Anubis, el dios con cabeza de chacal, de pie y de perfil a la derecha, junto a la
// balanza del juicio: en un platillo, el corazón; en el otro, la pluma de Maat. Negro
// como el limo del Nilo, con el oro del collar, la peluca de franjas, el faldellín y el
// cetro. Detrás, columnas de jeroglíficos grabados, muy tenues, y una cenefa de colores
// abajo, como en los papiros. La balanza oscila despacio, como si pesara.

// El dios en coordenadas propias: los pies en (0, 0), mirando a la izquierda, unas 530
// unidades hasta la punta de las orejas, con el canon egipcio: la cabeza y las piernas de
// perfil y los hombros de frente.
const CHACAL = contorno([
  [[-16, -378], [-40, -392], [-80, -402], [-112, -408]],
  [[-112, -408], [-124, -412], [-126, -418], [-120, -422]],
  [[-120, -422], [-80, -430], [-52, -440], [-40, -452], [-30, -458]],
  [[-30, -458], [-24, -530]],
  [[-24, -530], [-8, -462]],
  [[-8, -462], [6, -524]],
  [[6, -524], [18, -452]],
  [[18, -452], [28, -430], [30, -408], [24, -386]],
  [[24, -386], [-16, -378]],
])
function dios() {
  const piezas = [
    // Las piernas, la de delante adelantada, y los pies.
    banda([[-18, -236], [-40, -122], [-56, -14]], t => 34 - 20 * t),
    banda([[14, -236], [16, -122], [22, -14]], t => 32 - 18 * t),
    'M-46 -16L-62 -16L-100 -4L-100 0L-44 0Z', 'M30 -16L14 -16L-18 -4L-18 0L34 0Z',
    // El torso: la cintura estrecha, el pecho de perfil y los hombros de frente.
    'M-30 -262C-36 -290 -46 -320 -64 -346C-66 -354 -60 -358 -50 -358L52 -358C62 -358 66 -352 62 -344C48 -320 38 -290 30 -262Z',
    // Los brazos: el de delante sostiene el ankh; el de detrás, el cetro.
    banda([[-56, -346], [-86, -312], [-112, -284]], t => 26 - 10 * t),
    banda([[52, -346], [60, -300], [64, -256]], t => 26 - 10 * t),
    // El cuello.
    'M-18 -356L-16 -386L22 -390L26 -356Z',
  ]
  const faldellin = 'M-34 -264L34 -264L38 -150L-70 -150Z'
  const delantal = 'M-22 -258L-66 -152L-24 -152Z'
  const peluca = 'M-6 -446C10 -452 28 -444 34 -426C42 -400 46 -366 48 -332L22 -332L-2 -330L-14 -330C-12 -360 -8 -404 -6 -446Z'
  return piezas.map(d => `<path d="${d}"/>`).join('') + '<circle cx="-114" cy="-282" r="9"/><circle cx="64" cy="-252" r="9"/>' +
    `<path d="${faldellin}"/><path d="${delantal}" fill="url(#oroK)"/><path d="M-28 -246L-58 -160M-24 -230L-44 -160M-8 -262L-14 -152M8 -262L10 -152M22 -262L28 -152" stroke="${ORO}" stroke-width="1.2" opacity=".35"/>` +
    `<path d="M-36 -272H36V-258H-36Z" fill="url(#oroK)"/>` +
    `<path d="${peluca}" fill="url(#rayasK)"/>` +
    `<path d="${CHACAL}"/>` +
    // El collar ancho, de frente, con sus bandas de cuentas.
    [[30, ORO, 6], [38, TURQUESA, 6], [46, '#2a5f9a', 6], [53, ORO, 4], [60, CORNALINA, 5], [67, ORO, 4]].map(([r, c, g]) =>
      `<path d="M${r1(-4 - r)} -360A${r} ${r * 0.62} 0 0 0 ${r1(-4 + r)} -360" stroke="${c}" stroke-width="${g}" fill="none"/>`).join('') +
    // Los brazaletes de oro, el ojo pintado, la boca y el borde de las orejas.
    `<path d="M-72 -336L-62 -326M-104 -296L-98 -288M54 -322L68 -322M58 -268L72 -268" stroke="${ORO}" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M-74 -430C-66 -437 -54 -437 -46 -431C-54 -426 -66 -426 -74 -430Z" fill="${ARENISCA}"/><circle cx="-60" cy="-431" r="3.4"/>` +
    `<path d="M-74 -430C-66 -437 -54 -437 -46 -431L-30 -434M-76 -440C-64 -446 -48 -446 -34 -442" stroke="${ORO}" stroke-width="2" stroke-linecap="round" fill="none"/>` +
    `<path d="M-118 -414L-66 -404" stroke="${ORO}" stroke-width="1.4" opacity=".55"/>` +
    `<path d="M-30 -458L-24 -530L-8 -462M-8 -462L6 -524L18 -452" stroke="${ORO}" stroke-width="1.6" stroke-linejoin="round" fill="none" opacity=".6"/>` +
    // El cetro was, detrás, de la mano al suelo y por encima de la cabeza.
    `<path d="M66 6L66 -470M66 -470L82 -482L86 -476L72 -466M58 8L66 -6L74 8" stroke="url(#oroK)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    // El ankh, en la mano de delante.
    `<path d="${coloca(JEROGLIFOS.ankh, -128, -332, 1.6)}" stroke="${ORO}" stroke-width="4.4" stroke-linecap="round" fill="none"/>`
}

// La balanza en coordenadas de la escena: el pie, el mástil con la pluma arriba y el
// astil, que oscila alrededor del eje; los platillos cuelgan siempre derechos.
const EJE = [1150, 432], BRAZO = 125
function balanza() {
  const platillo = (contenido) => `<g class="platillo"><path d="M0 0L-34 156M0 0L34 156M0 0L0 150" stroke="${ORO}" stroke-width="1.6" opacity=".8"/>` +
    `<path d="M-40 156Q0 182 40 156Z" fill="url(#oroK)"/>${contenido}</g>`
  const corazon = '<path d="M-13 154C-18 140 -12 124 0 124C12 124 18 140 13 154Z" fill="#8a2a24"/><path d="M-6 124C-6 116 6 116 6 124" stroke="#8a2a24" stroke-width="4" fill="none"/>'
  const pluma = `<path d="M-4 156C-8 132 -2 108 12 88C16 110 12 136 4 156Z" fill="${ARENISCA}"/><path d="M0 156C2 132 6 110 12 90" stroke="${ORO}" stroke-width="1.4" fill="none"/>`
  return `<path d="M${EJE[0] - 44} 770L${EJE[0] - 34} 748H${EJE[0] + 34}L${EJE[0] + 44} 770Z" fill="url(#oroK)"/>` +
    `<path d="M${EJE[0] - 6} 750V${EJE[1] - 6}H${EJE[0] + 6}V750Z" fill="url(#oroK)"/>` +
    `<path d="M${EJE[0] - 5} ${EJE[1] - 12}C${EJE[0] - 10} ${EJE[1] - 40} ${EJE[0] - 2} ${EJE[1] - 66} ${EJE[0] + 12} ${EJE[1] - 82}C${EJE[0] + 14} ${EJE[1] - 58} ${EJE[0] + 10} ${EJE[1] - 34} ${EJE[0] + 5} ${EJE[1] - 12}Z" fill="${ARENISCA}"/>` +
    `<g class="astil"><path d="M${EJE[0] - BRAZO} ${EJE[1] - 3}H${EJE[0] + BRAZO}V${EJE[1] + 4}H${EJE[0] - BRAZO}Z" fill="url(#oroK)"/>` +
    `<circle cx="${EJE[0]}" cy="${EJE[1]}" r="7" fill="${ORO}"/>` +
    `<path d="M${EJE[0]} ${EJE[1]}V${EJE[1] + 96}" stroke="${ORO}" stroke-width="1.4"/><path d="M${EJE[0] - 7} ${EJE[1] + 96}H${EJE[0] + 7}L${EJE[0]} ${EJE[1] + 112}Z" fill="${ORO}"/>` +
    `<g transform="translate(${EJE[0] - BRAZO} ${EJE[1]})">${platillo(corazon)}</g>` +
    `<g transform="translate(${EJE[0] + BRAZO} ${EJE[1]})">${platillo(pluma)}</g></g>`
}

function anubis() {
  const pie = [1430, 770]
  // El muro de jeroglíficos: columnas separadas por rayas, con signos al azar, muy tenues;
  // algunos se encienden de oro, uno tras otro.
  const r = azar(181)
  let grabado = '', rayas = '', vivos = ''
  for (let c = 0; c < 31; c++) {
    const x = 14 + c * 52
    rayas += `M${x - 6} 214V752`
    for (let f = 0; f < 14; f++) {
      const y = 222 + f * 38, g = JEROGLIFOS[NOMBRES[Math.floor(r() * NOMBRES.length)]]
      const d = coloca(g, x + 6, y, 1.1)
      if (r() < 0.04 && x > 900) vivos += `<path class="vivo" style="animation-delay:-${r1(r() * 12)}s" d="${d}" opacity=".1"/>`
      else grabado += d
    }
  }
  // La cenefa de colores de abajo: rectángulos de oro, turquesa, lapislázuli y cornalina.
  const colores = [ORO, TURQUESA, ORO, '#2a5f9a', ORO, CORNALINA]
  let cenefa = ''
  for (let k = 0; k * 22 < W; k++) cenefa += `<rect x="${k * 22}" y="790" width="18" height="14" fill="${colores[k % colores.length]}"/>`
  // El friso de arriba: haces de juncos atados, el jéquer de las tumbas, de tres colores.
  let jequer = ''
  for (let k = 0; k * 26 < W; k++) {
    const x = k * 26 + 13
    jequer += `<path d="M${x - 8} 204V180C${x - 8} 172 ${x - 4} 168 ${x - 5} 162C${x - 6} 156 ${x - 3} 150 ${x} 150C${x + 3} 150 ${x + 6} 156 ${x + 5} 162C${x + 4} 168 ${x + 8} 172 ${x + 8} 180V204Z" fill="${['#2a5f9a', ORO, CORNALINA][k % 3]}"/>`
  }
  const defs = `<defs>
${radial('fondoA', 1260, 470, 900, [[0, '#18222c'], [0.6, NEGRO], [1, '#0a0f14']])}
${radial('luzA', 1280, 520, 420, [[0, '#c9a052', 0.16], [1, ORO, 0]])}
<linearGradient id="oroK" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d58e"/><stop offset=".55" stop-color="${ORO}"/><stop offset="1" stop-color="#7d5e26"/></linearGradient>
<pattern id="rayasK" patternUnits="userSpaceOnUse" width="200" height="16"><rect width="200" height="9" fill="#1d5389"/><rect y="9" width="200" height="7" fill="#c9a052"/></pattern>
</defs>`
  const estilo = `.astil{animation:astil 7s ease-in-out infinite alternate}@keyframes astil{from{transform:${giro(EJE, -3.2)}}to{transform:${giro(EJE, 3.2)}}}` +
    '.platillo{animation:platillo 7s ease-in-out infinite alternate}@keyframes platillo{from{transform:rotate(3.2deg)}to{transform:rotate(-3.2deg)}}' +
    '.vivo{animation:vivo 12s ease-in-out infinite}@keyframes vivo{0%,100%{opacity:.1}10%{opacity:.75}24%{opacity:.1}}'
  return abrir(NEGRO, estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#fondoA)"/><circle cx="1280" cy="520" r="420" fill="url(#luzA)"/>` +
    `<path d="${rayas}" stroke="${ARENISCA}" stroke-width="1.2" opacity=".06"/>` +
    `<path d="${grabado}" stroke="${ARENISCA}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".075"/>` +
    `<g stroke="#f0cf86" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none">${vivos}</g>` +
    `<g opacity=".5">${jequer}</g><path d="M0 206H${W}" stroke="${ORO}" stroke-width="2" opacity=".45"/><path d="M0 770H${W}" stroke="${ORO}" stroke-width="3" opacity=".7"/>` +
    `<g opacity=".8">${cenefa}</g><rect y="812" width="${W}" height="${H - 812}" fill="#0b1016"/>` +
    balanza() +
    `<g fill="${SOMBRA}" transform="translate(${pie[0]} ${pie[1]})">${dios()}</g>` +
    `</svg>`
}

// --- Jeroglíficos -----------------------------------------------------------------
// Una sala hipóstila: dos columnas de papiro enormes delante, a la derecha, y otra más
// lejos, a la izquierda, con los capiteles abiertos, las bandas y las inscripciones que
// rodean el fuste; detrás, un muro de grandes bloques de arenisca cubiertos de columnas de
// jeroglíficos; arriba, el arquitrabe con el disco solar alado. Un haz de sol entra en
// diagonal por una ventana alta, a la izquierda, dora el lado de las columnas y deja el
// resto en sombra honda. Por el haz flota el polvo y, de vez en cuando, cruza una golondrina.

// Oscurece un color hacia el negro: con 1 se queda igual y con 0 es negro.
const mezcla = (c, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(c.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('')

// Una columna de papiro de frente: el plinto, el fuste con las hojas del pie, los
// registros de jeroglíficos que rodean el fuste (más estrechos hacia los bordes, como en
// un cilindro), las bandas, el capitel abierto y el ábaco. `cx` es el eje, `d` el
// diámetro, `suelo` la altura del suelo y `alto` la del ábaco; `id` nombra su degradado.
function columna(id, cx, d, suelo, alto, semilla, luz = 1) {
  const r = azar(semilla), R = d / 2
  const yb = suelo - 0.12 * d, bandas = alto + 0.12 * d + 0.55 * d, ycap = alto + 0.12 * d
  const fuste = `M${r1(cx - R * 0.88)} ${r1(yb)}C${r1(cx - R * 1.02)} ${r1(yb - 0.35 * d)} ${r1(cx - R)} ${r1(yb - 0.6 * d)} ${r1(cx - R)} ${r1(yb - 0.9 * d)}L${r1(cx - R)} ${r1(bandas + 0.4 * d)}L${r1(cx + R)} ${r1(bandas + 0.4 * d)}L${r1(cx + R)} ${r1(yb - 0.9 * d)}C${r1(cx + R)} ${r1(yb - 0.6 * d)} ${r1(cx + R * 1.02)} ${r1(yb - 0.35 * d)} ${r1(cx + R * 0.88)} ${r1(yb)}Z`
  const capitel = `M${r1(cx - R * 1.04)} ${r1(bandas)}C${r1(cx - R * 1.2)} ${r1(bandas - 0.2 * d)} ${r1(cx - R * 1.5)} ${r1(ycap + 0.12 * d)} ${r1(cx - R * 1.58)} ${r1(ycap)}L${r1(cx + R * 1.58)} ${r1(ycap)}C${r1(cx + R * 1.5)} ${r1(ycap + 0.12 * d)} ${r1(cx + R * 1.2)} ${r1(bandas - 0.2 * d)} ${r1(cx + R * 1.04)} ${r1(bandas)}Z`
  // Las hojas que envuelven el pie del fuste.
  let hojas = ''
  for (let k = -3; k <= 3; k++) {
    const x = cx + R * 0.9 * Math.sin((k * Math.PI) / 8), w = R * 0.28 * Math.cos((k * Math.PI) / 8)
    hojas += `M${r1(x - w)} ${r1(yb)}L${r1(x)} ${r1(yb - 0.42 * d)}L${r1(x + w)} ${r1(yb)}`
  }
  // Los tallos del capitel, que se abren en abanico.
  let tallos = ''
  for (let k = -4; k <= 4; k++) tallos += `M${r1(cx + k * R * 0.22)} ${r1(bandas)}L${r1(cx + k * R * 0.36)} ${r1(ycap + 0.04 * d)}`
  // Los registros de jeroglíficos, de arriba abajo, entre rayas; en el del medio, un
  // cartucho de frente.
  let signos = '', pintados = '', rayas = ''
  // Los registros ocupan la parte de arriba del fuste, entre las bandas y las hojas del pie.
  const registros = 3, alto0 = bandas + 0.4 * d + 10, alto1 = alto0 + 0.7 * (yb - 0.5 * d - alto0), paso = (alto1 - alto0) / registros
  for (let g = 0; g <= registros; g++) rayas += `M${r1(cx - R)} ${r1(alto0 + g * paso)}H${r1(cx + R)}`
  for (let g = 0; g < registros; g++) {
    const y0 = alto0 + g * paso, e = (paso * 0.7) / 24
    for (let f = -6; f <= 6; f++) {
      const phi = (f * 13 * Math.PI) / 180, c = Math.cos(phi)
      if (c < 0.3 || (g === 1 && Math.abs(f) <= 1)) continue
      const x = cx + R * Math.sin(phi) - 10 * e * c, nombre = NOMBRES[Math.floor(r() * NOMBRES.length)]
      const trazo = coloca(JEROGLIFOS[nombre], x, y0 + paso * 0.15, e * c, e)
      if (r() < 0.22) pintados += trazo
      else signos += trazo
    }
  }
  // El cartucho del registro del medio, con tres signos dentro.
  const ym = alto0 + paso * 1.1, ec = (paso * 0.8) / 50
  let cartucho = `<path d="${coloca('M10 1C16 1 18 6 18 12L18 40C18 46 16 49 10 49C4 49 2 46 2 40L2 12C2 6 4 1 10 1ZM2 52L18 52', cx - 10 * ec, ym - paso * 0.02, ec)}" stroke="#3a2a18" stroke-width="2.4" fill="none" opacity=".75"/>`
  cartucho += `<path d="${['ra', 'ankh', 'junco'].map((n, i) => coloca(JEROGLIFOS[n], cx - 6 * ec, ym + (4 + i * 14.5) * ec, ec * 0.6)).join('')}" stroke="#3a2a18" stroke-width="2" fill="none" opacity=".75"/>`
  return {
    // El fuste redondo: el canto de la izquierda algo oscuro, el brillo a un cuarto, y la
    // derecha cada vez más honda. `luz` aclara u oscurece la columna entera.
    defs: horizontal(id, cx - R * 1.6, cx + R * 1.6, [[0, mezcla('#b89a6a', luz)], [0.22, mezcla('#f0d9a6', luz)], [0.48, mezcla('#c9aa76', luz)], [0.72, mezcla('#6e5638', luz)], [1, '#1c150e']]),
    dibujo: `<path d="M${r1(cx - R * 1.2)} ${r1(suelo)}L${r1(cx - R * 1.16)} ${r1(yb)}L${r1(cx + R * 1.16)} ${r1(yb)}L${r1(cx + R * 1.2)} ${r1(suelo)}Z" fill="url(#${id})"/>` +
      `<path d="${fuste}" fill="url(#${id})"/>` +
      `<path d="${hojas}" stroke="#5a4428" stroke-width="2" fill="none" opacity=".55"/>` +
      `<path d="${rayas}" stroke="#4a3820" stroke-width="2.4" opacity=".55"/>` +
      `<path d="${pintados}" stroke="${LAPIS}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".6"/>` +
      `<path d="${signos}" stroke="#3a2a18" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".6"/>` +
      cartucho +
      // Las cinco bandas del cuello, el capitel con sus tallos y el ábaco.
      [0, 1, 2, 3, 4].map(k => `<rect x="${r1(cx - R * 1.04)}" y="${r1(bandas + k * 0.08 * d)}" width="${r1(d * 1.08)}" height="${r1(0.06 * d)}" fill="url(#${id})"/>`).join('') +
      `<path d="${capitel}" fill="url(#${id})"/><path d="${tallos}" stroke="#5a4428" stroke-width="2" opacity=".5"/>` +
      `<path d="M${r1(cx - R * 1.5)} ${r1(ycap + 0.05 * d)}H${r1(cx + R * 1.5)}" stroke="${TURQUESA}" stroke-width="${r1(0.04 * d)}" opacity=".55"/>` +
      `<rect x="${r1(cx - R * 0.9)}" y="${r1(alto)}" width="${r1(d * 0.9)}" height="${r1(0.12 * d)}" fill="url(#${id})"/>`,
  }
}

function jeroglificos() {
  const suelo = 868, alto = 236
  // El muro de bloques del fondo: hiladas de sillares con sus juntas y, en muchos, una
  // columna de jeroglíficos grabados.
  const r = azar(191)
  let juntas = '', grabado = ''
  for (let fila = 0, y = 240; y < suelo; fila++, y += 112) {
    let x = fila % 2 ? -90 : 0
    juntas += `M0 ${y}H${W}`
    while (x < W) {
      const ancho = 170 + r() * 80
      juntas += `M${r1(x)} ${y}V${Math.min(y + 112, suelo)}`
      if (r() < 0.7) {
        for (let c = 0; c < 2; c++) for (let k = 0; k < 3; k++) {
          const g = JEROGLIFOS[NOMBRES[Math.floor(r() * NOMBRES.length)]]
          grabado += coloca(g, x + 30 + c * 70 + r() * 20, y + 12 + k * 32, 1.05)
        }
      }
      x += ancho
    }
  }
  // Las tres columnas: la del fondo a la izquierda, más pequeña y en sombra, y las dos de
  // delante a la derecha.
  const lejos = columna('colL', 330, 150, suelo - 40, alto + 40, 193, 0.42)
  const media = columna('colM', 1130, 210, suelo, alto, 197, 1)
  const cerca = columna('colC', 1450, 236, suelo, alto, 199, 0.62)
  // El arquitrabe, con el disco solar alado en el centro de la parte derecha.
  const alas = (s) => `M${1290 + s * 24} 186L${1290 + s * 200} 180C${1290 + s * 206} 184 ${1290 + s * 204} 190 ${1290 + s * 196} 194C${1290 + s * 140} 206 ${1290 + s * 80} 214 ${1290 + s * 24} 214Z`
  let plumas = ''
  for (const s of [-1, 1]) for (let k = 0; k < 9; k++) {
    const x = 1290 + s * (44 + k * 18)
    plumas += `M${x} ${r1(184 - k * 0.4)}L${x + s * 6} ${r1(212 - k * 1.8)}`
  }
  plumas += 'M1314 196H1486M1266 196H1094M1314 205H1450M1266 205H1130'
  // El polvo en el haz de sol y la golondrina que lo cruza.
  const polvo = motas(201, 34, 640, 1300, 300, 900, 260, 160)
  const golondrina = 'M-16 2C-10 -4 -4 -5 0 -1C4 -5 10 -4 16 2C10 0 4 1 0 3C-4 1 -10 0 -16 2ZM0 3L-3 9L0 7L3 9Z'
  const defs = `<defs>
${vertical('muro', 150, suelo, [[0, '#1d160f'], [0.5, '#17110c'], [1, '#100c08']])}
${vertical('sueloK', suelo, H, [[0, '#2e2418'], [1, '#110d09']])}
${lejos.defs}${media.defs}${cerca.defs}
<linearGradient id="haz" x1="560" y1="0" x2="1300" y2="1000" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffd690" stop-opacity=".2"/><stop offset=".6" stop-color="#e8b066" stop-opacity=".12"/><stop offset="1" stop-color="#e8b066" stop-opacity=".02"/></linearGradient>
${radial('mancha', 1200, 930, 300, [[0, '#ffcf86', 0.35], [1, '#ffcf86', 0]])}
${radial('muroLuz', 760, 470, 420, [[0, '#e8b066', 0.22], [1, '#e8b066', 0]])}
${horizontal('arq', 0, W, [[0, '#3a2c1c'], [0.45, '#7a6040'], [0.7, '#5a4630'], [1, '#2e2216']])}
</defs>`
  const estilo = CSS_MOTAS +
    '.golondrina{animation:golondrina 16s linear infinite}@keyframes golondrina{0%{transform:translate(-80px,420px);opacity:0}4%{opacity:1}34%{transform:translate(1700px,250px);opacity:1}36%,100%{transform:translate(1700px,250px);opacity:0}}' +
    '.ala{animation:ala .32s ease-in-out infinite alternate}@keyframes ala{from{transform:scale(1,1)}to{transform:scale(1,-.6)}}'
  return abrir('#120e0a', estilo) + defs +
    `<rect width="${W}" height="${suelo}" fill="url(#muro)"/><circle cx="760" cy="470" r="420" fill="url(#muroLuz)"/>` +
    `<path d="${[...Array(22)].map((_, k) => estrella5(36 + k * 72 + (k % 2) * 20, 46 + (k % 3) * 34, 7)).join('')}" fill="${ORO}" opacity=".22"/>` +
    `<path d="${juntas}" stroke="#0e0a07" stroke-width="3" opacity=".7"/>` +
    `<path d="${grabado}" stroke="#7a6446" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".35"/>` +
    `<rect y="${suelo}" width="${W}" height="${H - suelo}" fill="url(#sueloK)"/><path d="M0 ${suelo}H${W}" stroke="#4a3a26" stroke-width="2"/>` +
    `<path d="M0 ${suelo + 44}H${W}M0 ${suelo + 96}H${W}M180 ${suelo}L120 ${H}M520 ${suelo}L500 ${H}M860 ${suelo}L880 ${H}M1240 ${suelo}L1290 ${H}" stroke="#0e0a07" stroke-width="2" opacity=".5"/>` +
    lejos.dibujo +
    // El arquitrabe sobre las columnas, con su banda de inscripción y el disco alado.
    `<rect y="150" width="${W}" height="86" fill="url(#arq)"/><path d="M0 150H${W}M0 236H${W}" stroke="#120e0a" stroke-width="3"/>` +
    `<path d="${alas(-1)}${alas(1)}" fill="${ORO}" opacity=".85"/><path d="${plumas}" stroke="#7d5e26" stroke-width="1.6" opacity=".75"/>` +
    `<circle cx="1290" cy="200" r="21" fill="#e3bd6a"/><circle cx="1290" cy="200" r="21" fill="none" stroke="#7d5e26" stroke-width="2"/>` +
    media.dibujo + cerca.dibujo +
    // El haz de sol, la mancha de luz en el suelo y el polvo.
    `<path d="M560 0L780 0L1520 ${H}L1080 ${H}Z" fill="url(#haz)"/><ellipse cx="1240" cy="930" rx="300" ry="54" fill="url(#mancha)"/>` +
    `<g fill="#ffe0a0">${polvo}</g>` +
    `<g class="golondrina" opacity="0"><g fill="#0e0a07"><path class="ala" d="${golondrina}"/></g></g>` +
    `</svg>`
}

escribir('genera_kemet.mjs', 'las escenas de la sala Kemet, solo de noche.', { faraon, anubis, jeroglificos }, process.argv[2], process.argv[3])
