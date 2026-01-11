import { useEffect, useRef } from "react";
import { AlertTriangle, TrendingDown, Users, CloudRain, Flame, Droplets, Gift, Star } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ProblemSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const problems = [
    {
      icon: TrendingDown,
      title: "Lack of Motivation",
      description: "Without immediate feedback, sustainable actions feel unrewarding.",
    },
    {
      icon: AlertTriangle,
      title: "Inconsistent Habits",
      description: "It's hard to maintain eco-friendly routines without support and tracking.",
    },
    {
      icon: Users,
      title: "Low Awareness",
      description: "Many don't know the real impact of their daily environmental choices.",
    },
  ];

  const impactStats = [
    { value: "8M", label: "Tons of plastic enter oceans yearly", icon: Droplets },
    { value: "1.5°C", label: "Global temperature rise target", icon: Flame },
    { value: "40%", label: "Species at extinction risk", icon: CloudRain },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation with split text effect
      gsap.fromTo(
        ".problem-header",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".problem-header",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Animated SVG Earth with warning indicators
      gsap.fromTo(
        ".earth-svg",
        { scale: 0, rotation: -30, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
          scrollTrigger: {
            trigger: ".problem-visual",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Earth pulse effect
      gsap.to(".earth-glow", {
        scale: 1.3,
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: "power2.out",
      });

      // Crisis lines animate in
      gsap.fromTo(
        ".crisis-line",
        { strokeDashoffset: 300 },
        {
          strokeDashoffset: 0,
          duration: 1.5,
          ease: "power2.out",
          stagger: 0.2,
          scrollTrigger: {
            trigger: ".problem-visual",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Star twinkle animation
      gsap.to(".star-icon", {
        scale: 1.2,
        opacity: 0.9,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.15,
          from: "random",
        },
      });

      // Star floating animation
      gsap.to(".star-float", {
        y: -8,
        x: 3,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });

      // Impact stat bars animate
      gsap.fromTo(
        ".stat-bar",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: ".impact-stats",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Stat numbers count up
      gsap.fromTo(
        ".stat-value",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: ".impact-stats",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Problem cards stagger with 3D flip
      gsap.fromTo(
        ".problem-card",
        { x: 80, opacity: 0, rotateY: -15 },
        {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.7,
          ease: "back.out(1.2)",
          stagger: 0.15,
          scrollTrigger: {
            trigger: ".problem-cards",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Problem icons pulse
      gsap.to(".problem-icon", {
        scale: 1.1,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });

      // Solution card entrance
      gsap.fromTo(
        ".solution-card",
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.7)",
          scrollTrigger: {
            trigger: ".solution-card",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Floating danger particles
      gsap.utils.toArray(".danger-particle").forEach((particle: any, i) => {
        gsap.to(particle, {
          y: gsap.utils.random(-40, 40),
          x: gsap.utils.random(-30, 30),
          opacity: gsap.utils.random(0.2, 0.8),
          duration: gsap.utils.random(3, 5),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Star positions around the earth
  const starPositions = [
    { x: 80, y: 60, size: 16 },
    { x: 320, y: 80, size: 14 },
    { x: 60, y: 280, size: 12 },
    { x: 340, y: 300, size: 18 },
    { x: 150, y: 50, size: 10 },
    { x: 250, y: 40, size: 12 },
    { x: 350, y: 180, size: 14 },
    { x: 50, y: 180, size: 16 },
    { x: 120, y: 340, size: 12 },
    { x: 280, y: 350, size: 14 },
  ];

  return (
    <section ref={sectionRef} className="py-20 bg-muted/50 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="problem-header text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            The Challenge We Face
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Many people want to live sustainably but struggle with motivation, 
            consistency, and awareness of their environmental impact.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Animated Visual */}
          <div className="order-2 lg:order-1 problem-visual relative">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-radial from-destructive/10 via-transparent to-transparent rounded-full blur-3xl" />
              
              {/* SVG Visualization */}
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full earth-svg"
              >
                {/* Earth glow effect */}
                <circle
                  className="earth-glow"
                  cx="200"
                  cy="200"
                  r="80"
                  fill="hsl(var(--destructive))"
                  opacity="0.2"
                />
                
                {/* Main Earth circle */}
                <circle
                  cx="200"
                  cy="200"
                  r="80"
                  fill="url(#earthGradient)"
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                />
                
                {/* Earth continents (abstract) */}
                <g fill="hsl(var(--primary))" opacity="0.5">
                  <ellipse cx="180" cy="175" rx="30" ry="20" transform="rotate(-15 180 175)" />
                  <ellipse cx="225" cy="210" rx="25" ry="15" transform="rotate(20 225 210)" />
                  <ellipse cx="195" cy="240" rx="20" ry="12" transform="rotate(-5 195 240)" />
                  <ellipse cx="165" cy="205" rx="15" ry="10" transform="rotate(30 165 205)" />
                </g>

                {/* Crisis indicator lines */}
                <g className="crisis-lines">
                  <path
                    className="crisis-line"
                    d="M120 120 Q 140 100 180 120"
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="2"
                    strokeDasharray="300"
                    opacity="0.7"
                  />
                  <path
                    className="crisis-line"
                    d="M280 130 Q 300 110 320 140"
                    fill="none"
                    stroke="hsl(var(--warning))"
                    strokeWidth="2"
                    strokeDasharray="300"
                    opacity="0.7"
                  />
                  <path
                    className="crisis-line"
                    d="M100 250 Q 80 270 100 300"
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="2"
                    strokeDasharray="300"
                    opacity="0.7"
                  />
                  <path
                    className="crisis-line"
                    d="M300 260 Q 320 280 310 310"
                    fill="none"
                    stroke="hsl(var(--warning))"
                    strokeWidth="2"
                    strokeDasharray="300"
                    opacity="0.7"
                  />
                </g>

                {/* Danger indicator rings */}
                <circle
                  cx="200"
                  cy="200"
                  r="110"
                  fill="none"
                  stroke="hsl(var(--destructive))"
                  strokeWidth="1"
                  strokeDasharray="8 4"
                  opacity="0.4"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="140"
                  fill="none"
                  stroke="hsl(var(--warning))"
                  strokeWidth="1"
                  strokeDasharray="12 6"
                  opacity="0.3"
                />

                {/* Floating danger particles */}
                {[...Array(8)].map((_, i) => (
                  <circle
                    key={i}
                    className="danger-particle"
                    cx={100 + Math.random() * 200}
                    cy={100 + Math.random() * 200}
                    r={3 + Math.random() * 4}
                    fill="hsl(var(--destructive))"
                    opacity={0.3 + Math.random() * 0.4}
                  />
                ))}

                {/* Gradient definitions */}
                <defs>
                  <radialGradient id="earthGradient" cx="35%" cy="35%">
                    <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="hsl(var(--muted))" stopOpacity="0.4" />
                  </radialGradient>
                </defs>
              </svg>

              {/* Stars around the visualization (instead of orbiting icons) */}
              {starPositions.map((star, index) => (
                <div
                  key={index}
                  className="star-float absolute"
                  style={{
                    left: `${(star.x / 400) * 100}%`,
                    top: `${(star.y / 400) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <Star 
                    className={`star-icon text-warning fill-warning/60`}
                    style={{ width: star.size, height: star.size }}
                  />
                </div>
              ))}

              {/* Gold Gift Box positioned on the right side */}
              <div className="absolute" style={{ right: "5%", top: "50%", transform: "translateY(-50%)" }}>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 shadow-lg shadow-yellow-500/30 flex items-center justify-center animate-pulse">
                  <Gift className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>

            {/* Impact Stats Bar */}
            <div className="impact-stats mt-8 space-y-4">
              {impactStats.map((stat, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-5 h-5 text-destructive" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="stat-value font-heading font-bold text-xl text-destructive">
                        {stat.value}
                      </span>
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="stat-bar h-full bg-gradient-to-r from-destructive to-warning rounded-full origin-left"
                        style={{ width: `${60 + index * 15}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Problems List */}
          <div className="order-1 lg:order-2 space-y-5 problem-cards" style={{ perspective: "1000px" }}>
            {problems.map((problem, index) => (
              <div
                key={index}
                className="problem-card bg-card rounded-2xl p-5 shadow-sm border border-border flex gap-4 items-start hover:shadow-md hover:border-destructive/30 transition-all"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="problem-icon w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <problem.icon className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                    {problem.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{problem.description}</p>
                </div>
              </div>
            ))}

            <div className="solution-card bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-5 border border-primary/20">
              <p className="text-foreground font-medium text-sm">
                <span className="text-primary font-bold">GreenQuest</span> solves this by turning 
                sustainability into a fun, rewarding game that keeps you motivated and informed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;