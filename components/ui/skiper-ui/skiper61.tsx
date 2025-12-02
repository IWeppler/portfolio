"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);

  const xSpring = useSpring(x, { mass: 0.1, damping: 12, stiffness: 130 });
  const ySpring = useSpring(y, { mass: 0.1, damping: 12, stiffness: 130 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <motion.div
      style={{
        x: xSpring,
        y: ySpring,
      }}
      className="
        fixed top-0 left-0 
        w-4 h-4 
        bg-white/80 
        rounded-full 
        pointer-events-none 
        z-[9999]
        -translate-x-1/2 -translate-y-1/2
      "
    />
  );
}
