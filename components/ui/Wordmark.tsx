/**
 * Logo de la barra: el nombre en mayusculas condensadas y pesadas, y el
 * apellido en cursiva liviana y ancha. La "w" va dentro de un cuadrado de
 * acento; al pasar el mouse por el link que lo contiene (`group`), una capa
 * clara sube dentro del cuadrado.
 *
 * Comparte fuente con el nombre del hero (Roboto Flex, ver layout.tsx): sus
 * ejes de ancho e inclinacion dan el contraste entre las dos mitades.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`font-pressure inline-flex items-center text-xl ${className}`}
      style={{ lineHeight: 1 }}
    >
      <span className="uppercase" style={{ fontVariationSettings: "'wght' 900, 'wdth' 70, 'slnt' 0" }}>
        Ignacio
      </span>

      <span className="relative mx-[0.06em] inline-flex h-[1.05em] w-[0.92em] items-center justify-center overflow-hidden bg-orange text-dark">
        {/* Relleno que sube desde abajo. Solo con mouse: en tactil no hay hover. */}
        <span className="absolute inset-0 origin-bottom scale-y-0 bg-foreground transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-y-100" />
        <span className="relative" style={{ fontVariationSettings: "'wght' 300, 'wdth' 110, 'slnt' -10" }}>
          w
        </span>
      </span>

      <span style={{ fontVariationSettings: "'wght' 250, 'wdth' 110, 'slnt' -10" }}>eppler</span>
    </span>
  );
}
