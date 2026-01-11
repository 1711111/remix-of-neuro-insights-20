import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ChevronLeft, ChevronRight, Loader2, Leaf, Zap, Recycle, Car, Trash2, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Quest } from "@/pages/Quests";

interface QuestCarouselProps {
  className?: string;
  quests: Quest[];
  isLoading: boolean;
  onSelectQuest: (quest: Quest) => void;
}

const categoryIcons: Record<string, typeof Leaf> = {
  recycling: Recycle,
  energy: Zap,
  transport: Car,
  waste: Trash2,
  nature: TreeDeciduous,
};

const categoryColors: Record<string, string> = {
  recycling: "from-green-500 to-emerald-600",
  energy: "from-yellow-500 to-orange-500",
  transport: "from-blue-500 to-cyan-500",
  waste: "from-orange-500 to-red-500",
  nature: "from-emerald-500 to-teal-500",
};

const difficultyColors: Record<string, string> = {
  easy: "bg-success/20 text-success",
  medium: "bg-warning/20 text-warning",
  hard: "bg-destructive/20 text-destructive",
};

const QuestCarousel = ({ className, quests, isLoading, onSelectQuest }: QuestCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = (index: number) => {
    if (quests.length === 0) return;
    
    let newIndex = index;
    if (index < 0) newIndex = quests.length - 1;
    if (index >= quests.length) newIndex = 0;

    // Animate cards
    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      
      const offset = i - newIndex;
      const isActive = i === newIndex;
      
      gsap.to(card, {
        x: offset * 320,
        scale: isActive ? 1 : 0.85,
        opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.5,
        rotateY: offset * -5,
        zIndex: isActive ? 10 : 5 - Math.abs(offset),
        duration: 0.5,
        ease: "power3.out",
      });
    });

    setActiveIndex(newIndex);
  };

  // Initial animation
  useEffect(() => {
    if (quests.length > 0 && cardsRef.current.length > 0) {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        
        const offset = i - activeIndex;
        const isActive = i === activeIndex;
        
        gsap.set(card, {
          x: offset * 320,
          scale: isActive ? 1 : 0.85,
          opacity: Math.abs(offset) > 1 ? 0 : isActive ? 1 : 0.5,
          rotateY: offset * -5,
          zIndex: isActive ? 10 : 5 - Math.abs(offset),
        });
      });

      // Entrance animation
      gsap.fromTo(
        cardsRef.current.filter(Boolean),
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: (i) => (i === activeIndex ? 1 : 0.5),
          duration: 0.6,
          stagger: 0.1,
          ease: "power3.out",
        }
      );
    }
  }, [quests]);

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-20`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating your quests...</p>
        </div>
      </div>
    );
  }

  if (quests.length === 0) {
    return (
      <div className={`${className} bg-card rounded-3xl border border-border p-12 text-center`}>
        <Leaf className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-heading font-bold text-xl text-foreground mb-2">
          No quests available
        </h3>
        <p className="text-muted-foreground">
          Click "New Quests" to generate fresh challenges!
        </p>
      </div>
    );
  }

  const activeQuest = quests[activeIndex];
  const Icon = categoryIcons[activeQuest?.category] || Leaf;

  return (
    <div className={className}>
      <h2 className="font-heading font-bold text-xl text-foreground mb-4">
        Choose Your Quest
      </h2>
      
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="relative h-[320px] overflow-hidden"
        style={{ perspective: "1000px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {quests.map((quest, index) => {
            const QuestIcon = categoryIcons[quest.category] || Leaf;
            const gradientClass = categoryColors[quest.category] || "from-primary to-primary/70";
            
            return (
              <div
                key={index}
                ref={(el) => {
                  if (el) cardsRef.current[index] = el;
                }}
                className="absolute w-[300px] cursor-pointer"
                style={{ transformStyle: "preserve-3d" }}
                onClick={() => {
                  if (index === activeIndex) {
                    onSelectQuest(quest);
                  } else {
                    goToSlide(index);
                  }
                }}
              >
                <div
                  className={`bg-gradient-to-br ${gradientClass} rounded-3xl p-5 shadow-xl h-[280px] flex flex-col overflow-hidden`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                      <QuestIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${difficultyColors[quest.difficulty] || "bg-muted"}`}>
                        {quest.difficulty}
                      </span>
                      <div className="text-white font-bold text-base mt-1">
                        +{quest.points} pts
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <span className="text-white/80 text-xs uppercase tracking-wider block">
                      {quest.category}
                    </span>
                    <h3 className="font-heading font-bold text-lg text-white mt-1 mb-2 line-clamp-2 leading-tight">
                      {quest.title}
                    </h3>
                    <p className="text-white/80 text-sm line-clamp-2 leading-snug">
                      {quest.description}
                    </p>
                  </div>

                  {/* Action */}
                  {index === activeIndex && (
                    <Button
                      className="w-full mt-4 bg-white/20 hover:bg-white/30 text-white border-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectQuest(quest);
                      }}
                    >
                      Start Quest
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <button
          onClick={() => goToSlide(activeIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors z-20"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => goToSlide(activeIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors z-20"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {quests.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "bg-primary w-6"
                : "bg-muted-foreground/30 w-2 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default QuestCarousel;