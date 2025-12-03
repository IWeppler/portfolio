import { getDictionary } from "@/lib/get-dictionary";
import { AnimatedTitle } from "./ui/AnimatedTitle";

interface FeatureBlock {
  title: string;
  itemsLeft: string[];
  itemsRight: string[];
}

export default function Features({ lang }: { lang: string }) {
  const t = getDictionary(lang);

  const features = t.features;
  const blocks = features.blocks as FeatureBlock[];

  return (
    <section id="servicios" className="w-full py-16 md:py-32 text-foreground">
      {/* Subtítulo dinámico */}
      <p className="font-medium tracking-widest text-paragraph mb-2 uppercase">
        {features.subtitle}
      </p>

      {/* Título dinámico */}
      <AnimatedTitle
        text={features.title}
        className="text-4xl md:text-6xl font-medium text-foreground uppercase tracking-tight pb-4 text-balance wrap-break-word"
      />

      {blocks.map((block, i) => (
        <div
          key={i}
          className="
            group border-t border-assets 
            hover:border-foreground 
            transition-colors duration-300
            py-8 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10
          "
        >
          {/* Título del bloque */}
          <h3
            className="
              text-2xl md:text-4xl font-medium 
              text-foreground transition-colors duration-300
              group-hover:text-foreground
            "
          >
            {block.title}
          </h3>

          {/* Items izquierda */}
          <div
            className="
              space-y-1 md:space-y-3 text-paragraph text-lg 
              transition-colors duration-300
              group-hover:text-foreground
            "
          >
            {block.itemsLeft.map((item, idx) => (
              <p key={idx}>{item}</p>
            ))}
          </div>

          {/* Items derecha */}
          <div
            className="
              space-y-3 text-paragraph text-lg 
              transition-colors duration-300
              group-hover:text-foreground
            "
          >
            {block.itemsRight.map((item, idx) => (
              <p key={idx}>{item}</p>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
