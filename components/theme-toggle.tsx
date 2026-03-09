"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    // Create overlay div once, append to body so it works on any page
    const el = document.createElement("div");
    el.style.cssText = "position:fixed;inset:0;z-index:99999;display:none;opacity:0;pointer-events:none;";
    document.body.appendChild(el);
    overlayRef.current = el;
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    if (isTransitioning) return;
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

    // Try View Transition API for smoothest result
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      const doc = document as unknown as { startViewTransition: (cb: () => void) => { ready: Promise<void> } };
      doc.startViewTransition(() => {
        setTheme(nextTheme);
      });
      return;
    }

    // Fallback: smooth crossfade overlay appended to body
    setIsTransitioning(true);
    const overlay = overlayRef.current;
    if (!overlay) {
      setTheme(nextTheme);
      setIsTransitioning(false);
      return;
    }

    // Step 1: fade overlay in
    overlay.style.display = "block";
    overlay.style.opacity = "0";
    overlay.style.backgroundColor = nextTheme === "dark" ? "hsl(220, 20%, 4%)" : "hsl(0, 0%, 97%)";
    overlay.style.transition = "opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";

      // Step 2: at peak, switch theme
      setTimeout(() => {
        setTheme(nextTheme);

        // Step 3: small pause then fade out
        setTimeout(() => {
          overlay.style.transition = "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)";
          overlay.style.opacity = "0";

          setTimeout(() => {
            overlay.style.display = "none";
            overlay.style.transition = "";
            setIsTransitioning(false);
          }, 380);
        }, 60);
      }, 320);
    });
  }, [resolvedTheme, setTheme, isTransitioning]);

  if (!mounted) {
    return (
      <button type="button" className="w-9 h-9 flex items-center justify-center border border-border text-muted-foreground" aria-label="Prepnout motiv">
        <div className="w-4 h-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors duration-300"
      aria-label={isDark ? "Prepnout na svetly motiv" : "Prepnout na tmavy motiv"}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
