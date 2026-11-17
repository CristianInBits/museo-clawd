// Lo común a los generadores de escenas de las salas nuevas de museo-clawd: números al
// azar repetibles, curvas suaves, giros con su pivote, bandas de niebla y la escritura
// de los SVG sueltos y del módulo del mod. Los generadores de Bushidō y de Espacio
// profundo llevan su propia copia de algunas de estas piezas.
import { writeFileSync } from 'node:fs'

export const W = 1600, H = 1000

// Una serie de números al azar entre 0 y 1 que se repite con la misma semilla.
export function azar(semilla) {
  let s = semilla >>> 0
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 }
}
export const r1 = n => Math.round(n * 10) / 10
export const r2 = n => Math.round(n * 100) / 100
export const pt = ([x, y]) => `${r1(x)} ${r1(y)}`
export const mas = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k]
export const poli = ps => `M${ps.map(pt).join('L')}Z`

// Una curva suave por unos puntos (Catmull-Rom pasada a cúbicas de Bézier), con su M.
export function curva(puntos) {
  let d = `M${pt(puntos[0])}`
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[Math.max(i - 1, 0)], p1 = puntos[i], p2 = puntos[i + 1], p3 = puntos[Math.min(i + 2, puntos.length - 1)]
    d += `C${pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${pt(p2)}`
  }
  return d
}

// Una banda alrededor de una línea de puntos, con el grosor que diga `grosor(t)` para t
// de 0 a 1 a lo largo de la línea: sirve para ramas, raíces, cuellos y mástiles.
export function banda(centro, grosor) {
  const n = centro.length - 1, izq = [], der = []
  centro.forEach((p, i) => {
    const q = centro[Math.min(i + 1, n)], o = centro[Math.max(i - 1, 0)]
    const dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1
    const g = grosor(i / n) / 2
    izq.push([p[0] - dy / l * g, p[1] + dx / l * g])
    der.push([p[0] + dy / l * g, p[1] - dx / l * g])
  })
  return `${curva(izq)}L${curva(der.reverse()).slice(1)}Z`
}

// Con «reducir movimiento» en el sistema, todo se queda en la posición de sus atributos.
export const QUIETO = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'

// Un giro alrededor de un pivote, escrito entero para que no dependa de transform-origin.
export const giro = ([x, y], grados) => `translate(${x}px,${y}px) rotate(${grados}deg) translate(${-x}px,${-y}px)`

// La niebla va y viene de lado a lado: cada banda lleva su duración y su sentido, y las
// que tienen que verse moverse, un recorrido más largo.
export const CSS_NIEBLA = '.nb{animation-name:deriva;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}' +
  '@keyframes deriva{from{transform:translateX(-70px)}to{transform:translateX(70px)}}' +
  '@keyframes derivaLarga{from{transform:translateX(-150px)}to{transform:translateX(150px)}}'

// Los degradados y el desenfoque de las bandas de niebla, del color que se pida.
export const defsNiebla = color => `<linearGradient id="banda" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${color}" stop-opacity="0"/><stop offset=".18" stop-color="${color}"/><stop offset=".82" stop-color="${color}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>` +
  '<filter id="vaho" x="-5%" y="-60%" width="110%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>'

// Las bandas de niebla: largas, con las puntas redondas. Cada una es [x, y, ancho, alto,
// opacidad, segundos, larga]: va y viene 140 unidades de lado a lado (300 si es larga) y
// tarda esos segundos en cada trayecto, hacia la derecha primero o, si son negativos,
// hacia la izquierda. Con `quietas`, no se mueven: su desenfoque se pinta una vez y no
// en cada fotograma, lo que ayuda en las escenas caras de pintar.
export function nieblas(bandas, quietas = false) {
  if (quietas) return '<g fill="url(#banda)" filter="url(#vaho)">' + bandas.map(([x, y, w, h, o]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" opacity="${o}"/>`).join('') + '</g>'
  return '<g fill="url(#banda)" filter="url(#vaho)">' + bandas.map(([x, y, w, h, o, s, larga], i) => {
    const dur = Math.abs(s)
    const estilo = `animation-duration:${dur}s;animation-delay:-${r1(dur * ((i * 0.37 + 0.2) % 1))}s` + (s < 0 ? ';animation-direction:alternate-reverse' : '') + (larga ? ';animation-name:derivaLarga' : '')
    return `<rect class="nb" style="${estilo}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" opacity="${o}"/>`
  }).join('') + '</g>'
}

// Estrellas al azar en una franja, menos en el centro, donde va la conversación. Una de
// cada siete de las más grandes titila con la regla `.c1`, `.c2` o `.c3` de CSS_ESTRELLAS.
export const CSS_ESTRELLAS = '.c1{animation:titila 3.4s ease-in-out infinite}.c2{animation:titila 4.7s ease-in-out -1.6s infinite}.c3{animation:titila 6.2s ease-in-out -3.1s infinite}' +
  '@keyframes titila{50%{opacity:.12}}'
export function estrellas(semilla, cuantas, y0, y1, color = '#e6ebf0') {
  const r = azar(semilla)
  let s = ''
  for (let i = 0; i < cuantas; i++) {
    const x = r() * W, y = y0 + r() * (y1 - y0)
    if (Math.abs(x - W / 2) < 330 && r() < 0.7) continue
    const tam = r() < 0.9 ? 0.6 + r() * 0.8 : 1.4 + r() * 0.8
    const clase = i % 7 === 3 && tam >= 1 ? ` class="c${1 + (i % 3)}"` : ''
    s += `<circle${clase} cx="${r1(x)}" cy="${r1(y)}" r="${r1(tam)}" fill="${color}" opacity="${r1(0.3 + r() * 0.55)}"/>`
  }
  return s
}

// Parte cada tramo de una línea y desplaza su punto medio de lado, cada vez menos: así se
// rompen los bordes de la roca y se quiebran los rayos.
export function quiebra(r, p, niveles, amp) {
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

// Un degradado vertical en coordenadas de la escena: [desplazamiento, color, opacidad].
export const vertical = (id, y0, y1, paradas) => `<linearGradient id="${id}" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse">${paradas.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`
export const horizontal = (id, x0, x1, paradas) => `<linearGradient id="${id}" x1="${x0}" y1="0" x2="${x1}" y2="0" gradientUnits="userSpaceOnUse">${paradas.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`
export const radial = (id, cx, cy, r, paradas) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">${paradas.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`

// Abre una escena de 1600 × 1000 con su estilo y un fondo liso.
export const abrir = (fondo, estilo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><style>${estilo}${QUIETO}</style><rect width="${W}" height="${H}" fill="${fondo}"/>`

// Escribe cada escena en un SVG suelto, para verla en un navegador, y, si se pide, el
// módulo del mod con todas, con su cabecera.
export function escribir(generador, descripcion, escenas, carpeta, modulo) {
  const hechas = Object.entries(escenas).map(([nombre, fn]) => [nombre, fn()])
  for (const [nombre, svg] of hechas) {
    writeFileSync(`${carpeta}/${nombre}.svg`, svg)
    console.log(`${nombre}: ${svg.length} caracteres`)
  }
  if (modulo) {
    const cabecera = `// Generado por herramientas/${generador}: ${descripcion}\n// No se edita a mano.\n`
    writeFileSync(modulo, cabecera + hechas.map(([n, svg]) => `export const ${n.toUpperCase()} = ${JSON.stringify(svg)}`).join('\n') + '\n')
    console.log('módulo escrito')
  }
}
