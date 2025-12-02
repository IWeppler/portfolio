import { FancyNavLink } from "./ui/FancyNavLink";
import { getDictionary } from "@/lib/get-dictionary";

export const About = ({ lang }: { lang: string }) => {
  const t = getDictionary(lang);

  return (
    <section className="w-full py-16 md:py-32 text-white">
      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start mb-16 md:mb-32">
        {/* IZQUIERDA – TÍTULO */}
        <h2 className="text-4xl md:text-6xl font-medium text-white uppercase tracking-tight">
          {t.aboutme.title}
        </h2>

        {/* DERECHA – TEXTO REVEAL */}
        <div className="text-lg text-paragraph">
          <p className="md:text-2xl leading-relaxed text-paragraph max-w-2lg">
            {/* Párrafo 1 */}
            {t.aboutme.p1_part1}
            <span className="text-white font-medium italic">
              {t.aboutme.p1_span1}
            </span>
            {t.aboutme.p1_part2}
            <span className="text-white font-medium italic">
              {t.aboutme.p1_span2}
            </span>
            {t.aboutme.p1_part3}
            
            <br />
            <br />
            
            {/* Párrafo 2 */}
            {t.aboutme.p2_part1}
            <span className="text-white font-medium italic">
              {t.aboutme.p2_span1}
            </span>
            {t.aboutme.p2_part2}
            <span className="text-white font-medium italic">
              {t.aboutme.p2_span2}
            </span>
            {t.aboutme.p2_part3}
            
            <br />
            <br />
            
            {/* CTA Question & Link */}
            {t.aboutme.question}
            <FancyNavLink
              href={`/${lang}#contacto`}
              className="text-lg md:text-2xl text-cream font-medium py-2 px-1"
            >
              {t.aboutme.cta}
            </FancyNavLink>
          </p>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-20 text-center md:text-left">
        {/* Métrica 1 */}
        <div>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            7<span className="text-orange">+</span>
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.projects}
          </p>
        </div>

        {/* Métrica 2 */}
        <div>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            10<span className="text-orange">+</span>
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.tech}
          </p>
        </div>

        {/* Métrica 3 */}
        <div>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            1<span className="text-orange">+</span>
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.exp}
          </p>
        </div>

        {/* Métrica 4 */}
        <div>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            ∞
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.desire}
          </p>
        </div>
      </div>
    </section>
  );
};