"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-all duration-500 ${
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono uppercase tracking-[0.3em] text-foreground">
          patriot index
        </span>
      </div>

      <div className="flex items-center gap-4">
        <a
          href="https://www.facebook.com/profile.php?id=61588035370902"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          aria-label="Facebook"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            suppressHydrationWarning
          >
            <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.09.044 1.613.115V7.93c-.263-.006-.72-.01-1.222-.01-1.733 0-2.41.657-2.41 2.365v1.76h3.454l-.465 3.667H12.94v8.142C18.522 22.988 23 18.047 23 12.142 23 5.783 17.955.738 11.597.738S.193 5.783.193 12.142c0 5.117 3.427 9.457 8.107 10.83.268.063.502.096.801.719Z" />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/patriotindexcz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          aria-label="Instagram"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            suppressHydrationWarning
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
        <a
          href="https://x.com/patriotindexcz/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors duration-300"
          aria-label="X (Twitter)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
            suppressHydrationWarning
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <ThemeToggle />
      </div>
    </nav>
  );
}
