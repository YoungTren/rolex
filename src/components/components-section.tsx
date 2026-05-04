"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "motion/react";

import { ComponentModal } from "@/components/component-modal";

type WatchComponent = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  shortDescription: string;
  specs: { label: string; value: string }[];
  imageUrl: string;
};

const components: WatchComponent[] = [
  {
    id: "movement",
    title: "Swiss Movement",
    subtitle: "Mechanism",
    shortDescription: "Automatic caliber with 72-hour power reserve",
    description:
      "The heart of every timepiece. Our Swiss-made automatic movement features 31 jewels and beats at 28,800 vibrations per hour, ensuring exceptional precision and reliability.",
    specs: [
      { label: "Material", value: "Rhodium-plated brass" },
      { label: "Jewels", value: "31 synthetic rubies" },
      { label: "Power Reserve", value: "72 hours" },
      { label: "Frequency", value: "28,800 vph (4 Hz)" },
      { label: "Functions", value: "Hours, minutes, seconds, date" },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1712890933285-7a4371686947?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx3YXRjaCUyMG1lY2hhbmlzbSUyMGdlYXJzJTIwaW50ZXJuYWwlMjBtb3ZlbWVudCUyMG1hY3JvJTIwZGFya3xlbnwxfHx8fDE3Nzc4MjYzMzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "case",
    title: "Oyster Case",
    subtitle: "Construction",
    shortDescription: "Forged from a solid block of 904L steel",
    description:
      "Crafted from a single block of corrosion-resistant 904L stainless steel, our Oyster case is engineered to withstand the most demanding conditions while maintaining timeless elegance.",
    specs: [
      { label: "Material", value: "904L Stainless Steel" },
      { label: "Diameter", value: "40mm" },
      { label: "Thickness", value: "12.5mm" },
      { label: "Water Resistance", value: "300 meters (1000 feet)" },
      { label: "Finish", value: "Polished & brushed" },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1540967247317-16b0c1d1de63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBkYXJrJTIwd2F0Y2glMjBtZWNoYW5pY2FsJTIwZGV0YWlscyUyMGhpZ2glMjBjb250cmFzdHxlbnwxfHx8fDE3Nzc4MDkyMjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "crystal",
    title: "Sapphire Crystal",
    subtitle: "Protection",
    shortDescription: "Scratch-resistant with anti-reflective coating",
    description:
      "Our virtually scratchproof sapphire crystal is topped with an anti-reflective coating, ensuring optimal legibility in any lighting condition while protecting the dial.",
    specs: [
      { label: "Material", value: "Synthetic sapphire" },
      { label: "Hardness", value: "9 on Mohs scale" },
      { label: "Coating", value: "Multi-layer anti-reflective" },
      { label: "Clarity", value: "99.9% light transmission" },
      { label: "Profile", value: "Domed with Cyclops lens" },
    ],
    imageUrl:
      "https://images.unsplash.com/photo-1639160740064-44d85d5be1ad?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBkYXJrJTIwd2F0Y2glMjBtZWNoYW5pY2FsJTIwZGV0YWlscyUyMGhpZ2glMjBjb250cmFzdHxlbnwxfHx8fDE3Nzc4MDkyMjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export const ComponentsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  /** Stay readable after long pinned sections (hero): avoid 0 opacity at scroll extremes. */
  const cardOpacity = useTransform(
    scrollYProgress,
    [0, 0.06, 0.12, 0.88, 0.94, 1],
    [0.55, 0.85, 1, 1, 0.85, 0.55],
  );

  const leftX = useTransform(
    scrollYProgress,
    [0, 0.1, 0.14, 0.28, 0.72, 0.86, 0.9, 1],
    [-72, -48, -28, 0, 0, -28, -48, -72],
  );
  const rightX = useTransform(
    scrollYProgress,
    [0, 0.1, 0.14, 0.28, 0.72, 0.86, 0.9, 1],
    [72, 48, 28, 0, 0, 28, 48, 72],
  );
  const centerY = useTransform(
    scrollYProgress,
    [0, 0.1, 0.14, 0.28, 0.72, 0.86, 0.9, 1],
    [72, 48, 24, 0, 0, 24, 48, 72],
  );

  return (
    <>
      <div
        ref={sectionRef}
        className="relative min-h-screen overflow-x-hidden bg-black px-8 py-32 md:px-16 md:py-40 lg:px-24 lg:py-48"
      >
        <div className="mx-auto mb-16 max-w-7xl">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-[1px] w-12 bg-white/30" />
            <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-white/60">
              Components
            </span>
          </div>

          <h2
            className="font-heading max-w-3xl text-4xl text-white md:text-5xl lg:text-6xl"
            style={{
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            }}
          >
            Excellence in Every Element
          </h2>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
          {components.map((component, index) => {
            const isLeft = index === 0;
            const isCenter = index === 1;
            const isRight = index === 2;

            return (
              <motion.div
                key={component.id}
                style={{
                  x: isLeft ? leftX : isRight ? rightX : 0,
                  y: isCenter ? centerY : 0,
                  opacity: cardOpacity,
                }}
              >
                <motion.button
                  type="button"
                  whileHover={{ y: -8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => setActiveModal(component.id)}
                  className="group relative w-full overflow-hidden border border-white/10 bg-transparent text-left transition-[border-color,background-color] duration-500 hover:border-white/20"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={component.imageUrl}
                      alt={component.title}
                      className="size-full object-cover transition-all duration-700 group-hover:scale-110"
                    />

                    <div className="absolute left-6 top-6">
                      <span
                        className="font-heading text-5xl text-white/20 transition-colors duration-500 group-hover:text-white/30"
                        style={{ fontWeight: 300 }}
                      >
                        0{index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-8">
                    <div>
                      <span className="font-sans mb-2 block text-[9px] uppercase tracking-[0.2em] text-white/50">
                        {component.subtitle}
                      </span>
                      <h3
                        className="font-heading text-2xl text-white"
                        style={{
                          fontWeight: 600,
                          lineHeight: 1.3,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {component.title}
                      </h3>
                    </div>

                    <p
                      className="font-sans text-sm leading-relaxed text-white/60"
                      style={{
                        fontWeight: 300,
                        lineHeight: 1.6,
                      }}
                    >
                      {component.shortDescription}
                    </p>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="font-sans text-xs uppercase tracking-wider text-white/40 transition-colors group-hover:text-white/60">
                        Learn more
                      </span>
                      <div className="h-[1px] w-0 bg-white/40 transition-all duration-500 group-hover:w-6" />
                    </div>
                  </div>

                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {components.map((component) => (
        <ComponentModal
          key={component.id}
          isOpen={activeModal === component.id}
          onClose={() => setActiveModal(null)}
          title={component.title}
          subtitle={component.subtitle}
          description={component.description}
          specs={component.specs}
          imageUrl={component.imageUrl}
        />
      ))}
    </>
  );
};
