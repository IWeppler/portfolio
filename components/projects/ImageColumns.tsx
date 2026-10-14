import Image from "next/image";

export type ColumnImage = { src: string; name: string };

/** Reparte las imagenes en columnas, una tras otra, para que cada columna mezcle proyectos. */
function split(images: ColumnImage[], columns: number) {
  const result: ColumnImage[][] = Array.from({ length: columns }, () => []);
  images.forEach((image, i) => result[i % columns].push(image));
  return result;
}

/**
 * Mosaico de columnas que suben y bajan sin parar. Cada columna se duplica para
 * que el bucle no tenga corte (se mueve el 50% de su alto). Solo CSS.
 */
export function ImageColumns({ images, className = "" }: { images: ColumnImage[]; className?: string }) {
  const columns = split(images, 3);

  return (
    <div aria-hidden="true" className={`grid grid-cols-3 gap-2 overflow-hidden md:gap-3 ${className}`}>
      {columns.map((column, c) => (
        <div
          key={c}
          className="flex flex-col will-change-transform motion-reduce:!animate-none"
          style={{
            animation: `${c === 1 ? "column-down" : "column-up"} ${34 + c * 8}s linear infinite`,
          }}
        >
          {[...column, ...column].map((image, i) => (
            <div key={`${image.src}-${i}`} className="relative mb-2 aspect-[3/4] w-full shrink-0 overflow-hidden bg-surface md:mb-3">
              <Image
                src={image.src}
                alt=""
                fill
                sizes="(min-width: 1024px) 45vw, 100vw"
                quality={90}
                className="object-cover"
                priority={i < 2}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
