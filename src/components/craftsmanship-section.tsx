"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const MECHANISM_VIDEO_SRC = "/videos/mechanism-bg.mp4";

export const CraftsmanshipSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.06, 0.12, 0.88, 0.94, 1],
    [0.45, 0.88, 1, 1, 0.88, 0.45],
  );
  const textY = useTransform(
    scrollYProgress,
    [0, 0.12, 0.88, 1],
    [36, 0, 0, -28],
  );

  return (
    <div
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-black"
    >
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 size-full object-cover opacity-[0.88]"
        >
          <source src={MECHANISM_VIDEO_SRC} type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-r from-black/[0.21] via-black/[0.15] to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/[0.18] via-transparent to-black/10" />
      </div>

      <motion.div
        style={{ opacity, y: textY }}
        className="relative z-10 flex h-full items-center px-8 md:px-16 lg:px-24"
      >
        <div className="max-w-3xl space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-[1px] w-12 bg-white/30" />
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/60">
              Mechanism
            </span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="font-heading text-5xl tracking-tight text-white md:text-6xl lg:text-7xl"
            style={{
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Precision in Every Detail
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true, margin: "-100px" }}
            className="font-sans max-w-2xl text-base leading-relaxed text-white/70 md:text-lg"
            style={{
              fontWeight: 300,
              lineHeight: 1.8,
              letterSpacing: "0.01em",
            }}
          >
            Every component is engineered with absolute precision. From the
            balance wheel to the smallest gear, each element works in perfect
            harmony to deliver unmatched accuracy and performance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="h-[1px] w-24 origin-left bg-gradient-to-r from-white/40 to-transparent"
          />
        </div>
      </motion.div>
    </div>
  );
};
