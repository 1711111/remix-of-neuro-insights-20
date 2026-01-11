import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Trophy, Medal, Crown, Star, TrendingUp, Calendar, Clock, CalendarDays, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InfoTooltip from "@/components/ui/info-tooltip";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  points: number;
  current_streak: number;
  quests_completed: number;
}

type TimeFrame = "daily" | "weekly" | "monthly";

const PRIZES = {
  daily: { first: 100, second: 50, third: 25 },
  weekly: { first: 500, second: 300, third: 250 },
  monthly: { first: 2000, second: 1000, third: 500 },
};

const Leaderboards = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("weekly");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFrame]);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      let end: Date;
      
      if (timeFrame === "daily") {
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
      } else if (timeFrame === "weekly") {
        end = new Date(now);
        const daysUntilSunday = 7 - now.getDay();
        end.setDate(end.getDate() + daysUntilSunday);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      
      const diff = end.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown("Ending soon...");
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setCountdown(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setCountdown(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timeFrame]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    
    // Use the database function for proper timeframe filtering
    const { data, error } = await supabase.rpc("get_leaderboard", {
      _timeframe: timeFrame
    });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      // Fallback to direct query if function fails
      await fetchFallbackLeaderboard();
      return;
    }

    if (!data || data.length === 0) {
      setLeaderboard([]);
      setIsLoading(false);
      return;
    }

    setLeaderboard(data);
    setIsLoading(false);
  };

  const fetchFallbackLeaderboard = async () => {
    // Fallback: fetch from user_stats directly
    const { data, error } = await supabase
      .from("user_stats")
      .select(`
        user_id,
        total_points,
        current_streak,
        quests_completed
      `)
      .order("total_points", { ascending: false })
      .limit(10);

    if (error || !data) {
      setLeaderboard([]);
      setIsLoading(false);
      return;
    }

    const userIds = data.map(d => d.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

    const leaderboardData: LeaderboardEntry[] = data.map((entry, index) => ({
      user_id: entry.user_id,
      display_name: profileMap.get(entry.user_id) || `Eco Warrior ${index + 1}`,
      points: entry.total_points,
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

      if (listRef.current) {
        const items = listRef.current.querySelectorAll(".leaderboard-item");
        gsap.fromTo(
          items,
          { x: -50, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.05,
            delay: 0.8,
            ease: "power3.out",
          }
        );
      }

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
  }, [leaderboard, timeFrame]);

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
        return <Crown className="w-10 h-10 text-yellow-400" />;
      case 1:
        return <Medal className="w-9 h-9 text-gray-300" />;
      case 2:
        return <Medal className="w-8 h-8 text-orange-500" />;
      default:
        return null;
    }
  };

  const getPrize = (position: number) => {
    const prizes = PRIZES[timeFrame];
    switch (position) {
      case 0: return prizes.first;
      case 1: return prizes.second;
      case 2: return prizes.third;
      default: return 0;
    }
  };

  const getTimeFrameLabel = () => {
    switch (timeFrame) {
      case "daily": return "Today";
      case "weekly": return "This Week";
      case "monthly": return "This Month";
    }
  };

  const getTimeFrameIcon = () => {
    switch (timeFrame) {
      case "daily": return <Clock className="w-4 h-4" />;
      case "weekly": return <Calendar className="w-4 h-4" />;
      case "monthly": return <CalendarDays className="w-4 h-4" />;
    }
  };

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <Navbar />
      
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">Leaderboards</h1>
              <InfoTooltip content="Compete with other eco-warriors! Rankings show current available points (lifetime earnings minus spent). Top 3 win prizes each period!" />
            </div>
            <p className="text-muted-foreground">Compete with eco-warriors and win prizes!</p>
          </div>

          {/* Time Frame Tabs */}
          <Tabs value={timeFrame} onValueChange={(v) => setTimeFrame(v as TimeFrame)} className="mb-8">
            <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto h-auto p-1">
              <TabsTrigger value="daily" className="flex items-center justify-center gap-1.5 py-2.5 text-sm">
                <Clock className="w-4 h-4" />
                <span>Daily</span>
              </TabsTrigger>
              <TabsTrigger value="weekly" className="flex items-center justify-center gap-1.5 py-2.5 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Weekly</span>
              </TabsTrigger>
              <TabsTrigger value="monthly" className="flex items-center justify-center gap-1.5 py-2.5 text-sm">
                <CalendarDays className="w-4 h-4" />
                <span>Monthly</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Countdown Timer */}
          <Card className="mb-6 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 border-orange-500/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-center gap-3">
                <Timer className="w-5 h-5 text-orange-500 animate-pulse" />
                <span className="text-sm font-medium text-muted-foreground">Prizes awarded in:</span>
                <span className="text-xl font-bold text-orange-500 font-mono">{countdown}</span>
              </div>
            </CardContent>
          </Card>

          {/* Prizes Banner */}
          <Card className="mb-8 bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 border-primary/20">
            <CardContent className="py-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                  {getTimeFrameIcon()}
                  {getTimeFrameLabel()} Prizes
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-400/20 flex items-center justify-center">
                    <Medal className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-muted-foreground">2nd Place</p>
                  <p className="text-xl font-bold text-primary">+{PRIZES[timeFrame].second}</p>
                </div>
                <div className="order-first md:order-none">
                  <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Crown className="w-7 h-7 text-yellow-400" />
                  </div>
                  <p className="text-sm text-muted-foreground">1st Place</p>
                  <p className="text-2xl font-bold text-yellow-500">+{PRIZES[timeFrame].first}</p>
                </div>
                <div>
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Medal className="w-6 h-6 text-orange-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">3rd Place</p>
                  <p className="text-xl font-bold text-primary">+{PRIZES[timeFrame].third}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                {getTimeFrameLabel()} Rankings
                <span className="ml-auto text-xs font-normal text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Top 10
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="h-64 bg-muted/50 rounded-lg animate-pulse" />
              ) : (
                <>
                  {/* Podium - Top 3 (or fewer if not enough users) */}
                  {topThree.length > 0 && (
                    <div ref={podiumRef} className="flex items-end justify-center gap-4 mb-8">
                      {topThree.map((entry, index) => (
                        <div
                          key={entry.user_id}
                          className={`podium-item flex flex-col items-center p-4 sm:p-6 rounded-2xl border-2 ${getPodiumStyles(index)} ${
                            index === 0 ? "min-h-[200px]" : index === 1 ? "min-h-[170px]" : "min-h-[150px]"
                          }`}
                          style={{ minWidth: index === 0 ? "160px" : "140px" }}
                        >
                          <div className="podium-icon mb-3">
                            {getPositionIcon(index)}
                          </div>
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${
                            index === 0 ? "from-yellow-400 to-amber-500" :
                            index === 1 ? "from-gray-300 to-slate-400" :
                            "from-orange-500 to-amber-600"
                          } flex items-center justify-center text-xl font-bold text-white mb-3`}>
                            {entry.display_name.charAt(0).toUpperCase()}
                          </div>
                          <p className="font-semibold text-sm text-center text-foreground truncate max-w-full">
                            {entry.display_name}
                          </p>
                          <p
                            className="points-counter text-2xl font-bold text-primary mt-2"
                            data-target={entry.points}
                          >
                            0
                          </p>
                          <p className="text-xs text-muted-foreground">points</p>
                          <div className="mt-3 flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-yellow-500 font-semibold">+{getPrize(index)}</span>
                          </div>
                          {entry.user_id === user?.id && (
                            <Badge className="mt-2 bg-primary/20 text-primary border-primary/50">
                              You
                            </Badge>
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
                          className={`leaderboard-item flex items-center gap-3 p-4 rounded-xl transition-colors ${
                            entry.user_id === user?.id
                              ? "bg-primary/10 border border-primary/30"
                              : "bg-muted/30 hover:bg-muted/50"
                          }`}
                        >
                          <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
                            {index + 4}
                          </span>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-sm font-bold text-white">
                            {entry.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {entry.display_name}
                              {entry.user_id === user?.id && (
                                <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {entry.quests_completed} quests • {entry.current_streak} 🔥 streak
                            </p>
                          </div>
                          <span className="text-lg font-bold text-primary">
                            {entry.points.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {leaderboard.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="text-lg">No entries yet</p>
                      <p className="text-sm">Complete quests to join the leaderboard!</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Leaderboards;
