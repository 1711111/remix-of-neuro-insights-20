import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Leaf, Droplet, Zap, TreeDeciduous, Recycle, Car, Plane, Home, Factory, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import InfoTooltip from '@/components/ui/info-tooltip';

interface ImpactStats {
  co2_saved_kg: number;
  plastic_avoided_kg: number;
  water_saved_liters: number;
  trees_equivalent: number;
  energy_saved_kwh: number;
}

interface ImpactMetersProps {
  stats: ImpactStats | null;
}

const ImpactMeters = ({ stats }: ImpactMetersProps) => {
  const metersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!metersRef.current || !stats) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo('.meters-header',
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );

      // Animate meters filling up with wave effect
      gsap.fromTo('.impact-meter-fill',
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: 'left',
          duration: 1.2,
          stagger: 0.15,
          ease: 'power3.out',
          delay: 0.2
        }
      );

      // Animate icons with bounce
      gsap.fromTo('.meter-icon',
        { scale: 0, rotation: -180 },
        {
          scale: 1,
          rotation: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'elastic.out(1, 0.5)'
        }
      );

      // Animate values counting
      gsap.fromTo('.meter-value',
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.3,
          ease: 'power2.out'
        }
      );

      // Animate equivalents with 3D flip
      gsap.fromTo('.equivalent-card',
        { rotateY: -90, opacity: 0 },
        {
          rotateY: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'back.out(1.4)',
          delay: 0.6
        }
      );

      // Pulse effect on meter bars
      gsap.to('.meter-glow', {
        opacity: 0.6,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: 0.2
      });

    }, metersRef);

    return () => ctx.revert();
  }, [stats]);

  if (!stats) {
    return (
      <Card className="p-6 h-full">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'CO₂ Saved',
      value: stats.co2_saved_kg,
      unit: 'kg',
      icon: Leaf,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-500',
      max: 1000
    },
    {
      label: 'Water Saved',
      value: stats.water_saved_liters,
      unit: 'L',
      icon: Droplet,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-500',
      max: 5000
    },
    {
      label: 'Energy Saved',
      value: stats.energy_saved_kwh,
      unit: 'kWh',
      icon: Zap,
      color: 'from-yellow-500 to-orange-600',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-500',
      max: 500
    },
    {
      label: 'Plastic Avoided',
      value: stats.plastic_avoided_kg,
      unit: 'kg',
      icon: Recycle,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-500/20',
      textColor: 'text-purple-500',
      max: 100
    }
  ];

  // Calculate real-world equivalents
  const equivalents = [
    {
      icon: Car,
      value: ((stats.co2_saved_kg || 0) / 0.21).toFixed(0),
      label: 'km not driven',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      icon: TreeDeciduous,
      value: ((stats.co2_saved_kg || 0) / 21).toFixed(1),
      label: 'trees planted',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Home,
      value: ((stats.energy_saved_kwh || 0) / 30).toFixed(1),
      label: 'days powered',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Factory,
      value: ((stats.plastic_avoided_kg || 0) * 5).toFixed(0),
      label: 'bottles saved',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
    }
  ];

  return (
    <Card className="p-5 md:p-6 h-full" ref={metersRef}>
      <h3 className="meters-header text-lg md:text-xl font-bold mb-5 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-primary" />
        Your Environmental Impact
        <InfoTooltip content="Track your real environmental impact! These metrics are calculated based on the eco-quests you complete." className="ml-1" />
      </h3>

      {/* Impact Meters */}
      <div className="space-y-4 mb-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const percentage = Math.min((metric.value / metric.max) * 100, 100);
          
          return (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`meter-icon p-1.5 md:p-2 rounded-lg ${metric.bgColor} shrink-0`}>
                    <Icon className={`w-4 h-4 ${metric.textColor}`} />
                  </div>
                  <span className="font-medium text-sm md:text-base truncate">{metric.label}</span>
                </div>
                <span className="meter-value font-bold text-sm md:text-base shrink-0">
                  {metric.value?.toFixed(1) || 0} {metric.unit}
                </span>
              </div>
              
              <div className="h-2.5 md:h-3 bg-muted rounded-full overflow-hidden relative">
                <div 
                  className={`impact-meter-fill h-full bg-gradient-to-r ${metric.color} rounded-full relative`}
                  style={{ width: `${percentage}%` }}
                >
                  <div className="meter-glow absolute inset-0 bg-white/30 rounded-full" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-world Equivalents */}
      <div className="border-t border-border pt-5">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Real-World Impact
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3" style={{ perspective: '1000px' }}>
          {equivalents.map((eq, index) => {
            const Icon = eq.icon;
            return (
              <div 
                key={index}
                className={`equivalent-card text-center p-3 ${eq.bgColor} rounded-xl hover:scale-105 transition-transform cursor-pointer`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="flex justify-center mb-1.5">
                  <Icon className={`w-5 h-5 ${eq.color}`} />
                </div>
                <p className="text-lg md:text-xl font-bold">{eq.value}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground leading-tight">{eq.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default ImpactMeters;
