"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useLandingMotion(enabled: boolean) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      // Line-mask headline reveals (chapter headings only; hero has its own timeline)
      gsap.utils.toArray<HTMLElement>(".chapter .reveal-line").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: 115 },
          {
            yPercent: 0,
            duration: 1.1,
            ease: "expo.out",
            clearProps: "transform",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });

      // Staggered rise for grouped items
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        const items = group.querySelectorAll("[data-stagger-item]");
        if (!items.length) return;
        gsap.fromTo(
          items,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.09,
            clearProps: "transform",
            scrollTrigger: { trigger: group, start: "top 84%", once: true },
          }
        );
      });

      // Parallax layers at different rates, scrubbed to scroll
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0.12");
        gsap.to(el, {
          yPercent: speed * 100,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 1.2 },
        });
      });

      // SVG tactic lines draw on scroll
      gsap.utils.toArray<SVGPathElement>(".draw-path").forEach((path) => {
        let len = 1200;
        try {
          len = path.getTotalLength();
        } catch {
          /* keep fallback */
        }
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(path, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: path.closest("svg"), start: "top 92%", end: "top 45%", scrub: 1 },
        });
      });

      // Stat numerals count up when visible; final value rendered server-side
      // as fallback, tween only overrides while animating.
      gsap.utils.toArray<HTMLElement>(".stat-ring").forEach((ring) => {
        const target = parseFloat(ring.dataset.count || "0");
        const num = ring.querySelector(".stat-num");
        if (!num) return;
        num.textContent = String(Math.round(target));
        const obj = { v: 0 };
        gsap.fromTo(
          obj,
          { v: 0 },
          {
            v: target,
            duration: 1.6,
            ease: "expo.out",
            scrollTrigger: { trigger: ring, start: "top 88%", once: true },
            onUpdate: () => {
              num.textContent = String(Math.round(obj.v));
            },
            onComplete: () => {
              num.textContent = String(Math.round(target));
            },
          }
        );
      });

      // Hero entrance timeline
      gsap.timeline({ defaults: { ease: "expo.out" }, onComplete: () => gsap.set(".hero-title .reveal-line,.hero-kicker,.hero-standfirst,.hero-cta,.hero-stats,.hero-margin", { clearProps: "transform,opacity" }) })
        .fromTo(".hero-kicker", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.1)
        .fromTo(".hero-title .reveal-line", { yPercent: 115 }, { yPercent: 0, duration: 1.25, stagger: 0.12 }, 0.2)
        .fromTo(".hero-standfirst", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.55)
        .fromTo(".hero-cta", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, 0.7)
        .fromTo(".hero-stats", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.8)
        .fromTo(".hero-margin", { opacity: 0, x: 28 }, { opacity: 1, x: 0, duration: 1.1, stagger: 0.12 }, 0.6);

      // Pinned rehearsal: desktop only — phone pins while step cards scrub past.
      // Breakpoint (1020px) matches the CSS that stacks .pin-grid to one column.
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1021px)", () => {
        const progress = root.querySelector(".pin-progress-fill");
        if (progress) {
          gsap.fromTo(
            progress,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: ".pin-wrap",
                start: "top top",
                end: "+=180%",
                scrub: 0.8,
                pin: ".pin-stage",
                anticipatePin: 1,
              },
            }
          );
        }
        gsap.utils.toArray<HTMLElement>(".pin-card").forEach((card, i) => {
          if (i === 0) return;
          gsap.fromTo(
            card,
            { y: 56, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: "none",
              clearProps: "transform",
              scrollTrigger: {
                trigger: ".pin-wrap",
                start: `top+=${(i - 1) * 45}% top`,
                end: `top+=${(i - 1) * 45 + 40}% top`,
                scrub: 0.6,
              },
            }
          );
        });
      });
    }, root);

    return () => ctx.revert();
  }, [enabled]);

  return rootRef;
}
