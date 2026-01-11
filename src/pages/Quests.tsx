import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import QuestHeader from "@/components/quests/QuestHeader";
import StreakPanel from "@/components/quests/StreakPanel";
import QuestCarousel from "@/components/quests/QuestCarousel";
import MyQuestsWindow from "@/components/quests/MyQuestsWindow";
import ActiveQuestPanel from "@/components/quests/ActiveQuestPanel";
import QuestHistory from "@/components/quests/QuestHistory";
import Leaderboard from "@/components/quests/Leaderboard";
import AuthModal from "@/components/AuthModal";
import SurveyModal from "@/components/SurveyModal";
import InfoTooltip from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Quest {
  title: string;
  description: string;
  points: number;
  category: string;
  verification_hint: string;
  difficulty: string;
  challenge_id?: string; // Optional: for tracking challenge completions
  is_team_quest?: boolean; // Optional: whether this quest gives points to the team
  team_id?: string; // Optional: the team this quest is for
}

export interface UserStats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  quests_completed: number;
  last_quest_date: string | null;
  quests_since_last_survey: number;
}

const Quests = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isLoadingQuests, setIsLoadingQuests] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    total_points: 0,
    current_streak: 0,
    longest_streak: 0,
    quests_completed: 0,
    last_quest_date: null,
    quests_since_last_survey: 0,
  });

  // Fetch user stats
  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user stats:", error);
      return;
    }

    if (data) {
      setUserStats({
        total_points: data.total_points,
        current_streak: data.current_streak,
        longest_streak: data.longest_streak,
        quests_completed: data.quests_completed,
        last_quest_date: data.last_quest_date,
        quests_since_last_survey: data.quests_since_last_survey || 0,
      });

      // Check if we should show survey (every 3 quests)
      if (data.quests_since_last_survey >= 3) {
        setTimeout(() => setShowSurveyModal(true), 1000);
      }
    }
  };

  // Generate quests
  const generateQuests = async () => {
    setIsLoadingQuests(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-quest", {
        body: { count: 5 }
      });

      if (error) {
        console.error("Error generating quests:", error);
        toast.error("Failed to generate quests");
        return;
      }

      if (data?.quests) {
        setQuests(data.quests);
        toast.success("New quests available! 🌱");
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to generate quests");
    } finally {
      setIsLoadingQuests(false);
    }
  };

  // Check for pending challenge from ChallengesSection - run once on mount
  useEffect(() => {
    const checkPendingChallenge = () => {
      const pendingChallenge = localStorage.getItem("pendingChallenge");
      if (pendingChallenge) {
        try {
          const challenge = JSON.parse(pendingChallenge) as Quest;
          localStorage.removeItem("pendingChallenge");
          // Set the selected quest immediately
          setSelectedQuest(challenge);
          toast.success(`Challenge loaded: ${challenge.title}`);
        } catch (e) {
          console.error("Error parsing pending challenge:", e);
          localStorage.removeItem("pendingChallenge");
        }
      }
    };
    
    // Check immediately - no delay needed
    checkPendingChallenge();
  }, []);

  // Handle quest completion - update survey counter and remove from active quests
  const handleQuestComplete = async (completedQuest?: Quest) => {
    if (!user) return;

    // Remove from active quests if it exists
    if (completedQuest || selectedQuest) {
      const questToRemove = completedQuest || selectedQuest;
      if (questToRemove) {
        await supabase
          .from("user_active_quests")
          .delete()
          .eq("user_id", user.id)
          .eq("title", questToRemove.title);
      }
    }

    // Increment survey counter
    const { data: stats } = await supabase
      .from("user_stats")
      .select("quests_since_last_survey")
      .eq("user_id", user.id)
      .maybeSingle();

    if (stats) {
      const newCount = (stats.quests_since_last_survey || 0) + 1;
      await supabase
        .from("user_stats")
        .update({ quests_since_last_survey: newCount })
        .eq("user_id", user.id);

      // Check if we should show survey
      if (newCount >= 3) {
        setTimeout(() => setShowSurveyModal(true), 1500);
      }
    }

    await fetchUserStats();
    setSelectedQuest(null);
    // Don't auto-generate - let user choose from MyQuestsWindow or generate AI quest
  };

  // GSAP animations
  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        ".quest-header",
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
      );

      // Stats panel animation
      gsap.fromTo(
        ".stats-panel",
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: "power3.out" }
      );

      // Quest carousel animation
      gsap.fromTo(
        ".quest-carousel",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.4, ease: "power3.out" }
      );
    }, pageRef);

    return () => ctx.revert();
  }, [user]);

  if (!user) {
    return (
      <div ref={pageRef} className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-4">
              Join the Quest!
            </h1>
            <p className="text-muted-foreground mb-8">
              Sign in to start completing eco-friendly challenges and earn rewards.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 rounded-full gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        </div>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </div>
    );
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-6 sm:pb-8 overflow-y-auto">
        {/* Header */}
        <QuestHeader
          className="quest-header mb-6 sm:mb-8"
          onRefresh={generateQuests}
          isLoading={isLoadingQuests}
        />

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Stats, Streak & Leaderboard */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
            <StreakPanel className="stats-panel" stats={userStats} />
            <Leaderboard className="leaderboard-panel" />
          </div>

          {/* Right Column - Quests */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-1 lg:order-2">
            {selectedQuest ? (
              <ActiveQuestPanel
                quest={selectedQuest}
                onComplete={handleQuestComplete}
                onCancel={() => setSelectedQuest(null)}
              />
            ) : (
              <MyQuestsWindow
                className="quest-carousel"
                onSelectQuest={setSelectedQuest}
              />
            )}

            {/* Quest History */}
            <QuestHistory userId={user.id} />
          </div>
        </div>
      </main>

      <Footer />

      {/* Modals */}
      <SurveyModal 
        open={showSurveyModal} 
        onOpenChange={setShowSurveyModal}
        onComplete={() => fetchUserStats()}
      />
    </div>
  );
};

export default Quests;