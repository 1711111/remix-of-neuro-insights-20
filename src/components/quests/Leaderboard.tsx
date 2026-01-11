import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Trophy, Medal, Crown, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InfoTooltip from "@/components/ui/info-tooltip";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_points: number;
  current_streak: number;
  quests_completed: number;
}

interface LeaderboardProps {
  className?: string;
}

const Leaderboard = ({ className }: LeaderboardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    
    // Fetch user_stats joined with profiles for display names
    // Only include users with points > 0 to show meaningful data
    const { data, error } = await supabase
      .from("user_stats")
      .select(`
        user_id,
        total_points,
        current_streak,
        quests_completed
      `)
      .gt("total_points", 0)
      .order("total_points", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      setIsLoading(false);
      return;
    }

    if (!data || data.length === 0) {
      setLeaderboard([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles for display names
    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

    const leaderboardData: LeaderboardEntry[] = data.map((entry, index) => ({
      user_id: entry.user_id,
      display_name: profileMap.get(entry.user_id) || `Eco Warrior ${index + 1}`,
      total_points: entry.total_points,
      current_streak: entry.current_streak,
      quests_completed: entry.quests_completed,
    }));

    setLeaderboard(leaderboardData);
    setIsLoading(false);
  };

  // GSAP animations
  useEffect(() => {
    if (!containerRef.current || leaderboard.length === 0) return;

    const ctx = gsap.context(() => {
      // Podium entrance animation
      if (podiumRef.current) {
        const podiumItems = podiumRef.current.querySelectorAll(".podium-item");
        
        gsap.fromTo(
          podiumItems,
          { y: 100, opacity: 0, scale: 0.8 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "back.out(1.7)",
          }
        );

        // Crown/medal bounce animation
        const icons = podiumRef.current.querySelectorAll(".podium-icon");
        gsap.fromTo(
          icons,
          { y: -20, scale: 0 },
          {
            y: 0,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            delay: 0.5,
            ease: "elastic.out(1, 0.5)",
          }
        );

        // Continuous glow animation for first place
        const firstPlace = podiumRef.current.querySelector(".first-place");
        if (firstPlace) {
          gsap.to(firstPlace, {
            boxShadow: "0 0 60px hsla(48, 100%, 50%, 0.4)",
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          });
        }
      }

      // List items stagger animation
      if (listRef.current) {
        const items = listRef.current.querySelectorAll(".leaderboard-item");
        gsap.fromTo(
          items,
          { x: -50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.8,
            ease: "power3.out",
          }
        );
      }

      // Points counter animation
      const counters = containerRef.current?.querySelectorAll(".points-counter");
      counters?.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-target") || "0");
        gsap.fromTo(
          counter,
          { innerText: 0 },
          {
            innerText: target,
            duration: 1.5,
            delay: 0.3,
            ease: "power2.out",
            snap: { innerText: 1 },
            onUpdate: function () {
              counter.textContent = Math.round(parseFloat(counter.textContent || "0")).toLocaleString();
            },
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, [leaderboard]);

  const getPodiumStyles = (position: number) => {
    switch (position) {
      case 0:
        return "first-place order-2 bg-gradient-to-br from-yellow-400/20 via-amber-500/20 to-orange-500/20 border-yellow-500/50 scale-110";
      case 1:
        return "order-1 bg-gradient-to-br from-gray-300/20 via-slate-400/20 to-gray-500/20 border-gray-400/50";
      case 2:
        return "order-3 bg-gradient-to-br from-orange-600/20 via-amber-700/20 to-yellow-800/20 border-orange-600/50";
      default:
        return "";
    }
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case 1:
        return <Medal className="w-7 h-7 text-gray-300" />;
      case 2:
        return <Medal className="w-6 h-6 text-orange-500" />;
      default:
        return null;
    }
  };

  const getWeeklyBonus = (position: number) => {
    switch (position) {
      case 0:
        return 500;
      case 1:
        return 300;
      case 2:
        return 250;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <Card className={`${className} animate-pulse`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted/50 rounded-lg"></div>
        </CardContent>
      </Card>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <Card ref={containerRef} className={`${className} overflow-hidden`}>
      <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          Weekly Leaderboard
          <InfoTooltip content="Rankings based on current available points (lifetime points minus spent). Top 3 earn weekly bonus points!" className="ml-1" />
          <span className="ml-auto text-xs font-normal text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Top 10
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {/* Podium - Top 3 */}
        {topThree.length >= 3 && (
          <div ref={podiumRef} className="flex items-end justify-center gap-4 mb-8">
            {topThree.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`podium-item flex flex-col items-center p-4 rounded-2xl border-2 ${getPodiumStyles(index)} ${
                  index === 0 ? "min-h-[180px]" : index === 1 ? "min-h-[150px]" : "min-h-[130px]"
                }`}
                style={{ minWidth: index === 0 ? "140px" : "120px" }}
              >
                <div className="podium-icon mb-2">
                  {getPositionIcon(index)}
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                  index === 0 ? "from-yellow-400 to-amber-500" :
                  index === 1 ? "from-gray-300 to-slate-400" :
                  "from-orange-500 to-amber-600"
                } flex items-center justify-center text-lg font-bold text-white mb-2`}>
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>
                <p className="font-semibold text-sm text-center text-foreground truncate max-w-full">
                  {entry.display_name}
                </p>
                <p
                  className="points-counter text-lg font-bold text-primary mt-1"
                  data-target={entry.total_points}
                >
                  0
                </p>
                <p className="text-xs text-muted-foreground">points</p>
                <div className="mt-2 flex items-center gap-1 text-xs">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-yellow-500 font-medium">+{getWeeklyBonus(index)} weekly</span>
                </div>
                {entry.user_id === user?.id && (
                  <span className="mt-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rest of leaderboard */}
        {rest.length > 0 && (
          <div ref={listRef} className="space-y-2">
            {rest.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`leaderboard-item flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  entry.user_id === user?.id
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {index + 4}
                </span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-sm font-bold text-white">
                  {entry.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {entry.display_name}
                    {entry.user_id === user?.id && (
                      <span className="ml-2 text-xs text-primary">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.quests_completed} quests • {entry.current_streak} 🔥 streak
                  </p>
                </div>
                <span className="font-bold text-primary">
                  {entry.total_points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {leaderboard.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No entries yet. Complete quests to join the leaderboard!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
