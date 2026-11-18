import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

import { CLAWD_PINTOR } from './clawd'
import { SALAS, buscar, escenaDe, porEscena, salaDe, temasDe } from './temas'
import type { Sala, Tema } from './temas'

// museo-clawd: temas para la aplicación de escritorio de Claude Code. Cada tema pinta
// los colores de la aplicación, pone una escena detrás de la conversación con los
// paneles en cristal encima y lleva un motivo propio junto al indicador de trabajo.
// Se eligen con /tema, que abre el Museo encima de la caja de texto: una sala por
// familia, un cuadro por tema y un Clawd pintor que cuenta cómo es el que pones.

// La clave de $.store con el tema elegido, que vale para todas las sesiones: el id
// del tema, o «no» si se quitó. Sin nada guardado, no se pone ningún tema.
const GUARDADO = 'tema'
// La clave de $.store que recuerda que ya se avisó de /tema, para avisar una vez.
const AVISADO = 'avisado'

// El cristal de todos los temas: 12 px de desenfoque y 30 % de opacidad. El tinte es
// el de cada tema; un tema sin tinte deja que la aplicación use el color de panel de
// su paleta.
const CRISTAL = { blur: 12, opacity: 0.3 }

const ORO = '#c9a24f'
const MADERA = '#5a4128'

const puesto = atom({ plugin: 'museo-clawd', key: 'puesto' } as const, '')
const abierto = atom({ plugin: 'museo-clawd', key: 'abierto' } as const, false)
const sala = atom({ plugin: 'museo-clawd', key: 'sala' } as const, '')
const aviso = atom({ plugin: 'museo-clawd', key: 'aviso' } as const, '')

/** Lo que se le pasa a la aplicación para poner un tema. */
function argumentos(t: Tema): ThemeSetArgs {
  return {
    colors: t.colores,
    backdrop: {
      scene: escenaDe(t),
      glass: { ...CRISTAL, ...(t.tinte !== '' && { tint: t.tinte }) },
    },
  }
}

// Pide a la aplicación el tema y apunta si lo dibuja; no toca lo guardado. Si todavía no
// se ha conectado ninguna aplicación (al empezar la sesión puede pasar), el tema queda
// puesto con su `requestId` y se dibuja en cuanto se conecte: eso no es un fallo y no se
// avisa, porque el aviso se quedaría en el bocadillo con el tema ya a la vista.
async function aplicar($: EngineInterface, t: Tema): Promise<string> {
  const r = await $.theme.set(argumentos(t))
  const motivo = r.isDrawn || r.requestId !== undefined ? '' : r.reason
  await update($, puesto, () => t.id)
  await update($, aviso, () => motivo)

  return motivo
}

// Pone un tema y lo guarda para las sesiones siguientes.
async function poner($: EngineInterface, t: Tema): Promise<string> {
  const motivo = await aplicar($, t)
  await $.store.set(GUARDADO, t.id)

  return motivo
}

// Quita el tema que haya, sea de quien sea, porque lo pide la persona, y lo recuerda.
async function quitar($: EngineInterface): Promise<void> {
  await $.theme.clear()
  await $.store.set(GUARDADO, 'no')
  await update($, puesto, () => '')
  await update($, aviso, () => '')
}

// Abre el Museo en la sala del tema puesto, o en la primera si no hay ninguno.
async function abrirMuseo($: EngineInterface): Promise<void> {
  const t = buscar(await read($, puesto))
  const primera = SALAS[0] as Sala
  await update($, sala, () => (t === undefined ? primera.id : salaDe(t).id))
  await update($, abierto, () => true)
}

// Los temas por salas, en una línea.
function lista(): string {
  return SALAS.map(s => `${s.nombre}: ${temasDe(s).map(t => t.id).join(', ')}`).join('. ')
}

// Lo que dice el Clawd pintor en su bocadillo.
function bocadillo(t: Tema | undefined, motivo: string): string {
  if (motivo !== '') {
    return `Tu aplicación no dibuja el tema: ${motivo}`
  }

  return t === undefined ? 'Sin tema: la aplicación tal cual. Pulsa una placa y cuelgo ese cuadro.' : t.bocadillo
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'tema',
      description: 'Abre el Museo de temas encima de la caja de texto, o pone un tema por su nombre',
      argumentHint: '[nombre | no | lista]',
    })
    // Un tema no se guarda con la sesión: se vuelve a poner al empezar cada una.
    const guardado = await $.store.get(GUARDADO)
    const t = typeof guardado === 'string' ? buscar(guardado) : undefined
    if (t !== undefined) {
      await aplicar($, t)
    } else if (typeof guardado === 'string' && guardado !== 'no') {
      // Un tema guardado que ya no está en el Museo, como los de Cartografía, que salió
      // en la 0.2.0: se avisa una vez y se olvida, y la sesión empieza sin tema.
      $.ui.toast(`museo-clawd: el tema «${guardado}» ya no está en el Museo. Escribe /tema para elegir otro.`)
      await $.store.delete(GUARDADO)
      await $.store.set(AVISADO, true)
    } else if (guardado === undefined && (await $.store.get(AVISADO)) === undefined) {
      $.ui.toast('museo-clawd: escribe /tema para abrir el Museo y elegir un tema.')
      await $.store.set(AVISADO, true)
    }

    return next(e)
  })

  on('command.run', { command: 'tema' }, async ($, e) => {
    const orden = e.args.trim()

    if (orden === '') {
      await abrirMuseo($)

      return { text: 'Museo abierto encima de la caja de texto. Pulsa la placa de un cuadro para ponerlo.' }
    }
    if (orden.toLowerCase() === 'no') {
      await quitar($)

      return { text: 'Tema quitado: la aplicación vuelve a su aspecto.' }
    }
    if (orden.toLowerCase() === 'lista') {
      return { text: `Los temas, por salas. ${lista()}.` }
    }

    const t = buscar(orden)
    if (t === undefined) {
      return { text: `No conozco el tema «${orden}». Los temas, por salas. ${lista()}.` }
    }
    const motivo = await poner($, t)

    return { text: motivo === '' ? t.bocadillo : `${t.nombre} está guardado, pero tu aplicación no lo dibuja: ${motivo}` }
  })

  // La escena de fondo del tema puesto, en la aplicación de escritorio y en la del móvil.
  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const t = porEscena(e.props.scene)
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.plugin !== $.plugin.name || t === undefined) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={t.escena} alt={`Escena de ${t.nombre}`} isInteractive />
  })

  // El motivo del tema puesto, a la izquierda de la línea que dice qué hace Claude.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const propio = await next(e)
    const t = buscar(await read($, puesto))
    if (e.surface !== 'desktop' || t === undefined) {
      return propio
    }
    const { Box, Svg } = $.ui.resolve(e)

    return (
      <Box flexDirection="row" alignItems="center" gap={1}>
        <Svg source={t.motivo} alt={`Motivo de ${t.nombre}`} width={40} height={22} isInteractive />
        {propio}
      </Box>
    )
  })

  // El Museo: los botones de las salas, el Clawd pintor y los cuadros de la sala.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'desktop' || e.props.hasSurvey || !(await read($, abierto))) {
      return next(e)
    }
    const { Box, Button, Svg, Text } = $.ui.resolve(e)
    const idSala = await read($, sala)
    const vista = SALAS.find(s => s.id === idSala) ?? (SALAS[0] as Sala)
    const actual = buscar(await read($, puesto))
    const motivo = await read($, aviso)

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row" alignItems="center" gap={1} flexWrap="wrap">
          {SALAS.map(s => (
            <Button
              key={`sala-${s.id}`}
              label={s.id === vista.id ? `● ${s.nombre}` : s.nombre}
              onPress={() => update($, sala, () => s.id)}
            />
          ))}
          <Button key="sin-tema" label="Sin tema" onPress={() => quitar($)} />
          {/* Una cruz cierra el Museo. La aplicación de escritorio pinta los botones a su
              manera, en gris, y no respeta el color de lo que llevan dentro. */}
          <Button key="cerrar" role="dismiss" label="✕" onPress={() => update($, abierto, () => false)} />
        </Box>
        <Box flexDirection="row" alignItems="flex-start" gap={2} flexWrap="wrap">
          <Box flexDirection="column" alignItems="center" gap={1} width={30}>
            <Box backgroundColor="#ffffff1f" paddingX={1}>
              <Text>{bocadillo(actual, motivo)}</Text>
            </Box>
            <Svg source={CLAWD_PINTOR} alt="El Clawd pintor, pintando un lienzo" width={88} height={50} />
          </Box>
          {temasDe(vista).map(t => (
            <Box flexDirection="column" alignItems="center" gap={1}>
              {/* El marco: dorado el del tema puesto, de madera los demás. El paso «xs» es
                  más fino que una celda en la aplicación de escritorio. */}
              <Box key={`marco-${t.id}`} backgroundColor={actual?.id === t.id ? ORO : MADERA} padding="xs">
                <Svg source={t.escena} alt={`Cuadro de ${t.nombre}`} width={92} height={56} />
              </Box>
              <Button key={`placa-${t.id}`} label={t.nombre} onPress={() => poner($, t)} />
            </Box>
          ))}
        </Box>
      </Box>
    )
  })
}
