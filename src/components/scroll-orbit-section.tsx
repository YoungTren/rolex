"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Total section height drives scroll progress (track ≈ this minus viewport).
 * Keep only slightly above 100 so the orbit completes without a long empty tail.
 */
const SECTION_HEIGHT_VH = 172;

const LERP = 0.068;

/** Ellipse vertical semi-axis as fraction of horizontal — wide shallow ring like the original layout. */
const RADIUS_Y_RATIO = 0.33;

/**
 * Target horizontal semi-axis as fraction of stage width — clamped by stage minus card half-width.
 */
const RADIUS_X_RATIO = 0.98;

/** Ceiling only; real radius is clamped by stage width minus card half-width. */
const RADIUS_X_IDEAL_MAX_PX = 8000;

const ORBIT_IMAGES = [
  "/images/watch-carousel/watch-1.png",
  "/images/watch-carousel/watch-2.png",
  "/images/watch-carousel/watch-3.png",
  "/images/watch-carousel/watch-4.png",
  "/images/watch-carousel/watch-5.png",
  "/images/watch-carousel/watch-6.png",
  "/images/watch-carousel/watch-7.png",
  "/images/watch-carousel/watch-8.png",
] as const;

/**
 * max(w,h) of the opaque subject bbox in each 1024² asset (see scripts — measured once).
 * Reference = GMT-Master II two-tone (watch-5) so every watch matches that model’s size.
 */
const ORBIT_SUBJECT_MAX_PX: Record<(typeof ORBIT_IMAGES)[number], number> = {
  "/images/watch-carousel/watch-1.png": 897,
  "/images/watch-carousel/watch-2.png": 841,
  "/images/watch-carousel/watch-3.png": 914,
  "/images/watch-carousel/watch-4.png": 814,
  "/images/watch-carousel/watch-5.png": 981,
  "/images/watch-carousel/watch-6.png": 820,
  "/images/watch-carousel/watch-7.png": 865,
  "/images/watch-carousel/watch-8.png": 814,
};

const ORBIT_SUBJECT_SCALE_REF = ORBIT_SUBJECT_MAX_PX[
  "/images/watch-carousel/watch-5.png"
];

const orbitSubjectScale = (src: (typeof ORBIT_IMAGES)[number]): number =>
  ORBIT_SUBJECT_SCALE_REF / ORBIT_SUBJECT_MAX_PX[src];

const STEP_DEG = 360 / ORBIT_IMAGES.length;

/** Front of orbit: max depth (sin → 1). */
const FRONT_ANGLE_DEG = 90;

const ALIGN_EPS_DEG = 4;

const lerpAngle = (from: number, to: number, t: number) => {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return from + d * t;
};

const shortestAngleDelta = (deg: number) => {
  let d = ((deg % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return d;
};

/** Таймлайн заголовка (scrub): скролл без текста → появление → y 0→500 + fade.
 * Короткое end — к моменту «полной» орбиты слово уже скрыто. */
const COLLECTION_TITLE_HIDDEN_Y = -96;
const COLLECTION_TITLE_SCROLL_Y = 500;
const COLLECTION_TITLE_SCROLL_TRIGGER_END = "+=680";
/** Доли таймлайна: «только скролл» | появление | уход вниз. */
const COLLECTION_TITLE_PHASE_SCROLL_ONLY = 0.14;
const COLLECTION_TITLE_PHASE_ENTER = 0.1;

type WatchDetail = {
  name: string;
  description: string;
  price: string;
};

const WATCH_DETAILS: Record<string, WatchDetail> = {
  "/images/watch-carousel/watch-1.png": {
    name: "Rolex Submariner",
    description:
      "Precision, durability, and timeless luxury in one iconic design.",
    price: "From $12,000",
  },
  "/images/watch-carousel/watch-2.png": {
    name: "Rolex Day-Date 40",
    description:
      "The emblematic prestige model in precious metal, crafted for distinction.",
    price: "From $38,500",
  },
  "/images/watch-carousel/watch-3.png": {
    name: "Rolex Datejust",
    description:
      "Classic elegance with a sunray dial and instantly recognisable aesthetic.",
    price: "From $8,200",
  },
  "/images/watch-carousel/watch-4.png": {
    name: "Rolex Day-Date 40",
    description:
      "Roman numerals and a bright dial in yellow gold—boardroom presence, wrist-perfect balance.",
    price: "From $38,500",
  },
  "/images/watch-carousel/watch-5.png": {
    name: "Rolex GMT-Master II",
    description:
      "Two-tone steel and gold with a ceramic bezel—for travelers who want presence and utility.",
    price: "From $17,500",
  },
  "/images/watch-carousel/watch-6.png": {
    name: "Rolex Day-Date 40",
    description:
      "Deep blue sunray dial and diamond markers in cool precious metal.",
    price: "From $41,000",
  },
  "/images/watch-carousel/watch-7.png": {
    name: "Rolex GMT-Master II",
    description:
      "Steel sports icon with two-tone Cerachrom bezel and dual-time soul.",
    price: "From $11,000",
  },
  "/images/watch-carousel/watch-8.png": {
    name: "Rolex Day-Date 40",
    description:
      "Everose gold, diamond-set bezel, and white dial with Roman numerals—the Day-Date at its most formal.",
    price: "From $42,000",
  },
};

const detailForSrc = (src: string): WatchDetail =>
  WATCH_DETAILS[src] ?? WATCH_DETAILS["/images/watch-carousel/watch-1.png"];

const DETAIL_SWITCH_HALF_MS = 170;
const DETAIL_WHEEL_THRESHOLD = 48;

const clearStoredTimeouts = (ref: {
  mid?: ReturnType<typeof setTimeout>;
  end?: ReturnType<typeof setTimeout>;
}) => {
  if (ref.mid !== undefined) clearTimeout(ref.mid);
  if (ref.end !== undefined) clearTimeout(ref.end);
  ref.mid = undefined;
  ref.end = undefined;
};

export const ScrollOrbitSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ellipseRef = useRef<HTMLDivElement>(null);
  const snapIndexRef = useRef<number | null>(null);
  const setDetailIndexRef = useRef<(index: number | null) => void>(() => {});
  const detailOpenedForSnapRef = useRef<number | null>(null);

  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const detailWheelSwitchingRef = useRef(false);
  const detailSwitchTimersRef = useRef<{
    mid?: ReturnType<typeof setTimeout>;
    end?: ReturnType<typeof setTimeout>;
  }>({});
  const [detailFadedOut, setDetailFadedOut] = useState(false);
  const collectionTitleRef = useRef<HTMLHeadingElement>(null);
  const collectionStickyRef = useRef<HTMLDivElement>(null);

  setDetailIndexRef.current = setDetailIndex;

  useEffect(() => {
    const section = sectionRef.current;
    const title = collectionTitleRef.current;
    const sticky = collectionStickyRef.current;
    if (!section || !title) return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.getById("collection-title-y")?.kill();

    const ctx = gsap.context(() => {
      const trigger = sticky ?? section;
      const phaseExit =
        1 -
        COLLECTION_TITLE_PHASE_SCROLL_ONLY -
        COLLECTION_TITLE_PHASE_ENTER;

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "collection-title-y",
          trigger,
          start: "top bottom",
          end: COLLECTION_TITLE_SCROLL_TRIGGER_END,
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      tl.fromTo(
        title,
        { y: COLLECTION_TITLE_HIDDEN_Y, opacity: 0 },
        {
          y: COLLECTION_TITLE_HIDDEN_Y,
          opacity: 0,
          duration: COLLECTION_TITLE_PHASE_SCROLL_ONLY,
          ease: "none",
        },
      ).to(title, {
        y: 0,
        opacity: 1,
        duration: COLLECTION_TITLE_PHASE_ENTER,
        ease: "power2.out",
      }).to(title, {
        y: COLLECTION_TITLE_SCROLL_Y,
        opacity: 0,
        duration: phaseExit,
        ease: "none",
      });
    }, section);

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      window.removeEventListener("resize", onResize);
      ctx.revert();
    };
  }, []);

  const closeDetail = useCallback(() => {
    clearStoredTimeouts(detailSwitchTimersRef.current);
    snapIndexRef.current = null;
    detailOpenedForSnapRef.current = null;
    detailWheelSwitchingRef.current = false;
    setDetailFadedOut(false);
    setDetailIndex(null);
  }, []);

  const onCardClick = useCallback((index: number) => {
    snapIndexRef.current = index;
    detailOpenedForSnapRef.current = null;
    setDetailIndex(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDetail]);

  useEffect(() => {
    if (detailIndex === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detailIndex]);

  useEffect(() => {
    if (detailIndex !== null) return;
    clearStoredTimeouts(detailSwitchTimersRef.current);
    detailWheelSwitchingRef.current = false;
    setDetailFadedOut(false);
  }, [detailIndex]);

  const scheduleDetailSwitchByWheel = useCallback(
    (to: number) => {
      clearStoredTimeouts(detailSwitchTimersRef.current);
      detailWheelSwitchingRef.current = true;
      setDetailFadedOut(true);
      detailSwitchTimersRef.current.mid = setTimeout(() => {
        detailSwitchTimersRef.current.mid = undefined;
        snapIndexRef.current = to;
        detailOpenedForSnapRef.current = to;
        setDetailIndex(to);
        setDetailFadedOut(false);
        detailSwitchTimersRef.current.end = setTimeout(() => {
          detailSwitchTimersRef.current.end = undefined;
          detailWheelSwitchingRef.current = false;
        }, DETAIL_SWITCH_HALF_MS);
      }, DETAIL_SWITCH_HALF_MS);
    },
    [],
  );

  useEffect(() => {
    if (detailIndex === null) return;
    const el = detailPanelRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (detailWheelSwitchingRef.current) return;
      if (Math.abs(e.deltaY) < DETAIL_WHEEL_THRESHOLD) return;

      const len = ORBIT_IMAGES.length;
      const from = detailIndex;
      const to =
        e.deltaY > 0 ? (from + 1) % len : (from - 1 + len) % len;
      scheduleDetailSwitchByWheel(to);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [detailIndex, scheduleDetailSwitchByWheel]);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    const ellipse = ellipseRef.current;
    if (!section || !stage) return;

    let animatedDeg = 0;
    let extraDeg = 0;
    let rafId = 0;

    const tick = () => {
      const rect = section.getBoundingClientRect();
      const track = section.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(track, 0));
      const progress = Math.min(
        1,
        Math.max(0, track > 0 ? scrolled / track : 0),
      );

      const scrollDeg = progress * 360;
      const snapIdx = snapIndexRef.current;
      const extraTarget =
        snapIdx === null
          ? 0
          : shortestAngleDelta(
              FRONT_ANGLE_DEG - STEP_DEG * snapIdx - scrollDeg,
            );
      extraDeg = lerpAngle(extraDeg, extraTarget, LERP);
      const targetTotal = scrollDeg + extraDeg;
      animatedDeg = lerpAngle(animatedDeg, targetTotal, LERP);

      const w = stage.clientWidth;
      const cards = stage.querySelectorAll<HTMLElement>("[data-orbit-card]");
      const first = cards[0];
      let halfCard = Math.min(w * 0.29, 158);
      if (first != null) {
        halfCard = first.getBoundingClientRect().width / 2;
      }
      const edge = Math.max(6, w * 0.012);
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
        const opacity = 0.42 + 0.58 * depth;
        el.style.zIndex = String(10 + Math.round(depth * 45));
        el.style.opacity = String(opacity);
        el.style.transform = `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0)`;
      });

      if (snapIdx !== null) {
        const ang = STEP_DEG * snapIdx + animatedDeg;
        const delta = shortestAngleDelta(ang - FRONT_ANGLE_DEG);
        if (
          Math.abs(delta) < ALIGN_EPS_DEG &&
          detailOpenedForSnapRef.current !== snapIdx
        ) {
          detailOpenedForSnapRef.current = snapIdx;
          setDetailIndexRef.current(snapIdx);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  const detail =
    detailIndex !== null ? detailForSrc(ORBIT_IMAGES[detailIndex]) : null;

  const renderWatchDetailGrid = (idx: number, titleId?: string) => {
    const src = ORBIT_IMAGES[idx];
    const d = detailForSrc(src);
    return (
      <div className="grid max-h-[inherit] md:grid-cols-[1.1fr_1fr]">
        <div className="relative flex min-h-[200px] items-center justify-center bg-gradient-to-b from-[#12121a] to-[#060608] px-8 py-10 md:min-h-0 md:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_70%,rgba(216,200,168,0.08),transparent_65%)]" />
          <div
            className="relative z-[1] flex items-center justify-center origin-center"
            style={{
              transform: `scale(${orbitSubjectScale(src)})`,
            }}
          >
            <img
              src={src}
              alt=""
              className="max-h-[min(52vh,420px)] w-full max-w-[320px] object-contain drop-shadow-[0_32px_64px_rgba(0,0,0,0.55)] md:max-h-[min(60vh,480px)]"
              draggable={false}
            />
          </div>
        </div>
        <div className="flex flex-col justify-center gap-6 border-t border-white/[0.08] p-8 md:border-l md:border-t-0 md:p-10 lg:p-12">
          <p className="font-sans text-[10px] uppercase tracking-[0.28em] text-[#c9baa0]/85">
            Collection
          </p>
          <h3
            id={titleId}
            className="font-heading text-3xl font-medium tracking-tight text-white md:text-4xl lg:text-[2.6rem]"
          >
            {d.name}
          </h3>
          <p className="font-sans text-base font-light leading-relaxed text-white/72 md:text-lg">
            {d.description}
          </p>
          <p className="font-sans text-sm uppercase tracking-[0.12em] text-[#c9baa0]/90">
            {d.price}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              className="w-fit rounded-full border border-white/[0.2] bg-white/[0.07] px-8 py-3.5 font-sans text-xs uppercase tracking-[0.22em] text-white/95 shadow-[0_20px_48px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-[background-color,box-shadow] duration-300 hover:border-white/[0.28] hover:bg-white/[0.11]"
            >
              View Details
            </button>
            <button
              type="button"
              className="rounded-full border border-[#c9baa0]/45 bg-[#c9baa0]/12 px-8 py-3.5 font-sans text-xs uppercase tracking-[0.2em] text-[#f0e6d4] shadow-[0_20px_48px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-[background-color,border-color] duration-300 hover:border-[#c9baa0]/60 hover:bg-[#c9baa0]/20"
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      ref={sectionRef}
      className="relative mt-[clamp(60px,5vw,100px)] mb-8 overflow-hidden bg-[#050507] pt-[clamp(16px,2.5vw,28px)] sm:mb-10"
      style={{ minHeight: `${SECTION_HEIGHT_VH}vh` }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[min(220px,28vh)] bg-gradient-to-b from-black via-[#050507]/55 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_50%_at_50%_92%,rgba(48,42,34,0.45),transparent_58%)]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_28%,rgba(22,22,24,0.75),transparent_72%)]" />

      <div
        ref={collectionStickyRef}
        className="sticky top-0 flex h-screen w-full flex-col items-center justify-center px-4 pt-3 pb-1.5 sm:pt-4 sm:pb-2"
      >
        <div className="relative w-full">
          <h2
            ref={collectionTitleRef}
            className="mb-[calc(0.75rem+0.5cm)] text-center font-heading text-7xl font-medium tracking-tight text-white will-change-[transform,opacity] md:mb-[calc(1rem+0.5cm)] md:text-8xl lg:text-[7.5rem]"
          >
            Collection
          </h2>

          <div
            ref={stageRef}
            className="relative mx-auto h-[min(86vmin,860px)] w-full"
          >
            <div
              ref={ellipseRef}
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 rounded-[50%] opacity-0 shadow-none"
              style={{ width: 640, height: 224 }}
            />

            {ORBIT_IMAGES.map((src, i) => (
              <div
                key={`${src}-${i}`}
                data-orbit-card
                className="absolute left-1/2 top-1/2 z-10 w-[min(58vmin,316px)] will-change-transform"
                style={{
                  transform: "translate(-50%, -50%) translate3d(0, 0, 0)",
                  opacity: 1,
                }}
              >
                <button
                  type="button"
                  className="group flex h-[min(50vmin,252px)] w-full cursor-pointer items-center justify-center border-0 bg-transparent p-0"
                  aria-label={`${detailForSrc(src).name} — open details`}
                  onClick={() => onCardClick(i)}
                >
                  <div
                    className="flex max-h-full max-w-full origin-center items-center justify-center will-change-transform"
                    style={{
                      transform: `scale(${orbitSubjectScale(src)})`,
                    }}
                  >
                    <img
                      src={src}
                      alt={detailForSrc(src).name}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      draggable={false}
                    />
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[80] flex items-center justify-center p-4 transition-[opacity,visibility] duration-500 ease-out md:p-8 ${
          detailIndex !== null && detail
            ? "visible opacity-100"
            : "invisible opacity-0 pointer-events-none"
        }`}
        aria-hidden={detailIndex === null}
      >
        <button
          type="button"
          aria-label="Close details"
          className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-500"
          onClick={closeDetail}
        />
        <div
          ref={detailPanelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="watch-detail-title"
          className={`relative z-[1] max-h-[min(92vh,880px)] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/[0.12] bg-[#08080a]/85 shadow-[0_48px_120px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl transition-[opacity,transform,scale] duration-500 ease-out ${
            detailIndex !== null && detail
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-4 scale-[0.98] opacity-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full border border-white/[0.18] bg-black/50 text-xl leading-none text-white/90 backdrop-blur-sm transition-colors duration-300 hover:border-white/[0.35] hover:bg-white/[0.1] md:right-4 md:top-4"
            onClick={closeDetail}
          >
            ×
          </button>
          {detail && detailIndex !== null ? (
            <div
              className={`relative min-h-[min(65vh,720px)] w-full transition-[opacity,transform] ease-out ${
                detailFadedOut
                  ? "pointer-events-none opacity-0 translate-y-2"
                  : "opacity-100 translate-y-0"
              }`}
              style={{
                transitionDuration: `${DETAIL_SWITCH_HALF_MS}ms`,
              }}
            >
              {renderWatchDetailGrid(detailIndex, "watch-detail-title")}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};
