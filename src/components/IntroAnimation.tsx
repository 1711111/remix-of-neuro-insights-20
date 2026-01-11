import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsVisible(false);
          onComplete();
        },
      });

      // Initial state
      gsap.set(".intro-word", { y: 200, opacity: 0, rotateX: -90 });
      gsap.set(".intro-tagline", { opacity: 0, y: 50 });
      gsap.set(".intro-line", { scaleX: 0 });
      gsap.set(".intro-leaf", { scale: 0, rotation: -180 });
      gsap.set(".intro-circle", { scale: 0 });
      gsap.set(".intro-particle", { scale: 0, opacity: 0 });

      // Particles burst
      tl.to(".intro-particle", {
        scale: 1,
        opacity: 0.6,
        duration: 0.4,
        stagger: {
          amount: 0.3,
          from: "random",
        },
        ease: "power2.out",
      });

      // Circle expand
      tl.to(
        ".intro-circle",
        {
          scale: 1,
          duration: 0.8,
          ease: "power4.out",
        },
        "-=0.2"
      );

      // Leaf icon spin in
      tl.to(
        ".intro-leaf",
        {
          scale: 1,
          rotation: 0,
          duration: 1,
          ease: "elastic.out(1, 0.5)",
        },
        "-=0.5"
      );

      // Lines sweep
      tl.to(
        ".intro-line",
        {
          scaleX: 1,
          duration: 0.6,
          ease: "power3.inOut",
          stagger: 0.1,
        },
        "-=0.3"
      );

      // Words reveal with 3D flip
      tl.to(
        ".intro-word",
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          ease: "power4.out",
          stagger: 0.12,
        },
        "-=0.3"
      );

      // Tagline fade in
      tl.to(
        ".intro-tagline",
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power2.out",
        },
        "-=0.2"
      );

      // Pause for impact
      tl.to({}, { duration: 0.5 });

      // Particles scatter
      tl.to(".intro-particle", {
        y: () => gsap.utils.random(-200, 200),
        x: () => gsap.utils.random(-200, 200),
        opacity: 0,
        scale: 2,
        duration: 0.6,
        ease: "power2.in",
        stagger: {
          amount: 0.2,
          from: "random",
        },
      });

      // Everything scales up and fades
      tl.to(
        ".intro-content",
        {
          scale: 1.5,
          opacity: 0,
          duration: 0.8,
          ease: "power3.in",
        },
        "-=0.4"
      );

      // Container slides up
      tl.to(
        containerRef.current,
        {
          yPercent: -100,
          duration: 0.8,
          ease: "power4.inOut",
        },
        "-=0.3"
      );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-background flex items-center justify-center overflow-hidden"
    >
      {/* Background particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="intro-particle absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))",
          }}
        />
      ))}

      {/* Decorative circles */}
      <div className="intro-circle absolute w-[600px] h-[600px] rounded-full border border-primary/20" />
      <div className="intro-circle absolute w-[400px] h-[400px] rounded-full border border-secondary/30" />
      <div className="intro-circle absolute w-[200px] h-[200px] rounded-full bg-gradient-to-br from-primary/10 to-secondary/10" />

      <div className="intro-content relative z-10 text-center">
        {/* Leaf Icon */}
        <div className="intro-leaf mb-8 mx-auto">
          <svg
            className="w-20 h-20 mx-auto text-primary"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>

        {/* Decorative lines */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="intro-line h-0.5 w-16 bg-gradient-to-r from-transparent to-primary origin-left" />
          <div className="intro-line h-0.5 w-8 bg-primary origin-center" />
          <div className="intro-line h-0.5 w-16 bg-gradient-to-l from-transparent to-primary origin-right" />
        </div>

        {/* Main text */}
        <div className="overflow-hidden perspective-1000">
          <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl tracking-tight">
            <span className="intro-word inline-block text-foreground">GREEN</span>
            <span className="intro-word inline-block gradient-text">QUEST</span>
          </h1>
        </div>

        {/* Tagline */}
        <p className="intro-tagline mt-6 text-lg md:text-xl text-muted-foreground font-medium tracking-widest uppercase">
          The Future is Green
        </p>

        {/* Bottom decorative lines */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="intro-line h-0.5 w-24 bg-gradient-to-r from-transparent via-secondary to-transparent origin-center" />
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-primary/40 intro-circle origin-top-left" />
      <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-primary/40 intro-circle origin-top-right" />
      <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-secondary/40 intro-circle origin-bottom-left" />
      <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-secondary/40 intro-circle origin-bottom-right" />
    </div>
  );
};

export default IntroAnimation;
