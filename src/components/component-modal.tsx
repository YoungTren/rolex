"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

type ComponentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  description: string;
  specs: { label: string; value: string }[];
  imageUrl: string;
};

export const ComponentModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  description,
  specs,
  imageUrl,
}: ComponentModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative overflow-hidden border border-white/10 bg-black">
              <button
                type="button"
                onClick={onClose}
                className="absolute right-6 top-6 z-10 text-white/60 transition-colors hover:text-white"
                aria-label="Close"
              >
                <X size={24} />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative h-64 overflow-hidden bg-black md:h-auto">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="size-full object-cover"
                  />
                </div>

                <div className="p-8 md:p-12">
                  <div className="mb-8 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-[1px] w-8 bg-white/30" />
                      <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-white/50">
                        {subtitle}
                      </span>
                    </div>

                    <h3
                      className="font-heading text-3xl text-white md:text-4xl"
                      style={{
                        fontWeight: 600,
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {title}
                    </h3>
                  </div>

                  <p
                    className="font-sans mb-8 text-sm leading-relaxed text-white/60"
                    style={{
                      fontWeight: 300,
                      lineHeight: 1.7,
                    }}
                  >
                    {description}
                  </p>

                  <div className="space-y-4 border-t border-white/10 pt-6">
                    {specs.map((spec, index) => (
                      <div
                        key={index}
                        className="flex items-start justify-between gap-4"
                      >
                        <span className="font-sans text-xs uppercase tracking-wider text-white/40">
                          {spec.label}
                        </span>
                        <span
                          className="font-sans text-right text-sm text-white/80"
                          style={{ fontWeight: 300 }}
                        >
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
