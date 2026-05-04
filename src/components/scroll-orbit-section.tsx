"use client";

import { useEffect, useRef } from "react";

const SECTION_HEIGHT_VH = 250;

const LERP = 0.095;

/** Ellipse vertical radius as a fraction of horizontal (simulates a flat ring on the floor). */
const RADIUS_Y_RATIO = 0.35;

/** Ideal horizontal semi-axis: fraction of stage width (raised for clearer gaps). */
const RADIUS_X_RATIO = 0.52;

/** Upper bound for ideal radiusX (px) on very wide viewports (~2× prior cap for 2× cards). */
const RADIUS_X_IDEAL_MAX_PX = 760;

const ORBIT_IMAGES = [
  "/images/watch-carousel/watch-1.png",
  "/images/watch-carousel/watch-2.png",
  "/images/watch-carousel/watch-3.png",
  "/images/watch-carousel/watch-8.png",
  "/images/watch-carousel/watch-1.png",
  "/images/watch-carousel/watch-2.png",
  "/images/watch-carousel/watch-3.png",
  "/images/watch-carousel/watch-8.png",
] as const;

const STEP_DEG = 360 / ORBIT_IMAGES.length;

const lerpAngle = (from: number, to: number, t: number) => {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return from + d * t;
};

export const ScrollOrbitSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ellipseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const ellipse = ellipseRef.current;
    if (!section || !stage) return;

    let animatedDeg = 0;
    let rafId = 0;

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const track = section.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(track, 0));
      const progress = track > 0 ? scrolled / track : 0;

      const targetDeg = progress * 360;
      animatedDeg = lerpAngle(animatedDeg, targetDeg, LERP);

      const w = stage.clientWidth;
      const cards = stage.querySelectorAll<HTMLElement>("[data-orbit-card]");
      const halfCard =
        cards[0] != null
          ? cards[0].getBoundingClientRect().width / 2
          : Math.min(w * 0.29, 158);
      const edge = Math.max(10, w * 0.018);
      const radiusXMax = Math.max(44, w / 2 - halfCard - edge);
      const radiusXIdeal = Math.min(w * RADIUS_X_RATIO, RADIUS_X_IDEAL_MAX_PX);
      const radiusX = Math.min(radiusXIdeal, radiusXMax);
      const radiusY = radiusX * RADIUS_Y_RATIO;

      if (ellipse) {
        ellipse.style.width = `${radiusX * 2}px`;
        ellipse.style.height = `${radiusY * 2}px`;
      }

      cards.forEach((el, i) => {
        const angleDeg = STEP_DEG * i + animatedDeg;
        const angleRad = (angleDeg * Math.PI) / 180;
        const x = Math.cos(angleRad) * radiusX;
        const y = Math.sin(angleRad) * radiusY;
        const depth = (Math.sin(angleRad) + 1) / 2;
        const scale = 0.7 + 0.3 * depth ** 1.1;
        const opacity = 0.42 + 0.58 * depth;
        el.style.zIndex = String(10 + Math.round(depth * 45));
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#050507]"
      style={{ minHeight: `${SECTION_HEIGHT_VH}vh` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_92%,rgba(48,42,34,0.45),transparent_58%)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_28%,rgba(22,22,24,0.75),transparent_72%)]" />

      <div className="sticky top-0 flex h-screen w-full items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-7xl">
          <p className="mb-6 text-center font-sans text-[10px] uppercase tracking-[0.34em] text-[#c9baa0]/78">
            Collection
          </p>

          <div
            ref={stageRef}
            className="relative mx-auto h-[min(88vmin,860px)] w-full max-w-[min(96vmin,1280px)]"
          >
            <div
              ref={ellipseRef}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border border-[#d8c8a8]/[0.14] shadow-[inset_0_0_40px_rgba(216,200,168,0.05),0_0_70px_rgba(216,200,168,0.05)]"
              style={{ width: 640, height: 224 }}
            />

            {ORBIT_IMAGES.map((src, i) => (
              <div
                key={`${src}-${i}`}
                data-orbit-card
                className="absolute left-1/2 top-1/2 z-10 w-[min(58vmin,316px)] will-change-transform"
                style={{
                  transform: "translate(-50%, -50%) translate3d(0, 0, 0) scale(1)",
                  opacity: 1,
                }}
              >
                <button
                  type="button"
                  className="group w-full cursor-pointer border-0 bg-transparent p-0"
                  aria-label={`Piece ${i + 1}`}
                >
                  <div className="rounded-2xl bg-gradient-to-b from-white/[0.09] to-white/[0.02] p-[22px] ring-1 ring-white/[0.11] shadow-[0_44px_88px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)_inset] transition-[transform,box-shadow] duration-500 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_60px_120px_rgba(0,0,0,0.55),0_0_56px_rgba(216,200,168,0.1)]">
                    <div className="overflow-hidden rounded-xl bg-[#0a0a0c]/90 ring-1 ring-white/[0.05]">
                      <img
                        src={src}
                        alt={`Timepiece ${i + 1}`}
                        className="h-auto w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                        draggable={false}
                      />
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center font-sans text-xs font-light leading-relaxed text-white/32">
            Scroll — cards follow the horizontal ring; each stays upright, facing you.
          </p>
        </div>
      </div>
    </section>
  );
};
