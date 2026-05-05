"use client";

import { useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * После деплоя (Vercel) layout и шрифты дорисовываются с задержкой — ScrollTrigger
 * иногда создаётся по «старой» геометрии. Повторный refresh после load/fonts.ready
 * убирает «через раз» пустые/залипшие секции.
 */
const ScrollTriggerRootRefresh = () => {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const refresh = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.refresh();
        });
      });
    };

    refresh();
    window.addEventListener("load", refresh);

    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) refresh();
    });

    return () => {
      cancelled = true;
      window.removeEventListener("load", refresh);
    };
  }, []);

  return null;
};

export const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange
  >
    <ScrollTriggerRootRefresh />
    {children}
  </ThemeProvider>
);
