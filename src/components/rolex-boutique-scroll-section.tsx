"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const VIDEO_SRC = "/videos/boutique-porsche.mp4";

const PIN_SCROLL_END = "+=4000";

const SEEK_THRESHOLD_SEC = 0.04;

const SCRUB_SEC = 0.5;

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
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const titleWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    const titleWrap = titleWrapRef.current;
    if (!section || !video) return;

    video.pause();
    video.currentTime = 0;
    video.removeAttribute("autoplay");

    gsap.registerPlugin(ScrollTrigger);

    let progressTween: gsap.core.Tween | null = null;

    const syncTitle = (progress: number) => {
      if (!titleWrap) return;
      const els = titleWrap.querySelectorAll<HTMLElement>("[data-char]");
      const n = els.length;
      els.forEach((el, i) => {
        const o = charReveal(progress, i, n);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${10 * (1 - o)}px)`;
      });
    };

    const linkScrollToVideo = () => {
      if (progressTween) return;

      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;

      const progressState = { progress: 0 };

      progressTween = gsap.to(progressState, {
        progress: 1,
        ease: "none",
        immediateRender: false,
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: PIN_SCROLL_END,
          pin: true,
          scrub: SCRUB_SEC,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const p = self.progress;
            const d = video.duration;
            if (Number.isFinite(d) && d > 0 && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
              const targetTime = p * d;
              try {
                if (Math.abs(video.currentTime - targetTime) > SEEK_THRESHOLD_SEC) {
                  video.currentTime = targetTime;
                }
              } catch {
                /* seek not ready */
              }
            }
            syncTitle(p);
          },
        },
      });
    };

    const onLoadedMetadata = () => {
      linkScrollToVideo();
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    if (
      video.readyState >= HTMLMediaElement.HAVE_METADATA &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      linkScrollToVideo();
    }

    syncTitle(0);

    let innerRaf = 0;
    const outerRaf = requestAnimationFrame(() => {
      innerRaf = requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(outerRaf);
      cancelAnimationFrame(innerRaf);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("resize", onResize);

      progressTween?.scrollTrigger?.kill();
      progressTween?.kill();
      progressTween = null;

      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === section) st.kill();
      });

      video.pause();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full max-w-none overflow-hidden bg-black"
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
