import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Flame,
  Loader2,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";

gsap.registerPlugin(ScrollTrigger);

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  challenge_type: "daily" | "weekly" | "monthly";
  points: number;
  bonus_multiplier: number;
  verification_hint: string | null;
  difficulty: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface ChallengeCompletion {
  challenge_id: string;
}

const ChallengesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const [countdowns, setCountdowns] = useState<{ daily: string; weekly: string; monthly: string }>({
    daily: "",
    weekly: "",
    monthly: "",
  });

  useEffect(() => {
    fetchChallenges();
    if (user) {
      fetchCompletions();
    }
  }, [user]);

  // Refetch completions periodically to catch when user completes a challenge
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      fetchCompletions();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  // Countdown timer for challenge refresh
  useEffect(() => {
    const calculateCountdowns = () => {
      const now = new Date();
      
      // Daily: resets at midnight
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      // Weekly: resets on Monday
      const nextMonday = new Date(now);
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      nextMonday.setHours(0, 0, 0, 0);
      
      // Monthly: resets on 1st of next month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      
      const formatCountdown = (target: Date) => {
        const diff = target.getTime() - now.getTime();
        if (diff <= 0) return "Refreshing...";
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
      };
      
      setCountdowns({
        daily: formatCountdown(tomorrow),
        weekly: formatCountdown(nextMonday),
        monthly: formatCountdown(nextMonth),
      });
    };
    
    calculateCountdowns();
    const interval = setInterval(calculateCountdowns, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // GSAP Animations
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".challenges-header",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".challenges-header",
            start: "top 85%",
          },
        }
      );

      // Bonus multiplier cards
      gsap.fromTo(
        ".bonus-card",
        { scale: 0.8, opacity: 0, rotateY: -20 },
        {
          scale: 1,
          opacity: 1,
          rotateY: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".bonus-cards",
            start: "top 80%",
          },
        }
      );

      // Floating sparkles
      gsap.to(".floating-sparkle", {
        y: -10,
        rotation: 15,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: 0.2,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Card animations when challenges load
  useEffect(() => {
    if (!cardsRef.current || challenges.length === 0) return;

    const cards = cardsRef.current.querySelectorAll(".challenge-card");
    gsap.fromTo(
      cards,
      { y: 40, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
      }
    );
  }, [challenges, activeTab]);

  // Hover animation
  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    gsap.to(e.currentTarget, {
      scale: enter ? 1.02 : 1,
      y: enter ? -8 : 0,
      boxShadow: enter
        ? "0 25px 50px rgba(0,0,0,0.2)"
        : "0 4px 6px rgba(0,0,0,0.1)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const fetchChallenges = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("points", { ascending: false });

    if (!error && data) {
      setChallenges(data as Challenge[]);
    }
    setLoading(false);
  };

  const fetchCompletions = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("challenge_completions")
      .select("challenge_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setCompletions(new Set(data.map((c) => c.challenge_id)));
    }
  };

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h left`;
    return `${hours}h left`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "hard":
        return "bg-red-500/20 text-red-500 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getChallengeGradient = (type: string) => {
    switch (type) {
      case "daily":
        return "from-blue-500 to-cyan-500";
      case "weekly":
        return "from-purple-500 to-pink-500";
      case "monthly":
        return "from-orange-500 to-red-500";
      default:
        return "from-primary to-secondary";
    }
  };

  const filteredChallenges = challenges.filter((c) => c.challenge_type === activeTab);

  const bonusInfo = [
    { type: "daily", icon: Calendar, bonus: "1.5x", color: "from-blue-500 to-cyan-500", label: "Daily" },
    { type: "weekly", icon: CalendarDays, bonus: "2x", color: "from-purple-500 to-pink-500", label: "Weekly" },
    { type: "monthly", icon: CalendarRange, bonus: "3x", color: "from-orange-500 to-red-500", label: "Monthly" },
  ];

  return (
    <section ref={sectionRef} id="challenges" className="py-20 bg-accent/30 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="challenges-header text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Flame className="w-4 h-4 floating-sparkle" />
            Bonus Challenges
          </span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Daily, Weekly & Monthly <span className="gradient-text">Challenges</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Complete time-limited challenges for bonus points!
          </p>
        </div>

        {/* Bonus Multiplier Cards */}
        <div className="bonus-cards grid md:grid-cols-3 gap-4 mb-10">
          {bonusInfo.map((item) => (
            <div
              key={item.type}
              className={`bonus-card bg-gradient-to-r ${item.color} rounded-2xl p-5 text-white flex items-center gap-4 cursor-pointer`}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
            >
              <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <item.icon className="w-7 h-7 floating-sparkle" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm">{item.label} Challenges</p>
                <p className="font-heading font-bold text-3xl">{item.bonus}</p>
                <div className="flex items-center gap-1.5 text-white/70 text-xs mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Refreshes in {countdowns[item.type as keyof typeof countdowns]}</span>
                </div>
              </div>
              <Sparkles className="w-6 h-6 opacity-60 floating-sparkle flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1.5 rounded-xl h-auto">
            {bonusInfo.map((tab) => (
              <TabsTrigger
                key={tab.type}
                value={tab.type}
                className="rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-md gap-2 transition-all"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {challenges.filter((c) => c.challenge_type === tab.type).length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {["daily", "weekly", "monthly"].map((type) => (
                <TabsContent key={type} value={type}>
                  <div ref={cardsRef}>
                    {filteredChallenges.length === 0 ? (
                      <Card>
                        <CardContent className="py-16 text-center">
                          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                          <h3 className="font-heading font-bold text-xl mb-2">
                            No {type} challenges right now
                          </h3>
                          <p className="text-muted-foreground">
                            Check back later for new challenges!
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredChallenges.map((challenge) => {
                          const isCompleted = completions.has(challenge.id);
                          const gradient = getChallengeGradient(challenge.challenge_type);

                          return (
                            <Card
                              key={challenge.id}
                              className={`challenge-card overflow-hidden transition-all ${
                                isCompleted ? "opacity-60" : ""
                              }`}
                              onMouseEnter={(e) => handleCardHover(e, true)}
                              onMouseLeave={(e) => handleCardHover(e, false)}
                            >
                              {/* Header Gradient */}
                              <div className={`bg-gradient-to-r ${gradient} p-5`}>
                                <div className="flex items-start justify-between">
                                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-white" />
                                  </div>
                                  <Badge className={`${getDifficultyColor(challenge.difficulty)} border`}>
                                    {challenge.difficulty}
                                  </Badge>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                                  <Clock className="w-4 h-4" />
                                  {getTimeRemaining(challenge.ends_at)}
                                </div>
                              </div>

                              <CardContent className="pt-5">
                                <h3 className="font-heading font-bold text-lg mb-2 line-clamp-2">
                                  {challenge.title}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                  {challenge.description}
                                </p>

                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    <span className="font-bold text-primary text-lg">
                                      {Math.round(challenge.points * challenge.bonus_multiplier)} pts
                                    </span>
                                    <span className="text-xs text-muted-foreground line-through">
                                      {challenge.points}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    {challenge.bonus_multiplier}x
                                  </Badge>
                                </div>

                                {isCompleted ? (
                                  <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 rounded-xl text-green-500 font-medium">
                                    <Trophy className="w-5 h-5" />
                                    Completed!
                                  </div>
                                ) : (
                                  <Button
                                    className="w-full rounded-xl gradient-hero"
                                    disabled={isCompleted}
                                    onClick={() => {
                                      if (!user) {
                                        setAuthModalOpen(true);
                                      } else if (isCompleted) {
                                        toast.error("You've already completed this challenge!");
                                      } else {
                                        // Store the challenge as a quest format in localStorage
                                        const questFromChallenge = {
                                          title: challenge.title,
                                          description: challenge.description,
                                          points: Math.round(challenge.points * challenge.bonus_multiplier),
                                          category: challenge.category,
                                          verification_hint: challenge.verification_hint || "Take a photo showing you completed this challenge",
                                          difficulty: challenge.difficulty,
                                          challenge_id: challenge.id,
                                        };
                                        localStorage.setItem("pendingChallenge", JSON.stringify(questFromChallenge));
                                        // Use navigate instead of window.location.href to prevent white screen
                                        navigate("/quests");
                                      }
                                    }}
                                  >
                                    Start Challenge
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </>
          )}
        </Tabs>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </section>
  );
};

export default ChallengesSection;
