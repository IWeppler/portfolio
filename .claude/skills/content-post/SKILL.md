---
name: content-post
description: Diseña un posteo del módulo Content (/dashboard/content) a partir del pedido que Ignacio copia del panel ("/content-post <id> [formato]", o sin id para todas las ideas pendientes). Primero arma un brief con todo el contexto real (kit, referencias, capturas, piezas anteriores) y lo muestra para aprobar; recién con el OK diseña por el MCP portfolio-content y revisa el render.
---

# /content-post: de la idea al posteo

Ignacio escribe la idea en el panel y te pega el pedido. Tu trabajo tiene dos tiempos y el corte entre los dos es obligatorio: **primero el brief, después el diseño.** No diseñes nada hasta que apruebe el brief.

El argumento es el id de la pieza y, opcional, un formato (`square`, `portrait`, `grid`, `story`, `landscape`). Sin id: `list_posts` con `pending: true` y trabajá una pieza por vez, con su brief cada una.

## 1. Juntar el contexto (sin preguntar todavía)

Con el MCP `portfolio-content`:

1. `get_post` del id: la idea, el formato principal y lo que ya tenga.
2. `get_brand_kit` de su marca: colores, roles tipográficos, capas disponibles, voz, reglas y `reviewedExamples` (lo aprobado es el estilo; lo rechazado, con su nota, es lo que no hay que repetir).
3. `list_library` con `kind: "referencia"` y `view_library` de las que tengan que ver con la idea. La nota de cada referencia dice qué tomar. Las referencias de Ignacio están también en `references/content/` del repo (leelas con Read si la biblioteca no responde).
4. `find_assets` por cada imagen que la idea va a necesitar. Mirá con `view_assets` las que digan "sin describir" antes de elegirlas.
5. `list_posts` de la marca: no repetir el gancho ni la estructura de las últimas piezas.

Leé también la memoria del proyecto: ahí están las cifras reales, cómo presentar las demos y qué no le gustó antes.

## 2. Mostrar el brief y esperar el OK

Respondé con el brief, corto y concreto, en este orden:

- **Concepto**: la idea en una línea, y por qué ese ángulo (una línea).
- **Mensaje principal**: lo que tiene que quedar si solo se ve la portada.
- **Para quién y para qué**: audiencia y objetivo.
- **Formato**: formato y cantidad de slides.
- **Slide por slide**: qué función cumple (gancho, problema, proceso, prueba, cierre), el texto en borrador y qué se ve.
- **Dirección de arte**: de qué referencia sale cada recurso visual (composición, profundidad, luz, materiales, objetos, relación entre elementos) y qué no se toma (paleta, tipografía y fotos de otros nunca). Si una referencia pide algo que el render no hace, decí cómo se aproxima.
- **Recursos**: los que ya existen (con su url de `find_assets`) y los que faltan, con cómo conseguirlos (lo que dice `missing`).
- **Datos**: qué cifras o hechos usa y de dónde salen. Si la idea necesita un dato que no está en la memoria ni en el post, preguntalo; no lo inventes.
- **Dudas**: solo las que cambian el posteo.

Terminá preguntando si lo aprueba o qué cambia. **Pará acá.** Si corrige, rehacé el brief con eso y volvé a mostrarlo.

## 3. Con el brief aprobado: conseguir lo que falta

- **Capturas reales que no existen**: `node scripts/content-capture.mjs <url publicada> <salida.png> --viewport mobile|desktop` (con `--full` para la página entera). Mirá el PNG: si muestra cifras, precios o testimonios de una demo, se marca `demoData`. Subila con el `curl` que imprime el script (`category capture`, `origin real`, `projectSlug`). Si la biblioteca no está disponible, avisá y seguí con lo que hay.
- **Lo que nadie tiene** (un objeto, una foto): pedíselo a Ignacio con precisión (qué se ve, encuadre, orientación). Generar con IA solo si él lo pide, y confirmando antes porque consume créditos; nunca para mostrar la interfaz de un proyecto.
- Texturas, luz, grillas, metáforas: no hacen falta archivos (`backdrop`, capas `graphic`).

## 4. Diseñar

Un solo `update_post` con:

- `content`: título, bajada, puntos, CTA y caption (2 a 5 líneas, cierre a la web o al DM), más `objective` y `audience` del brief.
- `designs` del formato pedido: los slides con capas que toman el texto con `field` cuando corresponde. `purpose` en cada capa que no sea texto.
- `status: "borrador"`.

Reglas que no se negocian:

- La identidad sale del kit: colores como tokens (con alfa si hace falta, `$accent/20`), solo sus fuentes y roles. Lo que se puede explorar es la composición, la profundidad, la luz y los recursos.
- Las capturas reales solo se recortan (`crop`), se encajan, se enmarcan (`device`) y se tratan con luz. Nunca se inventa ni se altera una interfaz.
- Una imagen con `demoData` se puede usar como interfaz, nunca como prueba de un número.
- Ninguna cifra, cliente ni testimonio que no sea real.

## 5. Revisar, con un límite

1. Corregí los `issues` que devuelve `update_post`. Ojo con los textos que cortan en más líneas de las previstas y pisan otra capa: el lint informa las líneas, no los choques.
2. `render_preview` de cada slide y `render_preview` con `sheet: true` para ver el carrusel como secuencia. Mirá de verdad: contraste, jerarquía, que la portada se entienda sola, que el recurso visual se lea como pedía el brief.
3. Una ronda de correcciones en un solo `update_post`, y de nuevo el render. Una segunda ronda solo si quedó algo roto. No sigas puliendo en círculo.

## 6. Entregar

Un párrafo: qué armaste, cuántos slides, qué decisión del brief cambió al diseñar (si alguna) y qué quedó pendiente (un recurso que falta, un dato a confirmar). Recordale que lo ve en el panel, que ahí puede corregir textos y marcarlo listo o rechazado con una nota.
