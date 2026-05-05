"use client";

import { useEffect, useRef } from "react";

const VIDEO_SRC = "/videos/boutique-porsche.mp4";

/** Taller than 100vh so one full video scrub uses more wheel travel (slower feel). */
const SECTION_SCROLL_HEIGHT_VH = 130;

/** After this scroll fraction through the section, video/text scrub starts (0 = top, 1 = end). */
const SCRUB_START_PROGRESS = 0.5;

const SCROLL_LERP = 0.14;

const TITLE_SCROLL_LERP = 0.16;

const TITLE_LINE = "A wonderful time to live";

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
    const section = sectionRef.current;
    const video = videoRef.current;
    const titleWrap = titleWrapRef.current;
    if (!section || !video || !titleWrap) return;

    video.pause();
    video.currentTime = 0;
    video.removeAttribute("autoplay");
    video.removeAttribute("loop");

    const syncTitle = (revealProgress: number) => {
      const els = titleWrap.querySelectorAll<HTMLElement>("[data-char]");
      const n = els.length;
      const p = Math.min(1, Math.max(0, revealProgress));
      els.forEach((el, i) => {
        const o = charReveal(p, i, n);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${10 * (1 - o)}px)`;
      });
    };

    syncTitle(0);

    let rafId = 0;
    let smoothedTime = 0;
    let smoothedTitleReveal = 0;

    const tick = () => {
      rafId = requestAnimationFrame(tick);

      const rect = section.getBoundingClientRect();
      const scrollY = window.scrollY;
      const sectionTop = rect.top + scrollY;
      const vh = window.innerHeight;
      const h = Math.max(1, section.offsetHeight);
      /** Last block: scroll numerator caps at `h`; use `h` here so progress reaches 1 at max scroll. */
      const scrollableDistance = h;
      const rawProgress =
        (scrollY + vh - sectionTop) / Math.max(1, scrollableDistance);
      const scrollProgress = Math.min(1, Math.max(0, rawProgress));

      const scrubProgress =
        scrollProgress <= SCRUB_START_PROGRESS
          ? 0
          : (scrollProgress - SCRUB_START_PROGRESS) /
            (1 - SCRUB_START_PROGRESS);

      smoothedTitleReveal +=
        (scrubProgress - smoothedTitleReveal) * TITLE_SCROLL_LERP;
      syncTitle(smoothedTitleReveal);

      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;

      let targetTime = Math.min(duration, scrubProgress * duration);
      if (scrubProgress >= 0.999) {
        targetTime = duration;
      }
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
      className="relative -mt-[300px] w-full max-w-none bg-black"
      style={{ minHeight: `${SECTION_SCROLL_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
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
      </div>
    </section>
  );
};
