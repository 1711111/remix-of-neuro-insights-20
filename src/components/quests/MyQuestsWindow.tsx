import { useState, useEffect, useCallback } from "react";
import { Leaf, Zap, Recycle, Car, Trash2, TreeDeciduous, ChevronRight, Sparkles, Loader2, X, Check, Camera, Play, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Quest } from "@/pages/Quests";
import InfoTooltip from "@/components/ui/info-tooltip";

interface MyQuestsWindowProps {
  className?: string;
  onSelectQuest: (quest: Quest) => void;
}

const categoryIcons: Record<string, typeof Leaf> = {
  recycling: Recycle,
  energy: Zap,
  transport: Car,
  waste: Trash2,
  nature: TreeDeciduous,
};

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Pre-loaded quests pool
const allQuestsPool: Quest[] = [
  {
    title: "Plastic-Free Day Challenge",
    description: "Go an entire day without using any single-use plastics. Bring your own bags, bottles, and containers.",
    points: 75,
    category: "waste",
    verification_hint: "Take a photo of your reusable items you used today",
    difficulty: "medium",
  },
  {
    title: "Plant a Tree or Seedling",
    description: "Plant a tree, shrub, or seedling in your yard, community garden, or local park.",
    points: 45,
    category: "nature",
    verification_hint: "Share a photo of your newly planted tree or seedling",
    difficulty: "easy",
  },
  {
    title: "Energy Detective",
    description: "Find and unplug 5 devices that are using phantom energy when not in use.",
    points: 35,
    category: "energy",
    verification_hint: "Photo of unplugged devices or power strips turned off",
    difficulty: "easy",
  },
  {
    title: "Bike or Walk Commute",
    description: "Replace one car trip with biking or walking today. Track your distance!",
    points: 85,
    category: "transport",
    verification_hint: "Screenshot of your walking/biking route or distance tracker",
    difficulty: "medium",
  },
  {
    title: "Recycling Audit",
    description: "Sort through your recyclables and ensure everything is properly cleaned and categorized.",
    points: 40,
    category: "recycling",
    verification_hint: "Photo of your sorted recycling bins",
    difficulty: "easy",
  },
  {
    title: "Zero Food Waste Meal",
    description: "Prepare a meal using only leftover ingredients or items that would otherwise be thrown away.",
    points: 90,
    category: "waste",
    verification_hint: "Photo of your creative zero-waste meal",
    difficulty: "medium",
  },
  {
    title: "Community Clean-up Leader",
    description: "Organize or join a community clean-up event. Spend at least 2 hours cleaning a public space.",
    points: 150,
    category: "nature",
    verification_hint: "Photo of the clean-up event with collected waste",
    difficulty: "hard",
  },
  {
    title: "Cold Water Laundry",
    description: "Do a load of laundry using only cold water to save energy.",
    points: 30,
    category: "energy",
    verification_hint: "Photo of your washing machine set to cold water",
    difficulty: "easy",
  },
  {
    title: "Week-Long Sustainability Challenge",
    description: "Commit to 7 days of tracking and minimizing your carbon footprint across all activities.",
    points: 180,
    category: "energy",
    verification_hint: "Screenshots of your daily carbon tracking over 7 days",
    difficulty: "hard",
  },
  {
    title: "Public Transit Champion",
    description: "Use only public transportation for all your trips for an entire day.",
    points: 65,
    category: "transport",
    verification_hint: "Photo of your transit tickets or route map",
    difficulty: "medium",
  },
  {
    title: "Meatless Monday",
    description: "Eat only plant-based meals for an entire day to reduce your carbon footprint.",
    points: 50,
    category: "waste",
    verification_hint: "Photo of your plant-based meals",
    difficulty: "easy",
  },
  {
    title: "DIY Cleaning Products",
    description: "Make your own eco-friendly cleaning solution using natural ingredients.",
    points: 55,
    category: "waste",
    verification_hint: "Photo of your homemade cleaning product",
    difficulty: "easy",
  },
  {
    title: "5-Minute Shower Challenge",
    description: "Take only 5-minute showers for a full day to conserve water.",
    points: 40,
    category: "energy",
    verification_hint: "Photo of a timer or your low water bill",
    difficulty: "easy",
  },
  {
    title: "Carpool Champion",
    description: "Organize a carpool with coworkers or friends for your daily commute.",
    points: 80,
    category: "transport",
    verification_hint: "Photo of your carpool group or route",
    difficulty: "medium",
  },
  {
    title: "Composting Starter",
    description: "Start a compost bin and add your first food scraps.",
    points: 70,
    category: "recycling",
    verification_hint: "Photo of your compost bin with scraps",
    difficulty: "medium",
  },
  {
    title: "Light-Free Evening",
    description: "Spend an entire evening using only candles or natural light.",
    points: 45,
    category: "energy",
    verification_hint: "Photo of your candlelit evening",
    difficulty: "easy",
  },
  {
    title: "Upcycle Project",
    description: "Transform an old item into something new and useful instead of throwing it away.",
    points: 100,
    category: "recycling",
    verification_hint: "Before and after photos of your upcycled item",
    difficulty: "medium",
  },
  {
    title: "Nature Walk Observer",
    description: "Take a 30-minute walk in nature and identify 5 different plant or animal species.",
    points: 35,
    category: "nature",
    verification_hint: "Photos of the species you identified",
    difficulty: "easy",
  },
  {
    title: "Repair Don't Replace",
    description: "Fix something broken instead of buying new. Could be clothes, electronics, or furniture.",
    points: 95,
    category: "waste",
    verification_hint: "Before and after photos of your repair",
    difficulty: "medium",
  },
  {
    title: "Local Farmer's Market",
    description: "Buy your groceries from a local farmer's market to reduce transport emissions.",
    points: 60,
    category: "transport",
    verification_hint: "Photo of your local produce haul",
    difficulty: "medium",
  },
];

const MAX_ACTIVE_QUESTS = 5;
const MAX_AI_GENERATIONS_PER_DAY = 3;

const MyQuestsWindow = ({ className, onSelectQuest }: MyQuestsWindowProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeHoveredIndex, setActiveHoveredIndex] = useState<number | null>(null);
  const [completedTitles, setCompletedTitles] = useState<Set<string>>(new Set());
  const [availableQuests, setAvailableQuests] = useState<Quest[]>([]);
  const [activeQuests, setActiveQuests] = useState<Quest[]>([]);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGenerationsToday, setAiGenerationsToday] = useState(0);
  const [generatedQuest, setGeneratedQuest] = useState<Quest | null>(null);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [isAddingQuest, setIsAddingQuest] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch completed quests and active quests
  const fetchData = useCallback(async () => {
    if (!user) {
      setAvailableQuests(allQuestsPool.slice(0, 10));
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // Fetch user's team
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    setUserTeamId(membership?.team_id || null);

    // Fetch completed quests
    const { data: completed } = await supabase
      .from("completed_quests")
      .select("quest_title")
      .eq("user_id", user.id);

    const completedSet = new Set(completed?.map((q) => q.quest_title) || []);
    setCompletedTitles(completedSet);

    // Fetch active quests
    const { data: active } = await supabase
      .from("user_active_quests")
      .select("*")
      .eq("user_id", user.id);

    if (active) {
      setActiveQuests(active.map(q => ({
        title: q.title,
        description: q.description,
        points: q.points,
        category: q.category,
        verification_hint: q.verification_hint || "",
        difficulty: q.difficulty,
        is_team_quest: q.is_team_quest || false,
        team_id: q.team_id || undefined,
      })));
    }

    // Fetch AI generations today
    const today = new Date().toISOString().split("T")[0];
    const { data: generations } = await supabase
      .from("ai_quest_generations")
      .select("count")
      .eq("user_id", user.id)
      .eq("generation_date", today)
      .maybeSingle();

    setAiGenerationsToday(generations?.count || 0);

    // Filter available quests (exclude completed and active)
    const activeTitles = new Set(active?.map(q => q.title) || []);
    const uncompleted = allQuestsPool.filter(
      (q) => !completedSet.has(q.title) && !activeTitles.has(q.title)
    );
    setAvailableQuests(uncompleted.slice(0, 10));
    setLoadingData(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addQuestToActive = async (quest: Quest) => {
    if (!user) {
      toast.error("Please sign in to add quests");
      return;
    }

    // Prevent race conditions
    if (isAddingQuest) {
      toast.error("Please wait...");
      return;
    }

    // Check current count from database
    const { data: currentActive, error: countError } = await supabase
      .from("user_active_quests")
      .select("id")
      .eq("user_id", user.id);

    if (countError) {
      console.error("Error checking active quests:", countError);
      toast.error("Failed to check active quests");
      return;
    }

    if ((currentActive?.length || 0) >= MAX_ACTIVE_QUESTS) {
      toast.error(`You can only have ${MAX_ACTIVE_QUESTS} active quests at a time`);
      return;
    }

    // Check if already active
    const existingQuest = currentActive?.find(q => activeQuests.find(aq => aq.title === quest.title));
    if (existingQuest || activeQuests.find(q => q.title === quest.title)) {
      toast.error("This quest is already in your active quests");
      return;
    }

    setIsAddingQuest(true);

    // 2/5 probability (40%) of being a team quest if user is in a team
    const isTeamQuest = userTeamId ? Math.random() < 0.4 : false;

    const { error } = await supabase.from("user_active_quests").insert({
      user_id: user.id,
      title: quest.title,
      description: quest.description,
      points: quest.points,
      category: quest.category,
      verification_hint: quest.verification_hint,
      difficulty: quest.difficulty,
      is_ai_generated: false,
      is_team_quest: isTeamQuest,
      team_id: isTeamQuest ? userTeamId : null,
    });

    if (error) {
      console.error("Error adding quest:", error);
      if (error.code === "23505") {
        toast.error("This quest is already in your active quests");
      } else {
        toast.error("Failed to add quest");
      }
      setIsAddingQuest(false);
      return;
    }

    const newQuest = { ...quest, is_team_quest: isTeamQuest, team_id: isTeamQuest ? userTeamId! : undefined };
    setActiveQuests(prev => [...prev, newQuest]);
    setAvailableQuests(prev => prev.filter(q => q.title !== quest.title));
    toast.success(isTeamQuest ? "Team quest added! Points will go to your team! 🎯" : "Quest added to your active quests!");
    setIsAddingQuest(false);
  };

  const generateAIQuest = async () => {
    if (!user) {
      toast.error("Please sign in to generate quests");
      return;
    }

    if (aiGenerationsToday >= MAX_AI_GENERATIONS_PER_DAY) {
      toast.error(`You can only generate ${MAX_AI_GENERATIONS_PER_DAY} AI quests per day`);
      return;
    }

    // Check current count from database before generating
    const { data: currentActive } = await supabase
      .from("user_active_quests")
      .select("id")
      .eq("user_id", user.id);

    if ((currentActive?.length || 0) >= MAX_ACTIVE_QUESTS) {
      toast.error(`You can only have ${MAX_ACTIVE_QUESTS} active quests at a time`);
      return;
    }

    setGeneratingAI(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-quest", {
        body: { count: 1 },
      });

      if (error) throw error;

      const quest = data?.quests?.[0];
      if (!quest) throw new Error("No quest generated");

      setGeneratedQuest({
        title: quest.title,
        description: quest.description,
        points: quest.points,
        category: quest.category,
        verification_hint: quest.verification_hint,
        difficulty: quest.difficulty,
      });
      setShowAIDialog(true);
    } catch (error) {
      console.error("Error generating quest:", error);
      toast.error("Failed to generate quest");
    } finally {
      setGeneratingAI(false);
    }
  };

  const acceptGeneratedQuest = async () => {
    if (!user || !generatedQuest || isAddingQuest) return;

    // Re-check current count from database
    const { data: currentActive } = await supabase
      .from("user_active_quests")
      .select("id")
      .eq("user_id", user.id);

    if ((currentActive?.length || 0) >= MAX_ACTIVE_QUESTS) {
      toast.error(`You can only have ${MAX_ACTIVE_QUESTS} active quests at a time`);
      setShowAIDialog(false);
      setGeneratedQuest(null);
      return;
    }

    setIsAddingQuest(true);

    // 2/5 probability (40%) of being a team quest if user is in a team
    const isTeamQuest = userTeamId ? Math.random() < 0.4 : false;

    // Add to active quests
    const { error } = await supabase.from("user_active_quests").insert({
      user_id: user.id,
      title: generatedQuest.title,
      description: generatedQuest.description,
      points: generatedQuest.points,
      category: generatedQuest.category,
      verification_hint: generatedQuest.verification_hint,
      difficulty: generatedQuest.difficulty,
      is_ai_generated: true,
      is_team_quest: isTeamQuest,
      team_id: isTeamQuest ? userTeamId : null,
    });

    if (error) {
      console.error("Error adding AI quest:", error);
      toast.error("Failed to add quest");
      setIsAddingQuest(false);
      return;
    }

    // Update AI generations count
    const today = new Date().toISOString().split("T")[0];
    await supabase.from("ai_quest_generations").upsert(
      {
        user_id: user.id,
        generation_date: today,
        count: aiGenerationsToday + 1,
      },
      { onConflict: "user_id,generation_date" }
    );

    const newQuest = { ...generatedQuest, is_team_quest: isTeamQuest, team_id: isTeamQuest ? userTeamId! : undefined };
    setActiveQuests(prev => [...prev, newQuest]);
    setAiGenerationsToday(prev => prev + 1);
    setShowAIDialog(false);
    setGeneratedQuest(null);
    setIsAddingQuest(false);
    toast.success(isTeamQuest ? "Team AI quest added! Points will go to your team! 🎯" : "AI quest added to your active quests!");
  };

  const cancelGeneratedQuest = () => {
    setShowAIDialog(false);
    setGeneratedQuest(null);
  };

  const startActiveQuest = (quest: Quest) => {
    onSelectQuest(quest);
  };

  const canGenerateAI = aiGenerationsToday < MAX_AI_GENERATIONS_PER_DAY && activeQuests.length < MAX_ACTIVE_QUESTS;

  if (loadingData) {
    return (
      <div className={`${className} bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-teal-900/20 rounded-3xl border-2 border-green-500/30 dark:border-green-600/30 p-6`}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} space-y-6`}>
      {/* Active Quests Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-emerald-500/10 dark:from-primary/20 dark:via-primary/10 dark:to-emerald-900/20 rounded-3xl border-2 border-primary/30 dark:border-primary/40 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-foreground flex items-center gap-2">
              Active Quests
              <InfoTooltip content="Your currently active quests. Click on a quest to start completing it! Team quests give points to your team." />
            </h2>
            <p className="text-sm text-muted-foreground">Click to complete • {activeQuests.length}/{MAX_ACTIVE_QUESTS} slots used</p>
          </div>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {activeQuests.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground bg-card/50 rounded-2xl">
              <Play className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No active quests</p>
              <p className="text-sm">Add quests from the list below to get started!</p>
            </div>
          ) : (
            activeQuests.map((quest, index) => {
              const Icon = categoryIcons[quest.category] || Leaf;
              const isHovered = activeHoveredIndex === index;
              
              return (
                <div
                  key={quest.title}
                  className={`relative bg-card/90 backdrop-blur-sm rounded-2xl p-4 border-2 cursor-pointer transition-all duration-300 ${
                    isHovered 
                      ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                      : "border-primary/30 hover:border-primary/50"
                  }`}
                  onMouseEnter={() => setActiveHoveredIndex(index)}
                  onMouseLeave={() => setActiveHoveredIndex(null)}
                  onClick={() => startActiveQuest(quest)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isHovered 
                        ? "bg-gradient-to-br from-primary to-emerald-600" 
                        : "bg-primary/20"
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${
                        isHovered ? "text-white" : "text-primary"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">
                          {quest.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColors[quest.difficulty]}`}>
                            {quest.difficulty}
                          </span>
                          {quest.is_team_quest && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Team
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1 mb-2">
                        {quest.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {quest.category}
                        </span>
                        <span className="font-bold text-primary text-sm">
                          +{quest.points} pts {quest.is_team_quest && "(team)"}
                        </span>
                      </div>
                    </div>

                    <div className={`flex-shrink-0 transition-all duration-300 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}>
                      <div className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                        Start
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Available Quests Section */}
      <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-teal-900/20 rounded-3xl border-2 border-green-500/30 dark:border-green-600/30 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-foreground">Available Quests</h2>
              <p className="text-sm text-muted-foreground">Click to add to active quests</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
          {availableQuests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Leaf className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">All quests added or completed!</p>
              <p className="text-sm">Generate an AI quest for new challenges.</p>
            </div>
          ) : (
            availableQuests.map((quest, index) => {
              const Icon = categoryIcons[quest.category] || Leaf;
              const isHovered = hoveredIndex === index;
              const isMaxReached = activeQuests.length >= MAX_ACTIVE_QUESTS;
              
              return (
                <div
                  key={quest.title}
                  className={`relative bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 cursor-pointer transition-all duration-300 ${
                    isHovered ? "border-green-500/50 shadow-lg shadow-green-500/10 scale-[1.02]" : "hover:border-green-500/30"
                  } ${isMaxReached || isAddingQuest ? "opacity-60 cursor-not-allowed" : ""}`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => !isMaxReached && !isAddingQuest && addQuestToActive(quest)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      isHovered 
                        ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                        : "bg-green-500/10 dark:bg-green-500/20"
                    }`}>
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${
                        isHovered ? "text-white" : "text-green-600 dark:text-green-400"
                      }`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">
                          {quest.title}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColors[quest.difficulty]}`}>
                          {quest.difficulty}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2 mb-2">
                        {quest.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          {quest.category}
                        </span>
                        <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                          +{quest.points} pts
                        </span>
                      </div>
                    </div>

                    <div className={`flex-shrink-0 transition-all duration-300 ${
                      isHovered && !isMaxReached ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                    }`}>
                      <ChevronRight className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Generate Button */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button
            onClick={generateAIQuest}
            disabled={!canGenerateAI || generatingAI || isAddingQuest}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {generatingAI ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate AI Quest ({MAX_AI_GENERATIONS_PER_DAY - aiGenerationsToday} left today)
              </>
            )}
          </Button>
          {activeQuests.length >= MAX_ACTIVE_QUESTS && (
            <p className="text-xs text-center text-amber-600 dark:text-amber-400 mt-2">
              Complete a quest to add more
            </p>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {availableQuests.length > 0 
            ? `${allQuestsPool.length - completedTitles.size - activeQuests.length} quests available`
            : ""}
        </p>
      </div>

      {/* AI Quest Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              AI Generated Quest
            </DialogTitle>
            <DialogDescription>
              Review this quest and decide whether to add it to your active quests.
            </DialogDescription>
          </DialogHeader>

          {generatedQuest && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-accent/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{generatedQuest.title}</h4>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${difficultyColors[generatedQuest.difficulty]}`}>
                    {generatedQuest.difficulty}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {generatedQuest.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground uppercase tracking-wider text-xs">
                    {generatedQuest.category}
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    +{generatedQuest.points} pts
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={cancelGeneratedQuest}
                  disabled={isAddingQuest}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={acceptGeneratedQuest}
                  disabled={isAddingQuest}
                >
                  {isAddingQuest ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Accept
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyQuestsWindow;