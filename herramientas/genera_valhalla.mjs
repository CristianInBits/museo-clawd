// Generador de las escenas de la sala Valhalla de museo-clawd: Drakkar, Jarl, Yggdrasil
// y Thor. Dibujos propios, inspirados en las expediciones vikingas y en las sagas
// nórdicas, sin fantasía exagerada: siluetas oscuras, montañas
// escarpadas, niebla fría y pequeños acentos de fuego. Solo modo oscuro, con la paleta de
// la sala: azul noche nórdico, azul fiordo, verde musgo, gris hielo y ámbar fuego.
//
// El movimiento va en animaciones CSS dentro del <style> de cada escena. Cada elemento
// animado tiene en sus atributos una posición quieta buena, la que se ve con «reducir
// movimiento». Lo que se mueve tiene bordes o brillo, porque en la aplicación lo blando
// que se mueve despacio no se ve moverse.
import { CSS_ESTRELLAS, CSS_NIEBLA, H, W, abrir, azar, banda, curva, defsNiebla, escribir, estrellas, giro, mas, nieblas, poli, pt, r1, r2 } from './comun.mjs'

const NOCHE = '#101b26'
const FIORDO = '#345567'
const MUSGO = '#647c72'
const HIELO = '#acb9b7'
const AMBAR = '#d6a35f'
// El negro de las siluetas, más oscuro que el fondo para que se recorten.
const SOMBRA = '#071017'

// Una cresta escarpada de (x0, y0) a (x1, y1): picos (los puntos impares) y collados que
// se alternan, con la altura al azar. Con más `caos`, más irregular.
function cresta(semilla, x0, y0, x1, y1, n, alto, caos = 0.5) {
  const r = azar(semilla), p = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const dx = i > 0 && i < n ? (r() - 0.5) * ((x1 - x0) / n) * caos : 0
    const sube = i > 0 && i < n ? (i % 2 ? -1 : 0.3) * alto * (0.75 - caos * 0.6 + r() * (0.25 + caos * 0.6)) : 0
    p.push([x0 + (x1 - x0) * t + dx, y0 + (y1 - y0) * t + sube])
  }
  return p
}

// Una cordillera lejana y escarpada: sus picos y collados vienen dados, y entre ellos las
// aristas salen del desplazamiento del punto medio (cada tramo se parte en dos y su punto
// medio sube o baja al azar, cada vez menos). Lleva nieve en lo alto de cada pico.
// Devuelve su dibujo, con su degradado `id`.
function sierra(id, semilla, control, suelo, claro, oscuro) {
  const r = azar(semilla)
  let p = control
  for (let n = 0, amp = 0.22; n < 5; n++, amp *= 0.55) {
    const q = [p[0]]
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], largo = Math.hypot(b[0] - a[0], b[1] - a[1])
      q.push([(a[0] + b[0]) / 2 + (r() - 0.5) * (b[0] - a[0]) * 0.2, (a[1] + b[1]) / 2 + (r() - 0.5) * largo * amp], b)
    }
    p = q
  }
  const x0 = p[0][0], x1 = p[p.length - 1][0]
  let nieve = ''
  for (const [cx, cy] of control.slice(1, -1)) {
    const i = p.findIndex(q => q[0] === cx && q[1] === cy)
    if (i > 2 && i < p.length - 3 && p[i][1] < p[i - 2][1] && p[i][1] < p[i + 2][1]) nieve += `M${pt(p[i - 3])}L${pt(p[i])}L${pt(p[i + 3])}`
  }
  const cima = Math.min(...p.map(q => q[1]))
  return `<linearGradient id="${id}" x1="0" y1="${r1(cima)}" x2="0" y2="${suelo}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${claro}"/><stop offset="1" stop-color="${oscuro}"/></linearGradient>` +
    `<path d="${poli([[x0, suelo], ...p, [x1, suelo]])}" fill="url(#${id})"/><path d="${nieve}" stroke="${HIELO}" stroke-width="2" stroke-linejoin="round" fill="none" opacity=".22"/>`
}

// Una montaña de cresta escarpada: la silueta hasta `suelo`, con un degradado que se
// aclara hacia la cresta, una astilla de luz en la cara de cada pico que da a la luz y la
// nieve en lo alto de esa cara. `luz` es 1 si la luz viene de la derecha y -1 si viene de
// la izquierda. `id` nombra su degradado.
function montana(id, p, suelo, claro, oscuro, luz, nieve = 0.32) {
  const silueta = poli([[p[0][0], suelo], ...p, [p[p.length - 1][0], suelo]])
  const cima = Math.min(...p.map(q => q[1]))
  let caras = '', blanco = ''
  for (let i = 1; i < p.length - 1; i += 2) {
    const pico = p[i], lado = p[i + luz]
    const hacia = mas(pico, [lado[0] - pico[0], lado[1] - pico[1]], 0.6)
    caras += poli([pico, hacia, [pico[0] + luz * 10, pico[1] + 85]])
    blanco += `M${pt(pico)}L${pt(mas(pico, [lado[0] - pico[0], lado[1] - pico[1]], 0.45))}`
  }
  return `<linearGradient id="${id}" x1="0" y1="${r1(cima)}" x2="0" y2="${suelo}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${claro}"/><stop offset="1" stop-color="${oscuro}"/></linearGradient>` +
    `<path d="${silueta}" fill="url(#${id})"/><path d="${caras}" fill="${HIELO}" opacity=".07"/><path d="${blanco}" stroke="${HIELO}" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="${nieve}"/>`
}

// --- Drakkar ----------------------------------------------------------------------
// Un barco vikingo de vela cuadrada entre las paredes de un fiordo, recortado contra la
// luz fría de la salida del fiordo, sobre el agua quieta que lo refleja. La proa tallada
// acaba en una cabeza de dragón; los escudos van en la borda y un farol en la popa.

// El barco en coordenadas propias: el centro de su línea de flotación en (0, 0).
const L = 235
const borda = x => -26 - 72 * Math.pow(Math.abs(x) / L, 3.6)
// La quilla sube hacia las puntas, que salen del agua y se juntan con la borda.
const quilla = x => 12 - 84 * Math.pow(Math.abs(x) / L, 2.6)
// La vela cuadrada, con su panza: `b` es cuánto se hincha.
const vela = b => `M-113 -268L113 -268C${127 + b} -205 ${130 + b} -140 118 -86C60 ${-76 + b * 0.7} -60 ${-76 + b * 0.7} -118 -86C${-130 - b} -140 ${-127 - b} -205 -113 -268Z`

function barco() {
  const xs = [...Array(41)].map((_, i) => -L + (2 * L * i) / 40)
  const casco = `M${xs.map(x => pt([x, borda(x)])).join('L')}L${[...xs].reverse().map(x => pt([x, quilla(x)])).join('L')}Z`
  const tracas = [0.34, 0.64].map(f => `M${xs.slice(2, -2).map(x => pt([x, borda(x) * (1 - f) + quilla(x) * f])).join('L')}`).join('')
  // La roda sube y se curva hacia delante hasta la cabeza de dragón.
  const cuello = [[L - 6, -86], [L + 6, -122], [L + 13, -152], [L + 22, -178], [L + 38, -198]]
  const [ex, ey] = cuello[cuello.length - 1]
  const c = (dx, dy) => pt([ex + dx * 1.35, ey + dy * 1.35])
  const cabeza = `M${c(-5, 5)}C${c(-1, -11)} ${c(13, -16)} ${c(25, -11)}L${c(42, -4)}L${c(30, -1)}L${c(40, 5)}L${c(24, 7)}C${c(14, 9)} ${c(3, 9)} ${c(-5, 5)}Z`
  const crin = `M${c(-3, -6)}L${c(-13, -22)}L${c(1, -12)}L${c(-5, -29)}L${c(9, -14)}Z`
  const popa = `M${-L + 6} -86C${-L - 4} -122 ${-L - 16} -156 ${-L - 5} -180C${-L + 7} -200 ${-L + 30} -188 ${-L + 19} -171C${-L + 12} -161 ${-L + 1} -168 ${-L + 6} -177`
  let escudos = ''
  for (let k = 0; k < 13; k++) {
    const x = -174 + 29 * k, y = borda(x) + 9
    escudos += `<circle cx="${r1(x)}" cy="${r1(y)}" r="12" fill="${k % 2 ? '#22364a' : '#2b3e3a'}" stroke="${SOMBRA}" stroke-width="2"/><circle cx="${r1(x)}" cy="${r1(y)}" r="3" fill="${HIELO}" opacity=".45"/>`
  }
  const jarcia = `M0 -300L${L - 10} ${r1(borda(L - 10))}M0 -300L${-L + 10} ${r1(borda(-L + 10))}M120 -270L150 ${r1(borda(150))}M-120 -270L-150 ${r1(borda(-150))}`
  return `<g class="farol"><circle cx="${-L + 9}" cy="-122" r="34" fill="url(#farolG)"/></g><circle cx="${-L + 9}" cy="-122" r="3.2" fill="#ffd9a0"/>` +
    `<path d="${jarcia}" stroke="${SOMBRA}" stroke-width="1.6" fill="none"/>` +
    `<rect x="-3" y="-302" width="6" height="276" fill="${SOMBRA}"/>` +
    `<path class="vela" d="${vela(0)}" fill="url(#rayas)"/><path class="vela" d="${vela(0)}" fill="url(#velaG)"/>` +
    `<path d="M-120 -270Q0 -278 120 -270" stroke="${SOMBRA}" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<path d="${casco}" fill="${SOMBRA}"/><path d="${tracas}" stroke="#22313d" stroke-width="1.6" fill="none" opacity=".8"/>` +
    `<path d="${banda(cuello, t => 15 - 5 * t)}" fill="${SOMBRA}"/><path d="${cabeza}${crin}" fill="${SOMBRA}"/><circle cx="${r1(ex + 22)}" cy="${r1(ey - 8)}" r="2.4" fill="${HIELO}" opacity=".7"/>` +
    `<path d="${popa}" stroke="${SOMBRA}" stroke-width="12" stroke-linecap="round" fill="none"/>` +
    escudos
}

function drakkar() {
  const agua = 650
  const B = [1245, 668]
  const izq = cresta(7, -20, 250, 770, agua, 14, 70)
  const der = cresta(11, 1390, agua, 1620, 290, 8, 45)
  const lejos = cresta(5, 820, agua - 25, 1620, agua - 70, 12, 55)
  // La hoguera de una atalaya en un pico de la pared izquierda, fuera de la columna.
  const atalaya = izq.filter((_, i) => i % 2).reduce((a, b) => (Math.abs(b[0] - 250) < Math.abs(a[0] - 250) ? b : a))
  const reflejo = p => p.map(([x, y]) => [x, 2 * agua - y])
  const defs = `<defs>${defsNiebla(HIELO)}
<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="${agua}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a131c"/><stop offset=".55" stop-color="#132332"/><stop offset="1" stop-color="#2a4152"/></linearGradient>
<radialGradient id="salida" cx="1240" cy="610" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${HIELO}" stop-opacity=".34"/><stop offset=".35" stop-color="${HIELO}" stop-opacity=".1"/><stop offset="1" stop-color="${HIELO}" stop-opacity="0"/></radialGradient>
<linearGradient id="agua" x1="0" y1="${agua}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1b3142"/><stop offset="1" stop-color="#091219"/></linearGradient>
<linearGradient id="fundido" x1="0" y1="${agua}" x2="0" y2="${agua + 260}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="reflejoM" maskUnits="userSpaceOnUse" x="0" y="${agua}" width="${W}" height="${H - agua}"><rect y="${agua}" width="${W}" height="${H - agua}" fill="url(#fundido)"/></mask>
<radialGradient id="estela" cx="1240" cy="${agua + 90}" r="190" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${HIELO}" stop-opacity=".25"/><stop offset="1" stop-color="${HIELO}" stop-opacity="0"/></radialGradient>
<pattern id="rayas" patternUnits="userSpaceOnUse" x="-113" width="32" height="10"><rect width="16" height="10" fill="#2d4554"/><rect x="16" width="16" height="10" fill="#3a5556"/></pattern>
<linearGradient id="velaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SOMBRA}" stop-opacity=".45"/><stop offset=".45" stop-color="${SOMBRA}" stop-opacity="0"/><stop offset="1" stop-color="${SOMBRA}" stop-opacity=".5"/></linearGradient>
<radialGradient id="farolG"><stop offset="0" stop-color="${AMBAR}" stop-opacity=".75"/><stop offset="1" stop-color="${AMBAR}" stop-opacity="0"/></radialGradient>
</defs>`
  // Las franjas del agua que cortan los reflejos, más juntas cerca del barco.
  let franjas = '', brillos = ''
  for (let k = 0, y = agua + 8; y < H; k++, y += 7 + k * 2.2) franjas += `M0 ${r1(y)}H${W}`
  const r = azar(19)
  for (let k = 0; k < 16; k++) {
    const y = agua + 12 + r() * 170, x = 1240 + (r() - 0.5) * (120 + (y - agua) * 0.9), l = 20 + r() * 70
    brillos += `M${r1(x - l / 2)} ${r1(y)}H${r1(x + l / 2)}`
  }
  const estilo = CSS_ESTRELLAS + CSS_NIEBLA +
    '.olas{animation:olas 5.5s ease-in-out infinite}@keyframes olas{0%,100%{transform:translateY(0px)}50%{transform:translateY(-4px)}}' +
    '.balanceo{animation:balanceo 8s ease-in-out infinite alternate}@keyframes balanceo{from{transform:rotate(-1.4deg)}to{transform:rotate(1.4deg)}}' +
    `.vela{animation:vela 4.5s ease-in-out infinite alternate}@keyframes vela{from{d:path("${vela(0)}")}to{d:path("${vela(12)}")}}` +
    '.farol{animation:fuego 2.8s ease-in-out infinite}.hoguera{animation:fuego 3.6s ease-in-out -1s infinite}@keyframes fuego{0%,100%{opacity:1}20%{opacity:.62}38%{opacity:.92}60%{opacity:.5}80%{opacity:.85}}' +
    `.riela{animation:riela 3.4s ease-in-out infinite alternate}@keyframes riela{from{transform:translate(0px,${agua}px) skewX(-2.5deg) scale(1,1) translate(0px,${-agua}px)}to{transform:translate(0px,${agua}px) skewX(2.5deg) scale(1,.93) translate(0px,${-agua}px)}}` +
    '.franjas{animation:franjas 2.6s ease-in-out infinite alternate}@keyframes franjas{from{transform:translateY(-3px)}to{transform:translateY(3px)}}' +
    '.brillos{animation:brillos 3s ease-in-out infinite alternate}@keyframes brillos{from{transform:translateX(-18px);opacity:.2}to{transform:translateX(18px);opacity:.55}}'
  const nave = `<g class="olas"><g class="balanceo">${barco()}</g></g>`
  return abrir(NOCHE, estilo) + defs +
    `<rect width="${W}" height="${agua}" fill="url(#cielo)"/>` + estrellas(31, 150, 0, 430) +
    `<circle cx="1240" cy="610" r="560" fill="url(#salida)"/>` +
    `<path d="${poli([[lejos[0][0], agua], ...lejos, [W + 20, agua]])}" fill="#3a5568" opacity=".55"/>` +
    montana('paredDer', der, agua, '#2b3f4f', '#111d27', -1) + montana('paredIzq', izq, agua, '#27394a', '#0f1a23', 1) +
    `<g class="hoguera"><circle cx="${r1(atalaya[0])}" cy="${r1(atalaya[1] + 4)}" r="22" fill="url(#farolG)"/></g><circle cx="${r1(atalaya[0])}" cy="${r1(atalaya[1] + 4)}" r="2.6" fill="#ffd9a0"/>` +
    nieblas([[640, 612, 900, 34, 0.1, 20, true], [-40, 628, 820, 28, 0.08, -24, true], [80, 520, 620, 30, 0.06, 26]]) +
    `<rect y="${agua}" width="${W}" height="${H - agua}" fill="url(#agua)"/>` +
    `<g mask="url(#reflejoM)">` +
    `<circle cx="1240" cy="${agua + 90}" r="190" fill="url(#estela)"/>` +
    `<g opacity=".45"><path d="${poli([[lejos[0][0], agua], ...reflejo(lejos), [W + 20, agua]])}" fill="#3a5568" opacity=".5"/><path d="${poli([[der[0][0], agua], ...reflejo(der), [der[der.length - 1][0], agua]])}" fill="#15232f"/><path d="${poli([[izq[0][0], agua], ...reflejo(izq), [izq[izq.length - 1][0], agua]])}" fill="#121f2a"/></g>` +
    `<g class="riela" opacity=".34"><g transform="translate(${B[0]} ${B[1]}) scale(1 -1)">${nave}</g></g>` +
    `<g class="franjas"><path d="${franjas}" stroke="#14273a" stroke-width="2.4" fill="none" opacity=".85"/></g>` +
    `<g class="brillos"><path d="${brillos}" stroke="${HIELO}" stroke-width="1.2" stroke-linecap="round" fill="none"/></g>` +
    `</g>` +
    `<g transform="translate(${B[0]} ${B[1]})">${nave}</g>` +
    nieblas([[560, 850, 1000, 40, 0.07, -18, true], [-60, 760, 700, 30, 0.06, 22]]) +
    `</svg>`
}

// --- Jarl -------------------------------------------------------------------------
// Un guerrero nórdico en una cresta nevada, a la derecha, visto de espaldas y un poco de
// perfil, mirando el fiordo al amanecer: casco redondo con nasal y cuernos, la barba
// de perfil, la capa con cuello de piel, el escudo redondo a la espalda y el hacha de
// barba apoyada en el suelo. A su lado, una piedra rúnica tallada; abajo, unos drakkares
// diminutos salen de expedición. Silueta plana, como el ronin de Bushidō.

// Los copos de nieve: dos capas que caen a ritmos distintos. Cada copo va dos veces, una
// en su sitio y otra mil unidades más arriba, para que la caída no tenga saltos.
function copos(semilla, n, r0, r1_, o0) {
  const r = azar(semilla)
  let s = ''
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, rr = r1(r0 + r() * (r1_ - r0)), o = r2(o0 + r() * 0.3)
    s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${rr}" opacity="${o}"/><circle cx="${r1(x)}" cy="${r1(y - H)}" r="${rr}" opacity="${o}"/>`
  }
  return s
}

// Un cuervo que da vueltas: una elipse hecha con un vaivén lateral y otro vertical
// desfasados un cuarto de vuelta. Aletea a su ritmo. Lleva su propio <style>.
function cuervo(n, cx, cy, rx, ry, medio, aleteo) {
  return `<g transform="translate(${cx} ${cy})"><g class="cx${n}"><g class="cy${n}"><path class="ala${n}" d="M-24 3Q-13 -12 0 0Q13 -12 24 3Q13 -5 0 5Q-13 -5 -24 3Z" fill="${SOMBRA}"/></g></g></g>` +
    `<style>.cx${n}{animation:cx${n} ${medio}s cubic-bezier(.37,0,.63,1) infinite alternate}.cy${n}{animation:cy${n} ${medio}s cubic-bezier(.37,0,.63,1) -${medio / 2}s infinite alternate}` +
    `.ala${n}{animation:ala ${aleteo}s ease-in-out infinite}@keyframes cx${n}{from{transform:translateX(${-rx}px)}to{transform:translateX(${rx}px)}}@keyframes cy${n}{from{transform:translateY(${-ry}px)}to{transform:translateY(${ry}px)}}</style>`
}

// Un drakkar diminuto, para verlo a lo lejos: casco, mástil y vela cuadrada.
const barquita = (x, y, e) => `<path transform="translate(${x} ${y}) scale(${e})" d="M-26 -4Q0 6 26 -4Q28 -10 31 -12L30 -9Q28 -5 27 -1Q0 9 -27 -1Q-29 -6 -31 -11L-29 -10Q-28 -6 -26 -4ZM-1 -4V-36H1V-4ZM-12 -34H12L13 -14Q0 -11 -13 -14Z"/>`

// El guerrero en coordenadas propias: los pies en (0, 0) y la copa del casco arriba, a
// unas 330 unidades. Mira a la izquierda. La parte izquierda de la capa es una pieza
// suelta encima del cuerpo, del mismo negro, que gira desde el hombro con las ráfagas.
const HOMBRO_CAPA = [-72, -228]
function guerrero() {
  // Cada pieza va en su propio trazado: juntas en uno, las que se solapan en sentido
  // contrario se anulan y dejan huecos.
  const piezas = [
    // Las piernas, con los calzones anchos, las polainas y las botas, que miran a la izquierda.
    'M-50 -86L-20 -86L-24 -46L-26 -10L-23 0L-58 0L-54 -6L-40 -10L-44 -46Z',
    'M-6 -86L22 -86L17 -46L15 -10L18 0L-14 0L-10 -6L1 -10L2 -46Z',
    // La capa: los hombros caídos, el borde que se abre abajo y el bajo ondulado.
    'M-26 -258C-42 -254 -62 -244 -74 -228C-76 -178 -80 -118 -88 -50Q-62 -42 -38 -50Q-12 -42 12 -50Q36 -42 58 -50C56 -118 60 -178 64 -230C54 -246 34 -256 14 -258Z',
    // El brazo derecho, que baja a sujetar el hacha, y el hacha de barba: el asta y la hoja.
    banda([[56, -224], [66, -190], [76, -154]], t => 22 - 6 * t),
    'M79 2L85 2L77 -276L71 -276Z',
    'M73 -282L87 -282Q101 -286 109 -300Q118 -266 109 -232Q99 -242 87 -250L73 -250Z',
    // La cabeza, girada a la izquierda: la cara bajo el casco, el casco redondo con su
    // aro, el nasal y la barba, que asoma por encima del hombro.
    'M-42 -282C-44 -270 -40 -262 -30 -258L6 -262L8 -282Z',
    'M-42 -284C-42 -308 -30 -324 -16 -330C-2 -324 8 -308 8 -286Z',
    'M-45 -289H11V-281H-45Z',
    'M-43 -284H-50L-51 -260H-45Z',
    'M-44 -270C-64 -262 -72 -242 -64 -222C-54 -232 -44 -248 -32 -262Z',
    // Los cuernos, que salen a los lados del casco, se abren y suben con la punta hacia
    // dentro. Lo distinguen del casco de cresta de Esparta.
    banda([[-36, -300], [-52, -306], [-63, -318], [-68, -336], [-63, -354]], t => 12 - 10 * t),
    banda([[2, -302], [18, -310], [29, -324], [32, -342], [27, -358]], t => 12 - 10 * t),
  ]
  const capa = 'M-72 -230C-80 -172 -94 -112 -114 -48Q-96 -42 -80 -48L-52 -58L-56 -222Z'
  // El cuello de piel, con su borde de mechones, sobre los hombros.
  const hombro = [[-78, -226], [-66, -242], [-48, -252], [-26, -260], [0, -262], [24, -258], [46, -248], [66, -232]]
  let piel = `M${pt(hombro[0])}`
  hombro.slice(1).forEach(([x, y], k) => {
    const [px, py] = hombro[k]
    piel += `Q${r1((px + x) / 2 - 2)} ${r1((py + y) / 2 - 9 + (k % 2) * 4)} ${pt([x, y])}`
  })
  piel += hombro.slice().reverse().map(([x, y]) => `L${pt([x, y + 14])}`).join('') + 'Z'
  const trenzas = 'M6 -281C10 -270 12 -260 10 -250M0 -280C3 -268 3 -258 1 -250'
  return piezas.map(d => `<path d="${d}"/>`).join('') + '<circle cx="78" cy="-152" r="9"/>' +
    `<path class="capa" d="${capa}"/><path d="${piel}"/>` +
    `<path d="${trenzas}" stroke="${SOMBRA}" stroke-width="3" stroke-linecap="round" fill="none"/>` +
    // El escudo, a la espalda: del mismo negro, con el canto, las tablas y el umbo marcados.
    `<circle cx="2" cy="-158" r="64"/><g fill="none" stroke="${HIELO}"><circle cx="2" cy="-158" r="61" stroke-width="2.4" opacity=".3"/><circle cx="2" cy="-158" r="54" stroke-width="1" opacity=".1"/>` +
    `<path d="M-52 -158H56M2 -212V-104M-36 -196L40 -120M-36 -120L40 -196" stroke-width="1.2" opacity=".07"/><circle cx="2" cy="-158" r="12" stroke-width="2" opacity=".32"/></g>` +
    // La luz del alba en el filo del hacha y en el borde de la barba.
    `<path d="M109 -300Q118 -266 109 -232" stroke="${HIELO}" stroke-width="1.6" fill="none" opacity=".45"/>` +
    `<path d="M-64 -222C-72 -242 -64 -262 -44 -270" stroke="${HIELO}" stroke-width="1.4" fill="none" opacity=".25"/>` +
    `<path d="M-57 -309C-67 -320 -71 -336 -66 -352M23 -313C33 -324 35 -340 30 -356" stroke="${HIELO}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".3"/>`
}

// Runas del futhark antiguo en una caja de 10 × 20, para la piedra y para Yggdrasil.
const RUNAS = {
  Y: 'M2 4L-2 9L2 14M6 6L10 11L6 16', G: 'M0 0L10 20M10 0L0 20', D: 'M0 0V20L10 0V20L0 0', R: 'M0 20V0L8 5L0 10L9 20',
  A: 'M0 20V0M0 2L8 7M0 8L8 13', S: 'M7 0L1 7L9 13L3 20', I: 'M5 0V20', L: 'M1 20V0L9 6',
  T: 'M5 20V0M0 5L5 0L10 5', N: 'M5 0V20M2 7L8 13', K: 'M8 0L1 6L8 12', U: 'M1 20V0L9 6V20', H: 'M1 0V20M9 0V20M1 7L9 13',
}

function jarl() {
  const pie = [1240, 708]
  const cresta = [[760, H], [860, 900], [930, 840], [1000, 790], [1060, 752], [1120, 726], [1180, 714], [1240, 710], [1300, 712], [1360, 716], [1420, 712], [1480, 716], [1540, 724], [1600, 730], [1600, H]]
  const arriba = cresta.slice(1, -1)
  const nieve = [...arriba, ...arriba.map(([x, y]) => [x, y + 16 + (x % 3) * 3]).reverse()]
  // La piedra rúnica: una losa de lados casi rectos y copa redonda, con la banda de la
  // serpiente tallada a lo largo del borde y runas dentro de la banda.
  const piedra = 'M1390 716C1386 644 1394 566 1414 516C1428 484 1454 472 1474 486C1494 502 1504 548 1506 600C1508 650 1502 690 1510 716Z'
  // La banda pasa por el medio de la losa: sube por la izquierda, da la vuelta por la copa
  // y baja por la derecha, donde acaba en la cabeza de la serpiente.
  const franja = 'M1406 716C1402 642 1408 572 1426 530C1438 504 1462 498 1478 520C1494 548 1494 616 1488 664C1484 694 1466 700 1456 684C1446 668 1452 644 1466 638'
  const runas = [...'TIUNHKAR'].map((l, i) => {
    const izq = i < 5, y = izq ? 586 + i * 24 : 556 + (i - 5) * 26, x = izq ? 1401 + (i * 0.6) : 1484
    return `<path d="${RUNAS[l]}" transform="translate(${x} ${y}) scale(.48)"/>`
  }).join('')
  const cabezaSerpiente = 'M1462 640Q1466 624 1476 628Q1480 638 1470 644Z'
  const defs = `<defs>${defsNiebla('#8fa3ad')}
<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="700" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0a131c"/><stop offset=".7" stop-color="#16283a"/><stop offset="1" stop-color="#2c4556"/></linearGradient>
<radialGradient id="alba" cx="1150" cy="650" r="760" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${HIELO}" stop-opacity=".34"/><stop offset=".4" stop-color="${HIELO}" stop-opacity=".09"/><stop offset="1" stop-color="${HIELO}" stop-opacity="0"/></radialGradient>
<radialGradient id="brasa"><stop offset="0" stop-color="${AMBAR}" stop-opacity=".45"/><stop offset="1" stop-color="${AMBAR}" stop-opacity="0"/></radialGradient>
<linearGradient id="agua" x1="0" y1="660" x2="0" y2="800" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2a4152"/><stop offset="1" stop-color="#0f1c26"/></linearGradient>
<linearGradient id="piedraG" x1="1392" y1="0" x2="1500" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#2e3f4b"/><stop offset="1" stop-color="#141f28"/></linearGradient>
</defs>`
  const estilo = CSS_ESTRELLAS + CSS_NIEBLA +
    `.capa{animation:capa 6s ease-in-out infinite}@keyframes capa{0%,100%{transform:${giro(HOMBRO_CAPA, 0)}}24%{transform:${giro(HOMBRO_CAPA, 7)}}38%{transform:${giro(HOMBRO_CAPA, 3.5)}}52%{transform:${giro(HOMBRO_CAPA, 6)}}80%{transform:${giro(HOMBRO_CAPA, 0.8)}}}` +
    '@keyframes ala{0%,100%{transform:scale(1,1)}50%{transform:scale(1,-.5)}}' +
    '.sopla{animation:sopla 7s ease-in-out infinite alternate}@keyframes sopla{from{transform:translateX(-14px)}to{transform:translateX(14px)}}' +
    '.nieve1{animation:nieve 42s linear infinite}.nieve2{animation:nieve 26s linear infinite}@keyframes nieve{to{transform:translateY(1000px)}}' +
    '.barca{animation:barca 64s linear infinite}@keyframes barca{0%{transform:translateX(110px);opacity:0}10%{opacity:1}88%{opacity:1}100%{transform:translateX(-300px);opacity:0}}' +
    '.alba{animation:alba 9s ease-in-out infinite}@keyframes alba{50%{opacity:.7}}'
  return abrir(NOCHE, estilo) + defs +
    `<rect width="${W}" height="700" fill="url(#cielo)"/>` + estrellas(37, 90, 0, 360) +
    `<g class="alba"><circle cx="1150" cy="650" r="760" fill="url(#alba)"/><ellipse cx="1150" cy="652" rx="560" ry="62" fill="url(#brasa)"/></g>` +
    sierra('lejos1', 23, [[-20, 640], [110, 560], [250, 620], [400, 545], [560, 630], [700, 585], [880, 640], [1040, 590], [1200, 650], [1380, 600], [1620, 650]], 760, '#2a4253', '#152331') +
    `<rect y="650" width="${W}" height="${H - 650}" fill="url(#agua)"/>` +
    `<g fill="${SOMBRA}" opacity=".85">${[[250, 712, 1, 0], [120, 724, 0.8, 21], [330, 704, 0.7, 43]].map(([x, y, e, d]) => `<g class="barca" style="animation-delay:-${d}s">${barquita(x, y, e)}</g>`).join('')}</g>` +
    nieblas([[-60, 640, 900, 30, 0.1, 22, true], [300, 690, 900, 26, 0.08, -18, true]]) +
    sierra('lejos2', 29, [[-20, 790], [140, 750], [300, 780], [440, 765], [600, 800], [760, 790], [900, 830], [1100, 860]], H, '#1d3141', '#0e1820') +
    `<path d="${poli(cresta)}" fill="#111c25"/><path d="${poli(nieve)}" fill="${HIELO}" opacity=".2"/><path d="${curva(arriba)}" stroke="${HIELO}" stroke-width="2" fill="none" opacity=".45"/>` +
    `<path d="${piedra}" fill="url(#piedraG)"/><path d="${franja}" stroke="#3b4f5c" stroke-width="13" stroke-linecap="round" fill="none" opacity=".85"/><path d="${cabezaSerpiente}" fill="#3b4f5c" opacity=".85"/><g fill="none" stroke="#141f28" stroke-width="2.4" stroke-linecap="round">${runas}</g>` +
    `<g fill="${SOMBRA}" transform="translate(${pie[0]} ${pie[1]})">${guerrero()}</g>` +
    cuervo(1, 1180, 300, 170, 46, 9, 0.7) + cuervo(2, 1130, 340, 120, 32, 7, 0.55) +
    nieblas([[700, 760, 900, 44, 0.1, -16, true], [900, 820, 700, 34, 0.08, 14, true]]) +
    `<g class="sopla" fill="${HIELO}"><g class="nieve1">${copos(41, 70, 0.8, 1.6, 0.25)}</g><g class="nieve2">${copos(43, 34, 1.6, 2.6, 0.4)}</g></g>` +
    `</svg>`
}

// --- Yggdrasil --------------------------------------------------------------------
// El árbol del mundo: un tronco enorme y retorcido a la derecha, ramas que salen del
// cuadro, raíces que se entrelazan sobre el suelo y, entre ellas, el pozo donde nace la
// luz. Las runas del tronco despiertan una tras otra y unas motas de luz suben del pozo.

// Un ciervo, como los cuatro de las Eddas que viven en el árbol y roen sus ramas: de
// perfil, mirando al árbol, con la cornamenta que repite la forma de las ramas. Mueve la
// cabeza despacio, como si mirara alrededor, y de vez en cuando sacude una oreja.
const NUCA = [40, -72], OREJA = [58, -127]
const LOMA = 'M-20 1000V826C60 806 140 792 222 794C304 796 384 810 470 834C530 852 572 880 610 1000Z'
const BORDE_LOMA = 'M-20 826C60 806 140 792 222 794C304 796 384 810 470 834C530 852 572 880 610 1000'
function ciervo() {
  const cuerpo = 'M-54 -58C-56 -74 -44 -84 -22 -86C2 -88 26 -88 40 -80C50 -74 54 -64 52 -52C48 -42 40 -38 30 -40C10 -36 -14 -38 -34 -42C-46 -44 -54 -48 -54 -58Z'
  const patas = ['M-50 -50L-36 -50L-38 -30L-45 -16L-42 0L-48 0L-51 -16L-47 -30Z', 'M-37 -46L-26 -46L-28 -30L-34 -16L-31 0L-37 0L-40 -16L-35 -30Z', 'M28 -44L36 -44L35 -26L37 -8L39 0L33 0L32 -8L30 -26Z', 'M39 -48L46 -48L45 -26L47 -8L49 0L43 0L42 -8L40 -26Z']
  const cola = 'M-51 -70L-60 -74L-55 -62Z'
  const cuello = banda([[28, -74], [44, -100], [58, -122]], t => 32 - 16 * t)
  const cabeza = 'M56 -126C64 -134 78 -132 90 -122L95 -113C87 -110 74 -110 62 -113Z'
  const oreja = 'M58 -127L46 -138L60 -132Z'
  // Las dos cuernas: la de este lado y, un poco detrás, la del otro. Cada una es una vara
  // que sube y se curva hacia atrás, con sus puntas hacia delante.
  const cuerna = (dx, e) => {
    const vara = [[62 + dx, -130], [58 + dx, -150], [50 + dx, -170], [44 + dx, -190], [46 + dx, -208]]
    let d = curva(vara)
    for (const [i, px, py] of [[0, 16, -4], [1, 15, -10], [2, 13, -16], [3, 11, -14]]) {
      const [x, y] = vara[i]
      d += `M${pt([x, y])}L${pt([x + px * e, y + py * e])}`
    }
    return d
  }
  return `<path d="${cuerpo}"/>${patas.map(p => `<path d="${p}"/>`).join('')}<path d="${cola}"/>` +
    `<g class="cabeza"><path d="${cuello}"/><path d="${cabeza}"/><path class="oreja" d="${oreja}"/>` +
    `<path d="${cuerna(-10, 0.85)}" stroke="${SOMBRA}" stroke-width="3" stroke-linecap="round" fill="none"/><path d="${cuerna(0, 1)}" stroke="${SOMBRA}" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>`
}

function yggdrasil() {
  const cx = 1240, arriba = 370, abajo = 770, vuelta = 560
  // El ancho del tronco: ancho en el pie, más estrecho en el medio y abierto arriba, donde
  // se reparte en ramas.
  const anchos = [[abajo, 330], [700, 236], [600, 196], [500, 196], [430, 214], [arriba, 262]]
  const w = y => {
    for (let i = 0; i < anchos.length - 1; i++) {
      const [y0, w0] = anchos[i], [y1, w1] = anchos[i + 1]
      if (y <= y0 && y >= y1) return w0 + (w1 - w0) * ((y0 - y) / (y0 - y1))
    }
    return y > abajo ? 330 : 262
  }
  const r = azar(53)
  // Las tres hebras del tronco, que se retuercen una alrededor de otra. Todas son del mismo
  // negro: la silueta se abomba donde una sale por delante, y una luz de musgo marca el
  // borde de la que va delante en cada tramo.
  const anchoHebra = y => 0.56 * w(y)
  const hebras = [0, 1, 2].map(i => {
    const p = []
    for (let y = abajo; y >= arriba - 0.1; y -= 10) {
      const a = (2 * Math.PI * (y - arriba)) / vuelta + (2 * Math.PI * i) / 3
      p.push({ x: cx + 0.27 * w(y) * Math.sin(a), y, delante: Math.cos(a) })
    }
    return p
  })
  let tronco = '', lucesTronco = ''
  for (const h of hebras) {
    tronco += banda(h.map(p => [p.x, p.y]), t => anchoHebra(abajo - t * (abajo - arriba)))
    let tramo = []
    const cierra = () => { if (tramo.length > 2) lucesTronco += curva(tramo); tramo = [] }
    for (const p of h) {
      if (p.delante > 0.25) tramo.push([p.x - anchoHebra(p.y) * 0.4, p.y])
      else cierra()
    }
    cierra()
  }
  // Las ramas, que se reparten en ramas más finas hasta las ramitas. Las gruesas son
  // bandas que adelgazan; las finas, trazos de un grosor por nivel, juntos en un solo
  // trazado por nivel para que la escena no pase del tamaño máximo. Todas apuntan hacia
  // arriba o hacia los lados.
  const bandas = [], trazos = { 2: '', 3: '', 4: '' }, puntas = []
  const rama = (x, y, ang, largo, g, nivel) => {
    const n = nivel <= 1 ? 7 : 4, p = [[x, y]], angs = [ang]
    const curv = (r() - 0.5) * 1.1, codo = (r() - 0.5) * 0.7
    for (let k = 1; k <= n; k++) {
      const a = Math.max(-Math.PI + 0.1, Math.min(-0.1, ang + curv * (k / n) + codo * Math.sin(Math.PI * k / n) + (r() - 0.5) * 0.14))
      const [px, py] = p[p.length - 1]
      p.push([px + (largo / n) * Math.cos(a), py + (largo / n) * Math.sin(a)])
      angs.push(a)
    }
    if (nivel <= 1) bandas.push(banda(p, t => g * (1 - 0.86 * t)))
    else trazos[nivel] += `M${pt(p[0])}Q${pt(p[2])} ${pt(p[4])}`
    if (nivel >= 4 || g < 2) { puntas.push(p[n]); return }
    const hijos = nivel < 2 ? 3 : 2
    for (let h = 0; h < hijos; h++) {
      const t = 0.38 + r() * 0.5, k = Math.round(t * n)
      const lado = (h + nivel) % 2 ? 1 : -1
      rama(p[k][0], p[k][1], angs[k] + lado * (0.35 + r() * 0.45), largo * (0.5 + r() * 0.22), g * (1 - 0.86 * t) * 0.7, nivel + 1)
    }
  }
  // Las tres hebras siguen arriba como las tres ramas mayores; dos más salen a los lados.
  const cimas = hebras.map(h => h[h.length - 1]).sort((a, b) => a.x - b.x)
  const g0 = anchoHebra(arriba)
  rama(cimas[0].x, arriba + 10, -2.3, 520, g0, 0)
  rama(cimas[1].x, arriba + 10, -1.62, 560, g0, 0)
  rama(cimas[2].x, arriba + 10, -0.92, 500, g0, 0)
  rama(cx - 70, 455, -2.8, 620, 74, 0)
  rama(cx + 80, 470, -0.3, 440, 62, 0)
  // Las raíces: salen del pie de las hebras y de alrededor, serpentean pegadas al suelo y se
  // reparten. Nunca suben.
  const raicesB = [], raicesT = []
  const raiz = (x, y, ang, largo, g, nivel) => {
    const n = 10, p = [[x, y]], angs = [ang]
    const onda = 0.3 + r() * 0.28, fase = r() * 6
    for (let k = 1; k <= n; k++) {
      const a = Math.max(0.02, Math.min(Math.PI - 0.02, ang + Math.sin(k * 0.8 + fase) * onda))
      const [px, py] = p[p.length - 1]
      p.push([px + (largo / n) * Math.cos(a), py + (largo / n) * Math.sin(a) * 0.55])
      angs.push(a)
    }
    if (nivel === 0) raicesB.push(banda(p, t => g * (1 - 0.93 * t)))
    else raicesT.push(`<path d="${curva(p)}" stroke-width="${r1(Math.max(1.2, g * 0.6))}"/>`)
    if (nivel >= 2) return
    for (let h = 0; h < 2; h++) {
      const t = 0.3 + r() * 0.5, k = Math.round(t * n)
      raiz(p[k][0], p[k][1], angs[k] + (h ? 0.45 : -0.45), largo * 0.5, g * (1 - 0.93 * t) * 0.6, nivel + 1)
    }
  }
  const pies = hebras.map(h => h[0]).sort((a, b) => a.x - b.x)
  raiz(pies[0].x - 30, abajo - 6, Math.PI - 0.12, 760, 120, 0)
  raiz(pies[1].x, abajo + 4, Math.PI / 2 + 0.5, 380, 110, 0)
  raiz(pies[2].x + 30, abajo - 6, 0.14, 520, 120, 0)
  raiz(cx - 120, abajo + 14, Math.PI - 0.5, 520, 70, 0)
  raiz(cx + 110, abajo + 16, 0.55, 380, 70, 0)
  // Las hojas: pequeñas manchas de musgo en las puntas de las ramitas, en tres grupos de
  // distinta opacidad.
  const rh = azar(59)
  const hojas = ['', '', '']
  for (const [x, y] of puntas) {
    for (let k = 0; k < 2; k++) hojas[Math.floor(rh() * 3)] += `<circle cx="${Math.round(x + (rh() - 0.5) * 22)}" cy="${Math.round(y + (rh() - 0.5) * 16)}" r="${r1(2.5 + rh() * 3.5)}"/>`
  }
  // Las runas, de arriba abajo por el frente del tronco: cada una despierta a su turno.
  const runas = [...'YGGDRASIL'].map((letra, i) => `<path class="runa" style="animation-delay:${r1(i * 0.45)}s" d="${RUNAS[letra]}" transform="translate(${cx - 7} ${466 + i * 30}) scale(1.3)"/>`).join('')
  // Motas de luz que suben del pozo, cada una a su ritmo.
  const pozo = [990, 806]
  const rm = azar(61)
  let motas = ''
  for (let i = 0; i < 18; i++) {
    const x = pozo[0] + (rm() - 0.5) * 200, y = pozo[1] + (rm() - 0.5) * 16, d = r1(8 + rm() * 7), dx = r1((rm() - 0.5) * 120)
    motas += `<circle class="mota" style="animation-duration:${d}s;animation-delay:-${r1(rm() * d)}s;--dx:${dx}px" cx="${r1(x)}" cy="${r1(y)}" r="${r1(1.6 + rm() * 1.6)}" opacity="0"/>`
  }
  const defs = `<defs>${defsNiebla('#8aa39b')}
<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0c1820"/><stop offset="1" stop-color="#112027"/></linearGradient>
<radialGradient id="copa" cx="1230" cy="520" r="660" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${MUSGO}" stop-opacity=".55"/><stop offset=".3" stop-color="${MUSGO}" stop-opacity=".24"/><stop offset=".7" stop-color="${MUSGO}" stop-opacity=".04"/><stop offset="1" stop-color="${MUSGO}" stop-opacity="0"/></radialGradient>
<radialGradient id="nucleo" cx="1235" cy="470" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${HIELO}" stop-opacity=".16"/><stop offset="1" stop-color="${HIELO}" stop-opacity="0"/></radialGradient>
<linearGradient id="suelo" x1="0" y1="760" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#050b0f" stop-opacity="0"/><stop offset="1" stop-color="#050b0f" stop-opacity=".85"/></linearGradient>
<radialGradient id="pozoG" cx="${pozo[0]}" cy="${pozo[1]}" r="170" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${AMBAR}" stop-opacity=".5"/><stop offset=".45" stop-color="${HIELO}" stop-opacity=".12"/><stop offset="1" stop-color="${HIELO}" stop-opacity="0"/></radialGradient>
<filter id="brilla" x="-100%" y="-50%" width="300%" height="200%"><feGaussianBlur stdDeviation="2.2"/></filter>
</defs>`
  const estilo = CSS_NIEBLA +
    `.copa{animation:copa 9s ease-in-out infinite alternate}@keyframes copa{from{transform:${giro([cx, arriba], -0.7)}}to{transform:${giro([cx, arriba], 0.7)}}}` +
    '.runa{animation:runa 4.5s ease-in-out infinite}@keyframes runa{0%,100%{opacity:.18}12%{opacity:1}30%{opacity:.18}}' +
    '.mota{animation-name:mota;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes mota{0%{transform:translate(0px,0px);opacity:0}15%{opacity:.9}100%{transform:translate(var(--dx),-430px);opacity:0}}' +
    '.pozo{animation:pozo 5s ease-in-out infinite}@keyframes pozo{50%{opacity:.55}}' +
    `.cabeza{animation:cabeza 7s ease-in-out infinite}@keyframes cabeza{0%,100%{transform:${giro(NUCA, 0)}}30%{transform:${giro(NUCA, -6)}}55%{transform:${giro(NUCA, 4)}}75%{transform:${giro(NUCA, -2)}}}` +
    `.oreja{animation:oreja 5s ease-in-out infinite}@keyframes oreja{0%,86%,100%{transform:${giro(OREJA, 0)}}90%{transform:${giro(OREJA, -25)}}94%{transform:${giro(OREJA, 5)}}}`
  return abrir(NOCHE, estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#cielo)"/>` +
    `<circle cx="1230" cy="520" r="660" fill="url(#copa)"/><circle cx="1235" cy="470" r="230" fill="url(#nucleo)"/>` +
    nieblas([[-60, 560, 900, 40, 0.07, 26, true], [100, 680, 800, 34, 0.08, -22, true], [500, 300, 700, 34, 0.05, 20]]) +
    `<rect y="760" width="${W}" height="${H - 760}" fill="url(#suelo)"/>` +
    `<path d="${LOMA}" fill="#0a1418"/><path d="${BORDE_LOMA}" stroke="${MUSGO}" stroke-width="2" fill="none" opacity=".4"/>` +
    `<g fill="${SOMBRA}" transform="translate(222 794) scale(1.15)">${ciervo()}</g>` +
    // El árbol, más lejos: se dibuja a su tamaño y se encoge desde el pie del tronco.
    `<g transform="translate(1240 805) scale(.68) translate(-1240 -805)">` +
    `<g class="copa"><path d="${bandas.join('')}" fill="${SOMBRA}"/><g stroke="${SOMBRA}" stroke-linecap="round" fill="none"><path d="${trazos[2]}" stroke-width="6"/><path d="${trazos[3]}" stroke-width="3"/><path d="${trazos[4]}" stroke-width="1.6"/></g>` +
    `<g fill="${MUSGO}"><g opacity=".25">${hojas[0]}</g><g opacity=".38">${hojas[1]}</g><g opacity=".52">${hojas[2]}</g></g></g>` +
    `<path d="${tronco}" fill="${SOMBRA}"/><path d="${lucesTronco}" stroke="${MUSGO}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".45"/>` +
    `<path d="${raicesB.join('')}" fill="${SOMBRA}"/><g stroke="${SOMBRA}" stroke-linecap="round" fill="none">${raicesT.join('')}</g>` +
    `<g class="pozo"><ellipse cx="${pozo[0]}" cy="${pozo[1]}" rx="170" ry="44" fill="url(#pozoG)"/></g>` +
    `<g stroke="${AMBAR}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none" filter="url(#brilla)">${runas}</g>` +
    `<g stroke="#ffd9a0" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" fill="none">${runas}</g>` +
    `<g fill="${AMBAR}">${motas}</g>` +
    `</g>` +
    nieblas([[640, 790, 900, 40, 0.09, 17, true], [1000, 870, 700, 30, 0.07, -14, true]]) +
    `</svg>`
}

// --- Thor -------------------------------------------------------------------------
// Thor en lo alto de un risco, de frente, con el martillo (Mjölnir) en alto y la capa al
// viento, en una tormenta: bancos de nubes oscuras y rayos en diagonal, uno de ellos
// sobre el martillo. Sin casco, con el pelo y la barba al viento, para que no se confunda
// con Jarl. Silueta plana y poderosa. Los relámpagos siguen un solo ciclo de 12 s, uno
// cada 3 s: como mucho dos golpes de luz en medio segundo y nunca dos rayos a la vez,
// por las personas sensibles a los destellos. Con «reducir movimiento» no hay ninguno.
//
// Es la escena más cara de pintar, y en pantalla completa la aplicación no llegaba a
// tiempo y la animación se frenaba. Por eso los rayos brillan con trazos anchos y no con
// desenfoque, los destellos son pequeños y las nubes y la niebla están quietas: entre
// rayo y rayo solo cambian cosas pequeñas, la capa, el pelo, el viento y el martillo.

// Parte cada tramo de una línea y desplaza su punto medio de lado, cada vez menos: así se
// quiebra un rayo.
function quiebra(r, p, niveles, amp) {
  for (let n = 0; n < niveles; n++, amp *= 0.55) {
    const q = [p[0]]
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
      const d = (r() - 0.5) * l * amp
      q.push([(a[0] + b[0]) / 2 - (dy / l) * d, (a[1] + b[1]) / 2 + (dx / l) * d], b)
    }
    p = q
  }
  return p
}

// Un rayo de (x0, y0) a (x1, y1), con sus ramas.
function rayo(semilla, x0, y0, x1, y1, ramas) {
  const r = azar(semilla)
  const p = quiebra(r, [[x0, y0], [x1, y1]], 5, 0.36)
  let d = `M${p.map(pt).join('L')}`
  const largo = Math.hypot(x1 - x0, y1 - y0), rumbo = Math.atan2(y1 - y0, x1 - x0)
  for (let k = 0; k < ramas; k++) {
    const [x, y] = p[Math.floor(p.length * (0.2 + r() * 0.45))]
    const l = largo * (0.18 + r() * 0.16), a = rumbo + (k % 2 ? 1 : -1) * (0.45 + r() * 0.4)
    d += `M${quiebra(r, [[x, y], [x + l * Math.cos(a), y + l * Math.sin(a)]], 3, 0.4).map(pt).join('L')}`
  }
  return d
}

// Un banco de nubes de tormenta: muchas elipses alargadas del mismo color que se funden
// en una masa baja y pesada.
function banco(semilla, y, alto) {
  const r = azar(semilla)
  let s = ''
  for (let x = -200; x <= W + 200; x += 90 + r() * 70) s += `<ellipse cx="${r1(x)}" cy="${r1(y + (r() - 0.5) * alto * 0.5)}" rx="${r1(alto * (1.6 + r() * 1.2))}" ry="${r1(alto * (0.42 + r() * 0.3))}"/>`
  return s
}

// Thor en coordenadas propias: los pies en (0, 0), de frente, con el brazo del martillo en
// alto a la derecha del cuadro. La capa y el pelo son piezas sueltas que ondean.
const HOMBRO_THOR = [-80, -312], NUCA_THOR = [-22, -356], MAZO = [154, -500]
// El grosor de un brazo a lo largo: el hombro, el bíceps, el codo, el antebrazo y la muñeca.
const brazo = t => t < 0.3 ? 46 + 6 * (t / 0.3) : t < 0.5 ? 52 - 16 * ((t - 0.3) / 0.2) : t < 0.68 ? 36 + 6 * ((t - 0.5) / 0.18) : 42 - 12 * ((t - 0.68) / 0.32)
function dios() {
  const piezas = [
    // Las piernas, abiertas y firmes: muslos anchos, pantorrillas y botas.
    'M-64 -146L-10 -146L-20 -100L-34 -62L-42 -14L-38 0L-98 0L-88 -12L-82 -62L-78 -104Z',
    'M10 -146L64 -146L78 -104L82 -62L88 -12L98 0L38 0L42 -14L34 -62L20 -100Z',
    // El faldón de la túnica, que se abre, y el torso: los hombros muy anchos y la
    // cintura estrecha.
    'M-54 -206L54 -206L72 -140L-72 -140Z',
    'M-60 -336C-94 -336 -116 -318 -112 -292C-108 -264 -90 -238 -58 -204L58 -204C90 -238 108 -264 112 -292C116 -318 94 -336 60 -336Z',
    // El brazo que cae, con el puño cerrado, y el brazo que alza el martillo.
    banda([[-92, -312], [-110, -284], [-120, -256], [-124, -232], [-120, -212]], brazo),
    banda([[90, -312], [104, -340], [116, -368], [128, -396], [138, -420], [144, -438]], brazo),
    // El mango corto del martillo.
    'M136 -444L152 -441L159 -484L143 -487Z',
    // El cuello, la cabeza y la barba, que el viento empuja a la izquierda.
    'M-16 -336L16 -336L14 -318L-14 -318Z',
    'M-28 -358C-28 -384 -14 -396 0 -396C14 -396 28 -384 28 -358C28 -338 16 -328 0 -328C-16 -328 -28 -338 -28 -358Z',
    'M-25 -350C-36 -324 -32 -298 -16 -282L-7 -268L3 -282C19 -298 26 -324 22 -350Z',
  ]
  const capa = 'M-84 -318C-150 -306 -214 -262 -262 -190C-242 -180 -226 -166 -220 -142C-196 -154 -172 -134 -158 -108C-136 -132 -110 -146 -82 -170L-64 -306Z'
  const pelo = 'M-24 -380C-54 -388 -84 -376 -114 -386C-96 -370 -72 -356 -52 -344C-42 -338 -32 -342 -26 -352ZM-26 -362C-52 -362 -74 -348 -102 -350C-82 -336 -60 -326 -42 -326Z'
  // La cabeza del martillo: un bloque con los lados cortos hundidos, inclinado.
  const mazo = `<path d="M-44 -23L44 -23Q38 0 44 23L-44 23Q-38 0 -44 -23Z" transform="translate(${MAZO[0]} ${MAZO[1]}) rotate(8)"/>`
  return `<path class="capaT" d="${capa}"/><path class="pelo" d="${pelo}"/>` +
    piezas.map(d => `<path d="${d}"/>`).join('') + '<circle cx="-118" cy="-206" r="16"/><circle cx="144" cy="-440" r="16"/>' + mazo +
    // El cinturón de fuerza, con su borde.
    `<path d="M-56 -220H56V-200H-56Z"/><path d="M-56 -220H56M-56 -200H56" stroke="${HIELO}" stroke-width="1.4" opacity=".2"/>` +
    // Los nudos tallados en la cara del martillo.
    `<path d="M-28 -9C-16 -19 -6 -19 4 -9C14 1 24 1 32 -9M-28 9C-16 -1 -6 -1 4 9C14 19 24 19 32 9" transform="translate(${MAZO[0]} ${MAZO[1]}) rotate(8)" stroke="${HIELO}" stroke-width="1.4" fill="none" opacity=".22"/>`
}

// El filo de luz que dejan los relámpagos en la silueta, por el lado del rayo del martillo.
const FILO_THOR = 'M112 -292C108 -264 90 -238 58 -204M114 -334L128 -362L140 -392L150 -420M108 -525L200 -512M64 -146L78 -104L82 -62L88 -12M28 -358C28 -384 14 -396 0 -396'

function thor() {
  const pie = [1250, 714]
  // El rayo del martillo baja desde arriba a la derecha; otro cae en diagonal a la
  // izquierda, fuera de la columna; un tercero, lejano, entre las nubes del centro.
  const rayos = [
    { d: rayo(73, 1010, 30, 1400, 196, 2), clase: 'rA', luz: [1260, 140], quieto: 1 },
    { d: rayo(101, 1600, 110, 1420, 202, 1), clase: 'rA', luz: [1520, 170], quieto: 1 },
    { d: rayo(79, 40, 60, 330, 620, 2), clase: 'rB', luz: [200, 320], quieto: 0 },
    { d: rayo(83, 980, 120, 870, 500, 2), clase: 'rC', luz: [930, 300], quieto: 0 },
  ]
  const costa = sierra('costa', 89, [[-20, 742], [160, 700], [300, 726], [470, 690], [640, 734], [820, 712], [1000, 744], [1200, 760]], 770, '#18242f', '#0d151c')
  const risco = [[960, H], [1030, 900], [1090, 830], [1140, 764], [1180, 728], [1222, 714], [1290, 712], [1340, 720], [1390, 752], [1450, 800], [1520, 860], [1600, 900], [1600, H]]
  const r = azar(97)
  let viento = ''
  for (let i = 0; i < 8; i++) {
    const x = 700 + r() * 800, y = 260 + r() * 400, l = 70 + r() * 140, d = r1(3 + r() * 2.5)
    viento += `<path class="viento" style="animation-duration:${d}s;animation-delay:-${r1(r() * d)}s" d="M${r1(x)} ${r1(y)}h${r1(l)}" opacity="0"/>`
  }
  const defs = `<defs>${defsNiebla('#8fa3ad')}
<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="770" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#091118"/><stop offset=".6" stop-color="#132130"/><stop offset="1" stop-color="#22344a"/></linearGradient>
<linearGradient id="mar" x1="0" y1="760" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#16263a"/><stop offset="1" stop-color="#070d12"/></linearGradient>
<radialGradient id="relampago"><stop offset="0" stop-color="#dfe9f2" stop-opacity=".55"/><stop offset=".4" stop-color="${HIELO}" stop-opacity=".18"/><stop offset="1" stop-color="${HIELO}" stop-opacity="0"/></radialGradient>
<radialGradient id="mazoG"><stop offset="0" stop-color="#fff6e0" stop-opacity=".9"/><stop offset=".35" stop-color="${AMBAR}" stop-opacity=".45"/><stop offset="1" stop-color="${AMBAR}" stop-opacity="0"/></radialGradient>
<linearGradient id="riscoG" x1="960" y1="0" x2="1600" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1a2833"/><stop offset="1" stop-color="#0b131a"/></linearGradient>
</defs>`
  const estilo =
    // La tormenta en un ciclo de 12 s: cada destello son dos golpes de luz en medio
    // segundo (el lejano, uno solo), y entre uno y otro pasan 3 s.
    '@keyframes golpeA{0%{opacity:0}1%{opacity:1}2.2%{opacity:.15}3.6%{opacity:.85}5%{opacity:0}50%{opacity:0}51%{opacity:1}52.2%{opacity:.15}53.6%{opacity:.85}55%{opacity:0}100%{opacity:0}}' +
    '@keyframes golpeB{0%,25%{opacity:0}26%{opacity:1}27.2%{opacity:.15}28.6%{opacity:.85}30%,100%{opacity:0}}' +
    '@keyframes golpeC{0%,75%{opacity:0}76.5%{opacity:.8}79%,100%{opacity:0}}' +
    '.rA{animation:golpeA 12s linear infinite}.rB{animation:golpeB 12s linear infinite}.rC{animation:golpeC 12s linear infinite}' +
    '.carga{animation:carga 2.2s ease-in-out infinite}@keyframes carga{50%{opacity:.6}}' +
    `.capaT{animation:capaT 5s ease-in-out infinite}@keyframes capaT{0%,100%{transform:${giro(HOMBRO_THOR, 0)}}22%{transform:${giro(HOMBRO_THOR, 7)}}36%{transform:${giro(HOMBRO_THOR, 3)}}52%{transform:${giro(HOMBRO_THOR, 6)}}78%{transform:${giro(HOMBRO_THOR, 1)}}}` +
    `.pelo{animation:pelo 1.7s ease-in-out infinite alternate}@keyframes pelo{from{transform:${giro(NUCA_THOR, -3)}}to{transform:${giro(NUCA_THOR, 4)}}}` +
    '.viento{animation-name:viento;animation-timing-function:linear;animation-iteration-count:infinite}@keyframes viento{0%{transform:translateX(160px);opacity:0}20%{opacity:.3}80%{opacity:.3}100%{transform:translateX(-320px);opacity:0}}'
  const destellos = rayos.map(({ d, clase, luz, quieto }) =>
    `<g class="${clase}" opacity="${quieto}"><ellipse cx="${luz[0]}" cy="${luz[1]}" rx="300" ry="210" fill="url(#relampago)"/>` +
    `<path d="${d}" stroke="#bcd6f0" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".14"/>` +
    `<path d="${d}" stroke="#bcd6f0" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".3"/>` +
    `<path d="${d}" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>`).join('')
  return abrir(NOCHE, estilo) + defs +
    `<rect width="${W}" height="770" fill="url(#cielo)"/>` +
    // Los bancos de nubes, del más alto y oscuro al más bajo, quietos.
    `<g fill="#0b141c">${banco(61, 40, 150)}</g><g fill="#101b25">${banco(67, 200, 105)}</g><g fill="#16232f">${banco(71, 350, 72)}</g>` +
    destellos +
    costa + `<rect y="760" width="${W}" height="${H - 760}" fill="url(#mar)"/>` +
    // Los destellos se reflejan en el mar.
    `<g class="rB" opacity="0"><path d="M150 790h160M210 812h120M120 836h200M240 860h90" stroke="#bcd6f0" stroke-width="2" opacity=".5"/></g>` +
    nieblas([[-60, 740, 900, 30, 0.08], [500, 790, 900, 26, 0.07]], true) +
    `<path d="${poli(risco)}" fill="url(#riscoG)"/><g class="rA" opacity="1"><path d="${curva(risco.slice(4, 9))}" stroke="${HIELO}" stroke-width="2" fill="none" opacity=".6"/></g>` +
    `<circle class="carga" cx="${pie[0] + MAZO[0]}" cy="${pie[1] + MAZO[1]}" r="62" fill="url(#mazoG)" opacity=".3"/>` +
    `<g fill="${SOMBRA}" transform="translate(${pie[0]} ${pie[1]})">${dios()}</g>` +
    // La luz del martillo y el filo de luz de la silueta, con el rayo del martillo.
    `<g class="rA" opacity="1"><circle cx="${pie[0] + MAZO[0]}" cy="${pie[1] + MAZO[1]}" r="90" fill="url(#mazoG)"/><path d="${FILO_THOR}" transform="translate(${pie[0]} ${pie[1]})" stroke="#dfe9f2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity=".4"/></g>` +
    `<g stroke="${HIELO}" stroke-width="1.4" stroke-linecap="round">${viento}</g>` +
    nieblas([[700, 840, 900, 40, 0.08]], true) +
    `</svg>`
}

escribir('genera_valhalla.mjs', 'las escenas de la sala Valhalla, solo de noche.', { drakkar, jarl, yggdrasil, thor }, process.argv[2], process.argv[3])
