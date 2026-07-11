"use client";

import { motion, Variants, useReducedMotion } from "framer-motion";

interface AnimatedTitleProps {
  text: string;
  className?: string;
}

// Sin rebote: desacelera fuerte al final, sin overshoot
export const EASE_OUT_SOFT = [0.22, 1, 0.36, 1] as const;

const titleVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.9,
      ease: EASE_OUT_SOFT,
    },
  },
};

export const AnimatedTitle = ({ text, className = "" }: AnimatedTitleProps) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <h2 className={className}>{text}</h2>;
  }

  return (
    <motion.h2
      className={className}
      variants={titleVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
    >
      {text}
    </motion.h2>
  );
};
