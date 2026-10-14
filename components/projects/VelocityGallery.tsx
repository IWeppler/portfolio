"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";

export type GalleryItem = {
  key: string;
  href: string;
  src: string;
  name: string;
  /** Posicion del proyecto en el listado, ya formateada: "(06)". */
  index: string;
  detail: string;
};

// Velocidad del avance solo, en px por milisegundo.
const AUTO_SPEED = 0.06;
// Con el mouse encima avanza mas lento, para poder hacer click tranquilo.
const HOVER_SLOWDOWN = 0.25;
// Que tan rapido la posicion real alcanza a la buscada (inercia).
const FOLLOW = 0.075;
// Cuanto sigue de largo un arrastre al soltarlo, segun su velocidad.
const FLING = 260;
// Px que se puede mover el puntero antes de que cuente como arrastre.
const DRAG_THRESHOLD = 6;
// Velocidad (px por cuadro) a la que la deformacion llega a su maximo.
const MAX_VELOCITY = 38;
// Margen arriba y abajo del canvas. La deformacion es horizontal, asi que no
// necesita espacio extra; queda en 0 por si se suma una vertical.
const BULGE_ROOM = 0;

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    // Panza hacia los costados: el borde de arriba queda en su lugar y la
    // parte de abajo se atrasa respecto del movimiento. El desplazamiento
    // crece con el cuadrado de la altura, asi los bordes laterales se curvan
    // en vez de quedar rectos como en un skew comun.
    float lag = pow(1.0 - uv.y, 2.0);
    p.x += uVelocity * 0.12 * lag;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform vec2 uPlane;
  uniform vec2 uImage;
  uniform float uLoaded;
  uniform vec3 uEmpty;
  varying vec2 vUv;

  void main() {
    // object-fit: cover dentro del plano.
    vec2 ratio = vec2(
      min((uPlane.x / uPlane.y) / (uImage.x / uImage.y), 1.0),
      min((uPlane.y / uPlane.x) / (uImage.y / uImage.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    vec3 color = texture2D(tMap, uv).rgb;
    gl_FragColor = vec4(mix(uEmpty, color, uLoaded), 1.0);
  }
`;

type Layout = { width: number; card: number; gap: number; height: number; copies: number };

function measure(width: number, items: number): Layout {
  const card = width < 640 ? width * 0.74 : width < 1024 ? width * 0.42 : width * 0.27;
  const gap = width < 768 ? 16 : 24;
  // Tantas copias de la lista como hagan falta para que el loop nunca deje
  // un hueco visible: el ancho de pantalla mas dos tarjetas de sobra.
  const copies = Math.max(1, Math.ceil((width + 2 * (card + gap)) / (items * (card + gap))));
  return { width, card, gap, height: card * 1.25, copies };
}

// La imagen pasa por el optimizador de Next: mismo origen (sin CORS para
// WebGL) y en un tamano razonable.
const optimized = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Carrusel de proyectos que avanza solo, se adelanta o atrasa arrastrando y
 * deforma las imagenes segun la velocidad. Las imagenes se dibujan en WebGL
 * (OGL); las tarjetas son links comunes encima, que se mueven a la par, asi
 * que se puede navegar con teclado y, sin WebGL, muestran la imagen normal.
 */
export function VelocityGallery({ items }: { items: GalleryItem[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [webgl, setWebgl] = useState(true);

  // Posicion y arrastre: viven en refs porque se actualizan en cada cuadro.
  const motion = useRef({
    current: 0,
    target: 0,
    previous: 0,
    velocity: 0,
    hovering: false,
    dragging: false,
    startX: 0,
    startTarget: 0,
    lastX: 0,
    lastTime: 0,
    pointerVelocity: 0,
    moved: 0,
  });

  const loop = layout ? Array.from({ length: layout.copies }, () => items).flat() : items;

  useEffect(() => {
    setWebgl(hasWebGL());
    const element = wrap.current;
    if (!element) return;
    const update = () => setLayout(measure(element.clientWidth, items.length));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    if (!layout) return;
    const host = canvasHost.current;
    const element = wrap.current;
    if (!element) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { card, gap, height, width } = layout;
    const step = card + gap;
    const total = loop.length * step;
    const room = height * BULGE_ROOM;

    // --- WebGL (opcional) ---
    let renderer: Renderer | null = null;
    let camera: Camera | null = null;
    let scene: Transform | null = null;
    const meshes: Mesh[] = [];

    if (webgl && host) {
      renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
      const gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      host.appendChild(gl.canvas);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      renderer.setSize(width, height + room * 2);

      // Camara ortografica en pixeles: x de 0 a ancho, y hacia abajo.
      camera = new Camera(gl, {
        left: 0,
        right: width,
        top: room,
        bottom: -(height + room),
        near: 1,
        far: 100,
      });
      camera.position.z = 10;
      scene = new Transform();

      const geometry = new Plane(gl, { widthSegments: 32, heightSegments: 16 });
      const surface = getComputedStyle(document.documentElement).getPropertyValue("--surface").trim() || "#1a1b1d";
      const empty = [1, 3, 5].map((i) => parseInt(surface.slice(i, i + 2), 16) / 255);

      for (const item of loop) {
        const texture = new Texture(gl, { generateMipmaps: false });
        const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            tMap: { value: texture },
            uPlane: { value: [card, height] },
            uImage: { value: [1, 1] },
            uLoaded: { value: 0 },
            uEmpty: { value: empty },
            uVelocity: { value: 0 },
          },
        });
        const image = new window.Image();
        image.src = optimized(item.src);
        image.onload = () => {
          texture.image = image;
          program.uniforms.uImage.value = [image.naturalWidth, image.naturalHeight];
          program.uniforms.uLoaded.value = 1;
        };
        const mesh = new Mesh(gl, { geometry, program });
        mesh.scale.set(card, height, 1);
        mesh.position.y = -height / 2;
        mesh.setParent(scene);
        meshes.push(mesh);
      }
    }

    // --- Interaccion ---
    const m = motion.current;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      Object.assign(m, {
        dragging: true,
        startX: event.clientX,
        startTarget: m.target,
        lastX: event.clientX,
        lastTime: event.timeStamp,
        pointerVelocity: 0,
        moved: 0,
      });
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!m.dragging) return;
      const dx = event.clientX - m.startX;
      m.moved = Math.max(m.moved, Math.abs(dx));
      if (m.moved > DRAG_THRESHOLD && !element.hasPointerCapture(event.pointerId)) {
        element.setPointerCapture(event.pointerId);
      }
      m.target = m.startTarget - dx;
      const dt = event.timeStamp - m.lastTime;
      if (dt > 0) m.pointerVelocity = (event.clientX - m.lastX) / dt;
      m.lastX = event.clientX;
      m.lastTime = event.timeStamp;
    };
    const onPointerUp = (event: PointerEvent) => {
      if (!m.dragging) return;
      m.dragging = false;
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
      // Sigue de largo segun la velocidad con que se solto.
      m.target -= m.pointerVelocity * FLING;
    };
    const onWheel = (event: WheelEvent) => {
      // Solo el scroll horizontal (trackpad); el vertical sigue moviendo la pagina.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
      event.preventDefault();
      m.target += event.deltaX;
    };
    const onEnter = (event: PointerEvent) => {
      if (event.pointerType === "mouse") m.hovering = true;
    };
    const onLeave = () => {
      m.hovering = false;
    };

    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerenter", onEnter);
    element.addEventListener("pointerleave", onLeave);

    // --- Loop (solo mientras se ve) ---
    let frame = 0;
    let last = performance.now();
    let visible = false;
    let bend = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - last, 50);
      last = now;

      if (!m.dragging && !reduceMotion) {
        m.target += AUTO_SPEED * dt * (m.hovering ? HOVER_SLOWDOWN : 1);
      }
      m.previous = m.current;
      m.current += (m.target - m.current) * FOLLOW;
      m.velocity = m.current - m.previous;

      const goal = reduceMotion ? 0 : Math.max(-1, Math.min(1, m.velocity / MAX_VELOCITY));
      bend += (goal - bend) * 0.12;

      loop.forEach((_, i) => {
        // Posicion en el loop: siempre entre una tarjeta antes del borde
        // izquierdo y el final de la tira.
        const x = ((((i * step - m.current) % total) + total) % total) - step;
        const node = cards.current[i];
        if (node) node.style.transform = `translate3d(${x}px, 0, 0)`;
        const mesh = meshes[i];
        if (mesh) {
          mesh.position.x = x + card / 2;
          mesh.program.uniforms.uVelocity.value = bend;
        }
      });

      if (renderer && scene && camera) renderer.render({ scene, camera });
      if (visible) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(frame);
      if (visible) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    observer.observe(element);
    // Un cuadro inicial para ubicar todo aunque arranque fuera de pantalla.
    tick(performance.now());

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerenter", onEnter);
      element.removeEventListener("pointerleave", onLeave);
      if (renderer) {
        renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
        renderer.gl.canvas.remove();
      }
    };
    // `loop` se deriva de `layout` e `items`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, webgl, items]);

  const cardStyle = layout ? { width: layout.card } : undefined;

  return (
    <div
      ref={wrap}
      onClickCapture={(event) => {
        // El click que cierra un arrastre no abre el proyecto.
        if (motion.current.moved > DRAG_THRESHOLD) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      className="relative -mx-4 w-[calc(100%+2rem)] cursor-grab touch-pan-y select-none [overflow-x:clip] active:cursor-grabbing md:-mx-8 md:w-[calc(100%+4rem)]"
      style={{ height: layout ? layout.height * (1 + BULGE_ROOM) + 48 : undefined }}
    >
      {/* Canvas de WebGL: un poco mas alto que las tarjetas para que la
          deformacion no se recorte. */}
      {webgl && (
        <div
          ref={canvasHost}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0"
          style={layout ? { top: -layout.height * BULGE_ROOM, height: layout.height * (1 + 2 * BULGE_ROOM) } : undefined}
        />
      )}

      {layout &&
        loop.map((item, i) => (
          <Link
            key={`${item.key}-${i}`}
            ref={(node) => {
              cards.current[i] = node;
            }}
            href={item.href}
            draggable={false}
            // Las copias del loop no se repiten para teclado ni lectores.
            tabIndex={i < items.length ? undefined : -1}
            aria-hidden={i < items.length ? undefined : true}
            className="absolute left-0 top-0 block will-change-transform focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange"
            style={cardStyle}
          >
            <div className="relative" style={{ height: layout.height }}>
              {!webgl && (
                <Image src={item.src} alt={item.name} fill draggable={false} sizes="30vw" className="object-cover" />
              )}
              {webgl && <span className="sr-only">{item.name}</span>}
            </div>
            <div className="label mt-4 flex justify-between gap-4 text-paragraph">
              <span>
                {item.index} {item.name}
              </span>
              <span className="text-right">{item.detail}</span>
            </div>
          </Link>
        ))}
    </div>
  );
}
