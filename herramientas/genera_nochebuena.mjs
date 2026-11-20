// Generador de las escenas de la sala Nochebuena de museo-clawd: Abeto, Aldea y Trineo.
// Dibujos propios de la Navidad de siempre: un árbol con sus luces, un pueblo nevado de
// casas de madera y el trineo de Papá Noel delante de la luna. Papá Noel y sus renos van
// en silueta, sin cara ni nada de ninguna película o marca. Solo modo oscuro, con la
// paleta de la sala: verde abeto, rojo navideño, oro cálido, azul noche, blanco nieve y
// ámbar.
//
// El movimiento va en animaciones CSS dentro del <style> de cada escena. Cada elemento
// animado tiene en sus atributos una posición quieta buena, la que se ve con «reducir
// movimiento». Lo que se mueve es pequeño (luces, chispas, copos, humo, patas) o, como el
// trineo, de tamaño medio; lo grande se queda quieto y sin desenfoque, para que la
// aplicación llegue a pintar a tiempo también en pantalla completa. Las clases y los
// fotogramas de cada escena llevan su prefijo (ab-, al-, tr-), para que no se mezclen
// si dos escenas comparten página.
import { CSS_ESTRELLAS, H, W, abrir, azar, banda, curva, escribir, estrellas, giro, horizontal, poli, pt, r1, r2, radial, vertical } from './comun.mjs'

const VERDE = '#173C32'
const ROJO = '#B83B42'
const ORO = '#E3B76A'
const NOCHE = '#15253F'
const NIEVE = '#EDF2EE'
const AMBAR = '#F1C88B'

// Una estrella de cinco puntas con centro (cx, cy), radio de las puntas R y de los
// huecos rr.
function estrella5(cx, cy, R, rr) {
  let d = ''
  for (let k = 0; k < 10; k++) {
    const a = ((-90 + k * 36) * Math.PI) / 180, r = k % 2 ? rr : R
    d += `${k ? 'L' : 'M'}${r1(cx + r * Math.cos(a))} ${r1(cy + r * Math.sin(a))}`
  }
  return d + 'Z'
}

// --- Abeto ------------------------------------------------------------------------
// Un gran árbol de Navidad a la derecha, hecho de seis pisos de ramas que se tapan unos
// a otros, cada uno con su borde de puntas que cuelgan. Lo rodean guirnaldas de luces
// que bajan en espiral, lleva bolas rojas y doradas colgadas de las puntas y una estrella
// arriba que late con su resplandor. Abajo, los regalos sobre la nieve; alrededor, motas
// de oro que suben. El fondo es verde oscuro, con destellos cálidos muy dispersos, y la
// luz sale sobre todo de las guirnaldas.

const CX = 1285
// Cada piso: dónde está su vértice, dónde acaban sus puntas y su medio ancho abajo.
const PISOS = [[268, 365, 64], [305, 445, 104], [360, 530, 142], [420, 615, 178], [485, 700, 212], [552, 785, 244]]
const CIMA = [CX, 238]

// Las puntas de las ramas de un piso y la altura de los arcos entre ellas, calculadas una
// vez para que casen la sombra, el cuerpo y las guirnaldas.
function puntasPiso(r, yb, w) {
  const n = Math.max(3, Math.round((2 * w) / 40))
  const puntas = [], arcos = []
  for (let k = 0; k <= n; k++) {
    const t = k / n, borde = k === 0 || k === n
    puntas.push([CX - w + 2 * w * t + (borde ? 0 : (r() - 0.5) * 9), yb + (borde ? 6 : 5 + r() * 9 + Math.sin(t * Math.PI) * 5)])
  }
  for (let k = 0; k < n; k++) arcos.push(yb - 14 - r() * 9)
  return { puntas, arcos }
}

// El contorno de un piso: del vértice baja por la derecha, vuelve de punta en punta con un
// arco entre cada dos y sube por la izquierda. `alza` sube el borde de abajo y `estrecha`
// lo acerca al eje: así sale el cuerpo claro del piso dentro de su sombra.
function contornoPiso(ya, yb, w, { puntas, arcos }, alza = 0, estrecha = 1) {
  const p = puntas.map(([x, y]) => [CX + (x - CX) * estrecha, y - alza])
  const h = yb - ya, n = p.length - 1
  let d = `M${pt([CX, ya])}Q${pt([CX + w * 0.4 * estrecha, ya + h * 0.62])} ${pt(p[n])}`
  for (let k = n; k > 0; k--) d += `Q${pt([(p[k][0] + p[k - 1][0]) / 2, arcos[k - 1] - alza])} ${pt(p[k - 1])}`
  return d + `Q${pt([CX - w * 0.4 * estrecha, ya + h * 0.62])} ${pt([CX, ya])}Z`
}

// Un punto de un arco cuadrático, para colgar de él las agujas.
const enArco = (a, c, b, t) => [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]

// Las capas de ramas que se ven dentro de un piso: filas de arcos más arriba que el borde,
// en sombra con un filo de luz encima, y las agujas que cuelgan de cada arco del borde.
function texturaPiso(r, ya, yb, w, { puntas, arcos }) {
  let sombras = '', filos = '', agujas = ''
  for (const sube of [36, 72]) {
    const y = yb - sube
    if (y - ya < 34) continue
    const f = (y - ya) / (yb - ya), ancho = w * f * 0.9
    const n = Math.max(2, Math.round((2 * ancho) / 46))
    for (let k = 0; k < n; k++) {
      const a = [CX - ancho + (2 * ancho * k) / n, y + 6 + r() * 4], b = [CX - ancho + (2 * ancho * (k + 1)) / n, y + 6 + r() * 4]
      const c = [(a[0] + b[0]) / 2, y - 14 - r() * 6]
      sombras += `M${pt(a)}Q${pt(c)} ${pt(b)}`
      filos += `M${pt([a[0] + 3, a[1] - 4])}Q${pt([c[0], c[1] - 4])} ${pt([b[0] - 3, b[1] - 4])}`
    }
  }
  for (let k = puntas.length - 1; k > 0; k--) {
    const a = puntas[k], b = puntas[k - 1], c = [(a[0] + b[0]) / 2, arcos[k - 1]]
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const p = enArco(a, c, b, t), lado = p[0] < CX ? -1 : 1
      agujas += `M${pt(p)}l${r1(lado * (1.5 + r() * 2))} ${r1(6 + r() * 4)}`
    }
  }
  return `<path d="${sombras}" stroke="#0f3428" stroke-width="2.2" fill="none" opacity=".55"/>` +
    `<path d="${filos}" stroke="#4a9a73" stroke-width="1.5" fill="none" opacity=".28"/>` +
    `<path d="${agujas}" stroke="#2f7a58" stroke-width="1.3" stroke-linecap="round" fill="none" opacity=".75"/>`
}

// Las luces de la guirnalda de un piso: un hilo que cruza el piso de izquierda a derecha,
// bajando y combándose, por debajo del borde del piso de arriba.
function guirnalda(r, i) {
  const [ya, yb, w] = PISOS[i], arriba = PISOS[i - 1][1] + 24
  const y0 = arriba + r() * 8, y1 = Math.min(yb - 10, y0 + (yb - arriba) * 0.55)
  const ancho = y => w * ((y - ya) / (yb - ya)) * 0.84
  const x0 = CX - ancho(y0), x1 = CX + ancho(y1)
  const n = Math.max(4, Math.round((x1 - x0) / 24))
  const puntos = []
  for (let k = 0; k <= n; k++) {
    const t = k / n
    puntos.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 15])
  }
  return puntos
}

// Una luz de la guirnalda: el punto encendido y su halo, que se apagan y se encienden
// suavemente, cada una a su ritmo.
const LUCES = [['#fff1cf', 'hB'], ['#ffd88f', 'hA'], ['#ffd88f', 'hA'], ['#ffe6b0', 'hB'], ['#ff8f94', 'hR']]
function luz(r, [x, y]) {
  const [color, halo] = LUCES[Math.floor(r() * LUCES.length)]
  const dur = r1(2.2 + r() * 2.8), ret = r1(r() * dur)
  return `<g class="ab-luz" style="animation-duration:${dur}s;animation-delay:-${ret}s"><circle cx="${r1(x)}" cy="${r1(y)}" r="27" fill="url(#${halo})"/><circle cx="${r1(x)}" cy="${r1(y)}" r="4.6" fill="${color}"/><circle cx="${r1(x - 1)}" cy="${r1(y - 1)}" r="1.8" fill="#fffdf4"/></g>`
}

// Una bola colgada de una punta de rama: el hilo, el casquillo, la bola con su degradado
// y el reflejo.
function bola(x, y, R, tipo) {
  return `<path d="M${r1(x)} ${r1(y - R - 7)}V${r1(y - R)}" stroke="#c9a457" stroke-width="1"/>` +
    `<rect x="${r1(x - R * 0.3)}" y="${r1(y - R - 2.6)}" width="${r1(R * 0.6)}" height="3.2" fill="#d9b56c"/>` +
    `<circle cx="${r1(x)}" cy="${r1(y)}" r="${R}" fill="url(#bola${tipo})"/>` +
    `<circle cx="${r1(x - R * 0.36)}" cy="${r1(y - R * 0.38)}" r="${r1(R * 0.22)}" fill="#fff" opacity=".55"/>`
}

// Un regalo: su sombra en la nieve, la caja con su sombreado, la tapa algo más ancha y más
// clara, la cinta y el lazo.
function regalo(x, b, w, h, color, cinta) {
  const tapa = 12, y = b - h, cx = x + w / 2
  return `<ellipse cx="${cx + 6}" cy="${b + 1}" rx="${r1(w * 0.62)}" ry="6" fill="#0d1f19" opacity=".35"/>` +
    `<rect x="${x}" y="${y + tapa - 2}" width="${w}" height="${h - tapa + 2}" fill="${color}"/>` +
    `<rect x="${x}" y="${y + tapa - 2}" width="${w}" height="${h - tapa + 2}" fill="url(#sombraCaja)"/>` +
    `<rect x="${x + w * 0.5 - 5}" y="${y}" width="10" height="${h}" fill="${cinta}"/>` +
    `<rect x="${x - 4}" y="${y}" width="${w + 8}" height="${tapa}" rx="1.5" fill="${color}"/>` +
    `<rect x="${x - 4}" y="${y}" width="${w + 8}" height="${tapa}" rx="1.5" fill="url(#luzTapa)"/>` +
    `<rect x="${x + w * 0.5 - 5}" y="${y}" width="10" height="${tapa}" fill="${cinta}"/>` +
    `<path d="M${cx} ${y}C${cx - 8} ${y - 19} ${cx - 26} ${y - 13} ${cx - 15} ${y - 1}ZM${cx} ${y}C${cx + 8} ${y - 19} ${cx + 26} ${y - 13} ${cx + 15} ${y - 1}Z" fill="${cinta}"/>` +
    `<path d="M${cx} ${y}C${cx - 7} ${y - 14} ${cx - 19} ${y - 10} ${cx - 12} ${y - 2}" stroke="#000" stroke-opacity=".25" stroke-width="1.2" fill="none"/>` +
    `<circle cx="${cx}" cy="${y - 2}" r="4.4" fill="${cinta}"/><circle cx="${cx - 1.2}" cy="${y - 3.4}" r="1.4" fill="#fff" opacity=".5"/>`
}

// Motas de oro que suben y derivan alrededor del árbol, cada una a su ritmo. Quietas, se
// quedan donde están, medio encendidas.
function motas(r, n, x0, x1, y0, y1) {
  let s = ''
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), d = r1(7 + r() * 7)
    s += `<circle class="ab-mota" style="animation-duration:${d}s;animation-delay:-${r1(r() * d)}s;--dx:${r1((r() - 0.5) * 50)}px;--sube:-${r1(70 + r() * 80)}px" cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.9 + r() * 1.6)}" opacity="${r2(0.3 + r() * 0.45)}"/>`
  }
  return s
}

function abeto() {
  const r = azar(2412)
  // Los destellos cálidos del fondo, muy dispersos, y unas luces desenfocadas, quietas o
  // que titilan despacio, lejos del árbol.
  let bokeh = ''
  for (let i = 0; i < 16; i++) {
    const x = r() * W, y = 60 + r() * 820
    if (x > 980 && x < 1590 && y > 170 && y < 840) continue
    const clase = i % 3 === 1 ? ` class="c${1 + (i % 3)}"` : ''
    bokeh += `<circle${clase} cx="${r1(x)}" cy="${r1(y)}" r="${r1(12 + r() * 26)}" fill="url(#bokeh)" opacity="${r2(0.45 + r() * 0.5)}"/>`
  }
  // El árbol, de abajo arriba: cada piso tapa el de debajo, y la guirnalda y las bolas de
  // cada piso van entre él y el de encima.
  let arbol = ''
  const datos = PISOS.map(([, yb, w]) => puntasPiso(r, yb, w))
  for (let i = PISOS.length - 1; i >= 0; i--) {
    const [ya, yb, w] = PISOS[i], p = datos[i]
    arbol += `<path d="${contornoPiso(ya, yb, w, p)}" fill="#113a2c"/>` +
      `<path d="${contornoPiso(ya, yb, w, p, 6, 0.982)}" fill="url(#ramas)"/>` +
      `<path d="${contornoPiso(ya, yb, w, p, 6, 0.982)}" fill="url(#calor)"/>` +
      texturaPiso(r, ya, yb, w, p)
    if (i > 0) {
      const hilo = guirnalda(r, i)
      arbol += `<path d="${curva(hilo)}" stroke="#08180f" stroke-width="1.2" fill="none" opacity=".8"/>` + hilo.slice(1, -1).map(q => luz(r, q)).join('')
    }
    // Las bolas cuelgan de algunas puntas, unas rojas y otras doradas.
    p.puntas.forEach(([x, y], k) => {
      if (k === 0 || k === p.puntas.length - 1 || (k + i) % 3 !== 1) return
      const R = r1(6.5 + i * 0.9 + r() * 1.5)
      arbol += bola(x, y + R + 6, R, (k + i) % 2 ? 'R' : 'O')
    })
  }
  // La estrella: el resplandor y los rayos, que laten juntos, y la estrella con sus caras
  // de luz y de sombra.
  let rayos = '', caras = ''
  // Los rayos son cuñas finas que se afilan hacia fuera.
  for (let k = 0; k < 8; k++) {
    const a = ((k * 45 + 22.5) * Math.PI) / 180, largo = k % 2 ? 62 : 98, c = Math.cos(a), s = Math.sin(a)
    rayos += `M${r1(30 * c - 3.4 * s)} ${r1(30 * s + 3.4 * c)}L${r1(largo * c)} ${r1(largo * s)}L${r1(30 * c + 3.4 * s)} ${r1(30 * s - 3.4 * c)}Z`
  }
  for (let k = 0; k < 5; k++) {
    const a = ((-90 + k * 72) * Math.PI) / 180, b = ((-90 + k * 72 - 36) * Math.PI) / 180, c = ((-90 + k * 72 + 36) * Math.PI) / 180
    const punta = [42 * Math.cos(a), 42 * Math.sin(a)], antes = [17 * Math.cos(b), 17 * Math.sin(b)], despues = [17 * Math.cos(c), 17 * Math.sin(c)]
    caras += `<path d="${poli([[0, 0], antes, punta])}" fill="#fff6dc" opacity=".38"/><path d="${poli([[0, 0], punta, despues])}" fill="#8a5f22" opacity=".3"/>`
  }
  // La nieve del suelo, encendida por el árbol, y sus brillos.
  const suelo = curva([[-20, 872], [420, 858], [860, 838], [CX, 810], [1620, 828]])
  let brillos = ''
  for (let i = 0; i < 36; i++) {
    const x = 860 + r() * 740, y = 830 + r() * 160
    brillos += `<circle${i % 3 === 0 ? ` class="c${1 + (i % 3)}"` : ''} cx="${r1(x)}" cy="${r1(y)}" r="${r1(0.8 + r() * 1.1)}" fill="#fffaf0" opacity="${r2(0.35 + r() * 0.5)}"/>`
  }
  const defs = `<defs>
${radial('fondo', CX, 520, 1150, [[0, '#24533f'], [0.45, VERDE], [1, '#0a1915']])}
${radial('resplandor', CX, 540, 580, [[0, AMBAR, 0.16], [0.6, ORO, 0.05], [1, ORO, 0]])}
${horizontal('ramas', CX - 260, CX + 260, [[0, '#0d2b22'], [0.3, '#1b5140'], [0.52, '#215e48'], [0.78, '#184436'], [1, '#0c2820']])}
${radial('calor', CX - 30, 560, 380, [[0, '#ffcf87', 0.2], [0.6, '#ffcf87', 0.07], [1, '#ffcf87', 0]])}
${radial('nieveA', CX, 830, 860, [[0, '#cfcdbb'], [0.25, '#98a89e'], [0.55, '#466559'], [1, '#17302a']])}
${horizontal('bordeN', 700, 1600, [[0, '#f4efe0', 0], [0.45, '#f4efe0', 0.5], [1, '#f4efe0', 0.12]])}
<radialGradient id="bokeh"><stop offset="0" stop-color="${AMBAR}" stop-opacity=".16"/><stop offset=".7" stop-color="${AMBAR}" stop-opacity=".09"/><stop offset="1" stop-color="${AMBAR}" stop-opacity="0"/></radialGradient>
<radialGradient id="hA"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".9"/><stop offset=".3" stop-color="#ffcf7a" stop-opacity=".32"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
<radialGradient id="hB"><stop offset="0" stop-color="#fff0c8" stop-opacity=".9"/><stop offset=".3" stop-color="#fff0c8" stop-opacity=".3"/><stop offset="1" stop-color="#fff0c8" stop-opacity="0"/></radialGradient>
<radialGradient id="hR"><stop offset="0" stop-color="#ff7d84" stop-opacity=".85"/><stop offset=".3" stop-color="#ff7d84" stop-opacity=".28"/><stop offset="1" stop-color="#ff7d84" stop-opacity="0"/></radialGradient>
<radialGradient id="bolaR" cx=".36" cy=".34" r=".72"><stop offset="0" stop-color="#f29a9d"/><stop offset=".45" stop-color="${ROJO}"/><stop offset="1" stop-color="#5b151b"/></radialGradient>
<radialGradient id="bolaO" cx=".36" cy=".34" r=".72"><stop offset="0" stop-color="#fff0c4"/><stop offset=".45" stop-color="${ORO}"/><stop offset="1" stop-color="#7d5a25"/></radialGradient>
<radialGradient id="halo"><stop offset="0" stop-color="#ffeab4" stop-opacity=".8"/><stop offset=".22" stop-color="${AMBAR}" stop-opacity=".34"/><stop offset="1" stop-color="${ORO}" stop-opacity="0"/></radialGradient>
<radialGradient id="estrella" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fff8e0"/><stop offset=".5" stop-color="#f3d38f"/><stop offset="1" stop-color="#c48f3e"/></radialGradient>
<linearGradient id="sombraCaja" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>
<linearGradient id="luzTapa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>`
  const estilo = CSS_ESTRELLAS +
    '.ab-luz{animation-name:ab-luz;animation-timing-function:ease-in-out;animation-iteration-count:infinite}@keyframes ab-luz{0%,100%{opacity:1}50%{opacity:.25}}' +
    '.ab-brillo{animation:ab-brillo 3.6s ease-in-out infinite}@keyframes ab-brillo{0%,100%{opacity:.5;transform:scale(.88)}50%{opacity:1;transform:scale(1.1)}}' +
    '.ab-mota{animation-name:ab-mota;animation-timing-function:linear;animation-iteration-count:infinite}' +
    '@keyframes ab-mota{0%{transform:translate(0px,0px);opacity:0}20%{opacity:.9}75%{opacity:.55}100%{transform:translate(var(--dx),var(--sube));opacity:0}}'
  return abrir('#0a1915', estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#fondo)"/><circle cx="${CX}" cy="540" r="580" fill="url(#resplandor)"/>` +
    bokeh + estrellas(2413, 70, 20, 980, AMBAR) +
    // El tronco asoma bajo el último piso.
    `<rect x="${CX - 14}" y="770" width="28" height="62" fill="#3a2618"/><rect x="${CX - 14}" y="770" width="10" height="62" fill="#1f140c" opacity=".6"/>` +
    arbol +
    `<g transform="translate(${CIMA[0]} ${CIMA[1]})"><g class="ab-brillo" opacity=".85"><circle r="175" fill="url(#halo)"/><path d="${rayos}" fill="#fff1c8" opacity=".42"/></g>` +
    `<path d="${estrella5(0, 0, 42, 17)}" fill="url(#estrella)"/>${caras}<path d="${estrella5(0, 0, 42, 17)}" fill="none" stroke="#fff4d2" stroke-width="1.6" stroke-linejoin="round"/></g>` +
    `<path d="${suelo}L1620 1020L-20 1020Z" fill="url(#nieveA)"/><path d="${suelo}" stroke="url(#bordeN)" stroke-width="2.4" fill="none"/>` + brillos +
    regalo(1112, 836, 92, 66, ROJO, ORO) + regalo(1208, 842, 60, 44, ORO, ROJO) + regalo(1322, 838, 104, 78, '#2b4a78', NIEVE) +
    regalo(1436, 834, 70, 50, '#dfe6e1', ROJO) +
    `<g fill="#f3d58f">${motas(r, 42, 1000, 1580, 190, 800)}</g>` +
    `</svg>`
}

// --- Aldea ------------------------------------------------------------------------
// Un pueblo pequeño de casas de madera con los tejados empinados cubiertos de nieve, en
// unas colinas suaves y nevadas bajo un cielo azul noche. Las ventanas dan luz ámbar, sale
// humo de las chimeneas y hay abetos nevados entre las casas. Una luna discreta, arriba a
// la derecha, ilumina los tejados. La nieve cae en tres planos, unas ventanas cambian un
// poco de intensidad y otra se apaga de vez en cuando, como si alguien pasara por delante.

const lejos = x => 598 - 26 * Math.sin(x / 250 + 0.5) - 14 * Math.sin(x / 120 + 1.3)
const medio = x => 676 - 34 * Math.sin(x / 300 + 2.1) - 12 * Math.sin(x / 140 + 0.4)
const cerca = x => 806 - 30 * Math.sin(x / 380 + 0.8) - 10 * Math.sin(x / 160 + 2)
const linea = f => { const p = []; for (let x = -40; x <= W + 40; x += 40) p.push([x, f(x)]); return curva(p) }
const colina = (f, abajo) => `${linea(f)}L${W + 40} ${abajo}L-40 ${abajo}Z`

// Una ventana encendida: el halo, el cristal ámbar con su marco y su cruz, y la nieve del
// alféizar. `clase` la hace latir o apagarse.
function ventana(x, y, w, h, clase = '', estilo = '') {
  const c = clase ? ` class="${clase}" style="${estilo}"` : ''
  return `<g${c}><ellipse cx="${r1(x + w / 2)}" cy="${r1(y + h / 2)}" rx="${r1(w * 1.9)}" ry="${r1(h * 1.7)}" fill="url(#halo)"/>` +
    `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="url(#cristal)"/></g>` +
    `<path d="M${r1(x + w / 2)} ${r1(y)}V${r1(y + h)}M${r1(x)} ${r1(y + h * 0.45)}H${r1(x + w)}" stroke="#2a1a10" stroke-width="1.6"/>` +
    `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" fill="none" stroke="#24170f" stroke-width="2"/>` +
    `<rect x="${r1(x - 2)}" y="${r1(y + h)}" width="${r1(w + 4)}" height="3" rx="1.5" fill="${NIEVE}" opacity=".85"/>`
}

// Una casa de madera vista de frente, con el costado hacia la derecha si `L` no es cero:
// la fachada con su hastial, el costado que se aleja, el tejado nevado con su alero y sus
// carámbanos, la chimenea y las ventanas. Devuelve el dibujo y la boca de la chimenea.
function casa(r, { x, b, w, h, L = 0, ventanas = [], lado = [], puerta = false, corona = false, chimenea = true, ojo = true, tono = 1 }) {
  const g = w * 0.62, k = 0.34, alero = 7
  const cumbre = [x + w / 2, b - h - g]
  const pared = tono === 1 ? '#4a3326' : '#3a2a22', costado = tono === 1 ? '#33241b' : '#2a1f19'
  let s = ''
  // El costado y el tejado que se alejan.
  if (L) {
    s += `<path d="${poli([[x + w, b], [x + w + L, b - L * k], [x + w + L, b - h - L * k], [x + w, b - h]])}" fill="${costado}"/>`
    let tablas = ''
    for (let y = b - h + 9; y < b; y += 9) tablas += `M${x + w} ${r1(y)}L${r1(x + w + L)} ${r1(y - L * k)}`
    s += `<path d="${tablas}" stroke="#1d140e" stroke-width="1" opacity=".7"/>`
    for (const [u, v, a, al] of lado) {
      const x0 = x + w + u * L
      s += `<g transform="matrix(1 ${-k} 0 1 0 ${r2(k * (x + w))})">${ventana(x0, b - h + v, a, al)}</g>`
    }
    const techo = [cumbre, [cumbre[0] + L, cumbre[1] - L * k], [x + w + L + alero, b - h - L * k + alero * 0.8], [x + w + alero, b - h + alero * 0.8]]
    s += `<path d="${poli(techo)}" fill="url(#tejado)"/>`
    // Los carámbanos bajo el alero del costado.
    let hielo = ''
    for (let t = 0.06; t < 0.97; t += 0.07 + r() * 0.05) {
      const px = x + w + alero + L * t, py = b - h + alero * 0.8 - L * k * t + 1, largo = 4 + r() * 8
      hielo += `M${r1(px - 1.6)} ${r1(py)}L${r1(px)} ${r1(py + largo)}L${r1(px + 1.6)} ${r1(py)}Z`
    }
    s += `<path d="${hielo}" fill="#dce8f1" opacity=".85"/>`
  }
  // La fachada con sus tablas.
  s += `<path d="${poli([[x, b], [x + w, b], [x + w, b - h], cumbre, [x, b - h]])}" fill="${pared}"/>`
  let tablas = ''
  for (let y = b - 9; y > cumbre[1] + 6; y -= 9) {
    const medioAncho = y >= b - h ? w / 2 : ((y - cumbre[1]) / g) * (w / 2)
    tablas += `M${r1(cumbre[0] - medioAncho)} ${r1(y)}H${r1(cumbre[0] + medioAncho)}`
  }
  s += `<path d="${tablas}" stroke="#2b1d14" stroke-width="1" opacity=".7"/>`
  for (const [u, v, a, al] of ventanas) s += ventana(x + u, b - h + v, a, al)
  if (ojo) s += ventana(cumbre[0] - w * 0.06, cumbre[1] + g * 0.42, w * 0.12, w * 0.12)
  if (puerta) {
    const pw = w * 0.2, ph = h * 0.56, px = x + w / 2 - pw / 2
    s += `<rect x="${r1(px)}" y="${r1(b - ph)}" width="${r1(pw)}" height="${r1(ph)}" fill="#24170f"/><rect x="${r1(px + 2)}" y="${r1(b - ph + 2)}" width="${r1(pw - 4)}" height="${r1(ph - 2)}" fill="#3a2516"/>`
    if (corona) {
      const cx = x + w / 2, cy = b - ph * 0.68
      s += `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="7.5" stroke="#2f6b4c" stroke-width="4.6" fill="none"/><circle cx="${r1(cx)}" cy="${r1(cy)}" r="7.5" stroke="#4f9a6c" stroke-width="1.2" stroke-dasharray="2 3" fill="none"/>` +
        `<path d="M${r1(cx)} ${r1(cy + 7)}l-5 4 1 -6zM${r1(cx)} ${r1(cy + 7)}l5 4 -1 -6z" fill="${ROJO}"/>`
    }
  }
  // La nieve del hastial, gruesa, que sobresale por los aleros.
  const borde = [[x - alero, b - h + alero * 0.8], cumbre, [x + w + alero, b - h + alero * 0.8]]
  s += `<path d="${banda(borde, () => 11)}" fill="url(#hastial)"/>`
  // La chimenea, sobre el tejado del costado o, si no hay costado, sobre la fachada.
  let boca = null
  if (chimenea) {
    const base = L ? [cumbre[0] + L * 0.6 + (w / 2 + alero) * 0.3, cumbre[1] - L * 0.6 * k + g * 0.3] : [x + w * 0.72, b - h - g * 0.42]
    const cw = 13, ch = 26
    s += `<rect x="${r1(base[0] - cw / 2)}" y="${r1(base[1] - ch)}" width="${cw}" height="${ch + 6}" fill="#3b2a25"/><rect x="${r1(base[0] + cw / 2 - 4)}" y="${r1(base[1] - ch)}" width="4" height="${ch + 6}" fill="#2a1d19"/>` +
      `<rect x="${r1(base[0] - cw / 2 - 2.5)}" y="${r1(base[1] - ch - 5)}" width="${cw + 5}" height="6" rx="3" fill="${NIEVE}"/>`
    boca = [base[0], base[1] - ch - 7]
  }
  return { dibujo: s, boca }
}

// Un abeto nevado: pisos verdes oscuros con la nieve encima, más clara del lado de la luna.
function abetoNevado(r, x, b, h, tono = '#173a30') {
  const n = 4, w = h * 0.34
  let verde = '', nieve = ''
  for (let i = 0; i < n; i++) {
    const ya = b - h + h * 0.19 * i, yb = b - h + h * 0.34 + h * 0.2 * i, a = w * (0.42 + (0.58 * (i + 1)) / n)
    const puntas = 3 + i
    let borde = ''
    for (let k = puntas; k >= 0; k--) {
      const px = x - a + (2 * a * k) / puntas, py = yb + (k % 2 ? 2 : 4) + r() * 2
      borde += `L${r1(px)} ${r1(py)}`
    }
    verde += `M${r1(x)} ${r1(ya)}${borde.replace(/^L/, `L${r1(x + a)} ${r1(yb + 3)}L`)}Z`
    const yn = ya + (yb - ya) * 0.55, an = a * 0.6
    nieve += `M${r1(x)} ${r1(ya - 1)}L${r1(x + an)} ${r1(yn)}Q${r1(x + an * 0.5)} ${r1(yn - 5)} ${r1(x)} ${r1(yn + 1)}Q${r1(x - an * 0.5)} ${r1(yn - 5)} ${r1(x - an)} ${r1(yn)}Z`
  }
  return `<rect x="${r1(x - h * 0.03)}" y="${r1(b - h * 0.08)}" width="${r1(h * 0.06)}" height="${r1(h * 0.1)}" fill="#2a1d15"/>` +
    `<path d="${verde}" fill="${tono}"/><path d="${nieve}" fill="url(#nieveAbeto)"/>`
}

// El humo de una chimenea: bocanadas que suben, se ensanchan, tuercen con el aire y se
// deshacen. Quietas, forman la columna de humo, cada vez más ancha y más tenue.
function humo([x, y], escala = 1, n = 8) {
  let s = `<g transform="translate(${r1(x)} ${r1(y)}) scale(${escala})">`
  for (let i = 0; i < n; i++) {
    const t = (i + 0.6) / n
    s += `<circle class="al-humo" style="animation-delay:-${r2(8 * (i / n))}s" r="11" fill="url(#bocanada)" transform="translate(${r1(36 * t * t)} ${r1(-160 * t)}) scale(${r2(0.7 + 2 * t)})" opacity="${r2(0.9 * (1 - t) + 0.1)}"/>`
  }
  return s + '</g>'
}

// Los copos de una capa: cada copo va dos veces, una en su sitio y otra mil unidades más
// arriba, para que la caída no dé saltos al volver a empezar.
function copos(r, n, rmin, rmax, omin, omax) {
  let s = ''
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, rr = r1(rmin + r() * (rmax - rmin)), o = r2(omin + r() * (omax - omin))
    s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${rr}" opacity="${o}"/><circle cx="${r1(x)}" cy="${r1(y - H)}" r="${rr}" opacity="${o}"/>`
  }
  return s
}

function aldea() {
  const r = azar(1224)
  const luna = [1392, 238]
  // Las casas: tres grandes delante, a la derecha; tres pequeñas detrás, en la colina del
  // medio; y a la izquierda, lejos, dos casitas y una ermita.
  const delante = [
    casa(r, { x: 1000, b: cerca(1056) + 8, w: 112, h: 74, L: 38, ventanas: [[16, 24, 20, 22], [76, 24, 20, 22]], lado: [[0.3, 22, 14, 20]] }),
    casa(r, { x: 1190, b: cerca(1265) + 10, w: 150, h: 96, L: 48, ventanas: [[20, 26, 24, 26], [106, 26, 24, 26]], lado: [[0.22, 26, 16, 24], [0.62, 26, 16, 24]], puerta: true, corona: true }),
    casa(r, { x: 1440, b: cerca(1492) + 8, w: 104, h: 72, L: 30, ventanas: [[41, 26, 22, 22]], lado: [[0.35, 24, 12, 18]] }),
  ]
  const detras = [
    casa(r, { x: 1098, b: medio(1126) + 6, w: 56, h: 34, L: 18, ventanas: [[10, 12, 10, 11], [36, 12, 10, 11]], tono: 2, ojo: false }),
    casa(r, { x: 1318, b: medio(1350) + 6, w: 64, h: 38, L: 20, ventanas: [[24, 12, 14, 13]], tono: 2, ojo: false }),
    casa(r, { x: 1524, b: medio(1550) + 6, w: 52, h: 32, L: 16, ventanas: [[18, 11, 12, 11]], tono: 2, ojo: false, chimenea: false }),
  ]
  const izquierda = [
    casa(r, { x: 170, b: medio(192) + 5, w: 44, h: 26, L: 12, ventanas: [[16, 9, 10, 9]], tono: 2, ojo: false }),
    casa(r, { x: 300, b: medio(325) + 5, w: 50, h: 28, L: 14, ventanas: [[8, 10, 9, 9], [32, 10, 9, 9]], tono: 2, ojo: false, chimenea: false }),
  ]
  // La ermita: una nave pequeña con su campanario.
  const ex = 430, eb = medio(450) + 5
  const ermita = casa(r, { x: ex, b: eb, w: 40, h: 30, L: 30, ventanas: [[15, 8, 10, 14]], tono: 2, ojo: false, chimenea: false }).dibujo +
    `<rect x="${ex + 8}" y="${r1(eb - 30 - 70)}" width="24" height="46" fill="#3a2a22"/>${ventana(ex + 15, eb - 30 - 58, 10, 12, 'al-vela', 'animation-duration:5.2s')}` +
    `<path d="${poli([[ex + 4, eb - 100], [ex + 20, eb - 146], [ex + 36, eb - 100]])}" fill="url(#hastial)"/><path d="M${ex + 20} ${eb - 146}V${eb - 160}M${ex + 14} ${eb - 154}H${ex + 26}" stroke="#d9c7a0" stroke-width="2"/>`
  // Abetos nevados: detrás de las casas, entre ellas y a la izquierda.
  const abetosLejos = [[1000, medio(1000), 70], [1205, medio(1205), 84], [1268, medio(1268), 62], [1460, medio(1460), 78], [1590, medio(1590), 66],
    [120, medio(120), 58], [262, medio(262), 66], [380, medio(380), 52], [540, medio(540), 60], [600, medio(600), 44]]
    .map(([x, b, h]) => abetoNevado(r, x, b + 4, h, '#14322b')).join('')
  const abetosCerca = [[958, cerca(958), 146], [1168, cerca(1168), 92], [1414, cerca(1414), 126], [1596, cerca(1596), 154]]
    .map(([x, b, h]) => abetoNevado(r, x, b + 12, h)).join('')
  // La luz de las ventanas en la nieve, delante de las casas grandes.
  const charcos = [[1060, cerca(1060) + 14, 80], [1268, cerca(1268) + 16, 110], [1494, cerca(1494) + 14, 70]]
    .map(([x, y, a]) => `<ellipse cx="${x}" cy="${r1(y)}" rx="${a}" ry="${r1(a * 0.16)}" fill="url(#charco)"/>`).join('')
  // Algunas ventanas laten como una vela y una se apaga de vez en cuando.
  const latidos = (s, semilla) => {
    const rr = azar(semilla)
    let i = 0
    return s.replace(/<g><ellipse/g, m => {
      i += 1
      if (i % 3 === 1) return `<g class="al-vela" style="animation-duration:${r1(3.2 + rr() * 2.6)}s;animation-delay:-${r1(rr() * 4)}s"><ellipse`
      if (i === 5) return `<g class="al-apaga" style="animation-delay:-${r1(rr() * 14)}s"><ellipse`
      return m
    })
  }
  const casas = latidos(delante.map(c => c.dibujo).join(''), 77)
  const casasDetras = latidos(detras.map(c => c.dibujo).join('') + izquierda.map(c => c.dibujo).join(''), 78)
  const bocas = [...detras, ...izquierda].map(c => c.boca).filter(Boolean).map(b => humo(b, 0.55)).join('') +
    delante.map(c => c.boca).filter(Boolean).map(b => humo(b, 1)).join('')
  const defs = `<defs>
${vertical('cielo', 0, 700, [[0, '#0a1428'], [0.55, NOCHE], [1, '#26406a']])}
${radial('luz', luna[0], luna[1], 160, [[0, '#dfe8f2', 0.26], [1, '#dfe8f2', 0]])}
${vertical('lejos', 560, 700, [[0, '#33507a'], [1, '#22385a']])}
${vertical('medio', 620, 760, [[0, '#5a7398'], [1, '#3c5477']])}
${vertical('cerca', 760, 1000, [[0, '#7f95b0'], [1, '#4b6282']])}
<radialGradient id="bocanada"><stop offset="0" stop-color="#d3dce7" stop-opacity=".7"/><stop offset=".55" stop-color="#c8d2de" stop-opacity=".34"/><stop offset="1" stop-color="#c8d2de" stop-opacity="0"/></radialGradient>
${vertical('tejado', 500, 820, [[0, '#f3f7f9'], [1, '#b9c8d6']])}
${horizontal('hastial', 1000, 1600, [[0, '#cfdbe6'], [1, '#f1f5f8']])}
${horizontal('nieveAbeto', 0, 1600, [[0, '#b6c6d6'], [1, '#eef3f6']])}
<radialGradient id="halo"><stop offset="0" stop-color="#ffd38f" stop-opacity=".55"/><stop offset="1" stop-color="#ffd38f" stop-opacity="0"/></radialGradient>
<radialGradient id="charco"><stop offset="0" stop-color="${AMBAR}" stop-opacity=".22"/><stop offset="1" stop-color="${AMBAR}" stop-opacity="0"/></radialGradient>
<linearGradient id="cristal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a8"/><stop offset="1" stop-color="#e9a95a"/></linearGradient>
</defs>`
  const estilo = CSS_ESTRELLAS +
    '.al-humo{animation:al-humo 8s linear infinite}@keyframes al-humo{0%{transform:translate(0px,0px) scale(.6);opacity:0}12%{opacity:.95}50%{transform:translate(9px,-82px) scale(1.7);opacity:.6}100%{transform:translate(38px,-170px) scale(2.9);opacity:0}}' +
    '.al-vela{animation-name:al-vela;animation-timing-function:ease-in-out;animation-iteration-count:infinite}@keyframes al-vela{0%,100%{opacity:1}30%{opacity:.6}55%{opacity:.92}72%{opacity:.5}}' +
    '.al-apaga{animation:al-apaga 14s ease-in-out infinite}@keyframes al-apaga{0%,60%,94%,100%{opacity:1}66%,88%{opacity:.08}}' +
    '.al-c1{animation:al-cae 64s linear infinite}.al-c2{animation:al-cae 40s linear infinite}.al-c3{animation:al-cae 25s linear infinite}@keyframes al-cae{to{transform:translateY(1000px)}}' +
    '.al-v1{animation:al-vaiven 9s ease-in-out infinite alternate}.al-v2{animation:al-vaiven 6.5s ease-in-out -2s infinite alternate}.al-v3{animation:al-vaiven2 5s ease-in-out -1s infinite alternate}' +
    '@keyframes al-vaiven{from{transform:translateX(-14px)}to{transform:translateX(14px)}}@keyframes al-vaiven2{from{transform:translateX(-26px)}to{transform:translateX(26px)}}'
  return abrir('#0a1428', estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#cielo)"/>` + estrellas(1225, 120, 0, 520) +
    // La luna, pequeña, con su halo.
    `<circle cx="${luna[0]}" cy="${luna[1]}" r="200" fill="url(#luz)"/><circle cx="${luna[0]}" cy="${luna[1]}" r="38" fill="#f2efe3"/>` +
    `<g fill="#cfd4d8" opacity=".35"><circle cx="${luna[0] - 12}" cy="${luna[1] - 6}" r="8"/><circle cx="${luna[0] + 10}" cy="${luna[1] + 12}" r="6"/><circle cx="${luna[0] + 8}" cy="${luna[1] - 14}" r="4"/></g>` +
    `<path d="${colina(lejos, 1000)}" fill="url(#lejos)"/><path d="${linea(lejos)}" stroke="#a9bdd3" stroke-width="2" fill="none" opacity=".25"/>` +
    `<g fill="${NIEVE}"><g class="al-v1"><g class="al-c1">${copos(r, 90, 0.6, 1.1, 0.3, 0.55)}</g></g></g>` +
    `<path d="${colina(medio, 1000)}" fill="url(#medio)"/><path d="${linea(medio)}" stroke="#d2deea" stroke-width="2" fill="none" opacity=".35"/>` +
    abetosLejos + casasDetras + ermita +
    `<g fill="#c8d2de">${bocas}</g>` +
    `<g fill="${NIEVE}"><g class="al-v2"><g class="al-c2">${copos(r, 55, 1.3, 2, 0.45, 0.7)}</g></g></g>` +
    `<path d="${colina(cerca, 1000)}" fill="url(#cerca)"/><path d="${linea(cerca)}" stroke="#eef3f7" stroke-width="2.4" fill="none" opacity=".4"/>` +
    charcos + casas + abetosCerca +
    `<g fill="${NIEVE}"><g class="al-v3"><g class="al-c3">${copos(r, 28, 2.3, 3.4, 0.6, 0.9)}</g></g></g>` +
    `</svg>`
}

// --- Trineo -----------------------------------------------------------------------
// La silueta de Papá Noel en su trineo, tirado por cuatro renos, cruza el cielo de noche
// delante de una luna grande y luminosa. Debajo, un bosque de abetos oscuros y montañas
// nevadas muy sencillas. El trineo avanza despacio, los renos galopan y deja una estela
// de chispas de oro que se apagan poco a poco.

// La luna y el trineo van a la derecha del todo, para que Papá Noel no quede detrás del
// cristal de la conversación en una ventana ancha.
const LUNA = [1300, 410], RL = 228
const SILUETA = '#0c1525'

// Una cordillera de caras planas: la cara de cada pico que mira a la luna, clara; la
// otra, en sombra; y la nieve de las cumbres, con el borde de abajo en dientes.
function cordillera(r, picos, base, colores) {
  const [sombra, luz, nieveLuz, nieveSombra] = colores
  const p = [[-40, base], ...picos, [W + 40, base]]
  let caras = '', nieve = ''
  for (let i = 1; i < p.length - 1; i++) {
    const c = p[i]
    if (!(c[1] < p[i - 1][1] && c[1] < p[i + 1][1])) continue
    const hacia = c[0] < LUNA[0] ? 1 : -1, valle = p[i + hacia]
    caras += `M${pt(c)}L${pt(valle)}L${pt([valle[0], base])}L${pt([c[0] - hacia * 24, base])}Z`
    // La nieve: hasta un tercio de la bajada a cada lado, con dientes.
    const a = p[i - 1], b = p[i + 1], f = 0.34
    const izq = [c[0] + (a[0] - c[0]) * f, c[1] + (a[1] - c[1]) * f], der = [c[0] + (b[0] - c[0]) * f, c[1] + (b[1] - c[1]) * f]
    let dientes = ''
    for (let k = 1; k < 5; k++) {
      const t = k / 5, x = izq[0] + (der[0] - izq[0]) * t, y = izq[1] + (der[1] - izq[1]) * t + (k % 2 ? 10 + r() * 8 : -2)
      dientes += `L${pt([x, y])}`
    }
    const lado = hacia > 0 ? [c, der] : [izq, c]
    nieve += `<path d="M${pt(c)}L${pt(der)}${dientes.split('L').reverse().filter(Boolean).map(q => `L${q}`).join('')}L${pt(izq)}Z" fill="${nieveSombra}"/>`
    nieve += `<path d="M${pt(c)}L${pt(lado[hacia > 0 ? 1 : 0])}L${pt([c[0] + hacia * 6, c[1] + 40])}Z" fill="${nieveLuz}"/>`
  }
  return `<path d="${poli(p)}" fill="${sombra}"/><path d="${caras}" fill="${luz}"/>` + nieve
}

// Una fila de abetos en silueta, de lado a lado, con los bordes en dientes de sierra.
function bosque(r, base, hmin, hmax, paso, color, nevados = 0) {
  let d = '', nieve = ''
  for (let x = -30 + r() * paso; x < W + 30; x += paso * (0.6 + r() * 0.7)) {
    const h = hmin + r() * (hmax - hmin), w = h * (0.3 + r() * 0.06), n = 5, b = base + r() * 14
    const der = [], izq = []
    for (let k = 1; k <= n; k++) {
      const t = k / n, y = b - h + h * t * 0.92
      der.push([x + w * t, y + 2], [x + w * t * 0.45, y - 1])
      izq.push([x - w * t, y + 2], [x - w * t * 0.45, y - 1])
    }
    der.pop(); izq.pop()
    d += `M${pt([x, b - h])}${der.map(q => `L${pt(q)}`).join('')}L${pt([x + w * 0.12, b + 40])}L${pt([x - w * 0.12, b + 40])}${izq.reverse().map(q => `L${pt(q)}`).join('')}Z`
    if (nevados) nieve += `M${pt([x, b - h])}L${pt([x + w * 0.4, b - h + h * 0.36])}`
  }
  return `<path d="${d}" fill="${color}"/>` + (nevados ? `<path d="${nieve}" stroke="#a9bbd1" stroke-width="1.6" stroke-linecap="round" opacity="${nevados}"/>` : '')
}

// Un reno en silueta, mirando a la derecha, con el cuerpo en (0, 0): el cuerpo, el cuello,
// la cabeza con la oreja y la cornamenta, el rabo y las cuatro patas, que galopan: las de
// delante giran en el hombro y las de detrás en la cadera.
const HOMBRO = [14, 2], CADERA = [-21, 1]
const RENO_CUERPO = 'M-28 -2C-30 -9 -24 -14 -14 -14C-2 -15 10 -15 18 -12C22 -10 24 -6 23 -2C22 4 16 7 8 7C-6 8 -20 8 -26 4C-28 3 -28 1 -28 -2Z' +
  'M14 -12C18 -18 22 -24 25 -29C28 -31 32 -31 35 -29L42 -26C44 -25 44 -22 42 -21L35 -21C31 -20 28 -16 25 -10C23 -6 21 -4 18 -4Z' +
  'M27 -29L21 -34L26 -26ZM-28 -6L-35 -10L-31 -2Z'
const RENO_ASTAS = 'M30 -30C28 -38 24 -44 17 -48M27 -38L33 -45M23 -43L27 -51M20 -46L16 -53M33 -30C35 -39 33 -46 28 -52M34 -38L40 -43M32 -45L36 -51'
const PATAS_DELANTE = 'M15 2L23 10L29 7M12 3L17 13L24 16'
const PATAS_DETRAS = 'M-20 2L-30 9L-40 10M-23 3L-29 13L-38 17'
function reno(x, y, retraso) {
  const d = `animation-delay:-${r2(retraso)}s`
  return `<g transform="translate(${x} ${y})"><g class="tr-trote" style="${d}">` +
    `<path d="${RENO_CUERPO}"/><path d="${RENO_ASTAS}" fill="none" stroke="${SILUETA}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<path class="tr-delante" style="${d}" d="${PATAS_DELANTE}" fill="none" stroke="${SILUETA}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path class="tr-detras" style="${d}" d="${PATAS_DETRAS}" fill="none" stroke="${SILUETA}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `</g></g>`
}

// El trineo con Papá Noel, mirando a la derecha: la caja con la proa enroscada, los
// patines, el saco a la espalda y Papá Noel con su gorro, que sostiene las riendas.
const TRINEO_CAJA = 'M-54 -26C-56 -10 -52 4 -42 6L26 6C40 6 50 -2 54 -14C56 -22 52 -28 46 -27C42 -26 42 -20 46 -19C44 -12 36 -8 28 -8L-28 -8L-40 -26Z'
const PATINES = 'M-60 17L36 17C50 17 58 9 57 -1C56 -8 49 -9 48 -3M-40 6L-42 17M-8 6L-8 17M22 6L22 17'
const SACO = 'M-50 -24C-60 -36 -55 -58 -39 -59C-28 -59 -22 -48 -25 -36L-29 -24Z'
// Papá Noel: el abrigo, la cabeza con la barba, que baja en punta sobre el pecho, y el
// gorro, con su ribete ancho y la punta caída hacia atrás, que acaba en la borla.
const PAPA_NOEL = 'M-28 -8C-31 -24 -22 -38 -8 -39C5 -40 13 -31 13 -19L13 -8Z' +
  'M-10 -46C-11 -53 -4 -56 2 -54C8 -52 9 -45 7 -40C5 -35 1 -31 -3 -30C-7 -34 -9 -40 -10 -46Z' +
  'M-11 -48C-11 -51 -9 -53 -6 -53L5 -54C8 -54 9 -51 8 -48Z' +
  'M-10 -52C-9 -59 -5 -64 1 -65C-7 -68 -16 -64 -22 -57L-18 -55C-15 -58 -13 -58 -11 -55Z'
function trineo() {
  const r = azar(2512)
  // El trineo, los renos y las riendas, en coordenadas propias, con el trineo en (0, 0).
  const renos = [0, 1, 2, 3].map(k => reno(124 + 78 * k, -20 - 9 * k, 0.26 * k + 0.1)).join('')
  const riendas = curva([[26, -26], [70, -24], [140, -28], [218, -37], [296, -46], [374, -55]])
  // La estela de chispas: salen de la trasera del trineo, se quedan atrás en el cielo y se
  // apagan. Quietas, dibujan la estela entera, cada vez más tenue.
  let estela = ''
  const n = 32
  for (let i = 0; i < n; i++) {
    const t = i / n, dy = r1(4 + r() * 18), ret = r2(6 * t)
    const x = r1(-58 + (r() - 0.5) * 6), y = r1(4 + (r() - 0.5) * 8)
    estela += `<g transform="translate(${x} ${y})"><circle class="tr-chispa" style="animation-delay:-${ret}s;--dy:${dy}px" r="${r1(4.2 + r() * 2.6)}" fill="url(#chispa)" transform="translate(${r1(-150 * t)} ${r1(dy * t)}) scale(${r2(1 - 0.6 * t)})" opacity="${r2(0.95 * (1 - t))}"/></g>`
  }
  // Las estrellas, menos delante de la luna.
  const cielo = estrellas(2513, 150, 0, 640).replace(/<circle[^>]*cx="([\d.]+)" cy="([\d.]+)"[^>]*\/>/g, (m, x, y) => Math.hypot(x - LUNA[0], y - LUNA[1]) < RL + 24 ? '' : m)
  const lejanas = [[120, 640], [300, 600], [470, 660], [640, 590], [820, 650], [1010, 600], [1180, 668], [1360, 610], [1520, 655], [1640, 620]]
  const cercanas = [[60, 700], [230, 660], [420, 720], [600, 672], [780, 724], [960, 676], [1130, 730], [1330, 690], [1500, 728], [1660, 700]]
  // Los valles entre los picos, para que cada pico tenga sus dos bajadas.
  const conValles = (picos, hondo) => picos.flatMap((q, i) => i < picos.length - 1 ? [q, [(q[0] + picos[i + 1][0]) / 2, Math.max(q[1], picos[i + 1][1]) + hondo + r() * 20]] : [q])
  const defs = `<defs>
${vertical('cielo', 0, 760, [[0, '#0a1426'], [0.6, NOCHE], [1, '#223b63']])}
${radial('luna', LUNA[0] - 40, LUNA[1] - 40, RL * 1.3, [[0, '#fdf6e2'], [0.6, '#f2e6c6'], [1, '#dccb9f']])}
${radial('halo', LUNA[0], LUNA[1], RL + 280, [[0.4, '#f1e2bb', 0.3], [0.62, '#f1e2bb', 0.1], [1, '#f1e2bb', 0]])}
<radialGradient id="chispa"><stop offset="0" stop-color="#fff6d6"/><stop offset=".28" stop-color="#f3d58f" stop-opacity=".85"/><stop offset="1" stop-color="${ORO}" stop-opacity="0"/></radialGradient>
</defs>`
  const estilo = CSS_ESTRELLAS +
    '.tr-vuelo{animation:tr-vuelo 36s linear infinite}@keyframes tr-vuelo{0%{transform:translate(-300px,30px);opacity:0}8%,86%{opacity:1}100%{transform:translate(260px,-26px);opacity:0}}' +
    `.tr-trote{animation:tr-trote 1.1s ease-in-out infinite}@keyframes tr-trote{50%{transform:translateY(-3px)}}` +
    `.tr-delante{animation:tr-delante 1.1s ease-in-out infinite}@keyframes tr-delante{0%,100%{transform:${giro(HOMBRO, -16)}}50%{transform:${giro(HOMBRO, 16)}}}` +
    `.tr-detras{animation:tr-detras 1.1s ease-in-out infinite}@keyframes tr-detras{0%,100%{transform:${giro(CADERA, 14)}}50%{transform:${giro(CADERA, -14)}}}` +
    '.tr-chispa{animation:tr-chispa 6s linear infinite}@keyframes tr-chispa{0%{transform:translate(0px,0px) scale(1);opacity:.95}100%{transform:translate(-150px,var(--dy)) scale(.4);opacity:0}}'
  return abrir('#0a1426', estilo) + defs +
    `<rect width="${W}" height="${H}" fill="url(#cielo)"/>` + cielo +
    `<circle cx="${LUNA[0]}" cy="${LUNA[1]}" r="${RL + 280}" fill="url(#halo)"/><circle cx="${LUNA[0]}" cy="${LUNA[1]}" r="${RL}" fill="url(#luna)"/>` +
    `<g fill="#cdbb8f" opacity=".22"><ellipse cx="${LUNA[0] - 70}" cy="${LUNA[1] - 50}" rx="60" ry="42"/><ellipse cx="${LUNA[0] + 40}" cy="${LUNA[1] + 30}" rx="74" ry="50"/><ellipse cx="${LUNA[0] - 30}" cy="${LUNA[1] + 96}" rx="40" ry="26"/><ellipse cx="${LUNA[0] + 96}" cy="${LUNA[1] - 70}" rx="30" ry="22"/></g>` +
    cordillera(r, conValles(lejanas, 40), 780, ['#283d5e', '#425b80', '#b5c4d6', '#7f93ae']) +
    cordillera(r, conValles(cercanas, 30), 820, ['#1a2a44', '#2c4366', '#a3b5ca', '#687d96']) +
    // Tres filas de abetos, cada una con el suelo oscuro detrás, para que no asome el cielo
    // entre los troncos.
    bosque(r, 800, 46, 80, 34, '#14253e', 0.3) + `<rect y="830" width="${W}" height="170" fill="#10203a"/>` +
    bosque(r, 880, 80, 124, 44, '#0e1b30', 0.18) + `<rect y="912" width="${W}" height="88" fill="#0b1729"/>` +
    bosque(r, 1000, 150, 230, 62, '#09131f') +
    // El trineo y los renos, en vuelo: salen de detrás de la conversación, cruzan la luna y
    // se van por la derecha. Quietos, cruzan la luna por arriba de su centro.
    `<g transform="translate(1151 440) scale(1.02)"><g class="tr-vuelo"><g fill="${SILUETA}">` +
    `<g fill="#f3d58f">${estela}</g>` +
    `<path d="${SACO}"/><path d="M-40 -59C-43 -66 -36 -68 -34 -63" stroke="${SILUETA}" stroke-width="2" fill="none"/>` +
    `<path d="${TRINEO_CAJA}"/><path d="${PATINES}" fill="none" stroke="${SILUETA}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="${PAPA_NOEL}"/><circle cx="-22" cy="-54" r="4.2"/><path d="M4 -30C12 -30 20 -28 27 -26" stroke="${SILUETA}" stroke-width="5" stroke-linecap="round" fill="none"/>` +
    `<path d="${riendas}" stroke="${SILUETA}" stroke-width="1.4" fill="none"/>` +
    renos +
    `</g></g></g>` +
    `</svg>`
}

escribir('genera_nochebuena.mjs', 'las escenas de la sala Nochebuena, solo de noche.', { abeto, aldea, trineo }, process.argv[2], process.argv[3])
