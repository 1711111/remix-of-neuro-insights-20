import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Gift, ShoppingBag, TreeDeciduous, Ticket, Sparkles, Check, Lock, Coins, Star, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import InfoTooltip from '@/components/ui/info-tooltip';

gsap.registerPlugin(ScrollTrigger);

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  category: string;
  partner_name: string | null;
  image_url: string | null;
  stock: number | null;
}

interface UserReward {
  id: string;
  reward_id: string;
  redeemed_at: string;
  status: string;
  redemption_code: string | null;
}

const categoryIcons: Record<string, React.ReactNode> = {
  voucher: <Ticket className="w-6 h-6" />,
  donation: <TreeDeciduous className="w-6 h-6" />,
  product: <ShoppingBag className="w-6 h-6" />,
  experience: <Star className="w-6 h-6" />
};

const categoryColors: Record<string, string> = {
  voucher: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  donation: 'from-green-500/20 to-green-600/10 border-green-500/30',
  product: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  experience: 'from-orange-500/20 to-orange-600/10 border-orange-500/30'
};

const Rewards = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rewards
        const { data: rewardsData } = await supabase
          .from('rewards')
          .select('*')
          .eq('is_active', true)
          .order('points_cost', { ascending: true });
        
        setRewards(rewardsData || []);

        if (user) {
          // Fetch user points
          const { data: stats } = await supabase
            .from('user_stats')
            .select('total_points')
            .eq('user_id', user.id)
            .single();
          
          setUserPoints(stats?.total_points || 0);

          // Fetch user's redeemed rewards
          const { data: redeemed } = await supabase
            .from('user_rewards')
            .select('*')
            .eq('user_id', user.id);
          
          setUserRewards(redeemed || []);
        }
      } catch (error) {
        console.error('Error fetching rewards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Filter and sort rewards
  const filteredRewards = (activeCategory === 'all' 
    ? rewards 
    : rewards.filter(r => r.category === activeCategory)
  ).sort((a, b) => sortOrder === 'asc' ? a.points_cost - b.points_cost : b.points_cost - a.points_cost);

  const categories = ['all', 'voucher', 'donation', 'product', 'experience'];

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Initial page animation - runs only once when loading completes
  const hasAnimated = useRef(false);
  
  useEffect(() => {
    if (!pageRef.current || loading || hasAnimated.current) return;
    
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo('.rewards-header', 
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );

      // Points card animation
      gsap.fromTo('.points-card', 
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)', delay: 0.3 }
      );

      // Category tabs animation
      gsap.fromTo('.category-tab', 
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }
      );

      // Reward cards animation
      gsap.fromTo('.reward-card', 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.4 }
      );
    }, pageRef);

    return () => ctx.revert();
  }, [loading]);

  const handleRedeem = async (reward: Reward) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (userPoints < reward.points_cost) {
      toast.error("Not enough points to redeem this reward");
      return;
    }

    setRedeeming(reward.id);

    try {
      // Generate a random redemption code
      const redemptionCode = `ECO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert user reward
      const { error: rewardError } = await supabase
        .from('user_rewards')
        .insert({
          user_id: user.id,
          reward_id: reward.id,
          redemption_code: redemptionCode
        });

      if (rewardError) throw rewardError;

      // Deduct points
      const { error: pointsError } = await supabase
        .from('user_stats')
        .update({ total_points: userPoints - reward.points_cost })
        .eq('user_id', user.id);

      if (pointsError) throw pointsError;

      // Update local state
      setUserPoints(prev => prev - reward.points_cost);
      setUserRewards(prev => [...prev, {
        id: crypto.randomUUID(),
        reward_id: reward.id,
        redeemed_at: new Date().toISOString(),
        status: 'pending',
        redemption_code: redemptionCode
      }]);

      // Animate success
      gsap.to(`#reward-${reward.id}`, {
        scale: 1.1,
        duration: 0.3,
        yoyo: true,
        repeat: 1,
        ease: 'power2.inOut'
      });

      toast.success(`🎉 Reward redeemed! Code: ${redemptionCode}`);
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error("Failed to redeem reward");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="min-h-screen bg-background" ref={pageRef}>
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="rewards-header text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Gift className="w-10 h-10 text-primary animate-pulse" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-green-400 bg-clip-text text-transparent">
              Reward Marketplace
            </h1>
            <InfoTooltip content="Redeem your earned eco-points for vouchers, donations, products, and exclusive experiences from our sustainability partners." />
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Turn your eco-points into real-world rewards. Support sustainability partners and enjoy exclusive perks!
          </p>
        </div>

        {/* Points Card */}
        <Card className="points-card max-w-md mx-auto mb-8 p-6 bg-gradient-to-br from-primary/20 to-green-500/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/30 rounded-full">
                <Coins className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-3xl font-bold">{userPoints.toLocaleString()}</p>
              </div>
            </div>
            <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
        </Card>

        {/* Category Tabs and Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`category-tab px-6 py-2 rounded-full font-medium transition-all hover:scale-105 ${
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Sort Button */}
          <Button
            variant="outline"
            onClick={toggleSortOrder}
            className="gap-2 rounded-full"
          >
            {sortOrder === 'asc' ? (
              <>
                <ArrowUp className="w-4 h-4" />
                Cheapest First
              </>
            ) : (
              <>
                <ArrowDown className="w-4 h-4" />
                Expensive First
              </>
            )}
          </Button>
        </div>

        {/* Rewards Grid */}
        <div className="rewards-grid grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => {
            const isRedeemed = userRewards.some(ur => ur.reward_id === reward.id);
            const canAfford = userPoints >= reward.points_cost;

            return (
              <Card 
                key={reward.id}
                id={`reward-${reward.id}`}
                className={`reward-card overflow-hidden bg-gradient-to-br ${categoryColors[reward.category]} hover:shadow-xl transition-all duration-300 hover:-translate-y-2`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-background/50`}>
                      {categoryIcons[reward.category]}
                    </div>
                    <Badge variant="secondary" className="font-bold">
                      {reward.points_cost} pts
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{reward.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{reward.description}</p>

                  {reward.partner_name && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Partner: <span className="font-medium text-foreground">{reward.partner_name}</span>
                    </p>
                  )}

                  <Button
                    onClick={() => handleRedeem(reward)}
                    disabled={isRedeemed || redeeming === reward.id || !user}
                    className={`w-full ${
                      isRedeemed 
                        ? 'bg-green-500 hover:bg-green-500' 
                        : !canAfford 
                          ? 'opacity-50' 
                          : ''
                    }`}
                  >
                    {redeeming === reward.id ? (
                      <span className="animate-spin">⏳</span>
                    ) : isRedeemed ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Redeemed
                      </>
                    ) : !canAfford ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Need {reward.points_cost - userPoints} more pts
                      </>
                    ) : (
                      'Redeem Reward'
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredRewards.length === 0 && (
          <div className="text-center py-12">
            <Gift className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No rewards available in this category</p>
          </div>
        )}
      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      <Footer />
    </div>
  );
};

export default Rewards;
