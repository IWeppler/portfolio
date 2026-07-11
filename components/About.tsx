"use client";

import { FancyNavLink } from "./ui/FancyNavLink";
import { getDictionary } from "@/lib/get-dictionary";
import { motion, Variants } from "framer-motion";
import { AnimatedTitle, EASE_OUT_SOFT } from "./ui/AnimatedTitle";

// Separa el número/prefijo (+, dígitos) del resto del texto para resaltarlo
const splitMetric = (text: string) => {
  const match = text.match(/^(\+)?(\d+)(\+)?\s*(.*)$/);
  if (!match) return { leadingPlus: false, digits: "", trailingPlus: false, label: text };
  const [, leadingPlus, digits, trailingPlus, label] = match;
  return { leadingPlus: !!leadingPlus, digits, trailingPlus: !!trailingPlus, label };
};

export const About = ({ lang }: { lang: string }) => {
  const t = getDictionary(lang);

  const metrics = [
    t.aboutme.metrics.projects,
    t.aboutme.metrics.clients,
    t.aboutme.metrics.industries,
    t.aboutme.metrics.reach,
  ];

  // Variantes para el contenedor principal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  // Animación de entrada suave (fade + blur, sin rebote)
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.9, ease: EASE_OUT_SOFT },
    },
  };

  // Variantes para las métricas (staggered fade + blur, sin rebote)
  const metricsContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const metricItemVariants: Variants = {
    hidden: { opacity: 0, y: 12, filter: "blur(8px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.9, ease: EASE_OUT_SOFT },
    },
  };

  return (
    <section id="sobremi" className="w-full py-16 md:py-32 text-foreground">
      {/* GRID PRINCIPAL */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-start mb-16 md:mb-32"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        {/* IZQUIERDA – TÍTULO */}
        <AnimatedTitle text={t.aboutme.title} className="text-4xl md:text-6xl font-medium text-foreground uppercase tracking-tight text-balance wrap-break-word" />

        {/* DERECHA – TEXTO REVEAL */}
        <motion.div variants={itemVariants} className="text-lg text-paragraph">
          <p className="md:text-2xl leading-relaxed text-paragraph max-w-2lg">
            {/* Párrafo 1 */}
            {t.aboutme.p1_part1}
            <span className="text-foreground font-medium italic">
              {t.aboutme.p1_span1}
            </span>
            {t.aboutme.p1_part2}
            <span className="text-foreground font-medium italic">
              {t.aboutme.p1_span2}
            </span>
            {t.aboutme.p1_part3}

            <br />
            <br />

            {/* Párrafo 2 */}
            {t.aboutme.p2_part1}
            <span className="text-foreground font-medium italic">
              {t.aboutme.p2_span1}
            </span>
            {t.aboutme.p2_part2}
            <span className="text-foreground font-medium italic">
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
        </motion.div>
      </motion.div>

      {/* MÉTRICAS */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-20 text-center md:text-left"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={metricsContainerVariants}
      >
        {metrics.map((metric, i) => {
          const { leadingPlus, digits, trailingPlus, label } = splitMetric(metric);
          return (
            <motion.div key={i} variants={metricItemVariants}>
              <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
                {leadingPlus && <span className="text-orange">+</span>}
                {digits}
                {trailingPlus && <span className="text-orange">+</span>}
              </h3>
              <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
                {label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
};
