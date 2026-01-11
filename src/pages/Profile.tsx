import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { User, Trophy, Target, Flame, Calendar, Award, Edit2, Camera, Save, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InfoTooltip from "@/components/ui/info-tooltip";

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
}

interface UserStats {
  total_points: number;
  quests_completed: number;
  current_streak: number;
  longest_streak: number;
}

interface UserLevel {
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  title: string;
}

interface EarnedBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  earned_at: string;
}

const Profile = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;
    setIsLoading(true);

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setEditName(profileData.display_name || "");
    }

    // Fetch stats
    const { data: statsData } = await supabase
      .from("user_stats")
      .select("total_points, quests_completed, current_streak, longest_streak")
      .eq("user_id", user.id)
      .single();

    if (statsData) {
      setStats(statsData);
    }

    // Fetch level
    const { data: levelData } = await supabase
      .from("user_levels")
      .select("level, current_xp, xp_to_next_level, title")
      .eq("user_id", user.id)
      .single();

    if (levelData) {
      setLevel(levelData);
    }

    // Fetch badges
    const { data: badgesData } = await supabase
      .from("user_badges")
      .select(`
        badge_id,
        earned_at,
        badges (
          id,
          name,
          description,
          icon,
          tier
        )
      `)
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false })
      .limit(6);

    if (badgesData) {
      const formattedBadges = badgesData
        .filter(b => b.badges)
        .map(b => ({
          id: b.badge_id,
          name: (b.badges as any).name,
          description: (b.badges as any).description,
          icon: (b.badges as any).icon,
          tier: (b.badges as any).tier,
          earned_at: b.earned_at,
        }));
      setBadges(formattedBadges);
    }

    setIsLoading(false);
  };

  // GSAP animations
  useEffect(() => {
    if (!containerRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".profile-card",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: "power3.out" }
      );

      gsap.fromTo(
        ".stat-item",
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.3, ease: "back.out(1.7)" }
      );

      gsap.fromTo(
        ".badge-item",
        { y: 20, opacity: 0, rotateY: -30 },
        { y: 0, opacity: 1, rotateY: 0, duration: 0.5, stagger: 0.08, delay: 0.5, ease: "power2.out" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: editName })
      .eq("id", user.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      setProfile(prev => prev ? { ...prev, display_name: editName } : null);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    }
    setIsSaving(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "gold": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "silver": return "bg-gray-400/20 text-gray-300 border-gray-400/50";
      case "bronze": return "bg-orange-600/20 text-orange-400 border-orange-600/50";
      default: return "bg-primary/20 text-primary border-primary/50";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 container mx-auto px-4 text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view your profile</h1>
          <p className="text-muted-foreground">Track your progress, achievements, and eco-impact.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <Navbar />
      
      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header */}
          <Card className="profile-card overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30" />
            <CardContent className="relative pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white border-4 border-background">
                    {profile?.display_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="max-w-xs"
                        placeholder="Display name"
                      />
                      <Button size="icon" onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-center sm:justify-start">
                      <h1 className="text-2xl font-bold">{profile?.display_name || "Eco Warrior"}</h1>
                      <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

                {level && (
                  <div className="text-center sm:text-right">
                    <Badge variant="outline" className="text-lg px-3 py-1 bg-primary/10 border-primary/30">
                      Level {level.level}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">{level.title}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Level Progress */}
          {level && (
            <Card className="profile-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                  Level Progress
                  <InfoTooltip content="Your current level and XP progress. Complete quests to earn XP and level up!" className="ml-1" />
                  Level Progress
                  <InfoTooltip content="Your current level and XP progress. Complete quests to earn XP and level up!" className="ml-1" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">XP Progress</span>
                    <span className="font-medium">{level.current_xp} / {level.xp_to_next_level} XP</span>
                  </div>
                  <Progress value={(level.current_xp / level.xp_to_next_level) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground text-right">
                    {level.xp_to_next_level - level.current_xp} XP to Level {level.level + 1}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="stat-item text-center p-4">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{stats?.total_points.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </Card>
            <Card className="stat-item text-center p-4">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{stats?.quests_completed || 0}</p>
              <p className="text-xs text-muted-foreground">Quests Done</p>
            </Card>
            <Card className="stat-item text-center p-4">
              <Flame className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <p className="text-2xl font-bold">{stats?.current_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </Card>
            <Card className="stat-item text-center p-4">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">{stats?.longest_streak || 0}</p>
              <p className="text-xs text-muted-foreground">Best Streak</p>
            </Card>
          </div>

          {/* Badges */}
          <Card className="profile-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Recent Badges
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/badges">View All</a>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`badge-item p-4 rounded-xl border-2 text-center ${getTierColor(badge.tier)}`}
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-background/50 flex items-center justify-center text-2xl">
                        🏅
                      </div>
                      <p className="font-semibold text-sm">{badge.name}</p>
                      <p className="text-xs opacity-80 mt-1 line-clamp-2">{badge.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No badges earned yet. Complete quests to earn badges!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
