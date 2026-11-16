# Herramientas

Los dibujos de dos de las cuatro salas del Museo no están hechos a mano: los calculan estos generadores, que escriben los módulos del mod con las escenas ya listas.

| Generador | Escribe | Qué dibuja |
| --- | --- | --- |
| `genera_bushido.mjs` | `hooks/bushido.ts` | Ronin, Katana y Fortaleza: siluetas planas como las de los grabados japoneses (el ronin, la peña, el castillo con sus tejados de aleros levantados), montes de aguada con crestas calculadas, bandas de niebla, la banda oscura de lo alto del cielo y nubes con forma de pincelada que cruzan el sol y la luna. |
| `genera_espacio.mjs` | `hooks/espacio.ts` | Singularidad, Anillos y Teselado: estrellas al azar, degradados, desenfoques y, en el disco del agujero negro, una textura de vetas hecha con ruido fractal. |

Las escenas de Neón nocturno y Aurora están escritas a mano en `hooks/temas.ts`.

## Cómo se regeneran

Cada generador recibe dos rutas: una carpeta donde deja cada escena suelta en SVG, para verla en un navegador, y el módulo del mod que escribe. La carpeta de los SVG conviene que esté fuera del repositorio.

```bash
node herramientas/genera_bushido.mjs <carpeta para los SVG> hooks/bushido.ts
```

```bash
node herramientas/genera_espacio.mjs <carpeta para los SVG> hooks/espacio.ts
```

Los dos son deterministas: con el mismo código escriben el mismo módulo, byte a byte. Por eso `.gitattributes` fuerza los finales de línea LF.

## Al cambiar un dibujo

La aplicación de escritorio guarda el dibujo de una escena mientras se llama igual. Después de cambiar cualquier escena hay que subir `VERSION_ESCENAS` en `hooks/temas.ts` (por ejemplo, de `v1` a `v2`) para que la aplicación la pida otra vez.

La aplicación de escritorio mueve las escenas con las animaciones CSS que llevan en su `<style>`. Cada escena tiene que quedar bien también quieta, porque con la opción de reducir el movimiento del sistema las animaciones se paran y cada elemento se queda en la posición de sus atributos.

Para ver un momento concreto del movimiento, se pone la escena dentro de una página, se congelan sus animaciones con un script (`document.getAnimations()`, `pause()` y `currentTime`) y se hace una captura con Edge sin ventana. Dentro de una página, los `<style>` de las escenas valen para toda ella, así que las clases propias de la página tienen que llevar un prefijo que no use ninguna escena.
