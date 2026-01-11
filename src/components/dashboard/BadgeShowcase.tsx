import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Award, Sparkles, ChevronRight, Trophy, Leaf, Flame, Zap, Droplet, Recycle, Bike } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import InfoTooltip from '@/components/ui/info-tooltip';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  is_rare: boolean;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

interface BadgeShowcaseProps {
  userId: string;
}

const tierColors: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-500'
};

const iconMap: Record<string, React.ReactNode> = {
  leaf: <Leaf className="w-6 h-6" />,
  sprout: <Leaf className="w-6 h-6" />,
  flame: <Flame className="w-6 h-6" />,
  zap: <Zap className="w-6 h-6" />,
  droplet: <Droplet className="w-6 h-6" />,
  recycle: <Recycle className="w-6 h-6" />,
  bike: <Bike className="w-6 h-6" />,
  award: <Award className="w-6 h-6" />,
  crown: <Trophy className="w-6 h-6" />
};

const BadgeShowcase = ({ userId }: BadgeShowcaseProps) => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const showcaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const { data } = await supabase
          .from('user_badges')
          .select(`
            badge_id,
            earned_at,
            badges (
              id,
              name,
              description,
              icon,
              tier,
              is_rare
            )
          `)
          .eq('user_id', userId)
          .order('earned_at', { ascending: false })
          .limit(6);

        setBadges((data as any) || []);
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  useEffect(() => {
    if (!showcaseRef.current || loading) return;

    const ctx = gsap.context(() => {
      // Animate badge items
      gsap.from('.badge-item', {
        scale: 0,
        rotation: -180,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      });

      // Glow effect on rare badges
      document.querySelectorAll('.rare-badge').forEach((el) => {
        gsap.to(el, {
          boxShadow: '0 0 25px rgba(168, 85, 247, 0.6)',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
      });
    }, showcaseRef);

    return () => ctx.revert();
  }, [loading, badges]);

  return (
    <Card className="p-6" ref={showcaseRef}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold">Recent Badges</h3>
          <InfoTooltip content="Your recently earned badges. Collect more by completing quests, maintaining streaks, and earning points!" />
        </div>
        <Link to="/badges">
          <Button variant="ghost" size="sm" className="group">
            View All
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : badges.length === 0 ? (
        <div className="text-center py-8">
          <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No badges earned yet</p>
          <p className="text-sm text-muted-foreground">Complete quests to earn your first badge!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {badges.map((userBadge) => {
            const badge = userBadge.badges;
            return (
              <div
                key={userBadge.badge_id}
                className={`badge-item relative flex flex-col items-center p-3 rounded-xl bg-gradient-to-br from-background to-muted border hover:scale-110 transition-transform cursor-pointer ${
                  badge.is_rare ? 'rare-badge ring-2 ring-purple-500/50' : ''
                }`}
              >
                {badge.is_rare && (
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-purple-500" />
                )}
                
                <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br ${tierColors[badge.tier]} mb-2`}>
                  <span className="text-white">
                    {iconMap[badge.icon] || <Award className="w-6 h-6" />}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-center line-clamp-1">{badge.name}</p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default BadgeShowcase;
