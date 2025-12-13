"use client";

import Image from "next/image";
import profile from "@/public/profile.png";
import argentina from "@/public/argentina.avif";
import { ButtonPrimary, ButtonSecondary } from "./ui/Buttons";
import { getDictionary } from "@/lib/get-dictionary";
import { easeOut, motion, Variants } from "framer-motion";

export default function HeroSection({ lang }: { lang: string }) {
  const t = getDictionary(lang);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        when: "beforeChildren",
      },
    },
  };

  const textVariants = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
      y: 10,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        duration: 0.8,
        ease: easeOut,
      },
    },
  };
  const imageVariants = (rotation: number): Variants => ({
    hidden: {
      opacity: 0,
      scale: 0,
      rotate: 0,
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: rotation,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      },
    },
  });

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 1.2, duration: 0.5 },
    },
  };

  return (
    <section className="w-full min-h-[90dvh] bg-background flex items-end mb-20">
      <motion.div
        className="max-w-4xl w-full mb-12 md:mb-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <h1 className="text-2xl md:text-4xl font-general text-foreground font-medium leading-snug tracking-tight">
          {/* Parte 1 del texto */}
          <motion.span variants={textVariants}>{t.hero.part1}</motion.span>

          {/* Imagen Perfil */}
          <motion.span
            className="inline-block align-middle mx-2"
            variants={imageVariants(2)}
          >
            <Image
              src={profile}
              alt="Ignacio Weppler"
              className="w-16 h-12 object-contain"
              placeholder="blur"
              priority={true}
            />
          </motion.span>

          {/* Parte 2 del texto */}
          <motion.span variants={textVariants}>{t.hero.part2}</motion.span>

          {/* Imagen Argentina */}
          <motion.span
            className="inline-block align-middle mx-2"
            variants={imageVariants(-2)}
          >
            <Image
              src={argentina}
              alt="Ignacio Weppler - Argentina"
              className="w-16 h-12 object-cover"
              placeholder="blur"
              priority={true}
            />
          </motion.span>

          {/* Parte 3 del texto */} 
          <motion.span variants={textVariants}>{t.hero.part3}</motion.span>
        </h1>

        {/* Botones  */}
        <motion.div variants={buttonVariants} className="flex gap-4 mt-8">
          <ButtonPrimary href={`/${lang}#contacto`}>
            {t.hero.cta_write}
          </ButtonPrimary>

          <ButtonSecondary href="#projects">{t.hero.cta_works}</ButtonSecondary>
        </motion.div>
      </motion.div>
    </section>
  );
}
