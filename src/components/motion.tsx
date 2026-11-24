"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

// Fades and lifts content in on mount. Index staggers siblings.
export function Reveal({ children, i = 0, y = 20, blur = false, className, style, ...rest }: { children: ReactNode; i?: number; y?: number; blur?: boolean } & HTMLMotionProps<"div">) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, filter: blur ? "blur(8px)" : "blur(0px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
      className={className}
      style={style}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

// Same, but waits until the element scrolls into view.
export function InView({ children, i = 0, className, style }: { children: ReactNode; i?: number; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Lifts on hover like the job cards.
export function Lift({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 400, damping: 22 }} className={className} style={style}>
      {children}
    </motion.div>
  );
}

export const pressProps = {
  whileTap: { scale: 0.95 },
  transition: { type: "spring" as const, stiffness: 600, damping: 22 },
};
