"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const VIDEO_SRC = "/videos/rolex-hero.mp4";

const POSTER = "https://images.unsplash.com/photo-1540967247317-16b0c1d1de63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1920";

const PIN_SCROLL_END = "+=5000";

type ScrubTween = gsap.core.Tween & { scrollTrigger?: ScrollTrigger };

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

    let scrubTween: ScrubTween | null = null;
    let applyRafId = 0;

    const linkScrollToVideo = () => {
      if (scrubTween) return;

      const dur = video.duration;
      if (!Number.isFinite(dur) || dur <= 0) return;
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;

      // Scroll-scrub: tween a plain { t }, not video.currentTime — GSAP directly
      // animating HTMLVideoElement.currentTime fights the decoder. One rAF flush
      // applies the latest t. ScrollTrigger scrub: 1.5 smooths scroll → time.

      const scrubState = { t: 0 };

      const flushVideoTime = () => {
        applyRafId = 0;
        const d = video.duration;
        if (!Number.isFinite(d) || d <= 0) return;
        if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
        const next = Math.min(d, Math.max(0, scrubState.t));
        try {
          if (Math.abs(video.currentTime - next) > 1e-4) {
            video.currentTime = next;
          }
        } catch {
          /* seek not ready */
        }
      };

      scrubTween = gsap.fromTo(
        scrubState,
        { t: 0 },
        {
          t: dur,
          ease: "none",
          immediateRender: false,
          onUpdate: () => {
            if (!applyRafId) {
              applyRafId = window.requestAnimationFrame(flushVideoTime);
            }
          },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: PIN_SCROLL_END,
            pin: true,
            scrub: 1.5,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        },
      ) as ScrubTween;
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

    const onResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      window.removeEventListener("resize", onResize);

      window.cancelAnimationFrame(applyRafId);
      applyRafId = 0;

      scrubTween?.scrollTrigger?.kill();
      scrubTween?.kill();
      scrubTween = null;

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
        poster={POSTER}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(105deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.28) 100%), linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 45%, rgba(0,0,0,0.35) 100%)",
        }}
      />

      <div className="relative z-10 flex min-h-screen w-full flex-col px-8 md:px-16 lg:px-24">
        <div className="absolute left-8 top-8 md:left-16 md:top-12">
          <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-sm">
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
