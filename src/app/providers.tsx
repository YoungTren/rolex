"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

export const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    {children}
  </ThemeProvider>
);
