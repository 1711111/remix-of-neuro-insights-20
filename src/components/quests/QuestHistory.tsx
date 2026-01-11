import { useEffect, useState } from "react";
import { History, Leaf, Zap, Recycle, Car, Trash2, TreeDeciduous } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import InfoTooltip from "@/components/ui/info-tooltip";

interface CompletedQuest {
  id: string;
  quest_title: string;
  quest_category: string;
  points_earned: number;
  completed_at: string;
}

interface QuestHistoryProps {
  userId: string;
}

const categoryIcons: Record<string, typeof Leaf> = {
  recycling: Recycle,
  energy: Zap,
  transport: Car,
  waste: Trash2,
  nature: TreeDeciduous,
};

const QuestHistory = ({ userId }: QuestHistoryProps) => {
  const [history, setHistory] = useState<CompletedQuest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from("completed_quests")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching quest history:", error);
    } else {
      setHistory(data || []);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-3xl border border-border p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-card rounded-3xl border border-border p-6 text-center">
        <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-heading font-semibold text-foreground mb-1">
          No quests completed yet
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete your first quest to start building your history!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl border border-border p-6">
      <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
        <History className="w-5 h-5 text-muted-foreground" />
        Recent Quests
        <InfoTooltip content="Your last 10 completed quests. Each completed quest adds to your streak and earns you points!" className="ml-1" />
      </h3>
      
      <div className="space-y-3">
        {history.map((quest) => {
          const Icon = categoryIcons[quest.quest_category] || Leaf;
          const date = new Date(quest.completed_at);
          const formattedDate = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return (
            <div
              key={quest.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">
                  {quest.quest_title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formattedDate} • {quest.quest_category}
                </p>
              </div>
              <span className="text-sm font-semibold text-success">
                +{quest.points_earned}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuestHistory;