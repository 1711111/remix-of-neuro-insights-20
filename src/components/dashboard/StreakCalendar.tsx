import { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';
import { Calendar, Flame, Trophy, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import InfoTooltip from '@/components/ui/info-tooltip';

interface DailyActivity {
  activity_date: string;
  quests_completed: number;
  points_earned: number;
}

interface StreakCalendarProps {
  userId: string;
}

const StreakCalendar = ({ userId }: StreakCalendarProps) => {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, 55); // 8 weeks

        const { data } = await supabase
          .from('daily_activity')
          .select('activity_date, quests_completed, points_earned')
          .eq('user_id', userId)
          .gte('activity_date', format(startDate, 'yyyy-MM-dd'))
          .lte('activity_date', format(endDate, 'yyyy-MM-dd'));

        setActivities(data || []);

        // Get current streak
        const { data: stats } = await supabase
          .from('user_stats')
          .select('current_streak')
          .eq('user_id', userId)
          .single();
        
        setCurrentStreak(stats?.current_streak || 0);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  useEffect(() => {
    if (!calendarRef.current || loading) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo('.calendar-header',
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );

      // Streak counter animation
      gsap.fromTo('.streak-counter',
        { scale: 0, rotation: -180 },
        { 
          scale: 1, 
          rotation: 0, 
          duration: 0.8, 
          ease: 'elastic.out(1, 0.5)',
          delay: 0.2
        }
      );

      // Flame pulse
      gsap.to('.streak-flame', {
        scale: 1.2,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });

      // Animate cells with wave effect
      gsap.fromTo('.calendar-cell',
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.3,
          stagger: {
            each: 0.015,
            from: 'start',
            grid: 'auto'
          },
          ease: 'back.out(1.5)',
          delay: 0.3
        }
      );

      // Legend animation
      gsap.fromTo('.legend-item',
        { y: 10, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.05,
          ease: 'power2.out',
          delay: 0.8
        }
      );

    }, calendarRef);

    return () => ctx.revert();
  }, [loading]);

  const getActivityLevel = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const activity = activities.find(a => a.activity_date === dateStr);
    if (!activity) return 0;
    if (activity.quests_completed >= 5) return 4;
    if (activity.quests_completed >= 3) return 3;
    if (activity.quests_completed >= 1) return 2;
    return 1;
  };

  const getLevelColor = (level: number): string => {
    switch (level) {
      case 4: return 'bg-green-500 shadow-green-500/50';
      case 3: return 'bg-green-400';
      case 2: return 'bg-green-300';
      case 1: return 'bg-green-200';
      default: return 'bg-muted';
    }
  };

  // Generate last 8 weeks of dates
  const endDate = startOfDay(new Date());
  const startDate = subDays(endDate, 55);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group by weeks
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card className="p-4 md:p-5 h-full" ref={calendarRef}>
      {/* Header with streak counter */}
      <div className="calendar-header flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-base md:text-lg">Activity</h3>
          <InfoTooltip content="Your activity calendar showing quest completions. Darker cells mean more quests completed that day!" />
        </div>
        
        <div className="streak-counter flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-3 py-1.5 rounded-full">
          <Flame className="streak-flame w-4 h-4 text-orange-500" />
          <span className="font-bold text-sm">{currentStreak}</span>
          <span className="text-xs text-muted-foreground">day streak</span>
        </div>
      </div>

      {loading ? (
        <div className="h-32 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Week day labels */}
          <div className="flex gap-1 mb-1 pl-6">
            {weekDays.map((day, i) => (
              <div key={i} className="w-4 h-4 text-[9px] text-muted-foreground flex items-center justify-center font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="flex flex-col gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex gap-1 items-center">
                <div className="w-5 text-[9px] text-muted-foreground text-right pr-1">
                  {weekIndex % 2 === 0 ? format(week[0], 'MMM').slice(0, 3) : ''}
                </div>
                {week.map((day, dayIndex) => {
                  const level = getActivityLevel(day);
                  const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  return (
                    <div
                      key={dayIndex}
                      className={`calendar-cell w-4 h-4 rounded-sm ${getLevelColor(level)} 
                        hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer
                        ${isToday ? 'ring-2 ring-primary' : ''}
                        ${level === 4 ? 'shadow-sm' : ''}`}
                      title={`${format(day, 'MMM d, yyyy')}: ${activities.find(a => a.activity_date === format(day, 'yyyy-MM-dd'))?.quests_completed || 0} quests`}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`legend-item w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                />
              ))}
              <span>More</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="w-3 h-3 text-yellow-500" />
              <span>{activities.reduce((acc, a) => acc + a.quests_completed, 0)} total</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};

export default StreakCalendar;
