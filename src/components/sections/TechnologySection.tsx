import { useEffect, useRef } from "react";
import { Brain, Shield, MessageSquare, Zap, Sparkles, Cpu, Network, BarChart3 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const TechnologySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: Brain,
      title: "Personalized Challenges",
      description: "AI learns your habits and suggests challenges that fit your lifestyle and goals.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Shield,
      title: "Action Verification",
      description: "Smart verification ensures challenges are completed genuinely.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: MessageSquare,
      title: "Simple Explanations",
      description: "Understand your environmental impact in easy-to-grasp language.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "Real-Time Insights",
      description: "Get instant feedback on your eco-actions and carbon footprint.",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: Cpu,
      title: "Smart Automation",
      description: "Automated tracking and reward distribution powered by AI.",
      gradient: "from-red-500 to-rose-500",
    },
    {
      icon: Network,
      title: "Connected Ecosystem",
      description: "Seamlessly integrates with your daily apps and routines.",
      gradient: "from-indigo-500 to-violet-500",
    },
  ];

  useEffect(() => {
    if (!sectionRef.current || !carouselRef.current) return;

    const ctx = gsap.context(() => {
      // Animate floating SVG elements
      gsap.to(".floating-circle", {
        y: -20,
        duration: 3,
        ease: "power1.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.5,
          from: "random",
        },
      });

      gsap.to(".floating-hex", {
        rotation: 360,
        duration: 20,
        ease: "none",
        repeat: -1,
      });

      gsap.to(".pulse-ring", {
        scale: 1.5,
        opacity: 0,
        duration: 2,
        ease: "power2.out",
        repeat: -1,
        stagger: 0.4,
      });

      // Header animation
      gsap.fromTo(
        ".tech-header-new",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".tech-header-new",
            start: "top 85%",
          },
        }
      );

      // Horizontal scroll carousel on scroll
      const carousel = carouselRef.current;
      if (carousel) {
        const totalScroll = carousel.scrollWidth - carousel.clientWidth;
        
        gsap.to(carousel, {
          scrollLeft: totalScroll,
          ease: "none",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 20%",
            end: "bottom 80%",
            scrub: 1,
          },
        });
      }

      // Feature cards stagger in
      gsap.fromTo(
        ".tech-card",
        { y: 80, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          stagger: 0.1,
          scrollTrigger: {
            trigger: ".tech-carousel",
            start: "top 80%",
          },
        }
      );

      // Icon spin on scroll
      gsap.to(".tech-card-icon", {
        rotateY: 360,
        duration: 1,
        ease: "power2.inOut",
        stagger: 0.1,
        scrollTrigger: {
          trigger: ".tech-carousel",
          start: "top 70%",
          toggleActions: "play none none reverse",
        },
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      ref={sectionRef} 
      id="technology" 
      className="py-20 bg-card relative overflow-hidden"
    >
      {/* Animated SVG Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating circles */}
        <svg className="absolute top-10 left-10 w-32 h-32 floating-circle opacity-20" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary/50" />
        </svg>
        
        <svg className="absolute top-1/4 right-20 w-24 h-24 floating-circle opacity-20" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500" />
        </svg>

        <svg className="absolute bottom-20 left-1/4 w-40 h-40 floating-circle opacity-15" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-500" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-400" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" className="text-blue-300" />
        </svg>

        {/* Rotating hexagon */}
        <svg className="absolute top-1/2 right-10 w-48 h-48 floating-hex opacity-10" viewBox="0 0 100 100">
          <polygon 
            points="50,5 90,25 90,75 50,95 10,75 10,25" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1" 
            className="text-primary"
          />
        </svg>

        {/* Pulse rings */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2">
          <div className="pulse-ring absolute w-20 h-20 rounded-full border-2 border-primary/30" />
          <div className="pulse-ring absolute w-20 h-20 rounded-full border-2 border-primary/30" style={{ animationDelay: "0.5s" }} />
          <div className="pulse-ring absolute w-20 h-20 rounded-full border-2 border-primary/30" style={{ animationDelay: "1s" }} />
        </div>

        {/* Neural network lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 1000 600">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="1" className="text-primary" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-primary" />
            </linearGradient>
          </defs>
          <path d="M0,300 Q250,100 500,300 T1000,300" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
          <path d="M0,400 Q250,200 500,400 T1000,400" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
          <path d="M0,200 Q250,400 500,200 T1000,200" fill="none" stroke="url(#lineGrad)" strokeWidth="2" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="tech-header-new text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Powered by AI</span>
          </div>
          <h2 className="font-bold text-3xl md:text-5xl mb-4">
            Smart Technology for{" "}
            <span className="bg-gradient-to-r from-primary via-green-400 to-emerald-500 bg-clip-text text-transparent">
              Real Impact
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            GreenQuest uses the Gemini API to create a personalized, trustworthy, 
            and educational sustainability experience.
          </p>
        </div>

        {/* Horizontal Scroll Carousel */}
        <div 
          ref={carouselRef}
          className="tech-carousel flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="tech-card flex-shrink-0 w-72 md:w-80 snap-center"
            >
              <div className="h-full p-6 rounded-2xl bg-background border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 group">
                {/* Icon */}
                <div 
                  className={`tech-card-icon w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>

                {/* Decorative line */}
                <div className={`h-1 w-0 group-hover:w-full bg-gradient-to-r ${feature.gradient} rounded-full mt-4 transition-all duration-500`} />
              </div>
            </div>
          ))}

          {/* CTA Card */}
          <div className="tech-card flex-shrink-0 w-72 md:w-80 snap-center">
            <div className="h-full p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-green-500/20 border border-primary/30 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-12 h-12 text-primary mb-4" />
              <h3 className="font-bold text-lg mb-2">See Your Impact</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Track your progress with our real-time dashboard.
              </p>
              <a 
                href="/dashboard" 
                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                View Dashboard
              </a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-1 bg-primary/30 rounded-full overflow-hidden">
              <div className="w-1/3 h-full bg-primary rounded-full animate-pulse" />
            </div>
            <span>Scroll to explore</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TechnologySection;
