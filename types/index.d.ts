// Los valores que museo-clawd guarda en $.state durante la sesión. El tema elegido
// se guarda además en $.store, bajo la clave «tema», para que valga en todas las sesiones.

/** El id de un tema (como «circuito» o «ronin»), o '' cuando no hay ninguno puesto. */
export type IdDeTema = string

declare module 'claude-code' {
  interface PluginState {
    'museo-clawd': {
      /** El tema puesto ahora. */
      puesto: IdDeTema
      /** Si el Museo está abierto encima de la caja de texto. */
      abierto: boolean
      /** La sala que enseña el Museo, por su id («neon», «aurora», «bushido» o «espacio»). */
      sala: string
      /** Por qué la aplicación no dibujó el último tema, o '' si lo dibujó. */
      aviso: string
    }
  }
}
