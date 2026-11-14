# Herramientas

Los dibujos de dos de las cuatro salas del Museo no están hechos a mano: los calculan estos generadores, que escriben los módulos del mod con las escenas ya listas.

| Generador | Escribe | Qué dibuja |
| --- | --- | --- |
| `genera_cartografia.mjs` | `hooks/cartografia.ts` | Marea, Cumbres e Isobaras: curvas de nivel calculadas sobre un relieve de bultos gaussianos y ondas suaves (marching squares), suavizadas (Chaikin) y simplificadas (Ramer-Douglas-Peucker), con el papel de día y el de noche. |
| `genera_espacio.mjs` | `hooks/espacio.ts` | Singularidad, Anillos y Teselado: estrellas al azar, degradados, desenfoques y, en el disco del agujero negro, una textura de vetas hecha con ruido fractal. |

Las escenas de Neón nocturno y Aurora están escritas a mano en `hooks/temas.ts`.

## Cómo se regeneran

Cada generador recibe dos rutas: una carpeta donde deja cada escena suelta en SVG, para verla en un navegador, y el módulo del mod que escribe. La carpeta de los SVG conviene que esté fuera del repositorio.

```bash
node herramientas/genera_cartografia.mjs <carpeta para los SVG> hooks/cartografia.ts
```

```bash
node herramientas/genera_espacio.mjs <carpeta para los SVG> hooks/espacio.ts
```

Los dos son deterministas: con el mismo código escriben el mismo módulo, byte a byte. Por eso `.gitattributes` fuerza los finales de línea LF.

## Al cambiar un dibujo

La aplicación de escritorio guarda el dibujo de una escena mientras se llama igual. Después de cambiar cualquier escena hay que subir `VERSION_ESCENAS` en `hooks/temas.ts` (por ejemplo, de `v1` a `v2`) para que la aplicación la pida otra vez.

En la aplicación de escritorio los fondos no se animan todavía, así que cada escena tiene que quedar bien quieta. Las animaciones CSS que llevan se quedan escritas para el día que la aplicación las mueva.
