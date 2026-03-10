"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { AboutSection } from "@/components/about-section";
import { ParliamentChamber } from "@/components/parliament-chamber";
import { LawsPage } from "@/components/laws-page";
import { FaqSection } from "@/components/faq-section";

type ActivePage = "landing" | "parliament" | "laws";

export function PageRouter() {
  const [activePage, setActivePage] = useState<ActivePage>("landing");
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isPopstateNav = useRef(false);

  // Internal navigation without animation (for popstate)
  const setPageDirect = useCallback((page: ActivePage) => {
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const navigateTo = useCallback(
    (target: ActivePage, pushHistory = true) => {
      if (isAnimating) {
        return;
      }
      setIsAnimating(true);

      // Push to browser history (unless triggered by popstate)
      if (pushHistory && !isPopstateNav.current) {
        window.history.pushState({ page: target }, "", `#${target}`);
      }
      isPopstateNav.current = false;

      const el = containerRef.current;
      if (!el) {
        setActivePage(target);
        setIsAnimating(false);
        return;
      }

      el.style.willChange = "transform, opacity";
      el.style.animation = "pageTurnOut 0.5s ease-in forwards";

      // Fallback timeout in case animation doesn't fire (e.g., during hot reload)
      const fallbackTimeout = setTimeout(() => {
        el.removeEventListener("animationend", handleOutEnd);
        setActivePage(target);
        window.scrollTo({ top: 0, behavior: "instant" });
        el.style.animation = "";
        el.style.willChange = "";
        setIsAnimating(false);
      }, 600);

      const handleOutEnd = () => {
        clearTimeout(fallbackTimeout);
        el.removeEventListener("animationend", handleOutEnd);
        setActivePage(target);
        window.scrollTo({ top: 0, behavior: "instant" });

        requestAnimationFrame(() => {
          el.style.animation = "pageTurnIn 0.5s ease-out forwards";

          const handleInEnd = () => {
            el.removeEventListener("animationend", handleInEnd);
            el.style.animation = "";
            el.style.willChange = "";
            setIsAnimating(false);
          };
          el.addEventListener("animationend", handleInEnd);
        });
      };
      el.addEventListener("animationend", handleOutEnd);
    },
    [isAnimating],
  );

  // Set initial history state on mount only
  useEffect(() => {
    window.history.replaceState({ page: "landing" }, "", "");
  }, []);

  // Listen for browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const page = (event.state?.page as ActivePage) || "landing";
      isPopstateNav.current = true;
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        navigateTo(page, false);
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigateTo]);

  const handleEnterParliament = useCallback(() => navigateTo("parliament"), [navigateTo]);
  const handleBack = useCallback(() => {
    // Use browser history.back() so back button and our button behave the same
    window.history.back();
  }, []);
  const handleGoToLaws = useCallback(() => navigateTo("laws"), [navigateTo]);
  const handleBackToParliament = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <div ref={containerRef}>
      {activePage === "landing" ? (
        <>
          <Navbar />
          <Hero onEnterParliament={handleEnterParliament} />
          <AboutSection onNavigateToLaws={handleGoToLaws} />
          <FaqSection />
        </>
      ) : activePage === "parliament" ? (
        <ParliamentChamber onBack={handleBack} onGoToLaws={handleGoToLaws} />
      ) : (
        <LawsPage onBack={handleBackToParliament} />
      )}
    </div>
  );
}
