import { getDictionary } from "@/lib/get-dictionary";

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
    <section className="w-full py-16 md:py-32 text-white">
      {/* Subtítulo dinámico */}
      <p className="font-medium tracking-widest text-paragraph mb-2 uppercase">
        {features.subtitle}
      </p>

      {/* Título dinámico */}
      <h2 className="text-4xl md:text-6xl font-medium text-white uppercase tracking-tight mb-12">
        {features.title}
      </h2>

      {blocks.map((block, i) => (
        <div
          key={i}
          className="
            group border-t border-assets 
            hover:border-white 
            transition-colors duration-300
            py-16 grid grid-cols-1 md:grid-cols-3 gap-10
          "
        >
          {/* Título del bloque */}
          <h3
            className="
              text-3xl md:text-4xl font-medium 
              text-white transition-colors duration-300
              group-hover:text-white
            "
          >
            {block.title}
          </h3>

          {/* Items izquierda */}
          <div
            className="
              space-y-3 text-paragraph text-lg 
              transition-colors duration-300
              group-hover:text-white
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
              group-hover:text-white
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
