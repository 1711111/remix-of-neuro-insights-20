import { useState, useEffect, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestModal from "@/components/QuestModal";
import AuthModal from "@/components/AuthModal";
import { gsap } from "gsap";
import { useAuth } from "@/hooks/useAuth";

const HeroSection = () => {
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let updateOrbits: (() => void) | null = null;

    const ctx = gsap.context(() => {
      // Hero timeline for initial load
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Badge animation
      tl.fromTo(
        ".hero-badge",
        { y: -30, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6 }
      );

      // Heading with word-by-word animation
      if (headingRef.current) {
        const words = headingRef.current.querySelectorAll(".hero-word");
        tl.fromTo(
          words,
          { y: 80, opacity: 0, rotateX: -45 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.08 },
          "-=0.3"
        );
      }

      // Paragraph
      tl.fromTo(
        ".hero-paragraph",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7 },
        "-=0.4"
      );

      // Buttons
      tl.fromTo(
        ".hero-buttons",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.3"
      );

      // Stats with counter
      if (statsRef.current) {
        const statItems = statsRef.current.querySelectorAll(".stat-item");
        tl.fromTo(
          statItems,
          { y: 40, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1 },
          "-=0.2"
        );
      }

      // SVG Container entrance
      tl.fromTo(
        ".hero-svg-container",
        { scale: 0.5, opacity: 0, rotate: -10 },
        { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: "elastic.out(1, 0.6)" },
        "-=0.8"
      );

      // Animate SVG elements
      if (svgRef.current) {
        // Tree sway (subtle)
        gsap.to(".hero-tree", {
          rotation: 1.5,
          duration: 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          svgOrigin: "200 300",
        });

        // Glow pulse (kept contained)
        gsap.to(".hero-glow", {
          opacity: 0.55,
          scale: 1.04,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          svgOrigin: "200 200",
        });

        // Realistic ellipse orbits (manual positioning)
        const cx = 200;
        const cy = 200;
        const DEG = Math.PI / 180;

        const orbits = [
          { sel: ".hero-fruit-1", rx: 130, ry: 40, rot: 0, speed: 0.9, phase: 0, depthAxis: "y" as const },
          { sel: ".hero-fruit-2", rx: 120, ry: 38, rot: 45, speed: 0.72, phase: 1.2, depthAxis: "y" as const },
          { sel: ".hero-fruit-3", rx: 110, ry: 35, rot: -45, speed: -0.82, phase: 2.1, depthAxis: "y" as const },
          { sel: ".hero-fruit-4", rx: 40, ry: 130, rot: 0, speed: 0.62, phase: 0.6, depthAxis: "x" as const },
        ];

        updateOrbits = () => {
          const t = gsap.ticker.time;

          for (const o of orbits) {
            const a = t * o.speed + o.phase;
            const x0 = o.rx * Math.cos(a);
            const y0 = o.ry * Math.sin(a);

            const r = o.rot * DEG;
            const x = x0 * Math.cos(r) - y0 * Math.sin(r);
            const y = x0 * Math.sin(r) + y0 * Math.cos(r);

            const depthVal = o.depthAxis === "x" ? Math.cos(a) : Math.sin(a);
            const depth = (depthVal + 1) / 2;
            const scale = 0.85 + depth * 0.35;
            const opacity = 0.45 + depth * 0.55;

            gsap.set(o.sel, {
              attr: { transform: `translate(${cx + x}, ${cy + y}) scale(${scale})` },
              opacity,
            });
          }
        };

        gsap.ticker.add(updateOrbits);
      }

      // Floating background elements
      gsap.to(".float-el-1", {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      gsap.to(".float-el-2", {
        y: -30,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
      });

    }, sectionRef);

    return () => {
      if (updateOrbits) {
        gsap.ticker.remove(updateOrbits);
      }
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} className="min-h-screen pt-16 sm:pt-20 flex items-center relative overflow-x-hidden overflow-y-visible">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent via-background to-secondary/10 -z-10" />
      
      {/* Floating Elements - Hide on mobile for performance */}
      <div className="float-el-1 absolute top-1/4 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl hidden md:block" />
      <div className="float-el-2 absolute bottom-1/3 right-20 w-32 h-32 rounded-full bg-secondary/20 blur-xl hidden md:block" />
      
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <div className="hero-badge inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Gamified Sustainability</span>
            </div>
            
            <h1 ref={headingRef} className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground mb-4 sm:mb-6 perspective-1000">
              <span className="hero-word inline-block">Play</span>{" "}
              <span className="hero-word inline-block">Green.</span>{" "}
              <span className="hero-word inline-block gradient-text">Earn</span>{" "}
              <span className="hero-word inline-block gradient-text">Points.</span>{" "}
              <span className="hero-word inline-block">Save</span>{" "}
              <span className="hero-word inline-block">the</span>{" "}
              <span className="hero-word inline-block">Planet.</span>
            </h1>
            
            <p className="hero-paragraph text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
              Turn everyday eco-friendly actions into exciting challenges. 
              Complete quests, earn rewards, and make a real difference for our planet.
            </p>
            
            <div className="hero-buttons flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              {!user && (
                <Button 
                  size="lg" 
                  className="rounded-full gradient-hero hover:opacity-90 transition-opacity text-base sm:text-lg px-6 sm:px-8 pulse-glow"
                  onClick={() => setQuestModalOpen(true)}
                >
                  Start Your Quest
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                </Button>
              )}
              {!user && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full text-base sm:text-lg px-6 sm:px-8"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Sign Up
                </Button>
              )}
            </div>
            
            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
              <div className="stat-item">
                <p className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-primary">50K+</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Users</p>
              </div>
              <div className="stat-item">
                <p className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-primary">1M+</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Challenges Done</p>
              </div>
              <div className="stat-item">
                <p className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-primary">100+</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Partner Schools</p>
              </div>
            </div>
          </div>
          
          {/* Hero SVG Visualization */}
          <div className="hero-svg-container relative p-6">
            <svg
              ref={svgRef}
              viewBox="0 0 400 400"
              className="w-full max-w-lg mx-auto overflow-visible"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))" }}
            >
              <defs>
                <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(25 45% 35%)" />
                  <stop offset="100%" stopColor="hsl(25 55% 25%)" />
                </linearGradient>
                <radialGradient id="canopyGradient" cx="40%" cy="35%" r="70%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.55" />
                </radialGradient>
              </defs>

              {/* Background glow */}
              <circle className="hero-glow" cx="200" cy="200" r="150" fill="url(#heroGlow)" />

              {/* Orbit rings (static) */}
              <ellipse cx="200" cy="200" rx="150" ry="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.22" strokeDasharray="6 5" />
              <ellipse cx="200" cy="200" rx="140" ry="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="5 6" transform="rotate(45 200 200)" />
              <ellipse cx="200" cy="200" rx="130" ry="40" fill="none" stroke="hsl(var(--accent))" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="5 5" transform="rotate(-45 200 200)" />
              <ellipse cx="200" cy="200" rx="45" ry="150" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.14" strokeDasharray="4 7" />

              {/* Center tree */}
              <g className="hero-tree">
                {/* trunk */}
                <path
                  d="M190 300 C188 270 195 255 198 235 C200 220 196 210 193 198 C205 205 210 220 210 235 C210 250 205 270 210 300 Z"
                  fill="url(#trunkGradient)"
                  opacity="0.95"
                />
                {/* canopy */}
                <circle cx="200" cy="185" r="62" fill="url(#canopyGradient)" />
                <circle cx="160" cy="195" r="40" fill="url(#canopyGradient)" opacity="0.85" />
                <circle cx="245" cy="200" r="45" fill="url(#canopyGradient)" opacity="0.85" />
                <circle cx="190" cy="145" r="32" fill="url(#canopyGradient)" opacity="0.85" />
                {/* highlight */}
                <ellipse cx="175" cy="155" rx="22" ry="16" fill="white" fillOpacity="0.12" />
              </g>

              {/* Orbiting "fruit" icons (positions animated in JS) */}
              <g className="hero-fruit-1" transform="translate(200 200)">
                <circle cx="0" cy="0" r="18" fill="hsl(var(--primary))" fillOpacity="0.22" stroke="hsl(var(--primary))" strokeOpacity="0.25" />
                {/* leaf */}
                <path d="M2 -18 C10 -18 14 -10 10 -6 C6 -2 2 -6 2 -10 Z" fill="hsl(var(--primary))" fillOpacity="0.55" />
                {/* leaf glyph */}
                <path d="M0 -6 C-8 -2 -8 8 0 10 C8 8 8 -2 0 -6 M0 -3 L0 7" stroke="hsl(var(--primary))" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>

              <g className="hero-fruit-2" transform="translate(200 200)">
                <circle cx="0" cy="0" r="18" fill="hsl(var(--secondary))" fillOpacity="0.18" stroke="hsl(var(--secondary))" strokeOpacity="0.22" />
                <path d="M2 -18 C10 -18 14 -10 10 -6 C6 -2 2 -6 2 -10 Z" fill="hsl(var(--secondary))" fillOpacity="0.5" />
                {/* recycle-ish glyph */}
                <path d="M-6 5 L0 -5 L6 5 M-6 -5 L0 5 L6 -5" stroke="hsl(var(--primary))" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              <g className="hero-fruit-3" transform="translate(200 200)">
                <circle cx="0" cy="0" r="18" fill="hsl(var(--accent))" fillOpacity="0.16" stroke="hsl(var(--accent))" strokeOpacity="0.22" />
                <path d="M2 -18 C10 -18 14 -10 10 -6 C6 -2 2 -6 2 -10 Z" fill="hsl(var(--accent))" fillOpacity="0.5" />
                {/* sun glyph */}
                <circle cx="0" cy="0" r="6" stroke="hsl(var(--accent))" strokeWidth="1.6" fill="none" />
                <g stroke="hsl(var(--accent))" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="0" y1="-11" x2="0" y2="-13" />
                  <line x1="0" y1="11" x2="0" y2="13" />
                  <line x1="-11" y1="0" x2="-13" y2="0" />
                  <line x1="11" y1="0" x2="13" y2="0" />
                </g>
              </g>

              <g className="hero-fruit-4" transform="translate(200 200)">
                <circle cx="0" cy="0" r="18" fill="hsl(var(--primary))" fillOpacity="0.18" stroke="hsl(var(--primary))" strokeOpacity="0.2" />
                <path d="M2 -18 C10 -18 14 -10 10 -6 C6 -2 2 -6 2 -10 Z" fill="hsl(var(--primary))" fillOpacity="0.5" />
                {/* water drop glyph */}
                <path d="M0 -6 C-6 2 -7 8 0 11 C7 8 6 2 0 -6" stroke="hsl(var(--secondary))" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
            </svg>

            {/* Soft glow behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/10 blur-3xl -z-10 rounded-full" />
          </div>
        </div>
      </div>

      {/* Quest Modal */}
      <QuestModal open={questModalOpen} onOpenChange={setQuestModalOpen} />
      
      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </section>
  );
};

export default HeroSection;
