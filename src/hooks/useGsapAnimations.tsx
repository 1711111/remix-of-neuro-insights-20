import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

export const useGsapAnimations = () => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate section headers
      gsap.utils.toArray<HTMLElement>(".gsap-header").forEach((header) => {
        gsap.fromTo(
          header,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: header,
              start: "top 85%",
              end: "bottom 20%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Animate paragraphs
      gsap.utils.toArray<HTMLElement>(".gsap-text").forEach((text) => {
        gsap.fromTo(
          text,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: text,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Animate cards with stagger
      gsap.utils.toArray<HTMLElement>(".gsap-card-container").forEach((container) => {
        const cards = container.querySelectorAll(".gsap-card");
        gsap.fromTo(
          cards,
          { y: 80, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: "back.out(1.4)",
            stagger: 0.15,
            scrollTrigger: {
              trigger: container,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Animate images with reveal
      gsap.utils.toArray<HTMLElement>(".gsap-image").forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 0.8, opacity: 0, y: 50 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: image,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Text split animation for hero
      gsap.utils.toArray<HTMLElement>(".gsap-split-text").forEach((text) => {
        const words = text.textContent?.split(" ") || [];
        text.innerHTML = words.map((word) => `<span class="gsap-word inline-block">${word}&nbsp;</span>`).join("");

        gsap.fromTo(
          text.querySelectorAll(".gsap-word"),
          { y: 100, opacity: 0, rotateX: -90 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.05,
            scrollTrigger: {
              trigger: text,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Fade in from left
      gsap.utils.toArray<HTMLElement>(".gsap-from-left").forEach((el) => {
        gsap.fromTo(
          el,
          { x: -100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Fade in from right
      gsap.utils.toArray<HTMLElement>(".gsap-from-right").forEach((el) => {
        gsap.fromTo(
          el,
          { x: 100, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Counter animation
      gsap.utils.toArray<HTMLElement>(".gsap-counter").forEach((counter) => {
        const target = counter.textContent || "0";
        const numericValue = parseFloat(target.replace(/[^0-9.]/g, ""));
        const suffix = target.replace(/[0-9.]/g, "");

        gsap.fromTo(
          counter,
          { textContent: "0" },
          {
            textContent: numericValue,
            duration: 2,
            ease: "power2.out",
            snap: { textContent: 1 },
            scrollTrigger: {
              trigger: counter,
              start: "top 90%",
              toggleActions: "play none none none",
            },
            onUpdate: function () {
              counter.textContent = Math.round(parseFloat(counter.textContent || "0")) + suffix;
            },
          }
        );
      });

      // Parallax effect for images
      gsap.utils.toArray<HTMLElement>(".gsap-parallax").forEach((el) => {
        gsap.to(el, {
          y: -50,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
      });

      // Scale on scroll
      gsap.utils.toArray<HTMLElement>(".gsap-scale-scroll").forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.5, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 1,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 90%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return containerRef;
};

export default useGsapAnimations;
