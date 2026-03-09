"use client";

import { useState, useCallback, useRef } from "react";
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

  const navigateTo = useCallback(
    (target: ActivePage) => {
      if (isAnimating) return;
      setIsAnimating(true);

      const el = containerRef.current;
      if (!el) {
        setActivePage(target);
        setIsAnimating(false);
        return;
      }

      el.style.willChange = "transform, opacity";
      el.style.animation = "pageTurnOut 0.5s ease-in forwards";

      const handleOutEnd = () => {
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

  const handleEnterParliament = useCallback(() => navigateTo("parliament"), [navigateTo]);
  const handleBack = useCallback(() => navigateTo("landing"), [navigateTo]);
  const handleGoToLaws = useCallback(() => navigateTo("laws"), [navigateTo]);
  const handleBackToParliament = useCallback(() => navigateTo("parliament"), [navigateTo]);

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
