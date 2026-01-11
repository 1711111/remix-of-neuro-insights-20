import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Zap, Recycle, Car, Trash2, TreeDeciduous, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/AuthModal";

interface Quest {
  title: string;
  description: string;
  points: number;
  category: string;
  difficulty: string;
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

// Pre-loaded quests that are always available
const preloadedQuests: Quest[] = [
  {
    title: "Plastic-Free Day Challenge",
    description: "Go an entire day without using any single-use plastics.",
    points: 50,
    category: "waste",
    difficulty: "medium",
  },
  {
    title: "Plant a Tree or Seedling",
    description: "Plant a tree, shrub, or seedling in your yard or community garden.",
    points: 75,
    category: "nature",
    difficulty: "easy",
  },
  {
    title: "Energy Detective",
    description: "Find and unplug 5 devices using phantom energy when not in use.",
    points: 40,
    category: "energy",
    difficulty: "easy",
  },
  {
    title: "Bike or Walk Commute",
    description: "Replace one car trip with biking or walking today.",
    points: 60,
    category: "transport",
    difficulty: "medium",
  },
  {
    title: "Recycling Audit",
    description: "Sort through your recyclables and ensure proper categorization.",
    points: 45,
    category: "recycling",
    difficulty: "easy",
  },
];

const MyQuestsSection = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuestClick = () => {
    if (user) {
      navigate("/quests");
    } else {
      setAuthModalOpen(true);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-green-50/30 dark:to-green-950/10">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-4">
            <Sparkles className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Daily Eco Challenges</span>
          </div>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-3">
            My Quests
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Complete eco-friendly quests to earn points and make a real impact on the environment
          </p>
        </div>

        {/* Quest List */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 dark:from-green-900/20 dark:via-emerald-900/10 dark:to-teal-900/20 rounded-3xl border-2 border-green-500/30 dark:border-green-600/30 p-4 sm:p-6">
            {/* Quest Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-lg text-foreground">Available Quests</h3>
                <p className="text-sm text-muted-foreground">Choose a quest to start your eco-journey</p>
              </div>
            </div>

            {/* Quest Items */}
            <div className="space-y-3">
              {preloadedQuests.map((quest, index) => {
                const Icon = categoryIcons[quest.category] || Leaf;
                const isHovered = hoveredIndex === index;
                
                return (
                  <div
                    key={index}
                    className={`relative bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border/50 cursor-pointer transition-all duration-300 ${
                      isHovered ? "border-green-500/50 shadow-lg shadow-green-500/10 scale-[1.02]" : "hover:border-green-500/30"
                    }`}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={handleQuestClick}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isHovered 
                          ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                          : "bg-green-500/10 dark:bg-green-500/20"
                      }`}>
                        <Icon className={`w-5 h-5 transition-colors duration-300 ${
                          isHovered ? "text-white" : "text-green-600 dark:text-green-400"
                        }`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1">
                            {quest.title}
                          </h4>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColors[quest.difficulty]}`}>
                            {quest.difficulty}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs sm:text-sm line-clamp-1 mb-1">
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

                      {/* Arrow */}
                      <div className={`flex-shrink-0 transition-all duration-300 ${
                        isHovered ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                      }`}>
                        <ChevronRight className="w-5 h-5 text-green-500" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* View All Button */}
            <div className="mt-6 text-center">
              <Button 
                onClick={handleQuestClick}
                className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8"
              >
                {user ? "View All Quests" : "Sign Up to Start Quests"}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </section>
  );
};

export default MyQuestsSection;
