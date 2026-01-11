import { useEffect, useRef } from "react";
import { Recycle, Wind, Users, TrendingUp } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ImpactSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const impacts = [
    {
      icon: Recycle,
      value: "45%",
      label: "Increase in Recycling",
      description: "Users report significantly improved recycling habits",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Wind,
      value: "2.5M",
      label: "kg CO₂ Reduced",
      description: "Collective carbon footprint reduction by our community",
      color: "from-sky-500 to-blue-500",
    },
    {
      icon: Users,
      value: "89%",
      label: "User Engagement",
      description: "Of users complete at least one challenge daily",
      color: "from-violet-500 to-purple-500",
    },
    {
      icon: TrendingUp,
      value: "3x",
      label: "Habit Formation",
      description: "Faster eco-habit development compared to traditional methods",
      color: "from-amber-500 to-orange-500",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation with split text effect
      gsap.fromTo(
        ".impact-header",
        { y: 80, opacity: 0, filter: "blur(10px)" },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".impact-header",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Stats cards with 3D flip and elastic bounce
      gsap.fromTo(
        ".impact-card",
        { 
          rotateY: -90, 
          rotateX: 15,
          opacity: 0, 
          y: 100,
          scale: 0.5,
          transformOrigin: "center center"
        },
        {
          rotateY: 0,
          rotateX: 0,
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
          stagger: {
            each: 0.15,
            from: "start"
          },
          scrollTrigger: {
            trigger: ".impact-stats",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Icon pop animation
      gsap.fromTo(
        ".impact-icon",
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(3)",
          stagger: 0.15,
          delay: 0.3,
          scrollTrigger: {
            trigger: ".impact-stats",
            start: "top 75%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Continuous glow pulse on icons - using scale instead of boxShadow for better performance
      gsap.to(".impact-icon-glow", {
        scale: 1.05,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2,
      });

      // Floating particles in background
      gsap.utils.toArray(".impact-particle").forEach((particle: any, i) => {
        gsap.to(particle, {
          y: gsap.utils.random(-40, 40),
          x: gsap.utils.random(-30, 30),
          rotation: gsap.utils.random(-30, 30),
          opacity: gsap.utils.random(0.2, 0.8),
          duration: gsap.utils.random(3, 6),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        });
      });

      // Counter animation for values with spring effect
      const counterElements = sectionRef.current?.querySelectorAll(".impact-value");
      counterElements?.forEach((counter) => {
        const target = counter.textContent || "0";
        const isPercentage = target.includes("%");
        const hasM = target.includes("M");
        const hasX = target.includes("x");
        let numericValue = parseFloat(target.replace(/[^0-9.]/g, ""));
        
        const obj = { value: 0 };
        
        gsap.to(obj, {
          value: numericValue,
          duration: 2.5,
          ease: "power2.out",
          scrollTrigger: {
            trigger: counter,
            start: "top 90%",
            toggleActions: "play none none none",
          },
          onUpdate: () => {
            let displayValue = obj.value.toFixed(hasM ? 1 : 0);
            if (isPercentage) displayValue += "%";
            if (hasM) displayValue += "M";
            if (hasX) displayValue += "x";
            counter.textContent = displayValue;
          },
        });
      });

    }, sectionRef);

    // Magnetic hover effect for cards
    const handleMouseMove = (e: MouseEvent, card: HTMLElement) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      gsap.to(card, {
        rotateY: x / 15,
        rotateX: -y / 15,
        duration: 0.3,
        ease: "power2.out",
      });

      // Move the glow effect
      const glow = card.querySelector('.card-glow') as HTMLElement;
      if (glow) {
        gsap.to(glow, {
          x: x / 3,
          y: y / 3,
          duration: 0.3,
        });
      }
    };

    const handleMouseLeave = (card: HTMLElement) => {
      gsap.to(card, {
        rotateY: 0,
        rotateX: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.5)",
      });

      const glow = card.querySelector('.card-glow') as HTMLElement;
      if (glow) {
        gsap.to(glow, { x: 0, y: 0, duration: 0.5 });
      }
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
    <section ref={sectionRef} id="impact" className="py-20 relative overflow-hidden">
      {/* Background particles - reduced count for performance */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="impact-particle absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i * 10)}%`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="impact-header text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Making a Difference
          </span>
          <h2 className="font-heading font-bold text-3xl md:text-5xl text-foreground mt-2 mb-4">
            Our Collective Impact
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Together, GreenQuest users are creating measurable positive change for our planet.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="impact-stats grid sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: "1200px" }}>
          {impacts.map((impact, index) => (
            <div
              key={index}
              ref={(el) => (cardsRef.current[index] = el)}
              className="impact-card relative bg-card rounded-3xl p-6 border border-border text-center group cursor-pointer"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Animated glow background */}
              <div className="card-glow absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              
              {/* Glowing border on hover */}
              <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-primary/50 transition-all duration-500 group-hover:shadow-[0_0_30px_-5px_hsla(var(--primary),0.5)]" />

              <div className="relative z-10">
                <div 
                  className={`impact-icon impact-icon-glow w-16 h-16 rounded-2xl bg-gradient-to-br ${impact.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <impact.icon className="w-8 h-8 text-white" />
                </div>
                <p className="impact-value font-heading font-bold text-4xl bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent mb-2">
                  {impact.value}
                </p>
                <p className="font-semibold text-foreground mb-2 text-lg">{impact.label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{impact.description}</p>
              </div>

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;