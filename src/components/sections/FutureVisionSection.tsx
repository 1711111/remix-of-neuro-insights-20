import { useEffect, useRef, useState } from "react";
import { School, Globe, Trophy, BarChart3, ArrowRight, Gift, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FutureVisionSection = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement>(null);
  const globeRef = useRef<SVGSVGElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const visions = [
    {
      icon: School,
      title: "School Partnerships",
      description: "Integrating GreenQuest into curricula worldwide",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Globe,
      title: "Global Communities",
      description: "Connecting eco-warriors across continents",
      gradient: "from-emerald-500 to-green-500",
    },
    {
      icon: Trophy,
      title: "Leaderboards",
      description: "Friendly competition between schools and cities",
      gradient: "from-amber-500 to-yellow-500",
    },
    {
      icon: BarChart3,
      title: "Carbon Tracking",
      description: "Personal and community carbon footprint dashboards",
      gradient: "from-violet-500 to-purple-500",
    },
  ];

  // Star positions around the globe
  const starPositions = [
    { x: 60, y: 50, size: 16 },
    { x: 340, y: 60, size: 14 },
    { x: 50, y: 300, size: 12 },
    { x: 350, y: 320, size: 18 },
    { x: 150, y: 30, size: 10 },
    { x: 250, y: 25, size: 12 },
    { x: 370, y: 180, size: 14 },
    { x: 30, y: 180, size: 16 },
    { x: 100, y: 360, size: 12 },
    { x: 300, y: 370, size: 14 },
    { x: 200, y: 20, size: 10 },
    { x: 380, y: 260, size: 12 },
    { x: 20, y: 120, size: 14 },
    { x: 180, y: 380, size: 10 },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation with blur reveal
      gsap.fromTo(
        ".future-header",
        { y: 80, opacity: 0, filter: "blur(15px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".future-header",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Vision cards with 3D flip cascade
      gsap.fromTo(
        ".vision-card",
        { 
          rotateY: 90, 
          rotateX: -20,
          opacity: 0, 
          scale: 0.6,
          y: 80,
          transformOrigin: "left center"
        },
        {
          rotateY: 0,
          rotateX: 0,
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 1,
          ease: "elastic.out(1, 0.6)",
          stagger: {
            each: 0.12,
            from: "start"
          },
          scrollTrigger: {
            trigger: ".vision-grid",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Vision icons with spring pop
      gsap.fromTo(
        ".vision-icon",
        { scale: 0, rotation: -270, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 0.8,
          ease: "back.out(4)",
          stagger: 0.12,
          delay: 0.2,
          scrollTrigger: {
            trigger: ".vision-grid",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Continuous icon float
      gsap.to(".vision-icon", {
        y: -5,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.1,
      });

      // Card title reveal
      gsap.fromTo(
        ".vision-title",
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
          delay: 0.4,
          scrollTrigger: {
            trigger: ".vision-grid",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // CTA button with glow
      gsap.fromTo(
        ".future-cta",
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: ".future-cta",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // CTA pulse glow - using scale and opacity for better performance
      gsap.to(".cta-glow", {
        scale: 1.1,
        opacity: 0.7,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Globe container entrance with bounce
      gsap.fromTo(
        ".globe-container",
        { scale: 0, opacity: 0, rotation: -30 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 1.5,
          ease: "elastic.out(1, 0.4)",
          scrollTrigger: {
            trigger: ".globe-container",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Globe rotation
      gsap.to(".globe-sphere", {
        rotation: 360,
        duration: 30,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center",
      });

      // Star twinkle animation
      gsap.to(".future-star", {
        scale: 1.4,
        opacity: 1,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.08,
          from: "random",
        },
      });

      // Star floating animation
      gsap.to(".future-star-float", {
        y: -12,
        x: 6,
        rotation: 15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.12,
      });

      // Floating particles
      gsap.utils.toArray(".particle").forEach((particle: any, i) => {
        gsap.to(particle, {
          y: gsap.utils.random(-30, 30),
          x: gsap.utils.random(-20, 20),
          opacity: gsap.utils.random(0.3, 1),
          duration: gsap.utils.random(2, 4),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2,
        });
      });

      // Connection lines draw with glow
      gsap.fromTo(
        ".connection-line",
        { strokeDashoffset: 200, opacity: 0 },
        {
          strokeDashoffset: 0,
          opacity: 0.6,
          duration: 2.5,
          ease: "power2.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: ".globe-container",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Pulse rings
      gsap.to(".pulse-ring", {
        scale: 2.5,
        opacity: 0,
        duration: 2.5,
        repeat: -1,
        ease: "power2.out",
        stagger: {
          each: 0.6,
          repeat: -1,
        },
      });

      // Background floating particles
      gsap.utils.toArray(".future-particle").forEach((particle: any, i) => {
        gsap.to(particle, {
          y: gsap.utils.random(-50, 50),
          x: gsap.utils.random(-40, 40),
          rotation: gsap.utils.random(-45, 45),
          duration: gsap.utils.random(4, 8),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });

    }, sectionRef);

    // Magnetic hover effect for vision cards
    const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(card, {
        rotateY: x / 12,
        rotateX: -y / 12,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out",
      });

      // Spotlight effect
      const spotlight = card.querySelector('.card-spotlight') as HTMLElement;
      if (spotlight) {
        gsap.to(spotlight, {
          background: `radial-gradient(circle at ${e.clientX - rect.left}px ${e.clientY - rect.top}px, hsla(var(--primary), 0.15) 0%, transparent 60%)`,
          duration: 0.2,
        });
      }
    };

    const handleMouseLeave = (card: HTMLElement) => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.6,
        ease: "elastic.out(1, 0.5)",
      });
    };

    cardsRef.current.forEach((card) => {
      if (card) {
        card.addEventListener("mousemove", (e) => handleMouseMove(e, card));
        card.addEventListener("mouseleave", () => handleMouseLeave(card));
      }
    });

    return () => {
      ctx.revert();
      cardsRef.current.forEach((card) => {
        if (card) {
          card.removeEventListener("mousemove", (e) => handleMouseMove(e, card));
          card.removeEventListener("mouseleave", () => handleMouseLeave(card));
        }
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-20 bg-gradient-to-b from-accent/30 to-background overflow-hidden relative">
      {/* Background floating particles - reduced for performance */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="future-particle absolute w-3 h-3 rounded-full bg-primary/15"
            style={{
              left: `${15 + (i * 15)}%`,
              top: `${10 + (i * 14)}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="future-header">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm uppercase tracking-wider mb-4">
                Looking Ahead
              </span>
              <h2 className="font-heading font-bold text-3xl md:text-5xl text-foreground mt-2 mb-4">
                Our Vision for the Future
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We're just getting started. Our roadmap includes expanding to schools, 
                communities, and creating global partnerships for maximum environmental impact.
              </p>
            </div>

            <div className="vision-grid grid sm:grid-cols-2 gap-4 mb-8" style={{ perspective: "1000px" }}>
              {visions.map((vision, index) => (
                <div
                  key={index}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className="vision-card relative bg-card rounded-2xl p-5 border border-border group cursor-pointer overflow-hidden"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Spotlight effect */}
                  <div className="card-spotlight absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Glowing border on hover */}
                  <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/40 transition-all duration-500 group-hover:shadow-[0_0_25px_-5px_hsla(var(--primary),0.4)]" />

                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`vision-icon w-12 h-12 rounded-xl bg-gradient-to-br ${vision.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                      <vision.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="vision-title font-semibold text-foreground mb-1 text-lg">{vision.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{vision.description}</p>
                  </div>

                  {/* Shimmer effect */}
                  <div className="absolute inset-0 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                  </div>
                </div>
              ))}
            </div>

            {!user && (
              <div className="relative inline-block">
                <div className="cta-glow absolute inset-0 rounded-full opacity-50" />
                <Button 
                  size="lg" 
                  className="future-cta relative rounded-full gradient-hero hover:opacity-90 transition-opacity"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Join the Movement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
          </div>

          {/* Animated Globe Visualization */}
          <div className="globe-container relative w-full aspect-square max-w-lg mx-auto">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent rounded-full blur-3xl" />
            
            {/* SVG Globe */}
            <svg
              ref={globeRef}
              viewBox="0 0 400 400"
              className="w-full h-full relative z-10"
            >
              {/* Pulse rings */}
              <circle
                className="pulse-ring"
                cx="200"
                cy="200"
                r="80"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.5"
              />
              <circle
                className="pulse-ring"
                cx="200"
                cy="200"
                r="80"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.5"
                style={{ animationDelay: "0.5s" }}
              />
              <circle
                className="pulse-ring"
                cx="200"
                cy="200"
                r="80"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                opacity="0.5"
                style={{ animationDelay: "1s" }}
              />

              {/* Globe sphere */}
              <g className="globe-sphere">
                {/* Main globe */}
                <circle
                  cx="200"
                  cy="200"
                  r="80"
                  fill="url(#globeGradientFuture)"
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
                
                {/* Globe grid lines */}
                <g opacity="0.3" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" fill="none">
                  {/* Latitude lines */}
                  <ellipse cx="200" cy="200" rx="80" ry="20" />
                  <ellipse cx="200" cy="200" rx="80" ry="40" />
                  <ellipse cx="200" cy="200" rx="80" ry="60" />
                  {/* Longitude lines */}
                  <ellipse cx="200" cy="200" rx="20" ry="80" />
                  <ellipse cx="200" cy="200" rx="40" ry="80" />
                  <ellipse cx="200" cy="200" rx="60" ry="80" />
                </g>

                {/* Land masses (abstract shapes) */}
                <g fill="hsl(var(--primary))" opacity="0.6">
                  <ellipse cx="180" cy="180" rx="25" ry="15" transform="rotate(-20 180 180)" />
                  <ellipse cx="220" cy="210" rx="20" ry="12" transform="rotate(30 220 210)" />
                  <ellipse cx="200" cy="165" rx="15" ry="10" transform="rotate(-10 200 165)" />
                  <ellipse cx="170" cy="220" rx="18" ry="8" transform="rotate(15 170 220)" />
                </g>
              </g>

              {/* Connection lines */}
              <g className="connection-lines">
                <path
                  className="connection-line"
                  d="M200 120 Q 280 100 320 150"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="200"
                  opacity="0.6"
                />
                <path
                  className="connection-line"
                  d="M200 120 Q 120 100 80 150"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="1.5"
                  strokeDasharray="200"
                  opacity="0.6"
                />
                <path
                  className="connection-line"
                  d="M200 280 Q 280 300 320 250"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1.5"
                  strokeDasharray="200"
                  opacity="0.6"
                />
                <path
                  className="connection-line"
                  d="M200 280 Q 120 300 80 250"
                  fill="none"
                  stroke="hsl(var(--secondary))"
                  strokeWidth="1.5"
                  strokeDasharray="200"
                  opacity="0.6"
                />
              </g>

              {/* Floating particles */}
              {[...Array(12)].map((_, i) => (
                <circle
                  key={i}
                  className="particle"
                  cx={100 + Math.random() * 200}
                  cy={100 + Math.random() * 200}
                  r={2 + Math.random() * 3}
                  fill="hsl(var(--primary))"
                  opacity={0.4 + Math.random() * 0.4}
                />
              ))}

              {/* Gradient definitions */}
              <defs>
                <radialGradient id="globeGradientFuture" cx="40%" cy="40%">
                  <stop offset="0%" stopColor="hsl(var(--secondary))" />
                  <stop offset="50%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                </radialGradient>
              </defs>
            </svg>

            {/* Stars around the globe */}
            {starPositions.map((star, index) => (
              <div
                key={index}
                className="future-star-float absolute"
                style={{
                  left: `${(star.x / 400) * 100}%`,
                  top: `${(star.y / 400) * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Star 
                  className={`future-star text-yellow-400 fill-yellow-400/70 drop-shadow-lg`}
                  style={{ width: star.size, height: star.size }}
                />
              </div>
            ))}

            {/* Gold Gift Box at the top */}
            <div className="absolute" style={{ left: "50%", top: "5%", transform: "translateX(-50%)" }}>
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-lg shadow-yellow-500/40 flex items-center justify-center animate-bounce">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Center label */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20 pointer-events-none">
              <div className="bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-primary/30 shadow-lg shadow-primary/10">
                <span className="text-xs font-semibold text-primary">GLOBAL IMPACT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FutureVisionSection;