import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Award, Lock, Sparkles, Trophy, Star, Flame, Leaf, Droplet, Zap, Bike, Recycle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge as BadgeUI } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import InfoTooltip from '@/components/ui/info-tooltip';

gsap.registerPlugin(ScrollTrigger);

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  is_rare: boolean;
}

interface UserBadge {
  badge_id: string;
  earned_at: string;
}

interface UserStats {
  quests_completed: number;
  current_streak: number;
  total_points: number;
}

const tierColors: Record<string, string> = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-300 to-gray-500',
  gold: 'from-yellow-400 to-yellow-600',
  platinum: 'from-cyan-300 to-cyan-500'
};

const tierBorders: Record<string, string> = {
  bronze: 'border-amber-600/50',
  silver: 'border-gray-400/50',
  gold: 'border-yellow-500/50',
  platinum: 'border-cyan-400/50'
};

const iconMap: Record<string, React.ReactNode> = {
  leaf: <Leaf className="w-8 h-8" />,
  sprout: <Leaf className="w-8 h-8" />,
  'tree-deciduous': <Leaf className="w-8 h-8" />,
  trees: <Leaf className="w-8 h-8" />,
  globe: <Award className="w-8 h-8" />,
  flame: <Flame className="w-8 h-8" />,
  calendar: <Star className="w-8 h-8" />,
  crown: <Trophy className="w-8 h-8" />,
  recycle: <Recycle className="w-8 h-8" />,
  'trash-2': <Recycle className="w-8 h-8" />,
  'package-check': <Recycle className="w-8 h-8" />,
  zap: <Zap className="w-8 h-8" />,
  'battery-charging': <Zap className="w-8 h-8" />,
  droplet: <Droplet className="w-8 h-8" />,
  waves: <Droplet className="w-8 h-8" />,
  bike: <Bike className="w-8 h-8" />,
  'train-front': <Bike className="w-8 h-8" />,
  wind: <Leaf className="w-8 h-8" />,
  award: <Award className="w-8 h-8" />
};

const Badges = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all badges
        const { data: badgesData } = await supabase
          .from('badges')
          .select('*')
          .order('requirement_value', { ascending: true });
        
        setBadges(badgesData || []);

        if (user) {
          // Fetch user's earned badges
          const { data: earned } = await supabase
            .from('user_badges')
            .select('badge_id, earned_at')
            .eq('user_id', user.id);
          
          setUserBadges(earned || []);

          // Fetch user stats for progress
          const { data: stats } = await supabase
            .from('user_stats')
            .select('quests_completed, current_streak, total_points')
            .eq('user_id', user.id)
            .single();
          
          setUserStats(stats);

          // Auto-award badges if user meets requirements
          if (badgesData && stats) {
            const earnedBadgeIds = new Set(earned?.map(e => e.badge_id) || []);
            
            for (const badge of badgesData) {
              if (earnedBadgeIds.has(badge.id)) continue;
              
              let currentValue = 0;
              switch (badge.requirement_type) {
                case 'quests':
                  currentValue = stats.quests_completed;
                  break;
                case 'streak':
                  currentValue = stats.current_streak;
                  break;
                case 'points':
                  currentValue = stats.total_points;
                  break;
              }
              
              if (currentValue >= badge.requirement_value) {
                // Award the badge
                const { error } = await supabase
                  .from('user_badges')
                  .insert({ user_id: user.id, badge_id: badge.id });
                
                if (!error) {
                  setUserBadges(prev => [...prev, { badge_id: badge.id, earned_at: new Date().toISOString() }]);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Animation runs once on load
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    if (!pageRef.current || loading || hasAnimated.current) return;
    
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo('.badges-header', 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      // Stats animation
      gsap.fromTo('.stats-overview', 
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'back.out(1.7)' }
      );

      // Filter tabs
      gsap.fromTo('.filter-tab', 
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' }
      );

      // Badge cards
      gsap.fromTo('.badge-card', 
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.3 }
      );
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  // Animate earned badges with glow (separate effect)
  useEffect(() => {
    if (loading || userBadges.length === 0) return;
    
    const ctx = gsap.context(() => {
      document.querySelectorAll('.badge-earned').forEach((el) => {
        gsap.to(el, {
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'power2.inOut'
        });
      });
    }, pageRef);

    return () => ctx.revert();
  }, [loading, userBadges]);

  const getProgress = (badge: Badge): number => {
    if (!userStats) return 0;
    
    let current = 0;
    switch (badge.requirement_type) {
      case 'quests':
        current = userStats.quests_completed;
        break;
      case 'streak':
        current = userStats.current_streak;
        break;
      case 'points':
        current = userStats.total_points;
        break;
      default:
        return 0;
    }
    
    return Math.min((current / badge.requirement_value) * 100, 100);
  };

  const categories = ['all', 'combined', 'waste', 'energy', 'water', 'transport'];
  
  const filteredBadges = activeFilter === 'all' 
    ? badges 
    : badges.filter(b => b.category === activeFilter);

  const earnedCount = userBadges.length;
  const totalCount = badges.length;

  return (
    <div className="min-h-screen bg-background" ref={pageRef}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="badges-header text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Award className="w-10 h-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-yellow-400 bg-clip-text text-transparent">
              Badge Collection
            </h1>
            <InfoTooltip content="Collect badges by completing eco-quests, maintaining streaks, and earning points. Rare badges offer special rewards!" />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Earn badges by completing eco-quests, maintaining streaks, and making a positive impact!
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-8">
          <Card className="stats-overview p-4 text-center bg-gradient-to-br from-green-500/20 to-green-600/10">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{earnedCount}</p>
            <p className="text-xs text-muted-foreground">Earned</p>
          </Card>
          <Card className="stats-overview p-4 text-center bg-gradient-to-br from-blue-500/20 to-blue-600/10">
            <Award className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="stats-overview p-4 text-center bg-gradient-to-br from-purple-500/20 to-purple-600/10">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{badges.filter(b => b.is_rare).length}</p>
            <p className="text-xs text-muted-foreground">Rare</p>
          </Card>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`filter-tab px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                activeFilter === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="badges-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredBadges.map((badge) => {
            const isEarned = userBadges.some(ub => ub.badge_id === badge.id);
            const progress = getProgress(badge);

            return (
              <Card 
                key={badge.id}
                className={`badge-card relative overflow-hidden p-4 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  isEarned ? `badge-earned ${tierBorders[badge.tier]}` : 'opacity-70 grayscale hover:grayscale-0 hover:opacity-100'
                } ${badge.is_rare ? 'ring-2 ring-purple-500/50' : ''}`}
              >
                {badge.is_rare && (
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  </div>
                )}

                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-gradient-to-br ${tierColors[badge.tier]} ${
                  isEarned ? '' : 'opacity-50'
                }`}>
                  {isEarned ? (
                    <span className="text-white">{iconMap[badge.icon] || <Award className="w-8 h-8" />}</span>
                  ) : (
                    <Lock className="w-8 h-8 text-white/50" />
                  )}
                </div>

                <h3 className="font-bold text-sm mb-1 line-clamp-1">{badge.name}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{badge.description}</p>

                <BadgeUI variant="outline" className={`text-xs mb-2 ${
                  badge.tier === 'platinum' ? 'border-cyan-500 text-cyan-500' :
                  badge.tier === 'gold' ? 'border-yellow-500 text-yellow-500' :
                  badge.tier === 'silver' ? 'border-gray-400 text-gray-400' :
                  'border-amber-600 text-amber-600'
                }`}>
                  {badge.tier}
                </BadgeUI>

                {!isEarned && user && (
                  <div className="mt-2">
                    <Progress value={progress} className="h-1" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(progress)}%</p>
                  </div>
                )}

                <p className="text-xs text-primary font-medium mt-2">+{badge.points_reward} pts</p>
              </Card>
            );
          })}
        </div>

        {!user && (
          <div className="text-center mt-8">
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform"
            >
              Sign In to Track Progress
            </button>
          </div>
        )}
      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <Footer />
    </div>
  );
};

export default Badges;
