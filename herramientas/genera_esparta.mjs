// Generador de las escenas de la sala Esparta de museo-clawd: Hoplita, Falange y
// Termópilas. Dibujos propios, inspirados en los hoplitas de la Grecia clásica y en el
// ejército espartano: disciplina, fuerza y austeridad, sin fantasía. Cascos corintios de
// bronce, grandes escudos redondos, lanzas y capas rojas, con formas robustas y angulosas
// y el contraste entre el bronce iluminado y las siluetas oscuras. Solo modo oscuro, con
// la paleta de la sala: negro carbón, rojo espartano, bronce antiguo, gris piedra y marfil.
//
// El movimiento va en animaciones CSS dentro del <style> de cada escena. Cada elemento
// animado tiene en sus atributos una posición quieta buena, la que se ve con «reducir
// movimiento». Lo que se mueve es pequeño y tiene bordes o brillo; lo grande se queda
// quieto y sin desenfoque, para que la aplicación llegue a pintar a tiempo también en
// pantalla completa.
import { H, W, abrir, azar, banda, curva, escribir, giro, horizontal, mas, poli, pt, quiebra, r1, r2, radial, vertical } from './comun.mjs'

const CARBON = '#151519'
const ROJO = '#8e2e31'
const BRONCE = '#b68a4b'
const PIEDRA = '#665e57'
const MARFIL = '#ddd0b8'
// El negro de las siluetas, más oscuro que el carbón del fondo, para que se recorten.
const NEGRO = '#0b0a0d'

// Un contorno hecho de tramos suaves que se juntan en esquinas: cada tramo es una lista
// de puntos, y empieza donde acaba el anterior.
function contorno(tramos) {
  let d = `M${pt(tramos[0][0])}`
  for (const t of tramos) d += t.length > 2 ? curva(t).replace(/^M[^C]*/, '') : `L${pt(t[1])}`
  return d + 'Z'
}

// Reparte n puntos a lo largo de una línea quebrada, a distancias iguales.
function reparte(p, n) {
  const largos = [0]
  for (let i = 1; i < p.length; i++) largos.push(largos[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]))
  const total = largos[largos.length - 1], q = []
  for (let k = 0; k < n; k++) {
    const s = (total * k) / (n - 1)
    let i = 1
    while (i < p.length - 1 && largos[i] < s) i++
    const f = (s - largos[i - 1]) / (largos[i] - largos[i - 1] || 1)
    q.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f])
  }
  return q
}

// Chispas que suben de abajo y se apagan, cada una a su ritmo, entre x0 y x1.
function chispas(semilla, n, x0, x1, y, sube) {
  const r = azar(semilla)
  let s = ''
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), d = r1(7 + r() * 8), dx = r1((r() - 0.3) * 220)
    s += `<circle class="chispa" style="animation-duration:${d}s;animation-delay:-${r1(r() * d)}s;--dx:${dx}px;--sube:${-sube}px" cx="${r1(x)}" cy="${r1(y + r() * 60)}" r="${r1(1.2 + r() * 1.8)}" opacity="0"/>`
  }
  return s
}
const CSS_CHISPAS = '.chispa{animation-name:chispa;animation-timing-function:linear;animation-iteration-count:infinite}' +
  '@keyframes chispa{0%{transform:translate(0px,0px);opacity:0}12%{opacity:1}70%{opacity:.8}100%{transform:translate(var(--dx),var(--sube));opacity:0}}'

// --- Hoplita ----------------------------------------------------------------------
// Un casco corintio monumental de perfil, mirando a la izquierda, sobre el negro: bronce
// con reflejos de oro, la nasal, los ojos rasgados, las carrilleras que acaban en punta,
// el guardanuca abierto y las cejas en relieve. Encima, la cresta de crin roja, una sola,
// que cae por detrás. Sin cuernos: así no se confunde con el casco del Jarl de Valhalla.

// El casco en coordenadas propias: el centro en (0, 0), unas 420 unidades de alto.
const CASCO = contorno([
  // La nasal, la frente, la cúpula y la espalda, hasta la punta del guardanuca.
  [[-150, 18], [-158, -30], [-157, -80], [-140, -140], [-95, -188], [-20, -207], [60, -198], [125, -160], [160, -95], [168, -20], [162, 50], [166, 102], [182, 148], [202, 172]],
  // El borde de abajo del guardanuca y la escotadura de la oreja, en ángulo.
  [[202, 172], [160, 163], [118, 151], [88, 147]],
  [[88, 147], [66, 104]],
  [[66, 104], [44, 138]],
  // La carrillera, que acaba en punta delante, bajo la barbilla.
  [[44, 138], [0, 160], [-50, 188], [-100, 211], [-126, 219]],
  [[-126, 219], [-134, 180], [-130, 120], [-122, 70], [-118, 34]],
  [[-118, 34], [-150, 18]],
])
// El ojo rasgado y, debajo, la rendija de la cara entre la nasal y la carrillera.
const OJO = 'M-142 -66C-120 -76 -96 -71 -74 -54C-92 -46 -110 -42 -124 -38C-121 -10 -119 14 -118 34L-138 26C-141 4 -142 -20 -142 -42Z'
// Las cejas en relieve, la arista que separa la cúpula de las carrilleras y la banda del
// borde, con sus remaches.
const CEJA = curva([[-152, -86], [-120, -96], [-82, -90], [-52, -74], [-30, -50]])
const ARISTA = curva([[-30, -50], [40, -34], [100, -26], [160, -16]])
const BORDE = curva([[-116, 44], [-118, 120], [-118, 176], [-104, 196], [-52, 176], [0, 150], [36, 128], [54, 98], [68, 88], [84, 128], [120, 138], [168, 150]]) +
  curva([[168, 150], [154, 100], [152, 40], [156, -20]]).replace(/^M[^C]*/, '')
const REMACHES = [[-117, 70], [-117, 120], [-112, 168], [-70, 186], [-24, 164], [20, 140], [104, 134], [142, 142], [156, 70], [154, 10]]
// La cresta de crin: el soporte encima de la cúpula y el abanico de crin, que sube, se
// arquea y cae por detrás del guardanuca.
const SOPORTE = banda([[-66, -200], [-10, -214], [50, -206], [110, -180]], () => 14)
const CRESTA_FUERA = [[-70, -208], [-88, -252], [-82, -302], [-52, -346], [2, -374], [70, -380], [140, -358], [196, -312], [232, -250], [250, -172], [254, -92], [246, -10], [232, 52]]
const CRESTA_DENTRO = [[232, 52], [222, -10], [214, -86], [196, -150], [166, -186], [110, -184]]
const CRESTA = `M${pt(CRESTA_FUERA[0])}${curva(CRESTA_FUERA).replace(/^M[^C]*/, '')}L${pt(CRESTA_DENTRO[0])}${curva(CRESTA_DENTRO).replace(/^M[^C]*/, '')}Z`
const NUCA_CRESTA = [20, -205]

function hoplita() {
  const centro = [1280, 530], e = 0.95
  // Las crines: capas que van de delante atrás entre el soporte y el borde de la cresta,
  // como la crin peinada que sube, se arquea y cae por la nuca. Unas son oscuras, otras
  // claras, y por las de fuera corre de vez en cuando una luz, como el viento en la crin.
  const dentro = reparte([[-70, -208], [-10, -216], [50, -208], [110, -184], [166, -186], [196, -150], [214, -86], [222, -10], [232, 52]], 34)
  const fuera = reparte(CRESTA_FUERA, 34)
  const r = azar(101)
  let oscuras = '', claras = '', vivas = ''
  for (let k = 1; k <= 14; k++) {
    const f = k / 15
    const p = dentro.map((q, i) => [q[0] + (fuera[i][0] - q[0]) * f + (r() - 0.5) * 3, q[1] + (fuera[i][1] - q[1]) * f + (r() - 0.5) * 3])
    const d = curva(p)
    if (k % 2) oscuras += d
    else claras += d
    if (f > 0.35) {
      const t = r1(2.4 + r() * 1.8)
      vivas += `<path class="crin" style="animation-duration:${t}s;animation-delay:-${r1(r() * t)}s" d="${d}"/>`
    }
  }
  const remaches = REMACHES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join('')
  const defs = `<defs>
${radial('fondoH', centro[0], centro[1] + 60, 760, [[0, '#3a1a17', 0.9], [0.45, '#22161a', 0.6], [1, CARBON, 0]])}
${radial('brasas', centro[0], 1000, 560, [[0, '#c4532c', 0.38], [0.5, '#8e2e31', 0.12], [1, ROJO, 0]])}
<linearGradient id="bronceH" x1="-160" y1="-210" x2="190" y2="210" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffe5a8"/><stop offset=".12" stop-color="#e2ae62"/><stop offset=".3" stop-color="#a87337"/><stop offset=".48" stop-color="#6e4520"/><stop offset=".68" stop-color="#3e2512"/><stop offset="1" stop-color="#160d06"/></linearGradient>
<linearGradient id="crinG" x1="-90" y1="-380" x2="250" y2="50" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#c94a40"/><stop offset=".45" stop-color="${ROJO}"/><stop offset="1" stop-color="#4a1517"/></linearGradient>
<linearGradient id="barrido" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff1c9" stop-opacity="0"/><stop offset=".5" stop-color="#fff1c9" stop-opacity=".6"/><stop offset="1" stop-color="#fff1c9" stop-opacity="0"/></linearGradient>
<linearGradient id="franja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1108" stop-opacity="0"/><stop offset=".5" stop-color="#1c1108"/><stop offset="1" stop-color="#1c1108" stop-opacity="0"/></linearGradient>
<linearGradient id="calor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2783c" stop-opacity="0"/><stop offset=".6" stop-color="#e2783c"/><stop offset="1" stop-color="#e2783c" stop-opacity=".4"/></linearGradient>
<clipPath id="cascoC"><path d="${CASCO}"/></clipPath>
</defs>`
  const estilo = CSS_CHISPAS +
    '.crin{animation-name:crin;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes crin{from{stroke-dashoffset:420}to{stroke-dashoffset:0}}' +
    `.cresta{animation:cresta 5s ease-in-out infinite alternate}@keyframes cresta{from{transform:${giro(NUCA_CRESTA, -1.2)}}to{transform:${giro(NUCA_CRESTA, 1.8)}}}` +
    '.barre{animation:barre 6.5s ease-in-out infinite}@keyframes barre{0%{transform:translateX(-420px)}22%{transform:translateX(420px)}100%{transform:translateX(420px)}}'
  return abrir(CARBON, estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#fondoH)"/><rect y="440" width="${W}" height="${H - 440}" fill="url(#brasas)"/>` +
    `<g transform="translate(${centro[0]} ${centro[1]}) scale(${e})">` +
    // La cresta, detrás del casco: la crin con sus capas, que se mece y por la que corre el viento.
    `<g class="cresta"><path d="${CRESTA}" fill="url(#crinG)"/>` +
    `<g fill="none" stroke-linecap="round"><path d="${oscuras}" stroke="#3a0f11" stroke-width="2.2" opacity=".6"/><path d="${claras}" stroke="#d65a4c" stroke-width="1.6" opacity=".45"/>` +
    `<g stroke="#ffb08a" stroke-width="2" stroke-dasharray="70 350" stroke-dashoffset="420" opacity=".8">${vivas}</g></g>` +
    `<path d="${curva(CRESTA_FUERA)}" stroke="#ef8a6c" stroke-width="2.2" fill="none" opacity=".5"/></g>` +
    `<path d="${SOPORTE}" fill="#5a3a1c"/><path d="${curva([[-66, -207], [-10, -221], [50, -213], [110, -187]])}" stroke="#f0c98a" stroke-width="2" fill="none" opacity=".6"/>` +
    // El casco: el bronce con su degradado y, recortados al casco, los reflejos: la franja
    // oscura del suelo a media altura y el calor del fuego abajo.
    `<path d="${CASCO}" fill="url(#bronceH)"/>` +
    `<g clip-path="url(#cascoC)"><path d="${banda([[-170, -36], [-80, -66], [20, -76], [120, -64], [200, -30]], () => 34)}" fill="url(#franja)" opacity=".5"/>` +
    `<path d="${banda([[-170, 150], [-60, 130], [60, 128], [210, 160]], () => 70)}" fill="url(#calor)" opacity=".35"/></g>` +
    `<path d="${OJO}" fill="${NEGRO}"/>` +
    `<g fill="none" stroke-linecap="round"><path d="${CEJA}" stroke="#2a1a0d" stroke-width="5" opacity=".6"/><path d="${CEJA}" stroke="#ffe0a3" stroke-width="2" opacity=".75" transform="translate(0 -4)"/>` +
    `<path d="${ARISTA}" stroke="#2a1a0d" stroke-width="3.4" opacity=".5"/><path d="${ARISTA}" stroke="#e9c27f" stroke-width="1.6" opacity=".45" transform="translate(0 -3)"/>` +
    `<path d="${BORDE}" stroke="#2a1a0d" stroke-width="3.4" opacity=".55"/><path d="${BORDE}" stroke="#e0b46c" stroke-width="1.4" opacity=".45" transform="translate(-2 -2)"/>` +
    `<path d="M-142 -42C-142 -20 -141 4 -138 26" stroke="#ffe0a3" stroke-width="1.6" opacity=".6"/></g>` +
    `<g fill="#2a1a0d" opacity=".7">${remaches}</g><g fill="#f6d9a0" opacity=".55" transform="translate(-1 -1)">${REMACHES.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.3"/>`).join('')}</g>` +
    // Los brillos de oro: el arco de la cúpula, la carrillera y dos destellos pequeños.
    `<path d="${banda([[-150, -104], [-130, -152], [-88, -188], [-26, -203], [30, -199]], t => 11 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05)))}" fill="#fff0c4" opacity=".85"/>` +
    `<path d="${banda([[-108, 58], [-106, 120], [-100, 186]], t => 8 * Math.sin(Math.PI * t))}" fill="#f8d895" opacity=".6"/>` +
    `<path d="M-120 -168L-117 -160L-109 -157L-117 -154L-120 -146L-123 -154L-131 -157L-123 -160Z" fill="#fffbe8"/>` +
    `<path d="${curva([[-100, 211], [-50, 188], [0, 160], [44, 138]])}" stroke="#e27a45" stroke-width="2.6" fill="none" opacity=".5"/>` +
    `<path d="${curva([[166, 102], [182, 148], [202, 172]])}" stroke="#e27a45" stroke-width="2.6" fill="none" opacity=".55"/>` +
    // El reflejo que barre el bronce de vez en cuando, recortado al casco.
    `<g clip-path="url(#cascoC)"><g transform="rotate(24)"><rect class="barre" x="-55" y="-420" width="110" height="840" fill="url(#barrido)" transform="translate(-420 0)"/></g></g>` +
    `</g>` +
    `<g fill="#f0a15a">${chispas(103, 40, 0, 1600, 940, 700)}</g>` +
    `</svg>`
}

// --- Falange ----------------------------------------------------------------------
// Una falange de hoplitas en formación cerrada, de frente y en perspectiva: diez filas que
// se pierden hacia el horizonte, a la derecha, con los escudos redondos de bronce, cada
// uno con la lambda roja de Lacedemonia, los cascos con su cresta y las lanzas en alto,
// que forman un bosque de líneas verticales contra el cielo rojo del alba. La repetición
// es el dibujo: cada hoplita es igual a los demás.

// La cámara: el horizonte, el punto de fuga, la distancia focal y la altura de los ojos,
// en metros. Un punto a h metros del suelo, a Z metros de la cámara y X metros a un lado
// se ve en (FUGA + X·f/Z, HORIZONTE + (OJOS − h)·f/Z). La formación está en una ladera
// que sube hacia el fondo, CUESTA metros por fila, así que cada fila asoma por encima de
// la de delante y las lanzas siguen recortadas contra el cielo.
const HORIZONTE = 520, FUGA = 1300, FOCAL = 1050, OJOS = 2.2, CUESTA = 0.3
const FILAS = 12, HILERAS = 9

function falange() {
  const r = azar(131)
  let tropa = '', destellos = '', crestas = ''
  // De la fila de atrás a la de delante, para que cada una tape a la de detrás.
  for (let j = FILAS - 1; j >= 0; j--) {
    const Z = 7 + j * 1.05, s = FOCAL / Z, sube = j * CUESTA
    let lanzas = '', puntas = '', cuerpos = '', cascos = '', crines = '', escudos = '', lambdas = '', aros = '', piernas = '', grebas = '', tunicas = ''
    for (let i = 0; i < HILERAS; i++) {
      const X = -2.4 + i * 0.6 + (r() - 0.5) * 0.04
      const x = FUGA + X * s
      const y = h => HORIZONTE + (OJOS - h - sube) * s
      // La lanza, a la derecha del escudo, de la mano a la punta, y su punta de hoja.
      const xl = x + 0.36 * s, alta = 3.5 + (r() - 0.5) * 0.12
      lanzas += `M${r1(xl)} ${r1(y(0.9))}V${r1(y(alta))}`
      const p = y(alta), l = 0.32 * s, a = 0.045 * s
      puntas += `M${r1(xl)} ${r1(p - l)}L${r1(xl + a)} ${r1(p - l * 0.35)}L${r1(xl)} ${r1(p)}L${r1(xl - a)} ${r1(p - l * 0.35)}Z`
      destellos += `<path class="destello" style="animation-delay:${r2(i * 0.11 + j * 0.16)}s" d="M${r1(xl)} ${r1(p - l * 0.95)}l${r1(a * 1.6)} ${r1(l * 0.3)}l${r1(-a * 1.6)} ${r1(l * 0.3)}l${r1(-a * 1.6)} ${r1(-l * 0.3)}Z" opacity="0"/>`
      // El cuerpo, en sombra detrás del escudo: los hombros y el cuello.
      cuerpos += `M${r1(x - 0.26 * s)} ${r1(y(1.0))}V${r1(y(1.42))}Q${r1(x)} ${r1(y(1.56))} ${r1(x + 0.26 * s)} ${r1(y(1.42))}V${r1(y(1.0))}Z`
      // El casco: la cúpula con la nasal, las carrilleras y la cresta, de frente.
      const hc = y(1.66), ra = 0.15 * s
      cascos += `M${r1(x - ra)} ${r1(hc + ra * 0.9)}C${r1(x - ra * 1.1)} ${r1(hc - ra * 0.4)} ${r1(x - ra * 0.7)} ${r1(hc - ra * 1.15)} ${r1(x)} ${r1(hc - ra * 1.15)}C${r1(x + ra * 0.7)} ${r1(hc - ra * 1.15)} ${r1(x + ra * 1.1)} ${r1(hc - ra * 0.4)} ${r1(x + ra)} ${r1(hc + ra * 0.9)}L${r1(x + ra * 0.3)} ${r1(hc + ra * 1.2)}L${r1(x + ra * 0.18)} ${r1(hc + ra * 0.1)}H${r1(x - ra * 0.18)}L${r1(x - ra * 0.3)} ${r1(hc + ra * 1.2)}Z`
      // La cresta, de frente: un abanico estrecho de crin roja encima de la cúpula. Las de
      // la fila de delante se mecen, cada una desde su base.
      const crin = (bx, by) => `M${r1(bx - ra * 0.18)} ${r1(by - ra * 0.1)}C${r1(bx - ra * 0.5)} ${r1(by - ra * 1.4)} ${r1(bx - ra * 0.2)} ${r1(by - ra * 2)} ${r1(bx)} ${r1(by - ra * 2.1)}C${r1(bx + ra * 0.2)} ${r1(by - ra * 2)} ${r1(bx + ra * 0.5)} ${r1(by - ra * 1.4)} ${r1(bx + ra * 0.18)} ${r1(by - ra * 0.1)}Z`
      if (j === 0) crestas += `<g transform="translate(${r1(x)} ${r1(hc - ra)})"><path class="cresta" style="animation-delay:-${r1(r() * 4)}s" d="${crin(0, 0)}"/></g>`
      else crines += crin(x, hc - ra)
      // El escudo: el bronce, el aro del borde y la lambda.
      const ye = y(1.15), re = 0.45 * s
      escudos += `<circle cx="${r1(x)}" cy="${r1(ye)}" r="${r1(re)}"/>`
      aros += `<circle cx="${r1(x)}" cy="${r1(ye)}" r="${r1(re * 0.9)}"/>`
      lambdas += `M${r1(x - re * 0.4)} ${r1(ye + re * 0.42)}L${r1(x)} ${r1(ye - re * 0.5)}L${r1(x + re * 0.4)} ${r1(ye + re * 0.42)}`
      // Las piernas, en sombra, con las grebas de bronce y el borde de la túnica roja, solo
      // en la fila de delante, la única que se ve entera.
      if (j === 0) {
        tunicas += `M${r1(x - 0.3 * s)} ${r1(y(0.92))}H${r1(x + 0.3 * s)}L${r1(x + 0.26 * s)} ${r1(y(0.6))}H${r1(x - 0.26 * s)}Z`
        for (const dx of [-0.12, 0.12]) {
          const xp = x + dx * s
          piernas += `M${r1(xp - 0.065 * s)} ${r1(y(0.66))}H${r1(xp + 0.065 * s)}L${r1(xp + 0.05 * s)} ${r1(y(0.04))}H${r1(xp + 0.09 * s)}V${r1(y(0))}H${r1(xp - 0.07 * s)}L${r1(xp - 0.05 * s)} ${r1(y(0.04))}Z`
          grebas += `M${r1(xp - 0.06 * s)} ${r1(y(0.5))}C${r1(xp - 0.07 * s)} ${r1(y(0.34))} ${r1(xp - 0.05 * s)} ${r1(y(0.16))} ${r1(xp - 0.045 * s)} ${r1(y(0.1))}H${r1(xp + 0.045 * s)}C${r1(xp + 0.05 * s)} ${r1(y(0.16))} ${r1(xp + 0.07 * s)} ${r1(y(0.34))} ${r1(xp + 0.06 * s)} ${r1(y(0.5))}Z`
        }
      }
    }
    const niebla = r2(Math.min(0.62, j * 0.07))
    tropa += `<g opacity="${r2(1 - niebla * 0.5)}">` +
      `<path d="${lanzas}" stroke="${NEGRO}" stroke-width="${r1(Math.max(1.2, 0.05 * s))}" stroke-linecap="round"/>` +
      `<path d="${puntas}" fill="url(#hoja)"/>` +
      (piernas ? `<path d="${piernas}" fill="${NEGRO}"/><path d="${grebas}" fill="url(#greba)"/><path d="${tunicas}" fill="${ROJO}"/>` : '') +
      `<path d="${cuerpos}" fill="${NEGRO}"/>` +
      (crines ? `<path d="${crines}" fill="${ROJO}"/>` : '') +
      `<path d="${cascos}" fill="url(#cascoF)"/>` +
      `<g fill="url(#escudo)" stroke="#2c1d10" stroke-width="${r1(0.03 * s)}">${escudos}</g>` +
      `<g fill="none" stroke="#f0c886" stroke-width="${r1(Math.max(0.6, 0.012 * s))}" opacity=".5">${aros}</g>` +
      `<path d="${lambdas}" stroke="#a3302f" stroke-width="${r1(0.06 * s)}" stroke-linejoin="miter" stroke-linecap="butt" fill="none"/>` +
      `</g>`
  }
  // El polvo que levanta la formación: trazos bajos que cruzan despacio.
  const rp = azar(137)
  let polvo = ''
  for (let i = 0; i < 9; i++) {
    const x = 760 + rp() * 840, y = 820 + rp() * 150, l = 90 + rp() * 160, d = r1(5 + rp() * 4)
    polvo += `<path class="polvo" style="animation-duration:${d}s;animation-delay:-${r1(rp() * d)}s" d="M${r1(x)} ${r1(y)}h${r1(l)}" opacity="0"/>`
  }
  const sierra = quiebra(azar(139), [[-20, 540], [180, 470], [360, 505], [560, 455], [760, 500], [960, 470], [1160, 498], [1380, 462], [1620, 500]], 4, 0.18)
  const defs = `<defs>
${vertical('cielo', 0, HORIZONTE + 40, [[0, '#121115'], [0.5, '#1c1316'], [0.8, '#4a1a1b'], [1, '#93372b']])}
${radial('alba', 1180, HORIZONTE, 720, [[0, '#e0703c', 0.55], [0.35, '#a83a2c', 0.25], [1, ROJO, 0]])}
${vertical('suelo', HORIZONTE, H, [[0, '#2a1a18'], [0.4, '#1a1416'], [1, '#0f0e11']])}
<radialGradient id="escudo" cx=".36" cy=".34" r=".78"><stop offset="0" stop-color="#f6d08c"/><stop offset=".35" stop-color="${BRONCE}"/><stop offset=".75" stop-color="#6a4626"/><stop offset="1" stop-color="#3a2614"/></radialGradient>
<linearGradient id="cascoF" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3cd8a"/><stop offset=".5" stop-color="#9b6c36"/><stop offset="1" stop-color="#3e2914"/></linearGradient>
<linearGradient id="greba" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c99a58"/><stop offset=".35" stop-color="#8a6033"/><stop offset="1" stop-color="#2a1c0e"/></linearGradient>
<linearGradient id="hoja" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f8dca0"/><stop offset="1" stop-color="#7a5229"/></linearGradient>
</defs>`
  const estilo =
    // Una ola de destellos recorre las puntas de las lanzas, de la izquierda a la derecha
    // y de delante atrás, cada 4,5 s.
    '.destello{animation:destello 4.5s ease-in-out infinite}@keyframes destello{0%,100%{opacity:0}6%{opacity:1}14%{opacity:0}}' +
    '.cresta{animation:cresta 3.4s ease-in-out infinite alternate}@keyframes cresta{from{transform:rotate(-5deg)}to{transform:rotate(6deg)}}' +
    '.polvo{animation-name:polvo;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes polvo{0%{transform:translateX(-120px);opacity:0}25%{opacity:.35}75%{opacity:.35}100%{transform:translateX(220px);opacity:0}}'
  return abrir(CARBON, estilo) + defs +
    `<rect width="${W}" height="${HORIZONTE + 40}" fill="url(#cielo)"/><circle cx="1180" cy="${HORIZONTE}" r="720" fill="url(#alba)"/>` +
    `<path d="${poli([...sierra, [1620, HORIZONTE + 10], [-20, HORIZONTE + 10]])}" fill="#2b1517"/>` +
    `<rect y="${HORIZONTE}" width="${W}" height="${H - HORIZONTE}" fill="url(#suelo)"/>` +
    `<ellipse cx="${FUGA}" cy="${r1(HORIZONTE + OJOS * 150 + 4)}" rx="760" ry="26" fill="#08070a" opacity=".7"/>` +
    tropa +
    `<g fill="${ROJO}">${crestas}</g>` +
    `<g fill="#fff4d6">${destellos}</g>` +
    `<g stroke="#b9876a" stroke-width="2" stroke-linecap="round">${polvo}</g>` +
    `</svg>`
}

// --- Termópilas -------------------------------------------------------------------
// El paso de las Termópilas al ponerse el sol: dos montañas oscuras que se cierran en una
// garganta estrecha, a la derecha, y en el fondo de la garganta un horizonte rojo intenso.
// En el paso, pequeño, un hoplita de guardia: el casco con su cresta, el escudo redondo,
// la lanza en alto y la capa al viento. Lejos, en la llanura, las hogueras del campamento
// enemigo. Mucho espacio vacío, como en un plano de cine. Sin sol en el cielo, para que
// no se parezca al Ronin de Bushidō, y sin la lambda en el escudo.

// El hoplita en coordenadas propias: los pies en (0, 0), de frente y un poco girado a la
// izquierda, unas 230 unidades de alto. La capa es una pieza suelta que ondea desde el
// hombro, y la cresta otra que se mece desde el casco.
const HOMBRO_T = [30, -176], CASCO_T = [4, -216]
function guardian() {
  const piezas = [
    // Las piernas, firmes y separadas, con las grebas, y los pies.
    banda([[-15, -114], [-21, -62], [-26, -10]], t => 23 - 11 * t),
    banda([[13, -114], [18, -62], [23, -10]], t => 23 - 11 * t),
    'M-34 -12H-18L-16 0H-38Z', 'M16 -12H32L36 0H14Z',
    // Las tiras de cuero de la falda y la coraza, ancha de hombros, con sus hombreras.
    'M-28 -124H28L36 -96L29 -100L22 -92L15 -99L8 -91L0 -99L-8 -91L-15 -99L-22 -92L-29 -100L-36 -96Z',
    'M-26 -122C-32 -142 -40 -160 -42 -176C-26 -188 26 -188 42 -176C40 -160 32 -142 26 -122Z',
    'M-46 -168C-48 -180 -40 -188 -28 -186L-30 -170Z', 'M46 -168C48 -180 40 -188 28 -186L30 -170Z',
    // El brazo de la lanza, que baja a la mano, y el cuello.
    banda([[-40, -174], [-48, -152], [-51, -132]], t => 15 - 4 * t),
    'M-8 -184H8V-194H-8Z',
    // El casco corintio, un poco girado: la cúpula, la nasal y las carrilleras.
    'M-16 -190C-18 -204 -14 -218 0 -221C14 -222 20 -210 19 -196L15 -186L8 -190L5 -200H-3L-7 -188Z',
  ]
  // La lanza: el asta, mucho más alta que él, y la punta de hoja.
  const lanza = 'M-54 6L-50.5 6L-50.5 -330L-54 -330Z'
  const punta = 'M-52.2 -362L-46 -338L-52.2 -324L-58.4 -338Z'
  const capa = 'M-36 -180C-10 -190 30 -190 46 -176C74 -146 100 -102 120 -48C106 -46 98 -36 88 -40C80 -52 72 -44 60 -48C54 -90 48 -130 36 -168Z'
  // La cresta de crin: sale de lo alto del casco, se arquea hacia atrás y cae por la nuca.
  const cresta = 'M-10 -216C-14 -242 4 -256 24 -254C44 -252 56 -238 56 -218C56 -206 52 -196 48 -188C44 -204 36 -214 26 -220C14 -226 2 -224 -4 -214Z'
  return `<path class="capaT" d="${capa}" fill="#2e0c10"/>` +
    piezas.map(d => `<path d="${d}"/>`).join('') + '<circle cx="-51" cy="-130" r="7"/>' +
    `<path d="${lanza}"/><path d="${punta}" fill="url(#hojaT)"/>` +
    // El escudo, grande y un poco girado, delante del cuerpo, con su aro.
    '<ellipse cx="22" cy="-134" rx="54" ry="60" transform="rotate(-6 22 -134)"/>' +
    '<ellipse cx="22" cy="-134" rx="47" ry="53" transform="rotate(-6 22 -134)" fill="none" stroke="#2a1a14" stroke-width="2.4"/>' +
    `<g class="crestaT"><path d="${cresta}" fill="#3a0f12"/><path d="${FILO_CRESTA}" stroke="#f0703c" stroke-width="2" stroke-linecap="round" fill="none" opacity=".8"/></g>`
}
// El filo de luz roja del horizonte en los bordes de la silueta: los hombros, el casco,
// la cresta, el borde del escudo, el asta y la capa.
const FILO_T = 'M-46 -168C-48 -180 -40 -188 -24 -187M-16 -190C-18 -204 -14 -218 0 -221M-50.5 -322V-190' +
  curva([[-30.6, -149.1], [-20.4, -172.2], [15.7, -193.7], [43.4, -188.5]]) + 'M84 -122C96 -100 108 -76 120 -48M-29.5 -72L-32 -12M26.5 -72L29 -12'
const FILO_CRESTA = 'M-10 -216C-14 -242 4 -256 24 -254C44 -252 56 -238 56 -218'

function termopilas() {
  const pie = [1262, 790], horizonte = 702
  const ri = azar(151)
  // Las dos montañas que se cierran en la garganta, con las crestas rotas.
  const izq = quiebra(ri, [[-20, 330], [200, 268], [420, 202], [600, 150], [760, 232], [880, 362], [960, 482], [1020, 600], [1056, 700], [1072, 792]], 4, 0.16)
  const der = quiebra(ri, [[1446, 792], [1458, 690], [1482, 578], [1512, 458], [1550, 330], [1582, 228], [1620, 160]], 4, 0.16)
  // Las repisas de la roca, con la luz roja del horizonte en el canto.
  const repisas = 'M760 330L820 318L860 330M840 452L900 440L930 452M940 560L986 548L1012 556M520 300L590 286L640 296M1480 520L1510 510M1500 380L1536 370L1560 376M1462 640L1478 632'
  // Las cordilleras lejanas del fondo de la garganta y la llanura, con las hogueras.
  const lejos = quiebra(azar(157), [[1040, 690], [1110, 668], [1180, 684], [1250, 662], [1320, 680], [1400, 666], [1470, 686]], 3, 0.25)
  const rh = azar(163)
  let hogueras = ''
  for (let i = 0; i < 22; i++) {
    const x = 1090 + rh() * 340, y = horizonte + 6 + rh() * 40, rr = r1(0.9 + rh() * 1.6), d = r1(1.4 + rh() * 1.6)
    hogueras += `<circle class="hoguera" style="animation-duration:${d}s;animation-delay:-${r1(rh() * d)}s" cx="${r1(x)}" cy="${r1(y)}" r="${rr}"/>`
  }
  // El polvo que el viento arrastra por el paso.
  let polvo = ''
  for (let i = 0; i < 10; i++) {
    const x = 1100 + rh() * 240, y = 748 + rh() * 44, l = 40 + rh() * 90, d = r1(3 + rh() * 2.5)
    polvo += `<path class="arena" style="animation-duration:${d}s;animation-delay:-${r1(rh() * d)}s" d="M${r1(x)} ${r1(y)}h${r1(l)}" opacity="0"/>`
  }
  // Dos buitres que dan vueltas en lo alto, con su propio ritmo.
  const buitre = 'M-30 2Q-18 -10 -6 -4L0 -7L6 -4Q18 -10 30 2Q18 -3 6 1L0 4L-6 1Q-18 -3 -30 2Z'
  const vuelo = (n, cx, cy, rx, ry, medio) => `<g transform="translate(${cx} ${cy})"><g class="vx${n}"><g class="vy${n}"><path d="${buitre}"/></g></g></g>` +
    `<style>.vx${n}{animation:vx${n} ${medio}s cubic-bezier(.37,0,.63,1) infinite alternate}.vy${n}{animation:vy${n} ${medio}s cubic-bezier(.37,0,.63,1) -${medio / 2}s infinite alternate}` +
    `@keyframes vx${n}{from{transform:translateX(${-rx}px)}to{transform:translateX(${rx}px)}}@keyframes vy${n}{from{transform:translateY(${-ry}px)}to{transform:translateY(${ry}px)}}</style>`
  const defs = `<defs>
${vertical('cielo', 0, horizonte, [[0, '#111014'], [0.45, '#22121a'], [0.72, '#5a1c20'], [0.88, '#a8372c'], [0.96, '#d9552f'], [1, '#f08a45']])}
${radial('brillo', 1256, horizonte, 360, [[0, '#ffb070', 0.55], [0.4, '#e2603a', 0.2], [1, '#e2603a', 0]])}
${vertical('llano', horizonte, 800, [[0, '#3a1618'], [1, '#160e10']])}
${vertical('rocaT', 140, H, [[0, '#1d1316'], [0.6, '#120d10'], [1, '#0b090c']])}
<linearGradient id="hojaT" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6c98a"/><stop offset="1" stop-color="#6a3a22"/></linearGradient>
</defs>`
  const estilo =
    `.capaT{animation:capaT 4.6s ease-in-out infinite}@keyframes capaT{0%,100%{transform:${giro(HOMBRO_T, 0)}}25%{transform:${giro(HOMBRO_T, -6)}}40%{transform:${giro(HOMBRO_T, -2.5)}}60%{transform:${giro(HOMBRO_T, -5)}}82%{transform:${giro(HOMBRO_T, -1)}}}` +
    `.crestaT{animation:crestaT 3.1s ease-in-out infinite alternate}@keyframes crestaT{from{transform:${giro(CASCO_T, -3)}}to{transform:${giro(CASCO_T, 5)}}}` +
    '.hoguera{animation-name:hoguera;animation-timing-function:ease-in-out;animation-iteration-count:infinite}@keyframes hoguera{0%,100%{opacity:1}35%{opacity:.35}60%{opacity:.85}80%{opacity:.5}}' +
    '.arena{animation-name:arena;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes arena{0%{transform:translateX(-140px);opacity:0}20%{opacity:.45}80%{opacity:.45}100%{transform:translateX(200px);opacity:0}}' +
    '.estela{animation:estela 26s ease-in-out infinite alternate}@keyframes estela{from{transform:translateX(-50px)}to{transform:translateX(50px)}}'
  return abrir(CARBON, estilo) + defs +
    `<rect width="${W}" height="${horizonte}" fill="url(#cielo)"/><circle cx="1256" cy="${horizonte}" r="360" fill="url(#brillo)"/>` +
    // Dos estelas de nube delante del horizonte, que van y vienen despacio.
    `<g class="estela" fill="#3a1418" opacity=".8"><path d="M1010 640C1100 632 1220 630 1330 636C1250 642 1140 646 1010 640Z"/><path d="M1180 668C1260 662 1360 662 1450 666C1380 671 1280 673 1180 668Z" opacity=".7"/></g>` +
    `<path d="${poli([...lejos, [1470, horizonte + 4], [1040, horizonte + 4]])}" fill="#2a0f12"/>` +
    `<rect y="${horizonte}" width="${W}" height="${800 - horizonte}" fill="url(#llano)"/>` +
    `<g fill="#ffb25e">${hogueras}</g>` +
    // Las dos montañas, negras, con la luz roja en los cantos que miran a la garganta.
    `<path d="${poli([...izq, [1100, H], [-20, H]])}" fill="url(#rocaT)"/><path d="${poli([[1420, H], ...der, [1620, H]])}" fill="url(#rocaT)"/>` +
    `<path d="M${izq.slice(0, -26).map(pt).join('L')}" stroke="#7a2a26" stroke-width="1.6" stroke-linejoin="round" fill="none" opacity=".35"/>` +
    `<path d="M${izq.slice(-26).map(pt).join('L')}" stroke="#c4462f" stroke-width="2.4" stroke-linejoin="round" fill="none" opacity=".6"/>` +
    `<path d="M${der.slice(0, 26).map(pt).join('L')}" stroke="#c4462f" stroke-width="2.4" stroke-linejoin="round" fill="none" opacity=".55"/>` +
    `<path d="${repisas}" stroke="#a83a2c" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".45"/>` +
    // El suelo del paso, con la roca donde está el guardián.
    `<path d="M1040 ${H}L1066 800Q1140 786 1262 790Q1380 786 1450 800L1470 ${H}Z" fill="#0d0a0d"/><path d="M1200 792Q1262 776 1324 792" stroke="#b84a30" stroke-width="2" fill="none" opacity=".5"/>` +
    `<g fill="${NEGRO}" transform="translate(${pie[0]} ${pie[1]})">${guardian()}<path d="${FILO_T}" stroke="#f0703c" stroke-width="2" stroke-linecap="round" fill="none" opacity=".75"/></g>` +
    `<g fill="${NEGRO}">${vuelo(1, 1240, 380, 130, 34, 10)}${vuelo(2, 1300, 300, 90, 26, 8)}</g>` +
    `<g stroke="#d9805a" stroke-width="1.6" stroke-linecap="round">${polvo}</g>` +
    `</svg>`
}

escribir('genera_esparta.mjs', 'las escenas de la sala Esparta, solo de noche.', { hoplita, falange, termopilas }, process.argv[2], process.argv[3])
