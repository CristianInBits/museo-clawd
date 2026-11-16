import type { ThemeColors } from 'claude-code'

import { FORTALEZA, KATANA, RONIN } from './bushido'
import { ANILLOS, SINGULARIDAD, TESELADO } from './espacio'
import { makeColors } from './make-colors.js'

// Los doce temas de museo-clawd, en cuatro salas: la paleta de cada uno para la
// aplicación, el tinte de su cristal, su escena de fondo, el motivo de su indicador
// y lo que dice el Clawd pintor cuando lo pones.
//
// Las escenas se mueven despacio con animaciones CSS dentro de su <style>, que la
// aplicación de escritorio ejecuta en el fondo (el 14 de noviembre de 2026 todavía no
// lo hacía; el 16 de noviembre ya movía Neón nocturno). Cada escena es además un
// cuadro que queda bien quieto: cada elemento animado tiene una posición fija buena
// en sus propios atributos, la que se ve con «reducir movimiento» en el sistema. El
// indicador se mueve con SMIL.

// La aplicación guarda el dibujo mientras la escena se llama igual: cada cambio de
// los dibujos sube esta versión para que la aplicación los pida otra vez.
export const VERSION_ESCENAS = 'v3'

export type Tema = {
  id: string
  nombre: string
  /** El nombre de su sala del Museo, que es su familia. */
  familia: string
  /** El color del cristal, o '' para que la aplicación use el color de panel de la paleta. */
  tinte: string
  bocadillo: string
  colores: ThemeColors
  problemas: string[]
  escena: string
  motivo: string
}

export type Sala = { id: string; nombre: string }

/** Las salas del Museo, en el orden en que se enseñan sus botones. */
export const SALAS: Sala[] = [
  { id: 'neon', nombre: 'Neón nocturno' },
  { id: 'aurora', nombre: 'Aurora' },
  { id: 'bushido', nombre: 'Bushidō' },
  { id: 'espacio', nombre: 'Espacio profundo' },
]

type Anclas = [string, string, string, string, string, string, string]
type Papeles = { accent: string; danger: string; success: string; warning: string; pro: string }
type Git = { added: string; removed: string; modified: string; merged: string }

// Anclas: página, tarjetas, paneles, menús, texto principal, secundario y apagado.
function paleta(nombre: string, id: string, a: Anclas, roles: Papeles, git?: Git) {
  return makeColors({
    label: nombre,
    id: `museo-clawd-${id}`,
    only: 'dark',
    roles,
    dark: {
      gray: {
        anchors: {
          'surface-0': a[0],
          'surface-1': a[1],
          'surface-2': a[2],
          'surface-3': a[3],
          'text-primary': a[4],
          'text-secondary': a[5],
          'text-muted': a[6],
        },
      },
      ...(git !== undefined && { git }),
    },
  })
}

const QUIETO = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'

// --- Circuito -------------------------------------------------------------------

// Cada impulso recorre su pista con traslaciones por tramos: el porcentaje de cada
// fotograma es lo recorrido hasta esa esquina entre la longitud total de la pista
// (850, 420 y 710 unidades).
const P1 = 'M0 90H120V200H290V260H680'
const P2 = 'M420 0V70H540V160H680'
const P3 = 'M310 0V120H480V230H620V400'
function impulso(clase: string, color: string, nucleo: string, x: number, y: number): string {
  return `<g class="i ${clase}" transform="translate(${x} ${y})"><circle r="5" fill="${color}" filter="url(#brillo)"/><circle r="2.5" fill="${nucleo}"/></g>`
}
function nodo(clase: string, x: number, y: number, r: number, color: string): string {
  return `<circle class="n ${clase}" cx="${x}" cy="${y}" r="${r}" fill="${color}"/>`
}
const CIRCUITO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 400" preserveAspectRatio="xMidYMid slice">
<style>
.i{animation-timing-function:linear;animation-iteration-count:infinite}
.i1{animation-name:p1;animation-duration:9s}
.i2{animation-name:p2;animation-duration:7s;animation-delay:-3s}
.i3{animation-name:p3;animation-duration:11s;animation-delay:-5s}
@keyframes p1{0%{transform:translate(0px,90px)}14.12%{transform:translate(120px,90px)}27.06%{transform:translate(120px,200px)}47.06%{transform:translate(290px,200px)}54.12%{transform:translate(290px,260px)}100%{transform:translate(680px,260px)}}
@keyframes p2{0%{transform:translate(420px,0px)}16.67%{transform:translate(420px,70px)}45.24%{transform:translate(540px,70px)}66.67%{transform:translate(540px,160px)}100%{transform:translate(680px,160px)}}
@keyframes p3{0%{transform:translate(310px,0px)}16.9%{transform:translate(310px,120px)}40.85%{transform:translate(480px,120px)}56.34%{transform:translate(480px,230px)}76.06%{transform:translate(620px,230px)}100%{transform:translate(620px,400px)}}
.n{animation-name:late;animation-timing-function:ease-in-out;animation-iteration-count:infinite}
.n1{animation-duration:4s}.n2{animation-duration:5s;animation-delay:-2s}.n3{animation-duration:6s;animation-delay:-1s}.n4{animation-duration:4.5s;animation-delay:-3s}
@keyframes late{0%,100%{opacity:.35}50%{opacity:1}}
${QUIETO}
</style>
<defs>
<radialGradient id="cian" cx="15%" cy="10%" r="60%"><stop offset="0" stop-color="#52e4ff" stop-opacity=".28"/><stop offset="1" stop-color="#52e4ff" stop-opacity="0"/></radialGradient>
<radialGradient id="violeta" cx="90%" cy="95%" r="65%"><stop offset="0" stop-color="#8a5ce0" stop-opacity=".45"/><stop offset="1" stop-color="#8a5ce0" stop-opacity="0"/></radialGradient>
<filter id="brillo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.5"/></filter>
</defs>
<rect width="680" height="400" fill="#060a18"/>
<rect width="680" height="400" fill="url(#cian)"/>
<rect width="680" height="400" fill="url(#violeta)"/>
<path fill="none" stroke="#223059" stroke-width="1.5" vector-effect="non-scaling-stroke" d="${P1}M40 400V250H190${P2}${P3}M120 200V400M560 260V400M0 330H90"/>
<path fill="none" stroke="#52e4ff" stroke-width="5" opacity=".5" filter="url(#brillo)" d="M0 90H120V200H290M420 0V70H540V160"/>
<path fill="none" stroke="#52e4ff" stroke-width="1.6" vector-effect="non-scaling-stroke" d="M0 90H120V200H290M420 0V70H540V160"/>
${impulso('i1', '#52e4ff', '#e4ecff', 205, 200)}${impulso('i2', '#52e4ff', '#e4ecff', 540, 115)}${impulso('i3', '#ffc857', '#fff4de', 480, 175)}
${nodo('n1', 290, 200, 4, '#ffc857')}${nodo('n2', 540, 160, 4, '#7ff5a8')}${nodo('n3', 480, 120, 3.5, '#c9a4ff')}${nodo('n4', 190, 250, 3.5, '#52e4ff')}
</svg>`

// --- Horizonte ------------------------------------------------------------------

// Las líneas del suelo quietas van a distancias de perspectiva; cuando la animación
// corre, cada una baja desde el horizonte y se aclara.
const SUELO = [8, 20, 38, 64, 102, 155]
  .map(
    (y, i) =>
      `<line class="linea" style="animation-delay:-${i}s" x1="0" x2="680" y1="245" y2="245" transform="translate(0 ${y})"/>`,
  )
  .join('')
const HORIZONTE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 400" preserveAspectRatio="xMidYMid slice">
<style>
.sol{animation:late-sol 8s ease-in-out infinite}
@keyframes late-sol{0%,100%{opacity:.75}50%{opacity:.92}}
.linea{animation:avanza 6s cubic-bezier(.55,0,1,1) infinite}
@keyframes avanza{from{transform:translateY(0px);stroke-opacity:.1}to{transform:translateY(155px);stroke-opacity:.75}}
${QUIETO}
</style>
<defs>
<radialGradient id="violeta" cx="12%" cy="8%" r="55%"><stop offset="0" stop-color="#8a5ce0" stop-opacity=".7"/><stop offset="1" stop-color="#8a5ce0" stop-opacity="0"/></radialGradient>
<radialGradient id="cian" cx="92%" cy="92%" r="55%"><stop offset="0" stop-color="#52e4ff" stop-opacity=".45"/><stop offset="1" stop-color="#52e4ff" stop-opacity="0"/></radialGradient>
<linearGradient id="sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc857"/><stop offset="1" stop-color="#ff6f8e"/></linearGradient>
<clipPath id="suelo"><rect x="0" y="245" width="680" height="155"/></clipPath>
</defs>
<rect width="680" height="400" fill="#07060f"/>
<rect width="680" height="400" fill="url(#violeta)"/>
<rect width="680" height="400" fill="url(#cian)"/>
<circle class="sol" cx="340" cy="245" r="72" fill="url(#sol)" opacity=".85"/>
<g fill="#07060f"><rect x="260" y="205" width="160" height="3"/><rect x="260" y="218" width="160" height="4"/><rect x="260" y="231" width="160" height="6"/></g>
<rect x="0" y="245" width="680" height="155" fill="#07060f"/>
<path fill="none" stroke="#ff6f8e" stroke-opacity=".55" vector-effect="non-scaling-stroke" d="M0 245H680M340 245L-400 400M340 245L-100 400M340 245L100 400M340 245L230 400M340 245L340 400M340 245L450 400M340 245L580 400M340 245L780 400M340 245L1080 400"/>
<g clip-path="url(#suelo)" stroke="#ff6f8e" stroke-opacity=".6" vector-effect="non-scaling-stroke">${SUELO}</g>
</svg>`

// --- Constelación ---------------------------------------------------------------

// Dos señales recorren los hilos: (60,70) a (620,150), 695,6 unidades, y (80,360) a
// (600,320), 608,7 unidades. Quietas, cada una espera a mitad de un hilo.
const NODOS: [number, number, number, string][] = [
  [60, 70, 3, '#e4ecff'], [165, 140, 4, '#52e4ff'], [125, 260, 3, '#e4ecff'], [250, 220, 3.5, '#c9a4ff'],
  [350, 100, 4, '#c9a4ff'], [475, 180, 4, '#52e4ff'], [435, 300, 3.5, '#ffc857'], [515, 60, 3, '#e4ecff'],
  [620, 150, 3.5, '#7ff5a8'], [600, 320, 3, '#e4ecff'], [80, 360, 3, '#e4ecff'], [300, 350, 3, '#e4ecff'],
]
const CONSTELACION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 400" preserveAspectRatio="xMidYMid slice">
<style>
.h{animation:late 6s ease-in-out infinite}
.h2{animation-duration:7s;animation-delay:-2s}.h3{animation-duration:5s;animation-delay:-1s}.h4{animation-duration:8s;animation-delay:-3s}
@keyframes late{0%,100%{opacity:.3}50%{opacity:.9}}
.s1{animation:q1 10s linear infinite}
.s2{animation:q2 12s linear infinite;animation-delay:-4s}
@keyframes q1{0%{transform:translate(60px,70px)}18.14%{transform:translate(165px,140px)}34.92%{transform:translate(250px,220px)}57.37%{transform:translate(350px,100px)}78.71%{transform:translate(475px,180px)}100%{transform:translate(620px,150px)}}
@keyframes q2{0%{transform:translate(80px,360px)}18.02%{transform:translate(125px,260px)}39.58%{transform:translate(250px,220px)}72.7%{transform:translate(435px,300px)}100%{transform:translate(600px,320px)}}
${QUIETO}
</style>
<defs>
<radialGradient id="violeta" cx="75%" cy="20%" r="60%"><stop offset="0" stop-color="#8a5ce0" stop-opacity=".4"/><stop offset="1" stop-color="#8a5ce0" stop-opacity="0"/></radialGradient>
<radialGradient id="cian" cx="10%" cy="90%" r="55%"><stop offset="0" stop-color="#1fa3c7" stop-opacity=".35"/><stop offset="1" stop-color="#1fa3c7" stop-opacity="0"/></radialGradient>
<filter id="brillo" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<rect width="680" height="400" fill="#060a18"/>
<rect width="680" height="400" fill="url(#violeta)"/>
<rect width="680" height="400" fill="url(#cian)"/>
<path fill="none" stroke="#3a4d86" stroke-width="1.2" vector-effect="non-scaling-stroke" d="M60 70L165 140L125 260L250 220L165 140M250 220L350 100L475 180L435 300L250 220M350 100L515 60L620 150L475 180M435 300L600 320L620 150M125 260L80 360M435 300L300 350L125 260"/>
<g filter="url(#brillo)">
<circle class="h" cx="165" cy="140" r="8" fill="#52e4ff" opacity=".7"/><circle class="h h2" cx="350" cy="100" r="8" fill="#c9a4ff" opacity=".6"/>
<circle class="h h3" cx="475" cy="180" r="8" fill="#52e4ff" opacity=".7"/><circle class="h h4" cx="435" cy="300" r="8" fill="#ffc857" opacity=".6"/>
</g>
${NODOS.map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('')}
<g class="s1" transform="translate(300 160)"><circle r="6" fill="#52e4ff" filter="url(#brillo)"/><circle r="2.5" fill="#fff4de"/></g>
<g class="s2" transform="translate(342 260)"><circle r="6" fill="#ffc857" filter="url(#brillo)"/><circle r="2.5" fill="#fff4de"/></g>
</svg>`

// --- Aurora: Boreal, Austral y Bruma ---------------------------------------------

// Las cortinas de Boreal ondulan de verdad: sus dos orillas son ondas que avanzan a lo
// largo de la cortina. Cada fotograma es la misma figura con la fase corrida, y la
// aplicación pasa de uno a otro con la propiedad CSS d, así que la onda avanza y no da
// saltos al dar la vuelta. La segunda onda de cada orilla corre el doble de deprisa,
// para que la forma no se repita siempre igual.
type Onda = { base: number; a1: number; l1: number; a2: number; l2: number }

function orilla(o: Onda, fase: number): [number, number][] {
  const puntos: [number, number][] = []
  for (let x = -40; x <= 370; x += 41) {
    const y = o.base + o.a1 * Math.sin((2 * Math.PI * x) / o.l1 + fase) + o.a2 * Math.sin((2 * Math.PI * x) / o.l2 + 2 * fase + 1)
    puntos.push([x, Math.round(y * 10) / 10])
  }

  return puntos
}

// Una curva suave por unos puntos (Catmull-Rom pasada a cúbicas), sin el punto de partida.
function suave(p: [number, number][]): string {
  const r = (n: number) => Math.round(n * 10) / 10
  let d = ''
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(i - 1, 0)] as [number, number]
    const b = p[i] as [number, number]
    const c = p[i + 1] as [number, number]
    const e = p[Math.min(i + 2, p.length - 1)] as [number, number]
    d += `C${r(b[0] + (c[0] - a[0]) / 6)} ${r(b[1] + (c[1] - a[1]) / 6)} ${r(c[0] - (e[0] - b[0]) / 6)} ${r(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${c[1]}`
  }

  return d
}

function formaCortina(arriba: Onda, abajo: Onda, fase: number): string {
  const sup = orilla(arriba, fase)
  const inf = orilla(abajo, fase).reverse()
  const [x0, y0] = sup[0] as [number, number]
  const [x1, y1] = inf[0] as [number, number]

  return `M${x0} ${y0}${suave(sup)}L${x1} ${y1}${suave(inf)}Z`
}

// Los fotogramas de una cortina: ocho fases en una vuelta, y el último es el primero.
function ondula(nombre: string, arriba: Onda, abajo: Onda): string {
  let k = `@keyframes ${nombre}{`
  for (let j = 0; j < 8; j++) {
    k += `${j === 0 ? '0%,100%' : `${j * 12.5}%`}{d:path("${formaCortina(arriba, abajo, (j * Math.PI) / 4)}")}`
  }

  return `${k}}`
}

const VERDE_ARRIBA: Onda = { base: 34, a1: 11, l1: 230, a2: 5, l2: 120 }
const VERDE_ABAJO: Onda = { base: 99, a1: 8, l1: 260, a2: 4, l2: 140 }
const TURQUESA_ARRIBA: Onda = { base: 60, a1: 10, l1: 200, a2: 4, l2: 110 }
const TURQUESA_ABAJO: Onda = { base: 112, a1: 7, l1: 240, a2: 3, l2: 130 }

// Los rayos de Boreal: tres grupos que repiten su rayo cada 105 unidades, a 35 unidades
// uno de otro, y todos avanzan 105 unidades por vuelta, así que fluyen hacia un lado,
// con la onda, sin saltos. Además, cada grupo late a su ritmo.
const rayos = (x: number, y0: number, y1: number) =>
  [...Array(6)].map((_, k) => `M${x + 105 * (k - 1)} ${y0}V${y1}`).join('')

const BOREAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 150" preserveAspectRatio="xMidYMid slice">
<style>
.c1{animation:onda1 16s linear infinite,brilla 6s ease-in-out infinite}
.c2{animation:onda2 21s linear -7s infinite,brilla 7.5s ease-in-out -3s infinite}
${ondula('onda1', VERDE_ARRIBA, VERDE_ABAJO)}
${ondula('onda2', TURQUESA_ARRIBA, TURQUESA_ABAJO)}
@keyframes brilla{50%{opacity:.7}}
.flujo{animation:flujo 17s linear infinite}
@keyframes flujo{to{transform:translateX(-105px)}}
.r{animation:rayos 5s ease-in-out infinite}.r2{animation-duration:6.5s;animation-delay:-2s}.r3{animation-duration:4.2s;animation-delay:-3s}
@keyframes rayos{0%,100%{opacity:.2}50%{opacity:.65}}
.e{animation:titila 4s ease-in-out infinite}.e2{animation-duration:5.5s;animation-delay:-2s}
@keyframes titila{50%{opacity:.2}}
${QUIETO}
</style>
<defs>
<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020812"/><stop offset="1" stop-color="#0a1f2e"/></linearGradient>
<linearGradient id="verde" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ff5a8" stop-opacity="0"/><stop offset=".45" stop-color="#7ff5a8" stop-opacity=".75"/><stop offset="1" stop-color="#2fb86c" stop-opacity="0"/></linearGradient>
<linearGradient id="turquesa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf" stop-opacity="0"/><stop offset=".5" stop-color="#2dd4bf" stop-opacity=".55"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></linearGradient>
<filter id="suave" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="rayo" x="-50%" y="-10%" width="200%" height="120%"><feGaussianBlur stdDeviation="1.5"/></filter>
</defs>
<rect width="330" height="150" fill="url(#cielo)"/>
<g fill="#e4ecff"><circle cx="20" cy="15" r=".8"/><circle cx="70" cy="8" r=".7"/><circle class="e" cx="140" cy="20" r=".9"/><circle cx="210" cy="10" r=".7"/><circle class="e e2" cx="280" cy="18" r=".8"/><circle cx="310" cy="40" r=".6"/><circle cx="45" cy="45" r=".6"/></g>
<g filter="url(#suave)">
<path class="c1" fill="url(#verde)" d="${formaCortina(VERDE_ARRIBA, VERDE_ABAJO, 0)}"/>
<path class="c2" fill="url(#turquesa)" d="${formaCortina(TURQUESA_ARRIBA, TURQUESA_ABAJO, 0)}"/>
</g>
<g class="flujo" stroke="url(#verde)" stroke-width="2" filter="url(#rayo)">
<path class="r" opacity=".45" d="${rayos(15, 25, 95)}"/><path class="r r2" opacity=".45" d="${rayos(50, 20, 92)}"/><path class="r r3" opacity=".45" d="${rayos(85, 30, 100)}"/>
</g>
<path fill="#04080f" d="M0 150V118L30 104L52 114L80 96L110 112L140 100L170 116L205 92L240 110L270 102L300 115L330 106V150Z"/>
</svg>`

const AUSTRAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 150" preserveAspectRatio="xMidYMid slice">
<style>
.c1{animation:ondula1 12s ease-in-out infinite alternate}
.c2{animation:ondula2 10s ease-in-out -4s infinite alternate}
@keyframes ondula1{from{transform:translate(8px,-1px) translate(165px,95px) skewX(-4deg) scale(1,1.05) translate(-165px,-95px)}to{transform:translate(-10px,1px) translate(165px,95px) skewX(4deg) scale(1,.95) translate(-165px,-95px)}}
@keyframes ondula2{from{transform:translate(-8px,1px) translate(165px,105px) skewX(3deg) scale(1,.95) translate(-165px,-105px)}to{transform:translate(9px,-1px) translate(165px,105px) skewX(-4deg) scale(1,1.06) translate(-165px,-105px)}}
.reflejo{animation:reflejo 6s ease-in-out infinite}.reflejo2{animation-duration:7.5s;animation-delay:-3s}
@keyframes reflejo{0%,100%{stroke-opacity:.18;transform:translateX(0px)}50%{stroke-opacity:.55;transform:translateX(5px)}}
.e{animation:titila 4.5s ease-in-out infinite}.e2{animation-duration:6s;animation-delay:-2.5s}
@keyframes titila{50%{opacity:.2}}
${QUIETO}
</style>
<defs>
<linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07051a"/><stop offset="1" stop-color="#1a0f2e"/></linearGradient>
<linearGradient id="rosa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f8e" stop-opacity="0"/><stop offset=".45" stop-color="#ff6f8e" stop-opacity=".7"/><stop offset="1" stop-color="#ff6f8e" stop-opacity="0"/></linearGradient>
<linearGradient id="lila" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a78bfa" stop-opacity="0"/><stop offset=".5" stop-color="#a78bfa" stop-opacity=".6"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></linearGradient>
<radialGradient id="ambar" cx="50%" cy="100%" r="60%"><stop offset="0" stop-color="#ffc857" stop-opacity=".35"/><stop offset="1" stop-color="#ffc857" stop-opacity="0"/></radialGradient>
<filter id="suave" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="5"/></filter>
<filter id="agua" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="2"/></filter>
</defs>
<rect width="330" height="150" fill="url(#cielo)"/>
<rect width="330" height="112" fill="url(#ambar)"/>
<g fill="#e4ecff"><circle class="e" cx="30" cy="12" r=".8"/><circle cx="95" cy="22" r=".7"/><circle class="e e2" cx="170" cy="9" r=".9"/><circle cx="240" cy="25" r=".7"/><circle cx="300" cy="12" r=".8"/></g>
<g filter="url(#suave)">
<path class="c1" fill="url(#lila)" d="M-30 20C50 5 100 50 170 30S290 45 360 20V80C290 100 210 75 140 92S30 88 -30 98Z"/>
<path class="c2" fill="url(#rosa)" d="M-30 45C40 25 120 70 190 48S300 66 360 42V92C280 112 200 86 130 104S20 100 -30 108Z"/>
</g>
<rect y="112" width="330" height="38" fill="#0b0718"/>
<g stroke="#ff6f8e" stroke-width="2" filter="url(#agua)">
<path class="reflejo" stroke-opacity=".4" d="M40 120H140M90 134H220"/><path class="reflejo reflejo2" stroke-opacity=".4" d="M180 126H300M20 142H110"/>
</g>
</svg>`

const BRUMA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 330 150" preserveAspectRatio="xMidYMid slice">
<style>
.b1{animation:deriva1 9s ease-in-out infinite alternate,late1 7s ease-in-out infinite}
.b2{animation:deriva2 11s ease-in-out -4s infinite alternate,late2 8.5s ease-in-out -3s infinite}
.b3{animation:deriva3 13s ease-in-out -7s infinite alternate,late1 6s ease-in-out -2s infinite}
.b4{animation:deriva4 18s ease-in-out -5s infinite alternate,late2 5s ease-in-out infinite}
@keyframes deriva1{from{transform:translate(100px,45px) scale(.9) translate(-100px,-45px)}to{transform:translate(165px,68px) scale(1.15) translate(-100px,-45px)}}
@keyframes deriva2{from{transform:translate(250px,85px) scale(1.1) translate(-250px,-85px)}to{transform:translate(175px,70px) scale(.88) translate(-250px,-85px)}}
@keyframes deriva3{from{transform:translate(160px,145px) scale(1) translate(-160px,-145px)}to{transform:translate(225px,128px) scale(1.2) translate(-160px,-145px)}}
@keyframes deriva4{from{transform:translate(55px,105px)}to{transform:translate(275px,40px)}}
@keyframes late1{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes late2{0%,100%{opacity:.95}50%{opacity:.45}}
${QUIETO}
</style>
<defs>
<linearGradient id="fondo" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#081428"/><stop offset=".55" stop-color="#0c2a3e"/><stop offset="1" stop-color="#1b1640"/></linearGradient>
<radialGradient id="turquesa"><stop offset="0" stop-color="#2dd4bf" stop-opacity=".65"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient>
<radialGradient id="lila"><stop offset="0" stop-color="#a78bfa" stop-opacity=".6"/><stop offset="1" stop-color="#a78bfa" stop-opacity="0"/></radialGradient>
<radialGradient id="verde"><stop offset="0" stop-color="#4ade80" stop-opacity=".4"/><stop offset="1" stop-color="#4ade80" stop-opacity="0"/></radialGradient>
<radialGradient id="claro"><stop offset="0" stop-color="#5eead4" stop-opacity=".5"/><stop offset="1" stop-color="#5eead4" stop-opacity="0"/></radialGradient>
</defs>
<rect width="330" height="150" fill="url(#fondo)"/>
<ellipse class="b1" cx="100" cy="45" rx="120" ry="60" fill="url(#turquesa)"/>
<ellipse class="b2" cx="250" cy="85" rx="110" ry="65" fill="url(#lila)"/>
<ellipse class="b3" cx="160" cy="145" rx="140" ry="45" fill="url(#verde)"/>
<ellipse class="b4" cx="0" cy="0" rx="48" ry="32" fill="url(#claro)" transform="translate(150 80)"/>
</svg>`

// --- Los motivos del indicador: pequeños y con SMIL, que en el indicador sí se mueve ---

const M_CIRCUITO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><path fill="none" stroke="#3a4d86" stroke-width="1.5" d="M2 16H12V6H26V16H38"/><circle r="2.6" fill="#52e4ff"><animateMotion dur="1.6s" repeatCount="indefinite" path="M2 16H12V6H26V16H38"/></circle></svg>`
const M_HORIZONTE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc857"/><stop offset="1" stop-color="#ff6f8e"/></linearGradient><clipPath id="c"><rect x="0" y="0" width="40" height="15"/></clipPath></defs><circle cx="20" cy="15" r="9" fill="url(#s)" clip-path="url(#c)"><animate attributeName="opacity" values=".55;1;.55" dur="1.8s" repeatCount="indefinite"/></circle><path stroke="#ff6f8e" stroke-opacity=".7" d="M2 15H38M2 19H38"/></svg>`
const M_CONSTELACION = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><path stroke="#3a4d86" stroke-width="1.2" fill="none" d="M6 14L20 6L34 14"/><circle cx="6" cy="14" r="3" fill="#52e4ff"><animate attributeName="opacity" values=".25;1;.25" dur="1.5s" repeatCount="indefinite"/></circle><circle cx="20" cy="6" r="3" fill="#c9a4ff"><animate attributeName="opacity" values=".25;1;.25" dur="1.5s" begin=".5s" repeatCount="indefinite"/></circle><circle cx="34" cy="14" r="3" fill="#ffc857"><animate attributeName="opacity" values=".25;1;.25" dur="1.5s" begin="1s" repeatCount="indefinite"/></circle></svg>`
function cortina(arriba: string, abajo: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${arriba}" stop-opacity="0"/><stop offset=".5" stop-color="${arriba}" stop-opacity=".95"/><stop offset="1" stop-color="${abajo}" stop-opacity="0"/></linearGradient></defs><path fill="url(#g)" d="M0 6C8 2 14 10 22 6S34 8 40 4V16C32 20 24 14 16 18S6 16 0 19Z"><animateTransform attributeName="transform" type="translate" values="0 0;3 -1;0 0" dur="2.4s" repeatCount="indefinite"/></path></svg>`
}
const M_BRUMA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><defs><radialGradient id="g"><stop offset="0" stop-color="#2dd4bf" stop-opacity=".95"/><stop offset="1" stop-color="#2dd4bf" stop-opacity="0"/></radialGradient></defs><circle cx="20" cy="11" r="8" fill="url(#g)"><animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/></circle></svg>`

// Los motivos de Bushidō. Ronin: el sol rojo que se pinta de una sola pincelada, como
// un círculo zen (ensō), y se desvanece; quieto, se queda pintado.
const M_RONIN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><circle cx="20" cy="11" r="7.6" fill="none" stroke="#c63d3a" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="47.8" stroke-dashoffset="4" transform="rotate(-80 20 11)"><animate attributeName="stroke-dashoffset" values="47.8;4;4" keyTimes="0;.65;1" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;1;0" keyTimes="0;.8;1" dur="2.2s" repeatCount="indefinite"/></circle></svg>`
// Katana: un destello que recorre la hoja, de la guarda a la punta.
const HOJA = 'M10.2 15.4Q24 10 37.5 3'
const M_KATANA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><path d="M9.2 16.2L2.8 19.3" stroke="#b83535" stroke-width="2.8" stroke-linecap="round"/><path d="M8 13.4L10.6 18.6" stroke="#b89862" stroke-width="1.7" stroke-linecap="round"/><path d="${HOJA}" fill="none" stroke="#89939b" stroke-width="1.9" stroke-linecap="round"/><circle r="1.5" fill="#f1ebdf"><animateMotion dur="1.6s" repeatCount="indefinite" path="${HOJA}"/><animate attributeName="opacity" values="0;1;0" dur="1.6s" repeatCount="indefinite"/></circle></svg>`
// Fortaleza: una banda de niebla que pasa por delante de un castillo diminuto.
const M_FORTALEZA = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><circle cx="32" cy="5" r="2.6" fill="#e5d9c6" opacity=".85"/><path fill="#3a363f" d="M13 19.5H27L25.8 16.4H14.2Z"/><rect x="15" y="12.8" width="10" height="3.8" fill="#7a727e"/><path fill="#0c0c0f" stroke="#e5d9c6" stroke-opacity=".55" stroke-width=".5" d="M10.5 13.6Q13 13.4 15.5 12L17 10.6H23L24.5 12Q27 13.4 29.5 13.6Q26 14 20 13.8Q14 14 10.5 13.6Z"/><rect x="16.8" y="7.4" width="6.4" height="3.4" fill="#7a727e"/><path fill="#0c0c0f" stroke="#e5d9c6" stroke-opacity=".55" stroke-width=".5" d="M13.5 8.2Q16 8 18 6.4L20 4.6L22 6.4Q24 8 26.5 8.2Q23.5 8.6 20 8.4Q16.5 8.6 13.5 8.2Z"/><path d="M18.6 4.9l-.8-1.6M21.4 4.9l.8-1.6" stroke="#b89862" stroke-width=".7" stroke-linecap="round"/><rect x="2" y="16.6" width="15" height="2.2" rx="1.1" fill="#e5d9c6" opacity=".4"><animateTransform attributeName="transform" type="translate" values="0 0;18 0;0 0" dur="3.2s" repeatCount="indefinite"/></rect></svg>`

// Los motivos de Espacio profundo.
const ORBITA = 'M6 12A14 3.6 0 1 0 34 12A14 3.6 0 1 0 6 12'
const M_SINGULARIDAD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><ellipse cx="20" cy="12" rx="14" ry="3.6" fill="none" stroke="#ffb066" stroke-width="1.6" opacity=".55"><animate attributeName="opacity" values=".35;.8;.35" dur="2.2s" repeatCount="indefinite"/></ellipse><circle cx="20" cy="11" r="5" fill="#000" stroke="#ffe7c2" stroke-width=".9"/><path d="M6 12A14 3.6 0 0 0 34 12" fill="none" stroke="#ffd9a0" stroke-width="1.8"/><circle r="1.3" fill="#fff6e6"><animateMotion dur="1.8s" repeatCount="indefinite" path="${ORBITA}"/></circle></svg>`
const M_ANILLOS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22"><defs><linearGradient id="p" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2c393"/><stop offset=".45" stop-color="#3a2f27"/><stop offset="1" stop-color="#0b0b10"/></linearGradient></defs><path d="M8 13A12 3 -12 0 1 32 9" fill="none" stroke="#e9d3a8" stroke-width="1" opacity=".7"/><circle cx="20" cy="11" r="6" fill="url(#p)"/><path d="M8 13A12 3 -12 0 0 32 9" fill="none" stroke="#f3e2c0" stroke-width="1.2"/><circle r="1.2" fill="#e9d3a8"><animateMotion dur="3s" repeatCount="indefinite" path="M2 13A18 5 -12 1 0 38 9A18 5 -12 1 0 2 13"/></circle></svg>`
function marco(retraso: number): string {
  const a = `dur="1.8s" begin="${retraso}s" repeatCount="indefinite"`
  return `<rect fill="none" stroke="#ffb866" stroke-width=".9"><animate attributeName="x" values="2;19" ${a}/><animate attributeName="y" values="1;10" ${a}/><animate attributeName="width" values="36;2" ${a}/><animate attributeName="height" values="20;2" ${a}/><animate attributeName="opacity" values="0;.9;.2" ${a}/></rect>`
}
const M_TESELADO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 22">${marco(0)}${marco(-0.6)}${marco(-1.2)}<circle cx="20" cy="11" r="1.2" fill="#fff3dd"/></svg>`

// La paleta de Espacio profundo, solo de noche: negros cálidos, acento de luz de
// estrella y oro para pro.
function paletaEspacio(nombre: string, id: string) {
  return paleta(nombre, id, ['#07070a', '#0c0c11', '#111118', '#17171f', '#f2ede4', '#c4bcae', '#948c80'],
    { accent: '#8fb8ff', danger: '#ff6b5b', success: '#6fcf97', warning: '#ffb000', pro: '#e9c27a' })
}

// La paleta de Bushidō, solo de noche: negro carbón y texto pergamino. El acento es
// carmesí, un poco más frío que el de los dibujos, y el peligro va en bermellón: el
// código pinta las palabras clave con el acento y los nombres con el peligro, y con
// dos rojos iguales no se distinguirían. Éxito verde musgo, aviso oro e índigo acero
// para pro.
function paletaBushido(nombre: string, id: string) {
  return paleta(nombre, id, ['#101116', '#15161c', '#1a1b22', '#202129', '#e5d9c6', '#c2b7a6', '#988f82'],
    { accent: '#b8354a', danger: '#e8742a', success: '#8aa86a', warning: '#d9a441', pro: '#7f9cc4' })
}

// --- La tabla ---------------------------------------------------------------------

const NEON_GIT: Git = { added: '#2fb86c', removed: '#ff6f8e', modified: '#ffc857', merged: '#c9a4ff' }

function nuevoTema(
  id: string,
  nombre: string,
  familia: string,
  tinte: string,
  bocadillo: string,
  hecha: { theme: ThemeColors; problems: string[] },
  escena: string,
  motivo: string,
): Tema {
  return {
    id,
    nombre,
    familia,
    tinte,
    bocadillo,
    colores: hecha.theme,
    problemas: hecha.problems,
    escena: conPrefijo(id, escena),
    motivo: conPrefijo(`${id}-m`, motivo),
  }
}

// Pone delante de cada id del dibujo el de su tema, para que dos dibujos juntos
// en una misma página no se roben los degradados ni los filtros.
function conPrefijo(prefijo: string, svg: string): string {
  return svg.replace(/id="([^"]+)"/g, `id="${prefijo}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#${prefijo}-$1)`)
}

export const TEMAS: Tema[] = [
  nuevoTema('circuito', 'Circuito', 'Neón nocturno', '#0d1430', 'Circuito: impulsos de luz recorren las pistas.',
    paleta('Circuito', 'circuito', ['#060a18', '#0a1126', '#0d1430', '#131c40', '#e4ecff', '#a3b3da', '#8090c0'],
      { accent: '#52e4ff', danger: '#ff5f6d', success: '#7ff5a8', warning: '#ffc857', pro: '#c9a4ff' }, NEON_GIT),
    CIRCUITO, M_CIRCUITO),
  nuevoTema('horizonte', 'Horizonte', 'Neón nocturno', '#0c081e', 'Horizonte: la cuadrícula avanza hacia ti bajo el sol.',
    paleta('Horizonte', 'horizonte', ['#07060f', '#0c0a19', '#110d22', '#17122d', '#f3eaff', '#c4b5e0', '#9a8cc0'],
      { accent: '#e879f9', danger: '#ff5f6d', success: '#7ff5a8', warning: '#ffc857', pro: '#52e4ff' }),
    HORIZONTE, M_HORIZONTE),
  nuevoTema('constelacion', 'Constelación', 'Neón nocturno', '#0d1430', 'Constelación: señales que viajan entre los nodos.',
    paleta('Constelación', 'constelacion', ['#060a18', '#0a1126', '#0d1430', '#131c40', '#e4ecff', '#a3b3da', '#8090c0'],
      { accent: '#c9a4ff', danger: '#ff5f6d', success: '#7ff5a8', warning: '#ffc857', pro: '#52e4ff' }),
    CONSTELACION, M_CONSTELACION),
  nuevoTema('boreal', 'Boreal', 'Aurora', '#04121c', 'Boreal: cortinas verdes que ondulan sobre las montañas.',
    paleta('Boreal', 'boreal', ['#020812', '#061019', '#081723', '#0c1e2c', '#e6f7f1', '#a9cfc4', '#7fa79c'],
      { accent: '#5eead4', danger: '#ff5f6d', success: '#a3e635', warning: '#ffc857', pro: '#a78bfa' }),
    BOREAL, cortina('#7ff5a8', '#2fb86c')),
  nuevoTema('austral', 'Austral', 'Aurora', '#120a24', 'Austral: cortinas rosa y lila sobre el mar, con su reflejo.',
    paleta('Austral', 'austral', ['#07051a', '#0d0a22', '#120e2b', '#181335', '#fbeaf2', '#d6bfd6', '#a993b8'],
      { accent: '#ff8fb1', danger: '#ff5533', success: '#7ff5a8', warning: '#ffc857', pro: '#a78bfa' }),
    AUSTRAL, cortina('#ff6f8e', '#a78bfa')),
  nuevoTema('bruma', 'Bruma', 'Aurora', '#0a1830', 'Bruma: luces suaves que derivan despacio.',
    paleta('Bruma', 'bruma', ['#081428', '#0b1a30', '#0d1d38', '#12243f', '#e6f0fa', '#a8bfd6', '#7f97b3'],
      { accent: '#8ea2ff', danger: '#ff5f6d', success: '#4ade80', warning: '#ffc857', pro: '#2dd4bf' }),
    BRUMA, M_BRUMA),
  nuevoTema('ronin', 'Ronin', 'Bushidō', '#140e10', 'Ronin: un guerrero solo ante un sol rojo enorme.',
    paletaBushido('Ronin', 'ronin'), RONIN, M_RONIN),
  nuevoTema('katana', 'Katana', 'Bushidō', '#0e1014', 'Katana: una hoja de acero que cruza la noche.',
    paletaBushido('Katana', 'katana'), KATANA, M_KATANA),
  nuevoTema('fortaleza', 'Fortaleza', 'Bushidō', '#101116', 'Fortaleza: un castillo sobre la colina, entre niebla y luna.',
    paletaBushido('Fortaleza', 'fortaleza'), FORTALEZA, M_FORTALEZA),
  nuevoTema('singularidad', 'Singularidad', 'Espacio profundo', '#0a0806', 'Singularidad: la luz se curva alrededor de un agujero negro.',
    paletaEspacio('Singularidad', 'singularidad'), SINGULARIDAD, M_SINGULARIDAD),
  nuevoTema('anillos', 'Anillos', 'Espacio profundo', '#07090f', 'Anillos: un gigante de gas iluminado de lado por una estrella lejana.',
    paletaEspacio('Anillos', 'anillos'), ANILLOS, M_ANILLOS),
  nuevoTema('teselado', 'Teselado', 'Espacio profundo', '#0b0805', 'Teselado: marcos de luz que se pierden en la distancia.',
    paletaEspacio('Teselado', 'teselado'), TESELADO, M_TESELADO),
]

/** El tema por su nombre, con o sin tildes y en mayúsculas o minúsculas. */
export function buscar(nombre: string): Tema | undefined {
  const limpio = nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

  return TEMAS.find(t => t.id === limpio)
}

/** El nombre de escena de un tema, con la versión de los dibujos. */
export function escenaDe(t: Tema): string {
  return `${t.id}-${VERSION_ESCENAS}`
}

/** El tema que dibuja una escena, por su nombre. */
export function porEscena(escena: string): Tema | undefined {
  return TEMAS.find(t => escenaDe(t) === escena)
}

/** La sala de un tema. */
export function salaDe(t: Tema): Sala {
  return SALAS.find(s => s.nombre === t.familia) ?? (SALAS[0] as Sala)
}

/** Los temas de una sala, en su orden. */
export function temasDe(sala: Sala): Tema[] {
  return TEMAS.filter(t => t.familia === sala.nombre)
}
