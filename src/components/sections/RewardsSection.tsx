import { useEffect, useRef } from "react";
import { Gift, CreditCard, TreePine, Heart, ShoppingBag, Award } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const RewardsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const rewards = [
    {
      icon: CreditCard,
      title: "Discount Vouchers",
      description: "Get discounts at eco-friendly stores and restaurants",
      points: "500 pts",
    },
    {
      icon: ShoppingBag,
      title: "Eco Products",
      description: "Reusable bottles, bags, and sustainable items",
      points: "750 pts",
    },
    {
      icon: Award,
      title: "School Rewards",
      description: "Extra credit, certificates, and recognition",
      points: "1000 pts",
    },
    {
      icon: TreePine,
      title: "Plant a Tree",
      description: "We plant a tree in your name",
      points: "300 pts",
    },
    {
      icon: Heart,
      title: "Donate to Causes",
      description: "Support environmental charities",
      points: "200 pts",
    },
    {
      icon: Gift,
      title: "Gift Cards",
      description: "Popular brand gift cards",
      points: "1500 pts",
    },
  ];

  useEffect(() => {
    let updateOrbits: (() => void) | null = null;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".rewards-header",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".rewards-header",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Reward cards with stagger and scale
      gsap.fromTo(
        ".reward-card",
        { y: 60, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.4)",
          stagger: {
            amount: 0.8,
            grid: [3, 2],
            from: "start",
          },
          scrollTrigger: {
            trigger: ".rewards-grid",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Points badges pop
      gsap.fromTo(
        ".points-badge",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.4,
          ease: "elastic.out(1, 0.5)",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".rewards-grid",
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // SVG Container entrance
      gsap.fromTo(
        ".rewards-svg-container",
        { x: 100, opacity: 0, scale: 0.8 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".rewards-svg-container",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // SVG Animations
      if (svgRef.current) {
        // Gift bounce (subtle)
        gsap.to(".reward-gift", {
          y: -6,
          duration: 1.6,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        // Glow pulse (contained)
        gsap.to(".reward-glow", {
          opacity: 0.6,
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
          { sel: ".reward-orbit-item-1", rx: 130, ry: 38, rot: 0, speed: 0.8, phase: 0.2, depthAxis: "y" as const },
          { sel: ".reward-orbit-item-2", rx: 120, ry: 36, rot: 45, speed: 0.64, phase: 1.4, depthAxis: "y" as const },
          { sel: ".reward-orbit-item-3", rx: 110, ry: 34, rot: -45, speed: -0.72, phase: 2.2, depthAxis: "y" as const },
          { sel: ".reward-orbit-item-4", rx: 38, ry: 130, rot: 0, speed: 0.58, phase: 0.9, depthAxis: "x" as const },
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

    }, sectionRef);

    return () => {
      if (updateOrbits) {
        gsap.ticker.remove(updateOrbits);
      }
      ctx.revert();
    };
  }, []);

  return (
    <section ref={sectionRef} id="rewards" className="py-20 bg-gradient-to-b from-background to-accent/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Rewards Grid */}
          <div>
            <div className="rewards-header">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Exciting Incentives</span>
              <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mt-2 mb-4">
                Rewards That Matter
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Your eco-actions deserve recognition. Redeem your points for rewards 
                that help you and the planet.
              </p>
            </div>

            <div className="rewards-grid grid sm:grid-cols-2 gap-4">
              {rewards.map((reward, index) => (
                <div
                  key={index}
                  className="reward-card bg-card rounded-2xl p-5 border border-border hover:border-primary/50 transition-all hover:shadow-lg group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <reward.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{reward.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{reward.description}</p>
                      <span className="points-badge inline-block mt-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {reward.points}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Visualization */}
          <div className="rewards-svg-container relative p-6">
            <svg
              ref={svgRef}
              viewBox="0 0 400 400"
              className="w-full max-w-md mx-auto overflow-visible"
              style={{ filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.1))" }}
            >
              <defs>
                <radialGradient id="rewardGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="giftGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
                <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
                <linearGradient id="coinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.65" />
                </linearGradient>
              </defs>

              {/* Background glow */}
              <circle className="reward-glow" cx="200" cy="200" r="145" fill="url(#rewardGlow)" />

              {/* Orbit rings */}
              <ellipse cx="200" cy="200" rx="145" ry="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="6 5" />
              <ellipse cx="200" cy="200" rx="135" ry="40" fill="none" stroke="hsl(var(--secondary))" strokeWidth="1" strokeOpacity="0.16" strokeDasharray="5 6" transform="rotate(45 200 200)" />
              <ellipse cx="200" cy="200" rx="125" ry="38" fill="none" stroke="hsl(var(--accent))" strokeWidth="1" strokeOpacity="0.16" strokeDasharray="5 5" transform="rotate(-45 200 200)" />
              <ellipse cx="200" cy="200" rx="42" ry="145" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.12" strokeDasharray="4 7" />

              {/* Center gift */}
              <g className="reward-gift" transform="translate(200 215)">
                {/* box body */}
                <rect x="-55" y="-5" width="110" height="78" rx="8" fill="url(#giftGradient)" />
                {/* lid */}
                <rect x="-65" y="-30" width="130" height="28" rx="7" fill="url(#giftGradient)" />
                <rect x="-65" y="-30" width="130" height="9" rx="3" fill="hsl(var(--primary))" fillOpacity="0.18" />
                {/* vertical ribbon */}
                <rect x="-8" y="-30" width="16" height="103" fill="url(#ribbonGradient)" />
                {/* horizontal ribbon */}
                <rect x="-65" y="-24" width="130" height="16" fill="url(#ribbonGradient)" />
                {/* bow */}
                <ellipse cx="0" cy="-34" rx="22" ry="12" fill="url(#ribbonGradient)" />
                <ellipse cx="0" cy="-34" rx="14" ry="7" fill="hsl(var(--accent))" fillOpacity="0.35" />
                <circle cx="0" cy="-34" r="6" fill="url(#ribbonGradient)" />
              </g>

              {/* Orbit items (animated in JS) */}
              <g className="reward-orbit-item-1" transform="translate(200 200)">
                <ellipse cx="0" cy="0" rx="18" ry="18" fill="url(#coinGradient)" />
                <ellipse cx="0" cy="0" rx="12" ry="12" fill="none" stroke="hsl(var(--accent))" strokeOpacity="0.5" strokeWidth="1.5" />
                <text x="0" y="5" textAnchor="middle" fill="hsl(var(--foreground))" fontSize="14" fontWeight="700">$</text>
              </g>

              <g className="reward-orbit-item-2" transform="translate(200 200)">
                <circle cx="0" cy="0" r="16" fill="hsl(var(--secondary))" fillOpacity="0.16" stroke="hsl(var(--secondary))" strokeOpacity="0.2" />
                <path d="M-6 2 L0 -6 L6 2" stroke="hsl(var(--primary))" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                <path d="M-6 -2 L0 6 L6 -2" stroke="hsl(var(--primary))" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>

              <g className="reward-orbit-item-3" transform="translate(200 200)">
                <circle cx="0" cy="0" r="16" fill="hsl(var(--accent))" fillOpacity="0.14" stroke="hsl(var(--accent))" strokeOpacity="0.2" />
                <polygon points="0,-10 3,-3 10,-3 4,1 6,9 0,5 -6,9 -4,1 -10,-3 -3,-3" fill="hsl(var(--accent))" fillOpacity="0.7" />
              </g>

              <g className="reward-orbit-item-4" transform="translate(200 200)">
                <circle cx="0" cy="0" r="16" fill="hsl(var(--primary))" fillOpacity="0.14" stroke="hsl(var(--primary))" strokeOpacity="0.2" />
                <path d="M0 -6 C-6 2 -7 8 0 11 C7 8 6 2 0 -6" stroke="hsl(var(--secondary))" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              </g>
            </svg>

            {/* Soft glow behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-secondary/10 blur-3xl -z-10 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RewardsSection;
