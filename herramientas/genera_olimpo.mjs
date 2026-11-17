// Generador de las escenas de la sala Olimpo de museo-clawd: Santuario, Zeus y Oráculo.
// Dibujos propios, inspirados en la arquitectura clásica y en los símbolos de los dioses
// olímpicos: mármol blanco, templos de columnas, montañas entre nubes y detalles de oro
// sobre azules profundos. Es la sala luminosa del Museo dentro del modo oscuro: la luz es
// cálida y el cielo, azul noche. Solo modo oscuro, con la paleta de la sala: azul noche,
// azul celestial, blanco mármol, oro olímpico y gris niebla.
//
// El movimiento va en animaciones CSS dentro del <style> de cada escena. Cada elemento
// animado tiene en sus atributos una posición quieta buena, la que se ve con «reducir
// movimiento». Lo que se mueve tiene bordes o brillo, porque en la aplicación lo blando
// que se mueve despacio no se ve moverse; y lo grande se queda quieto y sin desenfoque,
// para que la aplicación llegue a pintar a tiempo también en pantalla completa.
import { CSS_ESTRELLAS, H, W, abrir, azar, banda, curva, escribir, estrellas, giro, horizontal, mas, poli, pt, quiebra, r1, r2, radial, vertical } from './comun.mjs'

const NOCHE = '#172a46'
const CELESTE = '#567eaa'
const MARMOL = '#eee8dc'
const ORO = '#c5a46d'
const NIEBLA = '#a8b9c9'
// El azul del fondo y el de las sombras más hondas, más oscuros que el azul noche.
const FONDO = '#0e1a2d'
const SOMBRA = '#0a1424'

// --- Nubes ------------------------------------------------------------------------
// Las nubes de la sala son estilizadas: lóbulos redondos que se solapan sobre una base
// recta, como en los relieves y en los vasos pintados.

// Los dos puntos donde se cortan dos círculos [x, y, r]: primero el que queda a la
// izquierda mirando del primero al segundo (arriba, si el segundo está a la derecha).
function cortes([x1, y1, ra], [x2, y2, rb]) {
  const d = Math.hypot(x2 - x1, y2 - y1)
  const l = (ra * ra - rb * rb + d * d) / (2 * d)
  const h = Math.sqrt(Math.max(ra * ra - l * l, 0))
  const px = x1 + (l * (x2 - x1)) / d, py = y1 + (l * (y2 - y1)) / d
  return [[px + (h * (y2 - y1)) / d, py - (h * (x2 - x1)) / d], [px - (h * (y2 - y1)) / d, py + (h * (x2 - x1)) / d]]
}
const corte = (a, b) => cortes(a, b)[0]


// Una luna creciente: el círculo (cx, cy, r) menos otro algo menor corrido hacia arriba a
// la derecha, así que la parte iluminada mira abajo a la izquierda.
function creciente(cx, cy, r) {
  const dentro = [cx + r * 0.42, cy - r * 0.34, r * 0.9]
  const [a, b] = cortes([cx, cy, r], dentro)
  return `M${pt(a)}A${r} ${r} 0 1 0 ${pt(b)}A${r1(dentro[2])} ${r1(dentro[2])} 0 0 1 ${pt(a)}Z`
}

// Una nube: el contorno cerrado hasta `base` y el arco de cada lóbulo, para pintarle la
// luz. `lobulos` va de izquierda a derecha, y cada uno se solapa con el siguiente.
function nube(lobulos, base) {
  const n = lobulos.length
  const puntos = [[lobulos[0][0] - lobulos[0][2], lobulos[0][1]]]
  for (let i = 0; i < n - 1; i++) puntos.push(corte(lobulos[i], lobulos[i + 1]))
  puntos.push([lobulos[n - 1][0] + lobulos[n - 1][2], lobulos[n - 1][1]])
  let arcos = ''
  const bordes = []
  for (let i = 0; i < n; i++) {
    const [cx, cy, r] = lobulos[i], a = puntos[i], b = puntos[i + 1]
    const aa = Math.atan2(a[1] - cy, a[0] - cx)
    let vuelta = Math.atan2(b[1] - cy, b[0] - cx) - aa
    while (vuelta < 0) vuelta += 2 * Math.PI
    arcos += `A${r1(r)} ${r1(r)} 0 ${vuelta > Math.PI ? 1 : 0} 1 ${pt(b)}`
    bordes.push({ cx, cy, r, aa, ab: aa + vuelta })
  }
  return { contorno: `M${r1(puntos[0][0])} ${base}L${pt(puntos[0])}${arcos}L${r1(puntos[n][0])} ${base}Z`, bordes }
}

// La luz en el borde de una nube: el trozo de cada lóbulo que mira a la luz, entre los
// ángulos `desde` y `hasta`, en grados y en el sentido de las agujas del reloj (0 a la
// derecha, 90 abajo, 180 a la izquierda y 270 arriba).
function luzNube(bordes, desde, hasta) {
  return bordes.map(b => arcoLuz(b, desde, hasta)).join('')
}

// El trozo de un lóbulo que queda entre dos ángulos, en grados.
function arcoLuz({ cx, cy, r, aa, ab }, desde, hasta) {
  const dos = 2 * Math.PI, d0 = (desde * Math.PI) / 180, d1 = (hasta * Math.PI) / 180
  let a0 = aa, a1 = ab, d = ''
  while (a0 < 0) { a0 += dos; a1 += dos }
  for (const k of [-dos, 0, dos]) {
    const s = Math.max(a0, d0 + k), e = Math.min(a1, d1 + k)
    // Los trozos muy cortos, de lóbulos casi tapados por sus vecinos, no llevan luz.
    if ((e - s) * r < 30) continue
    const p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)]
    d += `M${pt(p(s))}A${r1(r)} ${r1(r)} 0 ${e - s > Math.PI ? 1 : 0} 1 ${pt(p(e))}`
  }
  return d
}

// La luz de un foco en el borde de una nube: en cada lóbulo, el trozo que mira al punto
// más cercano del foco, más o menos abierto. `foco(x, y)` da ese punto. Devuelve tres
// trazados, de los lóbulos cercanos, medianos y lejanos, para pintarlos con tres brillos.
function luzHacia(bordes, foco, abre = 70, cerca = 260, lejos = 560) {
  const grupos = ['', '', '']
  for (const b of bordes) {
    const [fx, fy] = foco(b.cx, b.cy)
    const dist = Math.hypot(fx - b.cx, fy - b.cy)
    let mira = (Math.atan2(fy - b.cy, fx - b.cx) * 180) / Math.PI
    if (mira < 0) mira += 360
    grupos[dist < cerca ? 0 : dist < lejos ? 1 : 2] += arcoLuz(b, mira - abre, mira + abre)
  }
  return grupos
}

// Una fila de lóbulos al azar de x0 a x1: cada lóbulo sube entre la mitad y `sube` de su
// radio por encima de una base que ondula `ola` unidades arriba y abajo, para que el mar
// de nubes tenga lomas y valles.
function fila(semilla, x0, x1, base, rMin, rMax, ola = 0, sube = 0.8) {
  const r = azar(semilla), l = [], fase = r() * 6
  const lobulo = (x, rr) => [r1(x), r1(base + ola * Math.sin(x / 170 + fase) - rr * (0.5 + r() * (sube - 0.5))), r1(rr)]
  let x = x0, antes = rMin + r() * (rMax - rMin)
  l.push(lobulo(x, antes))
  while (x < x1) {
    const rr = rMin + r() * (rMax - rMin)
    x += (antes + rr) * (0.5 + r() * 0.2)
    l.push(lobulo(x, rr))
    antes = rr
  }
  return l
}


// --- Santuario --------------------------------------------------------------------
// Un templo dórico de mármol en lo alto de una montaña que sale de un mar de nubes, a la
// derecha. La luz cálida del ocaso llega de la izquierda y dora las columnas, y la puerta
// de la cella brilla con el fuego de dentro. Un águila, el ave de Zeus, da vueltas sobre
// el templo, y unos jirones de nube pasan por delante de la montaña.

// Los ejes de las seis columnas de la fachada.
const COLUMNAS = [0, 1, 2, 3, 4, 5].map(i => r1(1168 + 52.8 * i))

function templo() {
  const piso = 560, abaco = 410
  // Las gradas: tres escalones de 10, cada uno un poco más ancho que el de encima. Se ve
  // su frente, con la arista de arriba encendida por la luz.
  let gradas = ''
  for (const [k, x0, x1] of [[0, 1150, 1450], [1, 1139, 1461], [2, 1128, 1472]]) {
    const y = piso + k * 10
    gradas += `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="10" fill="url(#grada)"/><path d="M${x0} ${y + 0.8}H${x1}" stroke="#fff6e4" stroke-width="1.4" opacity=".55"/>`
  }
  // Las columnas: el fuste con éntasis, el equino y el ábaco, sombreados de izquierda a
  // derecha; las estrías son líneas finas. Cada una arroja su sombra en el muro de detrás.
  let columnas = '', estrias = '', sombras = ''
  for (const cx of COLUMNAS) {
    const fuste = `M${r1(cx - 13.5)} ${piso}Q${r1(cx - 12.6)} 490 ${r1(cx - 10.5)} 423H${r1(cx + 10.5)}Q${r1(cx + 12.6)} 490 ${r1(cx + 13.5)} ${piso}Z`
    const equino = `M${r1(cx - 10.5)} 423Q${r1(cx - 16)} 422 ${r1(cx - 16.5)} 416H${r1(cx + 16.5)}Q${r1(cx + 16)} 422 ${r1(cx + 10.5)} 423Z`
    columnas += `<path d="${fuste}"/><path d="${equino}"/><rect x="${r1(cx - 17)}" y="${abaco}" width="34" height="6"/>`
    for (const dx of [-7, -2.5, 2, 6.5]) estrias += `M${r1(cx + dx * 1.05)} ${piso - 2}L${r1(cx + dx * 0.8)} 425`
    if (cx + 11 < 1420) sombras += `M${r1(cx + 11)} ${abaco + 6}H${r1(Math.min(cx + 32, 1420))}L${r1(Math.min(cx + 36, 1420))} ${piso}H${r1(cx + 13)}Z`
  }
  // El entablamento: el arquitrabe con su listel de oro, el friso de triglifos y metopas
  // y la cornisa, que vuela un poco sobre todo lo demás.
  let triglifos = '', ranuras = ''
  for (let i = 0; i < 11; i++) {
    const x = 1168 + 26.4 * i
    triglifos += `<rect x="${r1(x - 6.5)}" y="376" width="13" height="18"/>`
    ranuras += `M${r1(x - 2.2)} 378V393M${r1(x + 2.2)} 378V393`
  }
  // El frontón, de pendiente suave: la cornisa inclinada y el tímpano, un poco en sombra,
  // con un escudo de oro en el centro. Las acróteras de oro rematan la punta y las esquinas.
  const fronton = 'M1139 368L1300 325L1461 368Z'
  const timpano = 'M1170 368L1300 333.3L1430 368Z'
  const palmeta = (x, y, e) => `<path transform="translate(${x} ${y}) scale(${e})" d="M0 0C-3 -6 -9 -9 -12 -8C-8 -12 -4 -14 -2 -12C-3 -17 -1 -21 0 -24C1 -21 3 -17 2 -12C4 -14 8 -12 12 -8C9 -9 3 -6 0 0Z"/>`
  return `<rect x="1180" y="${abaco}" width="240" height="${piso - abaco}" fill="url(#cella)"/>` +
    `<path d="${sombras}" fill="${SOMBRA}" opacity=".35"/>` +
    // La puerta de la cella, abierta al fuego de dentro, y la luz que derrama en las gradas.
    `<g class="fuego"><rect x="1276" y="468" width="48" height="${piso - 468}" fill="url(#puerta)"/><path d="M1276 ${piso}H1324L1352 ${piso + 30}H1248Z" fill="url(#derrame)"/></g>` +
    `<path d="M1272 ${piso}V464H1328V${piso}" stroke="#d8d2c6" stroke-width="3" fill="none" opacity=".7"/>` +
    // La sombra que el techo del pórtico echa en lo alto del muro.
    `<rect x="1180" y="${abaco}" width="240" height="22" fill="${SOMBRA}" opacity=".45"/>` +
    gradas +
    `<g fill="url(#fuste)">${columnas}</g><path d="${estrias}" stroke="#6f7e98" stroke-width="1" opacity=".38"/>` +
    `<rect x="1150" y="394" width="300" height="16" fill="url(#frente)"/><path d="M1150 395.5H1450" stroke="${ORO}" stroke-width="2.2"/>` +
    `<rect x="1150" y="376" width="300" height="18" fill="url(#frente)" opacity=".92"/><g fill="#97a3b8">${triglifos}</g><path d="${ranuras}" stroke="#5f6e8a" stroke-width="1.4"/>` +
    `<rect x="1143" y="368" width="314" height="8" fill="url(#frente)"/><path d="M1143 376H1457" stroke="${SOMBRA}" stroke-width="2" opacity=".55"/>` +
    `<path d="${fronton}" fill="url(#frente)"/><path d="${timpano}" fill="#b9b8b8"/><path d="${timpano}" fill="url(#sombraTimpano)"/>` +
    `<path d="M1139 368L1300 325L1461 368" stroke="#fff6e4" stroke-width="1.4" fill="none" opacity=".5"/>` +
    `<circle cx="1300" cy="354" r="8" fill="${ORO}"/><circle cx="1300" cy="354" r="4.5" fill="none" stroke="#f3dca6" stroke-width="1.2"/>` +
    `<g fill="${ORO}">${palmeta(1300, 326, 1.1)}${palmeta(1141, 368, 0.75)}${palmeta(1459, 368, 0.75)}</g>`
}

// El águila de Zeus vista desde abajo, con las alas abiertas y las plumas de las puntas
// separadas como dedos. Es simétrica, así que no hace falta girarla al cambiar de rumbo.
const AGUILA = 'M0 -6C3 -6 4.5 -4 4.5 -2.5C12 -6 24 -8 33 -6L38 -7.5L35.5 -4L39.5 -3.5L35.5 -1L38.5 .5L33 1.5C24 3 13 3 6 4L8.5 10L3 9L0 12L-3 9L-8.5 10L-6 4C-13 3 -24 3 -33 1.5L-38.5 .5L-35.5 -1L-39.5 -3.5L-35.5 -4L-38 -7.5L-33 -6C-24 -8 -12 -6 -4.5 -2.5C-4.5 -4 -3 -6 0 -6Z'

function santuario() {
  // La montaña del templo: la cumbre allanada donde se asientan las gradas y dos flancos
  // de roca rota que bajan hasta el mar de nubes, cada uno con un hombro.
  const rr = azar(13)
  const izq = quiebra(rr, [[900, 900], [944, 812], [978, 778], [1004, 752], [1034, 740], [1056, 716], [1072, 686], [1084, 656], [1094, 628], [1100, 606], [1110, 593], [1120, 591]], 3, 0.2)
  const der = quiebra(rr, [[1480, 591], [1492, 596], [1500, 616], [1506, 644], [1516, 670], [1540, 684], [1562, 712], [1574, 742], [1598, 766], [1624, 812], [1650, 900]], 3, 0.2)
  const montana = [[880, 1000], ...izq, ...der, [1670, 1000]]
  // Las grietas que bajan de la cumbre parten la roca en caras: las de la izquierda dan al
  // ocaso y se doran, las de la derecha se quedan en sombra.
  const grietas = [[[1158, 592], [1146, 640], [1130, 700], [1100, 790]], [[1236, 592], [1230, 652], [1212, 724], [1190, 800]], [[1388, 592], [1400, 660], [1398, 734], [1410, 800]], [[1462, 592], [1480, 650], [1500, 724], [1530, 800]]]
    .map(p => quiebra(rr, p, 3, 0.25))
  const caras = [
    { p: [[1106, 591], ...grietas[0], [900, 820]], color: '#f7dba6', o: 0.24 },
    { p: [...grietas[0], ...grietas[1].slice().reverse()], color: '#f0c983', o: 0.16 },
    { p: [...grietas[1], ...grietas[2].slice().reverse()], color: '#e9d2a6', o: 0.06 },
    { p: [...grietas[2], ...grietas[3].slice().reverse()], color: SOMBRA, o: 0.22 },
    { p: [...grietas[3], [1660, 820], [1494, 591]], color: SOMBRA, o: 0.42 },
  ].map(({ p, color, o }) => `<path d="${poli(p)}" fill="${color}" opacity="${o}"/>`).join('')
  const repisas = 'M1066 664L1104 659L1132 664M1156 712L1200 705L1226 711M1290 650L1342 645L1366 649M1424 690L1474 682L1500 688M1020 748L1058 740L1080 743'
  // Los cipreses de la cumbre, a los lados de las gradas, que se mecen con el viento.
  const cipres = (x, alto, ancho) => `<g transform="translate(${x} 592)"><g class="cipres" style="animation-duration:${r1(4 + alto / 30)}s"><path d="M0 0C${-ancho} ${-alto * 0.2} ${-ancho * 1.05} ${-alto * 0.6} 0 ${-alto}C${ancho * 1.05} ${-alto * 0.6} ${ancho} ${-alto * 0.2} 0 0Z" fill="${SOMBRA}"/><path d="M-2 -2C${-ancho} ${-alto * 0.22} ${-ancho * 1.05} ${-alto * 0.6} 0 ${-alto}" stroke="#f0c983" stroke-width="1.4" fill="none" opacity=".45"/></g></g>`
  const lejana = [[20, 790], [150, 700], [232, 650], [292, 610], [330, 592], [352, 600], [384, 626], [440, 664], [520, 712], [640, 790]]
  const lejanaB = [[430, 790], [520, 724], [575, 690], [606, 676], [632, 684], [680, 712], [760, 748], [860, 790]]
  const luzLejana = poli([[150, 700], [232, 650], [292, 610], [330, 592], [318, 640], [290, 700], [240, 760], [120, 760]])
  // El mar de nubes, en tres filas: la de atrás pasa por detrás de la montaña, clara y
  // encendida por el ocaso; las otras dos por delante, cada vez más bajas, más grandes y
  // más oscuras, para que el templo mande.
  const atras = nube(fila(3, -60, 1680, 770, 30, 66, 14), 900)
  const media = nube(fila(5, -80, 1700, 838, 44, 92, 22), 1000)
  const cerca = nube(fila(7, -90, 1720, 930, 64, 124, 26), 1000)
  // Los jirones que pasan por delante de los flancos de la montaña: largos y bajos.
  const jirones = [
    { l: [[952, 712, 11], [976, 705, 16], [1004, 700, 20], [1034, 702, 18], [1062, 708, 14], [1086, 713, 10]], base: 720, s: 13 },
    { l: [[1488, 690, 10], [1510, 683, 15], [1536, 679, 19], [1564, 682, 16], [1590, 688, 12], [1612, 693, 9]], base: 698, s: -16 },
    { l: [[1150, 752, 12], [1178, 744, 18], [1210, 739, 22], [1244, 741, 20], [1276, 747, 15], [1302, 753, 11]], base: 760, s: 19 },
  ]
  const luna = [250, 245]
  const defs = `<defs>
${vertical('cielo', 0, 800, [[0, '#0a1326'], [0.45, '#14253f'], [0.8, '#24406a'], [1, '#33527e']])}
${radial('ocaso', -60, 760, 1000, [[0, '#ffbd68', 0.8], [0.2, '#eca95c', 0.4], [0.45, ORO, 0.12], [1, ORO, 0]])}
${radial('halo', 1300, 470, 430, [[0, '#f6e0b0', 0.3], [0.45, '#f3dcaa', 0.1], [1, '#f3dcaa', 0]])}
${radial('lunaG', luna[0], luna[1], 90, [[0, MARMOL, 0.22], [1, MARMOL, 0]])}
${vertical('roca', 590, 860, [[0, '#3d5274'], [0.55, '#243759'], [1, '#121f35']])}
${horizontal('flanco', 1000, 1330, [[0, '#ecc78a', 0.5], [0.45, '#c5a46d', 0.16], [1, ORO, 0]])}
${horizontal('umbria', 1330, 1660, [[0, SOMBRA, 0], [1, SOMBRA, 0.55]])}
${vertical('lejos', 590, 790, [[0, '#3c5883'], [1, '#213759']])}
${vertical('nubeAtras', 690, 800, [[0, '#6c86b0'], [1, '#2e476d']])}
${vertical('nubeMedia', 740, 900, [[0, '#4a6592'], [0.6, '#263c62'], [1, '#18294a']])}
${vertical('nubeCerca', 820, 1000, [[0, '#30476e'], [0.5, '#1b2c4c'], [1, '#0e192d']])}
${horizontal('borde', 0, W, [[0, '#ffd99a', 0.9], [0.4, '#f0d49e', 0.55], [1, '#f0d49e', 0.25]])}
<linearGradient id="jiron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9db1cd" stop-opacity=".9"/><stop offset=".6" stop-color="#6982a8" stop-opacity=".5"/><stop offset="1" stop-color="#6982a8" stop-opacity=".08"/></linearGradient>
<linearGradient id="fuste" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fdf3df"/><stop offset=".32" stop-color="#efe6d4"/><stop offset=".66" stop-color="#b3bac8"/><stop offset="1" stop-color="#5f7298"/></linearGradient>
${horizontal('frente', 1130, 1470, [[0, '#fbefd6'], [0.55, '#e7e0d3'], [1, '#bfc0c4']])}
${horizontal('grada', 1130, 1470, [[0, '#e8dcc4'], [1, '#9ea6b6']])}
${vertical('cella', 410, 560, [[0, '#1a2944'], [1, '#2f405e']])}
${vertical('sombraTimpano', 333, 368, [[0, SOMBRA, 0.15], [1, SOMBRA, 0.45]])}
${radial('puerta', 1300, 560, 110, [[0, '#fff3cf'], [0.3, '#f0c878'], [0.65, '#a8803f'], [1, '#4a4038']])}
${vertical('derrame', 560, 590, [[0, '#f6d79a', 0.55], [1, '#f6d79a', 0]])}
</defs>`
  const estilo = CSS_ESTRELLAS +
    '.fuego{animation:fuego 3.2s ease-in-out infinite}@keyframes fuego{0%,100%{opacity:1}22%{opacity:.7}40%{opacity:.95}63%{opacity:.62}82%{opacity:.9}}' +
    '.jiron{animation-name:jiron;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}@keyframes jiron{from{transform:translateX(-90px)}to{transform:translateX(90px)}}' +
    '.ax{animation:ax 11s cubic-bezier(.37,0,.63,1) infinite alternate}.ay{animation:ay 11s cubic-bezier(.37,0,.63,1) -5.5s infinite alternate}' +
    '@keyframes ax{from{transform:translateX(-230px)}to{transform:translateX(230px)}}@keyframes ay{from{transform:translateY(-38px)}to{transform:translateY(38px)}}' +
    '.planea{animation:planea 6s ease-in-out infinite alternate}@keyframes planea{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}' +
    '.cipres{animation-name:cipres;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}@keyframes cipres{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}'
  const jironesSvg = jirones.map(({ l, base, s }, i) => {
    const { contorno, bordes } = nube(l, base)
    const estiloJ = `animation-duration:${Math.abs(s)}s;animation-delay:-${r1(Math.abs(s) * (0.3 + i * 0.27))}s` + (s < 0 ? ';animation-direction:alternate-reverse' : '')
    return `<g class="jiron" style="${estiloJ}"><path d="${contorno}" fill="url(#jiron)"/><path d="${luzNube(bordes, 170, 290)}" stroke="#ffe2a8" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".75"/></g>`
  }).join('')
  const filaNubes = ({ contorno, bordes }, relleno, grosor, opacidad) =>
    `<path d="${contorno}" fill="url(#${relleno})"/><path d="${luzNube(bordes, 172, 288)}" stroke="url(#borde)" stroke-width="${grosor}" stroke-linecap="round" fill="none" opacity="${opacidad}"/>`
  return abrir(FONDO, estilo) + defs +
    `<rect width="${W}" height="800" fill="url(#cielo)"/>` + estrellas(71, 150, 0, 470) +
    `<circle cx="${luna[0]}" cy="${luna[1]}" r="90" fill="url(#lunaG)"/><path d="${creciente(luna[0], luna[1], 24)}" fill="${MARMOL}"/>` +
    `<rect width="${W}" height="${H}" fill="url(#ocaso)"/><circle cx="1300" cy="470" r="430" fill="url(#halo)"/>` +
    // Las cumbres lejanas de la izquierda, con la cara que da al sol dorada.
    `<path d="${poli(lejanaB)}" fill="url(#lejos)" opacity=".7"/><path d="${poli(lejana)}" fill="url(#lejos)"/><path d="${luzLejana}" fill="${ORO}" opacity=".16"/>` +
    filaNubes(atras, 'nubeAtras', 2.2, 0.9) +
    // La montaña del templo, dorada por el ocaso en el flanco izquierdo y en sombra en el derecho.
    `<path d="${poli(montana)}" fill="url(#roca)"/><path d="${poli(montana)}" fill="url(#flanco)"/><path d="${poli(montana)}" fill="url(#umbria)"/>` +
    `<clipPath id="rocaC"><path d="${poli(montana)}"/></clipPath><g clip-path="url(#rocaC)">${caras}</g>` +
    `<path d="${grietas.map(p => `M${p.map(pt).join('L')}`).join('')}" stroke="${SOMBRA}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".5"/>` +
    `<path d="${repisas}" stroke="${SOMBRA}" stroke-width="2.4" stroke-linecap="round" fill="none" opacity=".45" transform="translate(0 2)"/><path d="${repisas}" stroke="#f0d6a4" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".3"/>` +
    `<path d="M${izq.slice(-6).map(pt).join('L')}L1480 591" stroke="#f0d6a4" stroke-width="2" stroke-linejoin="round" fill="none" opacity=".5"/>` +
    cipres(1104, 74, 9) + cipres(1119, 52, 7) + cipres(1490, 64, 8) +
    templo() +
    jironesSvg +
    filaNubes(media, 'nubeMedia', 2.4, 0.75) +
    filaNubes(cerca, 'nubeCerca', 2.6, 0.6) +
    // El águila, que da vueltas sobre el templo y se ladea al planear.
    `<g transform="translate(1250 234)"><g class="ax"><g class="ay"><g class="planea"><g transform="scale(1.3)"><path d="${AGUILA}" fill="${SOMBRA}"/><path d="M-33 1.5C-24 3 -13 3 -6 4M6 4C13 3 24 3 33 1.5" stroke="${ORO}" stroke-width="1.2" fill="none" opacity=".8"/></g></g></g></g></g>` +
    `</svg>`
}

// --- Zeus -------------------------------------------------------------------------
// El rayo de Zeus, sin el dios: un rayo de oro enorme que baja en diagonal por la derecha,
// desde las nubes de arriba hasta el mar de nubes de abajo, con su halo, una luz que lo
// recorre y destellos alrededor. Las nubes son las de la sala, con volutas, y se encienden
// por el lado que mira al rayo. A lo lejos, entre las nubes de la izquierda, la tormenta
// se ilumina de vez en cuando.
//
// La tormenta sigue un solo ciclo de 10 s: como mucho dos golpes de luz por destello y
// nunca dos destellos a la vez, por las personas sensibles a los destellos. El rayo de oro
// no destella: su halo late despacio y una luz lo recorre de arriba abajo.

// El rayo en coordenadas propias, de pie: arriba en (0, 0) y la punta abajo, a 900. Se
// gira RAYO_GIRO grados y se pone en RAYO_O. Es un zigzag de dos escalones, como los
// rayos de los escudos y de las monedas.
const RAYO_O = [1570, 52], RAYO_GIRO = 30
const RAYO = [[-20, 0], [40, 0], [10, 330], [52, 330], [-4, 620], [34, 620], [-36, 900], [-22, 655], [-60, 655], [-14, 365], [-54, 365]]
const RAYO_EJE = [[10, 0], [-1, 347], [-8, 637], [-36, 900]]
const enEscena = ([x, y]) => {
  const a = (RAYO_GIRO * Math.PI) / 180
  return [RAYO_O[0] + x * Math.cos(a) - y * Math.sin(a), RAYO_O[1] + x * Math.sin(a) + y * Math.cos(a)]
}
// El punto del eje del rayo más cercano a (x, y), en la escena: hacia él miran las luces.
function alRayo(x, y) {
  const eje = RAYO_EJE.map(enEscena)
  let mejor = eje[0], dmin = Infinity
  for (let i = 0; i < eje.length - 1; i++) {
    const [ax, ay] = eje[i], [bx, by] = eje[i + 1], dx = bx - ax, dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)))
    const p = [ax + t * dx, ay + t * dy], d = Math.hypot(p[0] - x, p[1] - y)
    if (d < dmin) { dmin = d; mejor = p }
  }
  return mejor
}

// Una voluta: una espiral que sale del centro de un lóbulo, como los rizos de las nubes
// pintadas en los vasos.
function voluta(cx, cy, r, empieza, sentido = 1, vueltas = 1.25) {
  const p = []
  for (let i = 0; i <= 28; i++) {
    const t = i / 28, a = empieza + sentido * t * vueltas * 2 * Math.PI, rr = r * (0.12 + 0.58 * t)
    p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return curva(p)
}

// Un destello de cuatro puntas, centrado en (0, 0).
const chispa = s => `M0 ${-s}L${r1(s * 0.18)} ${r1(-s * 0.18)}L${s} 0L${r1(s * 0.18)} ${r1(s * 0.18)}L0 ${s}L${r1(-s * 0.18)} ${r1(s * 0.18)}L${-s} 0L${r1(-s * 0.18)} ${r1(-s * 0.18)}Z`

function zeus() {
  // Las nubes: un banco que cuelga arriba a la izquierda y otro arriba a la derecha, de
  // donde sale el rayo, una isla de nubes a media altura a la izquierda y el mar de nubes
  // de abajo, en dos filas. Las de arriba se dibujan del revés, colgando.
  const capas = [
    { l: fila(21, -80, 960, 60, 40, 96, 26), base: 200, colgada: 70, relleno: 'nubeAlta', abre: 70 },
    { l: fila(23, 1040, 1720, 80, 46, 104, 22), base: 200, colgada: 70, relleno: 'nubeAlta', abre: 75 },
    { l: [[150, 560, 34], [205, 532, 50], [272, 524, 58], [340, 538, 46], [392, 556, 32]], base: 584, relleno: 'nubeIsla', abre: 80 },
    { l: fila(25, -80, 1720, 868, 44, 92, 22), base: 1000, relleno: 'nubeMar', abre: 75 },
    { l: fila(27, -90, 1720, 958, 64, 120, 28), base: 1000, relleno: 'nubeCerca', abre: 80 },
  ]
  // Cada capa: su contorno, la luz que mira al rayo en tres brillos y unas volutas en los
  // lóbulos grandes. Las colgadas se dibujan en un espejo alrededor de y = `colgada`.
  const pinta = ({ l, base, colgada, relleno, abre }, i) => {
    const { contorno, bordes } = nube(l, base)
    const espejo = colgada === undefined ? null : y => 2 * colgada - y
    const foco = espejo ? (x, y) => { const [fx, fy] = alRayo(x, espejo(y)); return [fx, espejo(fy)] } : alRayo
    const [cerca, media, lejos] = luzHacia(bordes, foco, abre)
    let volutas = ''
    l.forEach(([cx, cy, r], k) => {
      if (r < 50 || (k + i) % 3) return
      const [fx, fy] = foco(cx, cy)
      volutas += voluta(cx, cy - r * 0.08, r * 0.62, Math.atan2(fy - cy, fx - cx) + Math.PI, fx < cx ? 1 : -1)
    })
    const dibujo = `<path d="${contorno}" fill="url(#${relleno})"/>` +
      `<path d="${volutas}" stroke="#7f9cc8" stroke-width="3" stroke-linecap="round" fill="none" opacity=".28"/>` +
      `<g fill="none" stroke-linecap="round"><path d="${lejos}" stroke="#8fb0dc" stroke-width="2" opacity=".35"/><path d="${media}" stroke="#e9cf94" stroke-width="2.4" opacity=".6"/><path d="${cerca}" class="eco" stroke="#ffe7ad" stroke-width="3" opacity=".9"/></g>`
    return espejo ? `<g transform="matrix(1 0 0 -1 0 ${2 * colgada})">${dibujo}</g>` : dibujo
  }
  // El rayo de oro: el relleno con su degradado de lado a lado, el filo claro, la arista
  // del centro y el halo de trazos anchos y transparentes, sin desenfoque.
  const forma = poli(RAYO)
  const eje = `M${RAYO_EJE.map(pt).join('L')}`
  const r = azar(31)
  // Las ramas finas que salen de los escalones del rayo.
  const ramas = [[[52, 330], [164, 338]], [[-60, 655], [-176, 706]], [[-54, 365], [-128, 404]]]
    .map(([a, b], k) => {
      const p = quiebra(r, [a, b], 4, 0.4)
      return `<g class="rama r${k}" opacity=".85"><path d="M${p.slice(0, 9).map(pt).join('L')}" stroke-width="3.4"/><path d="M${p.map(pt).join('L')}" stroke-width="1.6"/></g>`
    }).join('')
  // Los destellos: casi todos alrededor del rayo, y unos pocos en el cielo.
  let chispas = ''
  const rc = azar(37)
  for (let i = 0; i < 22; i++) {
    let x, y
    if (i < 15) {
      const t = rc(), [ex, ey] = enEscena([-12 - 24 * t, 900 * t]), lado = rc() < 0.5 ? -1 : 1, d = 50 + rc() * 120
      x = ex + lado * d * 0.87; y = ey + lado * d * 0.5
    } else { x = 700 + rc() * 880; y = 200 + rc() * 560 }
    const dur = r1(2.6 + rc() * 2.2), s = r1(i < 15 ? 7 + rc() * 9 : 4 + rc() * 5)
    chispas += `<g transform="translate(${r1(x)} ${r1(y)})"><path class="chispa" style="animation-duration:${dur}s;animation-delay:-${r1(rc() * dur)}s" d="${chispa(s)}" opacity="${r2(0.35 + rc() * 0.55)}"/></g>`
  }
  // Los relámpagos lejanos de la izquierda, blancos y finos, cada uno con el brillo de la
  // nube donde nace.
  const lejanos = [
    { d: `M${quiebra(azar(41), [[250, 190], [340, 470]], 5, 0.35).map(pt).join('L')}`, luz: [270, 200], clase: 'dA' },
    { d: `M${quiebra(azar(43), [[372, 588], [300, 800]], 5, 0.35).map(pt).join('L')}`, luz: [350, 640], clase: 'dB' },
  ]
  const defs = `<defs>
${vertical('cielo', 0, H, [[0, '#0a1222'], [0.5, '#122139'], [1, '#1b2e4d']])}
${radial('auraCielo', 1340, 440, 640, [[0, '#f2d488', 0.24], [0.4, '#c5a46d', 0.08], [1, ORO, 0]])}
${vertical('nubeAlta', -100, 200, [[0, '#2a4470'], [0.3, '#1d3152'], [1, '#0f1b30']])}
${vertical('nubeIsla', 470, 590, [[0, '#2f4a74'], [1, '#172a46']])}
${vertical('nubeMar', 760, 1000, [[0, '#2b4570'], [0.6, '#1a2c4b'], [1, '#111e35']])}
${vertical('nubeCerca', 830, 1000, [[0, '#1f3456'], [1, '#0c172a']])}
${horizontal('oro', -60, 52, [[0, '#fff6dc'], [0.35, '#f4d996'], [0.72, '#d1aa62'], [1, '#a07a41']])}
<radialGradient id="destelloLejano"><stop offset="0" stop-color="#d9e6f5" stop-opacity=".42"/><stop offset=".45" stop-color="${CELESTE}" stop-opacity=".16"/><stop offset="1" stop-color="${CELESTE}" stop-opacity="0"/></radialGradient>
</defs>`
  const estilo =
    // El ciclo de 10 s: el destello lejano de arriba en el 0 %, con dos golpes; el de
    // abajo en el 55 %, con uno; y el halo del rayo se crece entre los dos, sin parpadeo.
    '@keyframes dA{0%{opacity:0}1%{opacity:1}2.2%{opacity:.15}3.6%{opacity:.8}5.5%{opacity:0}100%{opacity:0}}' +
    '@keyframes dB{0%,55%{opacity:0}56.5%{opacity:.85}59%,100%{opacity:0}}' +
    '.dA{animation:dA 10s linear infinite}.dB{animation:dB 10s linear infinite}' +
    '.aura{animation:aura 10s ease-in-out infinite}@keyframes aura{0%,20%,48%,72%,100%{opacity:.75}32%{opacity:1}86%{opacity:.95}}' +
    '.eco{animation:eco 10s ease-in-out infinite}@keyframes eco{0%,20%,48%,72%,100%{opacity:.7}32%{opacity:1}86%{opacity:.95}}' +
    '.pulso{animation:pulso 3.3s cubic-bezier(.45,0,.55,1) infinite}@keyframes pulso{0%{stroke-dashoffset:90}38%{stroke-dashoffset:-1000}100%{stroke-dashoffset:-1000}}' +
    '.rama{animation-duration:10s;animation-timing-function:linear;animation-iteration-count:infinite}' +
    '.r0{animation-name:rama0}.r1{animation-name:rama1}.r2{animation-name:rama2}' +
    '@keyframes rama0{0%,14%{opacity:.85}16%{opacity:.2}18%{opacity:.85}100%{opacity:.85}}@keyframes rama1{0%,38%{opacity:.85}40%{opacity:.2}42%{opacity:.85}100%{opacity:.85}}' +
    '@keyframes rama2{0%,66%{opacity:.85}68%{opacity:.2}70%{opacity:.85}100%{opacity:.85}}' +
    '.chispa{animation-name:chispa;animation-timing-function:ease-in-out;animation-iteration-count:infinite}@keyframes chispa{0%,100%{transform:scale(.15) rotate(0deg);opacity:0}45%{transform:scale(1) rotate(25deg);opacity:1}70%{transform:scale(.6) rotate(40deg);opacity:.5}}'
  const rayoSvg = `<g transform="translate(${RAYO_O[0]} ${RAYO_O[1]}) rotate(${RAYO_GIRO})">` +
    `<g class="aura" stroke="#f2d488" stroke-linejoin="round" fill="none">${[[96, 0.025], [72, 0.035], [52, 0.05], [36, 0.07], [22, 0.1], [12, 0.15]].map(([g, o]) => `<path d="${forma}" stroke-width="${g}" opacity="${o}"/>`).join('')}</g>` +
    `<g stroke="#f0d08a" stroke-linecap="round" stroke-linejoin="round" fill="none">${ramas}</g>` +
    `<path d="${forma}" fill="url(#oro)"/><path d="${forma}" stroke="#fff4cf" stroke-width="2" stroke-linejoin="round" fill="none" opacity=".75"/>` +
    `<path d="${eje}" stroke="#fffbea" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55"/>` +
    `<path class="pulso" d="${eje}" pathLength="1000" stroke-dasharray="90 1000" stroke-dashoffset="90" stroke="#fff6dd" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".3"/>` +
    `<path class="pulso" d="${eje}" pathLength="1000" stroke-dasharray="90 1000" stroke-dashoffset="90" stroke="#ffffff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
    `</g>`
  return abrir(FONDO, estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#cielo)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#auraCielo)"/>` +
    lejanos.map(({ d, luz, clase }) => `<g class="${clase}" opacity="0"><ellipse cx="${luz[0]}" cy="${luz[1]}" rx="260" ry="170" fill="url(#destelloLejano)"/><path d="${d}" stroke="#cfe0f5" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".25"/><path d="${d}" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`).join('') +
    pinta(capas[2], 2) + pinta(capas[3], 3) +
    rayoSvg +
    pinta(capas[0], 0) + pinta(capas[1], 1) + pinta(capas[4], 4) +
    `<g fill="#fff3d0">${chispas}</g>` +
    `</svg>`
}

// --- Oráculo ----------------------------------------------------------------------
// El oráculo de Delfos de noche: a la derecha, un busto de mármol de perfil, con la corona
// de laurel de Apolo, sobre un pedestal con la máxima del templo, «conócete a ti mismo».
// A su lado, el trípode de bronce con el fuego, que lo ilumina a medias: la cara y el
// pecho dorados y la nuca en sombra, con un filo de luz fría del cielo. Del fuego sube el
// humo en volutas. Detrás, una columna jónica y un trozo de arquitrabe con su greca de
// oro; a lo lejos, a la izquierda, las tres columnas del tolo bajo las estrellas.

// Letras griegas trazadas en una caja de 12 × 20, para la inscripción del pedestal.
const LETRAS = {
  Γ: 'M2 20V0H12', Ν: 'M1 20V0L11 20V0', Ω: 'M1 20H4C-1 16 -1 1 6 0C13 1 13 16 8 20H11',
  Θ: 'M6 0C-2 0 -2 20 6 20C14 20 14 0 6 0ZM3 10H9', Ι: 'M6 0V20', Σ: 'M11 0H1L7 10L1 20H11',
  Ε: 'M11 0H1V20H11M1 10H8', Α: 'M0 20L6 0L12 20M2.5 13H9.5', Υ: 'M0 0L6 9L12 0M6 9V20',
  Τ: 'M0 0H12M6 0V20', Ο: 'M6 0C-2 0 -2 20 6 20C14 20 14 0 6 0Z',
}
const palabra = (texto, cx, y, e = 1) => {
  const ancho = (texto.length * 16 - 4) * e
  return [...texto].map((l, i) => `<path d="${LETRAS[l]}" transform="translate(${r1(cx - ancho / 2 + i * 16 * e)} ${y}) scale(${e})"/>`).join('')
}

// El pelo: una línea de puntos alrededor del cráneo, de la frente a la nuca, y entre cada
// dos puntos un bucle redondo hacia fuera, como los rizos de los mármoles.
const PELO = [[-4, -104], [-7, -117], [-2, -130], [9, -142], [24, -151], [42, -156], [61, -156], [79, -150], [95, -139], [106, -123], [111, -106],
  [119, -98], [126, -86], [126, -72], [119, -62], [106, -57], [96, -48], [89, -36]]
const rizos = () => PELO.slice(1).map((p, i) => {
  const q = PELO[i], c = Math.hypot(p[0] - q[0], p[1] - q[1])
  return `A${r1(c * 0.62)} ${r1(c * 0.62)} 0 0 1 ${pt(p)}`
}).join('')
// La cabeza en coordenadas propias, de perfil, mirando a la izquierda: la barbilla en
// (0, 0) y la coronilla arriba, a unas 158 unidades. El perfil griego: la frente y la nariz
// en una sola línea recta. El pelo, rizado, va recogido en un moño en la nuca.
const CABEZA = 'M14 52C12 30 10 12 6 4C2 1 -6 0 -10 -4C-14 -8 -15 -15 -13 -19C-11 -22 -12 -23 -14 -25C-16 -27 -15 -29 -12 -29.5' +
  'C-15 -30 -17 -32 -16 -34.5C-15 -37 -13 -39 -14 -41C-17 -42 -24 -43 -26 -46C-24 -56 -14 -72 -10 -82C-7 -90 -6 -98 -4 -104' +
  rizos() + 'C86 -20 84 0 84 20C84 30 82 40 80 46Z'
// El borde de atrás de la cabeza y del cuello, para el filo de luz fría.
const NUCA_FILO = `M${pt(PELO[7])}` + PELO.slice(8).map((p, i) => {
  const q = PELO[i + 7], c = Math.hypot(p[0] - q[0], p[1] - q[1])
  return `A${r1(c * 0.62)} ${r1(c * 0.62)} 0 0 1 ${pt(p)}`
}).join('') + 'C86 -20 84 0 84 20C84 30 82 40 80 46'
// Los rasgos: la ceja, el párpado, la boca, la aleta de la nariz, la mandíbula y la oreja.
const RASGOS = 'M-9 -81C-2 -85 6 -85 12 -81M-9 -69.5C-4 -75 1 -75 6 -72M-12 -29.5C-9 -29.6 -7 -29.4 -5 -30' +
  'M-19 -43.5C-17 -46 -14 -46.5 -12 -45M-2 -2C14 -8 34 -14 48 -24M52 -42C48 -48 48 -64 54 -70C62 -74 68 -66 66 -56C64 -48 60 -44 56 -42M57 -52C55 -58 57 -63 61 -63'
// Los rizos de dentro del pelo: espirales pequeñas, y las ondas que van de la frente atrás.
function bucles() {
  let d = ''
  for (const [cx, cy, r, s] of [[8, -120, 7, 1], [26, -136, 8, 1], [48, -142, 8, -1], [70, -138, 8, 1], [90, -126, 8, -1], [100, -108, 7, 1], [112, -84, 8, -1], [104, -68, 6, 1], [20, -114, 6, -1]]) {
    const p = []
    for (let i = 0; i <= 18; i++) {
      const t = i / 18, a = s * t * 2.4 * Math.PI, rr = r * (0.15 + 0.85 * t)
      p.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
    }
    d += curva(p)
  }
  return d + 'M-1 -106C10 -112 22 -110 34 -116M4 -96C18 -102 32 -100 44 -108M60 -96C68 -102 76 -102 86 -98'
}
// La corona de laurel: hojas por pares a lo largo de una línea que rodea la cabeza, de
// la nuca a la frente, con las puntas hacia delante.
const NUDO = [108, -100]
function laurel() {
  const linea = [[108, -100], [90, -122], [64, -136], [36, -136], [12, -126], [-6, -114]]
  const p = []
  for (let i = 0; i < linea.length - 1; i++) for (let k = 0; k < 3; k++) {
    const t = k / 3, [ax, ay] = linea[i], [bx, by] = linea[i + 1]
    p.push([ax + (bx - ax) * t, ay + (by - ay) * t, Math.atan2(by - ay, bx - ax)])
  }
  let hojas = ''
  p.forEach(([x, y, a], i) => {
    for (const lado of [-1, 1]) {
      const g = a + lado * 0.42, l = 17 - i * 0.3, w = 4.6
      const punta = [x + l * Math.cos(g), y + l * Math.sin(g)]
      const n = [-Math.sin(g) * w, Math.cos(g) * w]
      const m = [x + (l / 2) * Math.cos(g), y + (l / 2) * Math.sin(g)]
      hojas += `M${r1(x)} ${r1(y)}Q${r1(m[0] + n[0])} ${r1(m[1] + n[1])} ${pt(punta)}Q${r1(m[0] - n[0])} ${r1(m[1] - n[1])} ${r1(x)} ${r1(y)}Z`
    }
  })
  return { hojas, rama: curva(linea) }
}

// Una voluta de humo: sube haciendo eses desde el fuego y acaba enroscada. `s` la tuerce
// a un lado o al otro.
function vaho(alto, s) {
  const p = [[0, 0], [s * -9, -alto * 0.22], [s * 10, -alto * 0.46], [s * -6, -alto * 0.7], [s * 4, -alto * 0.86]]
  const [cx, cy] = [s * 16, -alto * 0.9], r = 14
  const espiral = []
  for (let i = 0; i <= 20; i++) {
    const t = i / 20, a = Math.PI + s * t * 1.9 * Math.PI, rr = r * (1 - 0.75 * t)
    espiral.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)])
  }
  return curva([...p, ...espiral])
}

function oraculo() {
  const bustoO = [1330, 640], cabezaO = [-54, -224], ESC = 1.15
  const fuego = [1110, 588]
  // El pecho del busto, de frente, con la cabeza girada de perfil, como en muchos bustos
  // clásicos: los hombros redondos y el corte en curva hasta la peana torneada.
  const pecho = 'M-30 -182C-48 -176 -72 -166 -96 -156C-118 -146 -132 -128 -128 -108C-124 -90 -108 -80 -84 -76Q-46 -70 -32 -66H32Q46 -70 84 -76C108 -80 124 -90 128 -108C132 -128 118 -146 96 -156C72 -166 48 -176 30 -182Z'
  const peana = 'M-32 -66H32L30 -60Q22 -58 20 -52V-30Q34 -26 40 -16L46 -8V0H-46V-8L-40 -16Q-34 -26 -20 -30V-52Q-22 -58 -30 -60Z'
  // El manto, prendido en el hombro con una fíbula de oro, cae en pliegues por el pecho.
  const pliegues = 'M86 -158C58 -140 20 -126 -40 -122M100 -140C70 -118 30 -104 -60 -100M112 -118C82 -98 40 -86 -50 -80M118 -100C96 -88 70 -80 30 -74M-104 -150C-96 -136 -90 -124 -76 -110'
  const pechoFilo = 'M30 -182C48 -176 72 -166 96 -156C118 -146 132 -128 128 -108C124 -90 108 -80 84 -76'
  const claviculas = 'M-22 -170C-44 -166 -66 -164 -86 -158M22 -170C44 -166 66 -164 86 -158'
  // El trípode: el caldero con sus asas de anilla, tres patas con garras y el fuego.
  const caldero = 'M1046 590H1174C1172 614 1156 634 1110 638C1064 634 1048 614 1046 590Z'
  const patas = 'M1068 630L1040 846L1028 858H1052L1050 848L1080 634ZM1152 630L1180 846L1192 858H1168L1170 848L1140 634Z'
  const lenguas = [
    { d: 'M1110 594C1088 584 1092 556 1102 540C1104 556 1112 560 1114 548C1120 532 1116 516 1108 500C1130 512 1140 542 1134 566C1132 580 1124 590 1110 594Z', clase: 'l1', o: 1 },
    { d: 'M1086 594C1074 586 1076 568 1084 558C1086 570 1094 572 1094 564C1098 574 1098 588 1086 594Z', clase: 'l2', o: 0.9 },
    { d: 'M1136 594C1150 588 1150 572 1144 562C1140 572 1134 572 1134 566C1128 576 1128 590 1136 594Z', clase: 'l3', o: 0.9 },
  ]
  // El humo: volutas que suben del fuego, se abren y se desvanecen. Cada una empieza a su
  // altura, para que el cuadro quieto también tenga su columna de humo.
  let humo = ''
  for (let i = 0; i < 4; i++) {
    const y = 516 - i * 62, x = fuego[0] + (i % 2 ? 12 : -8), s = i % 2 ? -1 : 1, d = vaho(120 + i * 16, s)
    humo += `<g transform="translate(${x} ${y})"><g class="humo" style="animation-delay:-${r1(i * 2)}s" opacity="${r2(0.7 - i * 0.12)}"><path d="${d}" stroke-width="22" opacity=".06"/><path d="${d}" stroke-width="2.4" opacity=".75"/></g></g>`
  }
  // Motas de luz que suben del fuego.
  const rm = azar(67)
  let motas = ''
  for (let i = 0; i < 14; i++) {
    const x = fuego[0] + (rm() - 0.5) * 140, y = fuego[1] - 10 + (rm() - 0.5) * 20, d = r1(6 + rm() * 6), dx = r1((rm() - 0.5) * 160)
    motas += `<circle class="mota" style="animation-duration:${d}s;animation-delay:-${r1(rm() * d)}s;--dx:${dx}px" cx="${r1(x)}" cy="${r1(y)}" r="${r1(1.3 + rm() * 1.5)}" opacity="0"/>`
  }
  // La columna jónica de la derecha, con sus dos volutas, y el arquitrabe roto que
  // sostiene, con la greca de oro.
  const cx = 1530
  let estrias = ''
  for (let k = -3; k <= 3; k++) estrias += `M${cx + k * 11} 262V826`
  const volutaJ = (x, s) => `M${x} 232C${x + s * 4} 224 ${x + s * 18} 224 ${x + s * 18} 240C${x + s * 18} 254 ${x + s * 2} 254 ${x + s * 2} 242C${x + s * 2} 234 ${x + s * 12} 234 ${x + s * 12} 241`
  let greca = ''
  for (let x = 1232; x < 1600; x += 28) greca += `M${x} 158V138H${x + 20}V152H${x + 8}V144H${x + 14}`
  const { hojas, rama } = laurel()
  const marmol = (id, dx, dy, e) => `<linearGradient id="${id}" x1="${r1((-90 - dx) / e)}" y1="${r1((-150 - dy) / e)}" x2="${r1((90 - dx) / e)}" y2="${r1((-170 - dy) / e)}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fdebc8"/><stop offset=".32" stop-color="#f0d9ae"/><stop offset=".52" stop-color="#b9a689"/><stop offset=".7" stop-color="#56647e"/><stop offset="1" stop-color="#27354f"/></linearGradient>`
  const defs = `<defs>
${vertical('cielo', 0, 860, [[0, '#0a1324'], [0.55, '#13223c'], [1, '#1f3456']])}
${radial('luzFuego', fuego[0], fuego[1], 520, [[0, '#ffd690', 0.42], [0.25, '#e8b066', 0.18], [0.6, ORO, 0.05], [1, ORO, 0]])}
${radial('suelo', fuego[0], 870, 360, [[0, '#f0c47a', 0.4], [1, '#f0c47a', 0]])}
${vertical('pisoG', 856, H, [[0, '#1e2c45'], [1, '#0b1424']])}
${vertical('lejos', 400, 860, [[0, '#1a2d4b'], [1, '#14233d']])}
${marmol('marmol', 0, 0, 1)}${marmol('marmolC', cabezaO[0], cabezaO[1], ESC)}
${horizontal('pedestal', 1236, 1424, [[0, '#c9b38d'], [0.4, '#7f7a74'], [1, '#26334d']])}
${horizontal('fusteJ', 1480, 1590, [[0, '#b3a284'], [0.3, '#706e72'], [1, '#1b283f']])}
${vertical('arquitrabe', 128, 206, [[0, '#26364f'], [1, '#3a4a66']])}
${horizontal('bronce', 1046, 1174, [[0, '#f3cf86'], [0.45, '#b58a48'], [1, '#5a4430']])}
${vertical('llamaG', 500, 596, [[0, '#ffe9b0', 0.2], [0.35, '#ffd27a'], [1, '#e48f3a']])}
${horizontal('oroLaurel', -10, 120, [[0, '#f8dfa0'], [0.5, '#d8b56e'], [1, '#8f6f3e']])}
</defs>`
  const pivote = (x, y, t) => `translate(${x}px,${y}px) ${t} translate(${-x}px,${-y}px)`
  const estilo = CSS_ESTRELLAS +
    '.llama{animation:llama 2.6s ease-in-out infinite}@keyframes llama{0%,100%{opacity:1}18%{opacity:.82}34%{opacity:.95}52%{opacity:.78}70%{opacity:.97}86%{opacity:.86}}' +
    `.l1{animation:l1 1.3s ease-in-out infinite alternate}@keyframes l1{from{transform:${pivote(1110, 594, 'scale(1,1)')}}to{transform:${pivote(1110, 594, 'scale(.92,1.12) skewX(-6deg)')}}}` +
    `.l2{animation:l2 .9s ease-in-out infinite alternate}@keyframes l2{from{transform:${pivote(1086, 594, 'scale(1,1)')}}to{transform:${pivote(1086, 594, 'scale(1.06,.82) skewX(8deg)')}}}` +
    `.l3{animation:l3 1.1s ease-in-out -.4s infinite alternate}@keyframes l3{from{transform:${pivote(1136, 594, 'scale(1,1)')}}to{transform:${pivote(1136, 594, 'scale(.94,1.18) skewX(-7deg)')}}}` +
    '.humo{animation:humo 8s linear infinite}@keyframes humo{0%{transform:translate(0px,60px) scale(.8);opacity:0}18%{opacity:1}100%{transform:translate(-24px,-110px) scale(1.25);opacity:0}}' +
    '.mota{animation-name:mota;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes mota{0%{transform:translate(0px,0px);opacity:0}15%{opacity:.9}100%{transform:translate(var(--dx),-380px);opacity:0}}' +
    `.cinta{animation:cinta 5.5s ease-in-out infinite alternate}@keyframes cinta{from{transform:${giro(NUDO, -6)}}to{transform:${giro(NUDO, 8)}}}`
  // Las rocas de las Fedríades, que bajan hasta el horizonte por la derecha.
  const rocas = quiebra(azar(71), [[-20, 560], [120, 470], [260, 500], [420, 430], [560, 520], [700, 480], [860, 560], [1000, 610], [1200, 690], [1420, 730], [1620, 760]], 4, 0.18)
  return abrir(FONDO, estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#cielo)"/>` + estrellas(89, 170, 0, 520) +
    `<path d="${poli([...rocas, [1620, 860], [-20, 860]])}" fill="url(#lejos)"/><path d="M${rocas.slice(0, 40).map(pt).join('L')}" stroke="#2c4266" stroke-width="1.6" fill="none" opacity=".7"/>` +
    // El tolo: tres columnas dóricas sobre su grada redonda, con un trozo de cornisa curva.
    `<g fill="#0e1a2e"><path d="M168 768Q270 756 372 768V784Q270 772 168 784Z"/><path d="M178 756Q270 744 362 756V770Q270 758 178 770Z"/>` +
    [206, 270, 334].map(x => `<path d="M${x - 11} 752L${x - 9} 540H${x + 9}L${x + 11} 752Z"/><rect x="${x - 14}" y="530" width="28" height="10"/>`).join('') +
    `<path d="M184 530Q270 516 356 530V510Q270 496 184 510Z"/></g>` +
    `<path d="M184 510Q270 496 356 510M197 752L199 540M261 752L263 540M325 752L327 540" stroke="#3d557c" stroke-width="1.6" fill="none" opacity=".6"/>` +
    // El suelo del santuario, con la luz del fuego.
    `<rect y="856" width="${W}" height="${H - 856}" fill="url(#pisoG)"/><path d="M0 856H${W}" stroke="#3a4a66" stroke-width="2"/>` +
    `<g class="llama"><circle cx="${fuego[0]}" cy="${fuego[1]}" r="520" fill="url(#luzFuego)"/><ellipse cx="${fuego[0]}" cy="880" rx="360" ry="60" fill="url(#suelo)"/></g>` +
    // La columna y el arquitrabe.
    `<path d="M1232 128H1600V206H1232L1244 192L1228 180L1240 166L1226 150Z" fill="url(#arquitrabe)"/><path d="M1240 180H1600M1244 194H1600" stroke="#4d5d7a" stroke-width="1.6" fill="none"/>` +
    `<path d="${greca}" stroke="${ORO}" stroke-width="2.6" fill="none" opacity=".85"/>` +
    `<rect x="${cx - 62}" y="206" width="124" height="10" fill="#2f3f5c"/><path d="M${cx - 56} 216H${cx + 56}V250Q${cx} 258 ${cx - 56} 250Z" fill="url(#fusteJ)"/>` +
    `<path d="${volutaJ(cx - 56, -1)}${volutaJ(cx + 56, 1)}" stroke="#b3a284" stroke-width="3" fill="none" opacity=".75"/>` +
    `<path d="M${cx - 42} 254H${cx + 42}L${cx + 44} 828H${cx - 44}Z" fill="url(#fusteJ)"/><path d="${estrias}" stroke="#18243a" stroke-width="1.4" opacity=".5"/>` +
    `<path d="M${cx - 52} 828H${cx + 52}V842H${cx - 52}ZM${cx - 58} 842H${cx + 58}V856H${cx - 58}Z" fill="url(#fusteJ)"/>` +
    // El humo, detrás del busto.
    `<g stroke="#d3dce7" stroke-linecap="round" fill="none">${humo}</g>` +
    // El pedestal con la inscripción grabada, con su oro.
    `<path d="M1238 640H1422V652H1414V662H1408V824H1416V840H1424V856H1236V840H1244V824H1252V662H1246V652H1238Z" fill="url(#pedestal)"/>` +
    `<path d="M1238 640H1422M1246 652H1414M1252 662H1408M1252 824H1408M1244 840H1416" stroke="#fff1d6" stroke-width="1.2" opacity=".3"/>` +
    `<g stroke="#1b2133" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".55" transform="translate(.8 1)">${palabra('ΓΝΩΘΙ', 1330, 716)}${palabra('ΣΕΑΥΤΟΝ', 1330, 752)}</g>` +
    `<g class="llama" stroke="#e9c57f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">${palabra('ΓΝΩΘΙ', 1330, 716)}${palabra('ΣΕΑΥΤΟΝ', 1330, 752)}</g>` +
    // El busto: la cinta de la corona detrás, luego la peana, el pecho y la cabeza, todo
    // con el degradado del mármol a medio iluminar.
    `<g transform="translate(${bustoO[0]} ${bustoO[1]}) scale(.9)">` +
    `<g transform="translate(${cabezaO[0]} ${cabezaO[1]}) scale(${ESC})"><g class="cinta" fill="url(#oroLaurel)"><path d="${banda([[108, -100], [120, -70], [116, -40], [124, -8]], t => 7 - 2 * t)}"/><path d="${banda([[110, -98], [130, -72], [132, -44], [144, -14]], t => 6.5 - 2 * t)}"/></g></g>` +
    `<path d="${peana}" fill="url(#marmol)"/>` +
    `<path d="${pecho}" fill="url(#marmol)"/><path d="${pliegues}" stroke="#4a5672" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".4"/>` +
    `<path d="${claviculas}" stroke="#6a6f7e" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".35"/><circle cx="92" cy="-156" r="7.5" fill="${ORO}"/><circle cx="92" cy="-156" r="3.8" fill="none" stroke="#fff0c8" stroke-width="1.2"/>` +
    `<g transform="translate(${cabezaO[0]} ${cabezaO[1]}) scale(${ESC})">` +
    `<path d="${CABEZA}" fill="url(#marmolC)"/>` +
    `<path d="${bucles()}" stroke="#4e5a74" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".5"/>` +
    `<path d="M-9 -69.5C-4 -75 1 -75 6 -72C2 -68 -3 -67 -9 -69.5Z" fill="#4a5168" opacity=".3"/><path d="M-8 -68.6C-4 -67 0 -67 4 -68.6" stroke="#5a5f70" stroke-width="1.1" stroke-linecap="round" fill="none" opacity=".55"/>` +
    `<path d="${RASGOS}" stroke="#5a5f70" stroke-width="1.6" stroke-linecap="round" fill="none" opacity=".6"/>` +
    `<path d="${rama}" stroke="#8f6f3e" stroke-width="1.6" fill="none"/><path d="${hojas}" fill="url(#oroLaurel)"/>` +
    `<path d="${NUCA_FILO}" stroke="#9fbde3" stroke-width="2" stroke-linecap="round" fill="none" opacity=".55"/>` +
    `</g>` +
    `<path d="${pechoFilo}" stroke="#9fbde3" stroke-width="2.2" stroke-linecap="round" fill="none" opacity=".5"/>` +
    `</g>` +
    // El trípode y el fuego, delante.
    `<path d="M1110 640L1110 850" stroke="#3a3026" stroke-width="7"/><path d="${patas}" fill="#6e5538"/><path d="M1068 630L1040 846M1152 630L1180 846" stroke="#f0c47a" stroke-width="1.4" opacity=".5"/>` +
    `<circle cx="1076" cy="576" r="13" fill="none" stroke="#b58a48" stroke-width="4"/><circle cx="1144" cy="576" r="13" fill="none" stroke="#7a5c3a" stroke-width="4"/>` +
    `<g class="llama">${lenguas.map(({ d, clase, o }) => `<path class="${clase}" d="${d}" fill="url(#llamaG)" opacity="${o}"/>`).join('')}</g>` +
    `<path d="${caldero}" fill="url(#bronce)"/><path d="M1046 590H1174" stroke="#ffe2a6" stroke-width="2.4"/><path d="M1052 606C1080 614 1140 614 1168 606" stroke="#3a2c1e" stroke-width="2" fill="none" opacity=".5"/>` +
    `<g fill="#ffd98f">${motas}</g>` +
    `</svg>`
}

escribir('genera_olimpo.mjs', 'las escenas de la sala Olimpo, solo de noche.', { santuario, zeus, oraculo }, process.argv[2], process.argv[3])
