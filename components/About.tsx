"use client";

import { FancyNavLink } from "./ui/FancyNavLink";
import { getDictionary } from "@/lib/get-dictionary";
import { easeOut, motion, Variants } from "framer-motion";
import { AnimatedTitle } from "./ui/AnimatedTitle";

export const About = ({ lang }: { lang: string }) => {
  const t = getDictionary(lang);

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

  // Animación de entrada suave (Fade Up)
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: easeOut },
    },
  };

  // Variantes para las métricas (Staggered Pop)
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
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 },
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
        {/* Métrica 1 */}
        <motion.div variants={metricItemVariants}>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            7<span className="text-orange">+</span>
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.projects}
          </p>
        </motion.div>

        {/* Métrica 2 */}
        <motion.div variants={metricItemVariants}>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            10<span className="text-orange">+</span>
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.tech}
          </p>
        </motion.div>

        {/* Métrica 3 */}
        <motion.div variants={metricItemVariants}>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            1<span className="text-orange">+</span>
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.exp}
          </p>
        </motion.div>

        {/* Métrica 4 */}
        <motion.div variants={metricItemVariants}>
          <h3 className="text-6xl md:text-7xl font-semibold tracking-tight">
            ∞
          </h3>
          <p className="text-paragraph mt-2 text-sm uppercase tracking-wide">
            {t.aboutme.metrics.desire}
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};
