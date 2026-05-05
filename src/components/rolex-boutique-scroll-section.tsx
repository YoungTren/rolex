"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/videos/boutique-porsche.mp4";

const SCROLL_LERP = 0.14;

const TEXT_REVEAL_MS = 3200;

const TITLE_LINE = "a wonderful time to live";

const splitTitle = TITLE_LINE.split("");

const charReveal = (progress: number, charIndex: number, n: number) => {
  if (n <= 1) return progress;
  const span = 0.72;
  const start = (charIndex / (n - 1)) * span;
  const dur = 0.22;
  const t0 = progress - start;
  if (t0 <= 0) return 0;
  if (t0 >= dur) return 1;
  const t = t0 / dur;
  return t * t;
};

export const RolexBoutiqueScrollSection = () => {
  const titleWrapRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const titleWrap = titleWrapRef.current;
    if (!titleWrap) return;

    const syncTitle = (progress: number) => {
      const els = titleWrap.querySelectorAll<HTMLElement>("[data-char]");
      const n = els.length;
      els.forEach((el, i) => {
        const o = charReveal(progress, i, n);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${10 * (1 - o)}px)`;
      });
    };

    syncTitle(0);

    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / TEXT_REVEAL_MS);
      syncTitle(t);
      if (t < 1) rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    video.pause();
    video.currentTime = 0;
    video.removeAttribute("autoplay");
    video.removeAttribute("loop");

    let rafId = 0;
    let smoothedTime = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      const rect = section.getBoundingClientRect();
      const scrollY = window.scrollY;
      const sectionTop = rect.top + scrollY;
      const vh = window.innerHeight;
      const h = Math.max(1, section.offsetHeight);
      const scrollableDistance = h + vh;
      const rawProgress =
        (scrollY + vh - sectionTop) / Math.max(1, scrollableDistance);
      const progress = Math.min(1, Math.max(0, rawProgress));

      const targetTime = progress * duration;
      smoothedTime += (targetTime - smoothedTime) * SCROLL_LERP;
      if (Math.abs(smoothedTime - targetTime) < 0.03) {
        smoothedTime = targetTime;
      }

      try {
        if (Math.abs(video.currentTime - smoothedTime) > 0.016) {
          video.currentTime = smoothedTime;
        }
      } catch {
        /* seek not ready */
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative -mt-[300px] h-screen w-full max-w-none overflow-hidden bg-black"
    >
      <video
        ref={videoRef}
        src={VIDEO_SRC}
        className="pointer-events-none absolute inset-0 z-0 object-cover will-change-transform"
        style={{
          width: "100vw",
          height: "100vh",
          minWidth: "100%",
          minHeight: "100%",
          objectFit: "cover",
        }}
        preload="auto"
        playsInline
        muted
        aria-hidden
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[clamp(150px,22vh,250px)] bg-gradient-to-t from-black via-black/[0.72] via-[40%] to-transparent"
      />

      <div
        ref={titleWrapRef}
        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 md:px-12"
      >
        <p
          className="font-heading max-w-[95vw] text-center text-5xl font-medium leading-[1.1] tracking-[-0.02em] md:text-7xl lg:text-8xl xl:text-9xl"
          style={{
            fontWeight: 500,
          }}
          aria-label={TITLE_LINE}
        >
          {splitTitle.map((ch, i) => (
            <span
              key={`${ch}-${i}`}
              data-char
              className="inline-block text-white [text-shadow:0_0_1px_rgba(255,255,255,0.35)]"
              style={{
                opacity: 0,
                color: "rgba(255,255,255,0.97)",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
};
