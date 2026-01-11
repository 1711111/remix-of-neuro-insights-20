import { useEffect, useRef, useState } from "react";
import { Target, Coins, Gift, ChevronLeft, ChevronRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const HowItWorksSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const slidesRef = useRef<HTMLDivElement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = [
    {
      icon: Target,
      step: "01",
      title: "Complete Eco-Friendly Challenges",
      description: "Choose from daily challenges like recycling correctly, saving energy, using public transport, or reducing water usage.",
      color: "bg-primary",
      gradient: "from-primary to-primary/70",
    },
    {
      icon: Coins,
      step: "02",
      title: "Earn GreenQuest Points",
      description: "Every completed challenge earns you points. Track your progress and compete with friends on leaderboards.",
      color: "bg-secondary",
      gradient: "from-secondary to-secondary/70",
    },
    {
      icon: Gift,
      step: "03",
      title: "Redeem Amazing Rewards",
      description: "Exchange your points for vouchers, discounts, eco-products, or donate to environmental causes.",
      color: "bg-success",
      gradient: "from-success to-success/70",
    },
  ];

  const goToSlide = (index: number) => {
    if (index < 0) index = steps.length - 1;
    if (index >= steps.length) index = 0;
    
    const currentSlide = slidesRef.current[activeIndex];
    const nextSlide = slidesRef.current[index];
    
    // Animate out current slide
    gsap.to(currentSlide, {
      opacity: 0,
      scale: 0.8,
      rotateY: -45,
      duration: 0.5,
      ease: "power3.inOut",
    });

    // Animate in next slide
    gsap.fromTo(
      nextSlide,
      { opacity: 0, scale: 0.8, rotateY: 45 },
      {
        opacity: 1,
        scale: 1,
        rotateY: 0,
        duration: 0.5,
        ease: "power3.out",
        delay: 0.2,
      }
    );

    setActiveIndex(index);
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".hiw-header",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".hiw-header",
            start: "top 85%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Carousel container animation
      gsap.fromTo(
        ".carousel-container",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".carousel-container",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Initialize first slide
      slidesRef.current.forEach((slide, i) => {
        if (i === 0) {
          gsap.set(slide, { opacity: 1, scale: 1, rotateY: 0 });
        } else {
          gsap.set(slide, { opacity: 0, scale: 0.8, rotateY: 45 });
        }
      });

      // Navigation dots animation
      gsap.fromTo(
        ".nav-dot",
        { scale: 0 },
        {
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(2)",
          scrollTrigger: {
            trigger: ".carousel-nav",
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      goToSlide(activeIndex + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  return (
    <section ref={sectionRef} id="how-it-works" className="py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="hiw-header text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Simple & Fun</span>
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mt-2 mb-4">
            How GreenQuest Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start making a difference in just three easy steps
          </p>
        </div>

        {/* Carousel */}
        <div className="carousel-container relative max-w-4xl mx-auto" style={{ perspective: "1200px" }}>
          <div ref={carouselRef} className="relative h-[400px] md:h-[350px]">
            {steps.map((item, index) => (
              <div
                key={index}
                ref={(el) => {
                  if (el) slidesRef.current[index] = el;
                }}
                className="absolute inset-0 flex items-center justify-center"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className={`w-full max-w-2xl bg-gradient-to-br ${item.gradient} rounded-3xl p-8 md:p-12 shadow-2xl`}>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
                        <item.icon className="w-12 h-12 md:w-16 md:h-16 text-primary-foreground" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="text-center md:text-left">
                      <span className="inline-block px-4 py-1 bg-background/20 rounded-full text-primary-foreground font-bold text-sm mb-4">
                        Step {item.step}
                      </span>
                      <h3 className="font-heading font-bold text-2xl md:text-3xl text-primary-foreground mb-4">
                        {item.title}
                      </h3>
                      <p className="text-primary-foreground/90 text-lg">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={() => goToSlide(activeIndex - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 z-10"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => goToSlide(activeIndex + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all hover:scale-110 z-10"
            aria-label="Next step"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="carousel-nav flex justify-center gap-3 mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`nav-dot w-3 h-3 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
