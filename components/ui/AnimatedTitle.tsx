"use client";

import { motion, Variants } from "framer-motion";

interface AnimatedTitleProps {
  text: string;
  className?: string;
}

export const AnimatedTitle = ({ text, className = "" }: AnimatedTitleProps) => {
  // Configuración del contenedor principal
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Menor tiempo entre letras para que sea más fluido
        delayChildren: 0.1,
      },
    },
  };

  // Variantes de cada letra (EFECTO ESCALERA / SLIDE UP)
  const letterVariants: Variants = {
    hidden: {
      opacity: 0,
      y: "50%", // Empieza desplazada hacia abajo (efecto escalera)
    },
    visible: {
      opacity: 1,
      y: 0, // Sube a su posición original
      transition: {
        type: "spring",
        damping: 12, // Menos rebote para que sea más serio
        stiffness: 100, // Rigidez suave
      },
    },
  };

  return (
    <motion.h2
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      aria-label={text}
    >
      {text.split("").map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          variants={letterVariants}
          className="inline-block"
          aria-hidden="true"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.h2>
  );
};
