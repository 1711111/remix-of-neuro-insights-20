import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Leaf, Droplet, Zap, TreeDeciduous, Recycle, TrendingUp, Award, Target, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';
import StreakCalendar from '@/components/dashboard/StreakCalendar';
import BadgeShowcase from '@/components/dashboard/BadgeShowcase';
import LevelProgress from '@/components/dashboard/LevelProgress';
import ImpactMeters from '@/components/dashboard/ImpactMeters';
import TeamsWidget from '@/components/dashboard/TeamsWidget';
import InfoTooltip from '@/components/ui/info-tooltip';

gsap.registerPlugin(ScrollTrigger);

interface ImpactStats {
  co2_saved_kg: number;
  plastic_avoided_kg: number;
  water_saved_liters: number;
  trees_equivalent: number;
  energy_saved_kwh: number;
}

interface UserLevel {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  title: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [impactStats, setImpactStats] = useState<ImpactStats | null>(null);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch or create impact stats
        let { data: impact } = await supabase
          .from('impact_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!impact) {
          const { data: newImpact } = await supabase
            .from('impact_stats')
            .insert({ user_id: user.id })
            .select()
            .single();
          impact = newImpact;
        }
        setImpactStats(impact);

        // Fetch or create user level
        let { data: level } = await supabase
          .from('user_levels')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!level) {
          const { data: newLevel } = await supabase
            .from('user_levels')
            .insert({ user_id: user.id })
            .select()
            .single();
          level = newLevel;
        }
        setUserLevel(level);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!dashboardRef.current || loading) return;

    const ctx = gsap.context(() => {
      // Header animation with 3D effect
      gsap.fromTo('.dashboard-header', 
        { y: -80, opacity: 0, rotateX: 15 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1,
          ease: 'power4.out'
        }
      );

      // Header icon pulse
      gsap.to('.header-icon', {
        scale: 1.1,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Stats cards with 3D flip entrance
      gsap.fromTo('.stat-card', 
        { 
          rotateY: -90, 
          opacity: 0,
          transformPerspective: 1000
        },
        {
          rotateY: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.12,
          ease: 'back.out(1.4)',
          scrollTrigger: {
            trigger: '.stats-grid',
            start: 'top 85%'
          }
        }
      );

      // Stat card icons bounce
      gsap.fromTo('.stat-icon', 
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.3,
          ease: 'elastic.out(1, 0.5)'
        }
      );

      // Stat values count up effect
      gsap.fromTo('.stat-value', 
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.4,
          ease: 'power2.out'
        }
      );

      // Impact meters section slide in
      gsap.fromTo('.impact-section', 
        { x: -120, opacity: 0, rotateY: 10 },
        {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.impact-section',
            start: 'top 80%'
          }
        }
      );

      // Calendar section elastic entrance
      gsap.fromTo('.calendar-section', 
        { scale: 0.7, opacity: 0, rotation: -5 },
        {
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.6)',
          scrollTrigger: {
            trigger: '.calendar-section',
            start: 'top 80%'
          }
        }
      );

      // Badge showcase dramatic entrance
      gsap.fromTo('.badge-section', 
        { y: 100, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: '.badge-section',
            start: 'top 85%'
          }
        }
      );

      // Floating particles animation
      gsap.utils.toArray('.floating-particle').forEach((particle: any, i) => {
        gsap.to(particle, {
          y: gsap.utils.random(-20, 20),
          x: gsap.utils.random(-15, 15),
          opacity: gsap.utils.random(0.3, 0.8),
          duration: gsap.utils.random(2, 4),
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: i * 0.2
        });
      });

    }, dashboardRef);

    return () => ctx.revert();
  }, [loading]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Leaf className="w-20 h-20 mx-auto mb-6 text-primary animate-pulse" />
          <h1 className="text-4xl font-bold mb-4">Impact Dashboard</h1>
          <p className="text-muted-foreground mb-8">Sign in to track your environmental impact</p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-semibold hover:scale-105 transition-transform"
          >
            Sign In to View Dashboard
          </button>
        </div>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
        <Footer />
      </div>
    );
  }

  const statCards = [
    {
      icon: Leaf,
      value: impactStats?.co2_saved_kg?.toFixed(1) || '0',
      label: 'kg CO₂ Saved',
      gradient: 'from-green-500/20 to-green-600/10',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-500'
    },
    {
      icon: Droplet,
      value: impactStats?.water_saved_liters?.toFixed(0) || '0',
      label: 'Liters Saved',
      gradient: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-500'
    },
    {
      icon: Zap,
      value: impactStats?.energy_saved_kwh?.toFixed(1) || '0',
      label: 'kWh Saved',
      gradient: 'from-yellow-500/20 to-yellow-600/10',
      borderColor: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      iconColor: 'text-yellow-500'
    },
    {
      icon: TreeDeciduous,
      value: impactStats?.trees_equivalent?.toFixed(1) || '0',
      label: 'Trees Equiv.',
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-500'
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden" ref={dashboardRef}>
      <Navbar />
      
      {/* Floating particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="floating-particle absolute w-2 h-2 rounded-full bg-primary/20"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`
            }}
          />
        ))}
      </div>
      
      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        {/* Header */}
        <div className="dashboard-header mb-8" style={{ perspective: '1000px' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="header-icon p-3 bg-primary/20 rounded-full">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <div className="flex items-start gap-2">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Impact Dashboard</h1>
                <p className="text-muted-foreground">Track your environmental footprint</p>
              </div>
              <InfoTooltip content="Your personal dashboard showing environmental impact stats, level progress, and achievements." className="mt-2" />
            </div>
          </div>
        </div>

        {/* Level Progress */}
        {userLevel && (
          <LevelProgress 
            level={userLevel.level}
            currentXp={userLevel.current_xp}
            xpToNextLevel={userLevel.xp_to_next_level}
            title={userLevel.title}
          />
        )}

        {/* Stats Grid - Fixed alignment */}
        <div className="stats-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8" style={{ perspective: '1000px' }}>
          {statCards.map((stat, index) => (
            <Card 
              key={index}
              className={`stat-card p-4 md:p-5 bg-gradient-to-br ${stat.gradient} ${stat.borderColor} hover:scale-105 transition-transform cursor-pointer`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="flex items-center gap-3">
                <div className={`stat-icon p-2.5 ${stat.iconBg} rounded-xl shrink-0`}>
                  <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="stat-value text-xl md:text-2xl font-bold truncate">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          {/* Impact Meters */}
          <div className="impact-section lg:col-span-3" style={{ perspective: '1000px' }}>
            <ImpactMeters stats={impactStats} />
          </div>

          {/* Streak Calendar */}
          <div className="calendar-section lg:col-span-2">
            <StreakCalendar userId={user.id} />
          </div>
        </div>

        {/* Teams and Badges Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <TeamsWidget />
          </div>
          <div className="badge-section lg:col-span-2">
            <BadgeShowcase userId={user.id} />
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
