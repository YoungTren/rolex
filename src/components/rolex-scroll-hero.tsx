"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const VIDEO_SRC = "/videos/0503.mov";

const PIN_SCROLL_END = "+=4000";

const SEEK_THRESHOLD_SEC = 0.04;

const SCRUB_SEC = 0.5;

export const RolexScrollHero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    video.pause();
    video.currentTime = 0;
    video.removeAttribute("autoplay");

    gsap.registerPlugin(ScrollTrigger);

    let progressTween: gsap.core.Tween | null = null;

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
            const d = video.duration;
            if (!Number.isFinite(d) || d <= 0) return;
            if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;

            const targetTime = self.progress * d;

            try {
              if (Math.abs(video.currentTime - targetTime) > SEEK_THRESHOLD_SEC) {
                video.currentTime = targetTime;
              }
            } catch {
              /* seek not ready */
            }
          },
        },
      });
    };

    const onVideoReady = () => {
      linkScrollToVideo();
    };

    video.addEventListener("loadedmetadata", onVideoReady);
    video.addEventListener("canplay", onVideoReady);

    if (
      video.readyState >= HTMLMediaElement.HAVE_METADATA &&
      Number.isFinite(video.duration) &&
      video.duration > 0
    ) {
      linkScrollToVideo();
    }

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
      video.removeEventListener("loadedmetadata", onVideoReady);
      video.removeEventListener("canplay", onVideoReady);
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
        className="pointer-events-none absolute inset-0 z-0 size-full max-h-none max-w-none min-h-full min-w-full object-cover"
        style={{
          objectFit: "cover",
          objectPosition: "center center",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
        preload="auto"
        playsInline
        muted
        aria-hidden
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col px-8 md:px-16 lg:px-24">
        <div className="absolute left-8 top-8 md:left-16 md:top-12">
          <div className="inline-flex items-center gap-2 border border-white/20 px-4 py-2">
            <span className="size-1.5 rounded-full bg-white/90" />
            <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-white/90">
              Oyster Perpetual
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div className="max-w-4xl space-y-8">
            <h1
              className="font-heading text-5xl tracking-tight text-white md:text-7xl lg:text-8xl"
              style={{
                fontWeight: 500,
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              Engineered Time
            </h1>

            <p
              className="max-w-xl font-sans text-base font-light leading-relaxed text-white/82 md:text-lg"
              style={{ letterSpacing: "0.02em" }}
            >
              A cinematic expression of precision, craft, and motion.
            </p>

            <div className="pt-2">
              <button
                type="button"
                className="group relative overflow-hidden border border-white/35 bg-white/5 px-10 py-4 backdrop-blur-md transition-colors duration-500 hover:border-white/55 hover:bg-white/10"
              >
                <span className="relative z-10 font-sans text-sm uppercase tracking-[0.18em] text-white">
                  Explore Collection
                </span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/12 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
