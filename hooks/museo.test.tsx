import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { SALAS, TEMAS, escenaDe, temasDe } from './temas'

type Puesto = {
  colors?: { label?: string; inputs?: { light?: unknown; dark?: unknown } }
  backdrop?: { scene?: string; glass?: unknown }
}
type Motor = Parameters<TestBody>[0]
type Ganchos = Parameters<TestBody>[1]

// Cada hook de estas pruebas hace de motor: responde a lo que el mod le pide, con
// un almacén de mentira para $.store.
function motor(on: Ganchos, guardado = new Map<string, unknown>()) {
  const puestos: Puesto[] = []
  const avisos: unknown[] = []
  let quitados = 0
  on('command.register', () => ({ value: { command: 'tema' } }))
  on('theme.set', (_, e) => {
    puestos.push(e as Puesto)

    return { value: { isDrawn: true, requestId: 'backdrop' } }
  })
  on('theme.clear', () => {
    quitados += 1

    return { value: { isDrawn: false, reason: 'quitado' } }
  })
  on('ui.toast', (_, e) => {
    avisos.push(e)

    return { value: undefined }
  })
  on('store.get', (_, e) => ({ value: guardado.get(e.key) }))
  on('store.set', (_, e) => {
    guardado.set(e.key, e.value)

    return { value: undefined }
  })
  on('store.delete', (_, e) => {
    guardado.delete(e.key)

    return { value: undefined }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  return { puestos, avisos, guardado, quitados: () => quitados }
}

const empezar = ($: Motor) => $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })

// La orden /tema con sus argumentos, como la escribiría la persona.
function tema($: Motor, args: string) {
  return $.command.run({ command: 'tema', args } as Parameters<Motor['command']['run']>[0])
}

const BANDA = {
  hasSurvey: false,
  isCollapsed: false,
  isWorking: false,
  maxRows: 12,
  bodyColumns: 151,
  scroll: { offset: 0, bodyRows: 11 },
  view: {},
}

test('cada una de las seis salas tiene al menos tres temas, y la aplicación puede pintarlos todos', () => {
  expect(SALAS.length).toBe(6)
  expect(TEMAS.length).toBe(19)
  expect(SALAS.map(s => temasDe(s).length)).toEqual([3, 3, 3, 3, 4, 3])
  expect(new Set(TEMAS.map(t => t.id)).size).toBe(TEMAS.length)
  for (const t of TEMAS) {
    expect(t.problemas.filter(linea => linea.startsWith("Desktop won't paint"))).toEqual([])
    expect(t.escena.length).toBeLessThan(131072)
    expect(t.escena).toContain('viewBox')
    expect(t.motivo).toContain('<svg')
  }
})

test('cada escena se mueve con CSS y se queda quieta con «reducir movimiento»', () => {
  for (const t of TEMAS) {
    expect(t.escena).toContain('@keyframes')
    expect(t.escena).toContain('@media (prefers-reduced-motion: reduce){*{animation:none!important}}')
  }
})

test('sin nada guardado no pone ningún tema y avisa de /tema una sola vez', async ($, on) => {
  const m = motor(on)

  await empezar($)
  await empezar($)

  expect(m.puestos.length).toBe(0)
  expect(m.avisos.length).toBe(1)
})

test('al empezar vuelve a poner el tema guardado: Ronin, solo de noche y con su tinte', async ($, on) => {
  const m = motor(on, new Map<string, unknown>([['tema', 'ronin']]))

  await empezar($)

  expect(m.puestos[0]?.colors?.label).toBe('Ronin')
  expect(m.puestos[0]?.colors?.inputs?.dark).toBeDefined()
  expect(m.puestos[0]?.colors?.inputs?.light).toBeUndefined()
  expect(m.puestos[0]?.backdrop).toEqual({ scene: 'ronin-v5', glass: { blur: 12, opacity: 0.3, tint: '#140e10' } })
})

test('un tema guardado que ya no está en el Museo se olvida con un solo aviso', async ($, on) => {
  const m = motor(on, new Map<string, unknown>([['tema', 'marea']]))

  await empezar($)
  await empezar($)

  expect(m.puestos.length).toBe(0)
  expect(m.avisos.length).toBe(1)
  expect(JSON.stringify(m.avisos[0])).toContain('«marea» ya no está en el Museo')
  expect(m.guardado.has('tema')).toBe(false)
})

test('/tema singularidad lo pone con su tinte, lo guarda y contesta con el bocadillo', async ($, on) => {
  const m = motor(on)

  await empezar($)
  const r = await tema($, 'Singularidad')

  expect(m.puestos[0]?.colors?.label).toBe('Singularidad')
  expect(m.puestos[0]?.backdrop).toEqual({ scene: 'singularidad-v5', glass: { blur: 12, opacity: 0.3, tint: '#0a0806' } })
  expect(m.guardado.get('tema')).toBe('singularidad')
  expect(r.text).toBe('Singularidad: la luz se curva alrededor de un agujero negro.')
})

test('/tema constelación y /tema oráculo aceptan tildes y mayúsculas', async ($, on) => {
  const m = motor(on)

  await tema($, 'CONSTELACIÓN')
  await tema($, 'Oráculo')

  expect(m.puestos[0]?.colors?.label).toBe('Constelación')
  expect(m.puestos[1]?.colors?.label).toBe('Oráculo')
})

test('/tema no quita el tema, lo recuerda y ya no avisa al empezar', async ($, on) => {
  const m = motor(on)

  await tema($, 'boreal')
  const r = await tema($, 'no')
  await empezar($)

  expect(m.quitados()).toBe(1)
  expect(m.guardado.get('tema')).toBe('no')
  expect(r.text).toContain('Tema quitado')
  expect(m.puestos.length).toBe(1)
  expect(m.avisos.length).toBe(0)
})

test('/tema lista y un nombre desconocido enseñan los temas sin poner ninguno', async ($, on) => {
  const m = motor(on)

  const lista = await tema($, 'lista')
  const desconocido = await tema($, 'volcán')

  expect(lista.text).toContain('Bushidō: ronin, katana, fortaleza')
  expect(lista.text).toContain('Espacio profundo: singularidad, anillos, teselado')
  expect(lista.text).toContain('Valhalla: drakkar, jarl, yggdrasil, thor')
  expect(lista.text).toContain('Olimpo: santuario, zeus, oraculo')
  expect(lista.text).not.toContain('marea')
  expect(desconocido.text).toContain('No conozco el tema «volcán».')
  expect(m.puestos.length).toBe(0)
})

test('el Museo enseña una sala cada vez y pone el tema de la placa que pulsas', async ($, on) => {
  const m = motor(on)

  await tema($, 'circuito')
  await tema($, '')
  const ui = await $.ui.mount({ plugin: 'museo-clawd', surface: 'desktop', component: 'AbovePrompt', props: BANDA })

  expect((await ui.find({ key: 'sala-neon' }))?.text).toBe('● Neón nocturno')
  expect(await ui.find({ key: 'placa-circuito' })).toBeDefined()
  expect(await ui.find({ key: 'placa-anillos' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /Circuito: impulsos/ })).toBeDefined()

  await ui.press({ key: 'sala-espacio' })
  await ui.press({ key: 'placa-anillos' })

  expect(m.puestos[1]?.colors?.label).toBe('Anillos')
  expect(m.guardado.get('tema')).toBe('anillos')
  expect(await ui.find({ type: 'Text', text: 'Puesto' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /Anillos: un gigante/ })).toBeDefined()

  await ui.press({ key: 'sala-bushido' })
  await ui.press({ key: 'placa-katana' })

  expect((await ui.find({ key: 'sala-bushido' }))?.text).toBe('● Bushidō')
  expect(m.puestos[2]?.backdrop).toEqual({ scene: 'katana-v5', glass: { blur: 12, opacity: 0.3, tint: '#0e1014' } })
  expect(await ui.find({ type: 'Text', text: /Katana: una hoja de acero/ })).toBeDefined()
  await ui.unmount()
})

test('cada escena se dibuja en la aplicación de escritorio y en la del móvil', async ($, on) => {
  motor(on)

  for (const t of TEMAS) {
    for (const surface of ['desktop', 'mobile'] as const) {
      const ui = await $.ui.mount({
        plugin: 'museo-clawd',
        surface,
        component: 'Backdrop',
        requestId: 'backdrop',
        props: { scene: escenaDe(t), plugin: 'museo-clawd', glass: { blur: 12, opacity: 0.3 } },
      })

      expect(await ui.find({ type: 'Svg' })).toBeDefined()
      await ui.unmount()
    }
  }
})

test('con un tema puesto, el indicador lleva su motivo junto a la línea de la aplicación', async ($, on) => {
  motor(on)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)

    return <Text>Trabajando</Text>
  })

  await tema($, 'fortaleza')
  const ui = await $.ui.mount({
    plugin: 'museo-clawd',
    surface: 'desktop',
    component: 'Spinner',
    props: { word: 'Trabajando', message: null, suffix: '…', mode: 'thinking' },
  })

  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'Trabajando' })).toBeDefined()
  await ui.unmount()
})
