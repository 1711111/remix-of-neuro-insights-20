import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Star, Zap, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LevelProgressProps {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  title: string;
}

const levelTitles: Record<number, string> = {
  1: 'Eco Beginner',
  2: 'Green Sprout',
  3: 'Nature Friend',
  4: 'Earth Defender',
  5: 'Eco Warrior',
  6: 'Planet Protector',
  7: 'Nature Guardian',
  8: 'Climate Champion',
  9: 'Eco Master',
  10: 'Earth Legend'
};

const LevelProgress = ({ level, currentXp, xpToNextLevel, title }: LevelProgressProps) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const progressPercent = (currentXp / xpToNextLevel) * 100;

  useEffect(() => {
    if (!progressRef.current) return;

    const ctx = gsap.context(() => {
      // Animate the level badge
      gsap.from('.level-badge', {
        scale: 0,
        rotation: -360,
        duration: 1,
        ease: 'elastic.out(1, 0.5)'
      });

      // Animate the XP bar
      gsap.from('.xp-bar', {
        scaleX: 0,
        transformOrigin: 'left',
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.3
      });

      // Animate stars
      gsap.to('.level-star', {
        rotate: 360,
        duration: 3,
        repeat: -1,
        ease: 'linear'
      });

      // Glow pulse
      gsap.to('.level-glow', {
        opacity: 0.3,
        scale: 1.2,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });
    }, progressRef);

    return () => ctx.revert();
  }, []);

  return (
    <Card className="mb-8 p-6 overflow-hidden relative" ref={progressRef}>
      {/* Background glow */}
      <div className="level-glow absolute inset-0 bg-gradient-to-r from-primary/20 via-yellow-500/20 to-primary/20 opacity-20" />
      
      <div className="relative flex items-center gap-6">
        {/* Level Badge */}
        <div className="level-badge relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-yellow-500 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">{level}</span>
          </div>
          <Star className="level-star absolute -top-1 -right-1 w-6 h-6 text-yellow-500 fill-yellow-500" />
        </div>

        {/* Level Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold">{levelTitles[level] || title}</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-muted-foreground">
              {currentXp.toLocaleString()} / {xpToNextLevel.toLocaleString()} XP
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="xp-bar relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-yellow-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
            <div 
              className="absolute inset-y-0 left-0 bg-white/30 rounded-full animate-pulse"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            {xpToNextLevel - currentXp} XP until Level {level + 1}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LevelProgress;
