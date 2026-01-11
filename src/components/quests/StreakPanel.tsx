import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Flame, Trophy, Star, Target, Zap } from "lucide-react";
import type { UserStats } from "@/pages/Quests";
import InfoTooltip from "@/components/ui/info-tooltip";

interface StreakPanelProps {
  className?: string;
  stats: UserStats;
}

const streakRewards = [
  { days: 3, reward: "50 Bonus Points", icon: Star },
  { days: 7, reward: "Mystery Badge", icon: Trophy },
  { days: 14, reward: "2x Points Day", icon: Zap },
  { days: 30, reward: "Eco Champion Title", icon: Target },
];

const StreakPanel = ({ className, stats }: StreakPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const flameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flameRef.current) return;

    // Flame pulse animation
    gsap.to(flameRef.current, {
      scale: 1.1,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
    });
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;

    const ctx = gsap.context(() => {
      // Animate stat numbers
      gsap.fromTo(
        ".stat-number",
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "back.out(2)",
        }
      );

      // Animate reward items
      gsap.fromTo(
        ".reward-item",
        { x: -30, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.1,
          delay: 0.3,
          ease: "power2.out",
        }
      );
    }, panelRef);

    return () => ctx.revert();
  }, [stats]);

  return (
    <div ref={panelRef} className={className}>
      {/* Main Stats Card */}
      <div className="bg-card rounded-3xl border border-border p-6 mb-6">
        {/* Streak Display */}
        <div className="text-center mb-6">
          <div
            ref={flameRef}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-3 shadow-lg"
          >
            <Flame className="w-10 h-10 text-white" />
          </div>
          <div className="stat-number">
            <span className="font-heading font-bold text-4xl text-foreground">
              {stats.current_streak}
            </span>
            <span className="text-muted-foreground text-lg ml-1">day streak</span>
          </div>
          {stats.current_streak > 0 && (
            <p className="text-sm text-success mt-1">🔥 Keep it going!</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/50 rounded-2xl p-4 text-center">
            <div className="stat-number font-heading font-bold text-2xl text-primary">
              {stats.total_points.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
          <div className="bg-accent/50 rounded-2xl p-4 text-center">
            <div className="stat-number font-heading font-bold text-2xl text-secondary">
              {stats.quests_completed}
            </div>
            <div className="text-xs text-muted-foreground">Quests Done</div>
          </div>
          <div className="col-span-2 bg-accent/50 rounded-2xl p-4 text-center">
            <div className="stat-number font-heading font-bold text-2xl text-success">
              {stats.longest_streak}
            </div>
            <div className="text-xs text-muted-foreground">Longest Streak</div>
          </div>
        </div>
      </div>

      {/* Streak Rewards */}
      <div className="bg-card rounded-3xl border border-border p-6">
        <h3 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          Streak Rewards
          <InfoTooltip content="Maintain your daily streak to unlock bonus rewards! Complete at least one quest per day to keep your streak going." className="ml-1" />
        </h3>
        <div className="space-y-3">
          {streakRewards.map((item, index) => {
            const isUnlocked = stats.current_streak >= item.days;
            const Icon = item.icon;
            
            return (
              <div
                key={index}
                className={`reward-item flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isUnlocked
                    ? "bg-success/10 border border-success/30"
                    : "bg-muted/50 opacity-60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isUnlocked
                      ? "bg-success text-success-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {item.days} Day Streak
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.reward}
                  </div>
                </div>
                {isUnlocked && (
                  <span className="text-success text-xs font-semibold">
                    ✓ Unlocked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreakPanel;