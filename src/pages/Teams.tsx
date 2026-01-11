import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Trophy,
  Plus,
  Crown,
  Star,
  Zap,
  Target,
  LogOut,
  Loader2,
  Sparkles,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import TeamShop from "@/components/teams/TeamShop";
import TeamChat from "@/components/teams/TeamChat";
import TeamMembersList from "@/components/teams/TeamMembersList";

gsap.registerPlugin(ScrollTrigger);

interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  total_points: number;
  member_count: number;
}

interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  teams: Team;
}

const Teams = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const perksRef = useRef<HTMLDivElement>(null);
  const leaderboardRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<TeamMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchTeams();
    if (user) {
      fetchUserTeam();
    }
  }, [user]);

  // GSAP Animations
  useEffect(() => {
    if (!pageRef.current) return;

    const ctx = gsap.context(() => {
      // Header animation
      const header = document.querySelector(".teams-header");
      if (header) {
        gsap.fromTo(
          header,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
          }
        );
      }

      // Perks cards stagger animation
      const perkCards = document.querySelectorAll(".perk-card");
      if (perkCards.length > 0 && perksRef.current) {
        gsap.fromTo(
          perkCards,
          { y: 60, opacity: 0, rotateX: -15 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.7,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: perksRef.current,
              start: "top 75%",
            },
          }
        );
      }

      // Team cards animation with 3D effect
      const teamCards = document.querySelectorAll(".team-card");
      if (teamCards.length > 0 && leaderboardRef.current) {
        gsap.fromTo(
          teamCards,
          { scale: 0.8, opacity: 0, rotateY: -10 },
          {
            scale: 1,
            opacity: 1,
            rotateY: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: leaderboardRef.current,
              start: "top 75%",
            },
          }
        );
      }

      // Floating animation for icons
      const floatingIcons = document.querySelectorAll(".floating-icon");
      if (floatingIcons.length > 0) {
        gsap.to(floatingIcons, {
          y: -8,
          duration: 2,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          stagger: 0.3,
        });
      }
    }, pageRef);

    return () => ctx.revert();
  }, [teams, loading]);

  const handleCardHover = (e: React.MouseEvent<HTMLDivElement>, enter: boolean) => {
    gsap.to(e.currentTarget, {
      scale: enter ? 1.03 : 1,
      y: enter ? -5 : 0,
      boxShadow: enter 
        ? "0 20px 40px rgba(0,0,0,0.15)" 
        : "0 4px 6px rgba(0,0,0,0.1)",
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    gsap.to(e.currentTarget, {
      scale: enter ? 1.05 : 1,
      duration: 0.2,
      ease: "power2.out",
    });
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("total_points", { ascending: false })
      .limit(10);

    if (!error && data) {
      setTeams(data);
    }
    setLoading(false);
  };

  const fetchUserTeam = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("team_memberships")
      .select("*, teams(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setUserTeam(data as TeamMembership);
    }
  };

  const createTeam = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!newTeam.name.trim()) {
      toast.error("Team name is required");
      return;
    }

    setCreating(true);
    try {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          name: newTeam.name.trim(),
          description: newTeam.description.trim() || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      const { error: memberError } = await supabase
        .from("team_memberships")
        .insert({
          team_id: team.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) throw memberError;

      toast.success("Team created! 🎉");
      setCreateDialogOpen(false);
      setNewTeam({ name: "", description: "" });
      fetchTeams();
      fetchUserTeam();
    } catch (error: any) {
      console.error("Error creating team:", error);
      if (error.code === "23505") {
        toast.error("A team with this name already exists");
      } else {
        toast.error("Failed to create team");
      }
    } finally {
      setCreating(false);
    }
  };

  const MAX_TEAM_MEMBERS = 10;

  const joinTeam = async (teamId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (userTeam) {
      toast.error("You're already in a team. Leave first to join another.");
      return;
    }

    // Check if team is full
    const team = teams.find(t => t.id === teamId);
    if (team && team.member_count >= MAX_TEAM_MEMBERS) {
      toast.error(`This team is full (max ${MAX_TEAM_MEMBERS} members)`);
      return;
    }

    setJoining(teamId);
    try {
      const { error } = await supabase.from("team_memberships").insert({
        team_id: teamId,
        user_id: user.id,
        role: "member",
      });

      if (error) throw error;

      toast.success("Joined team! 🚀");
      fetchTeams();
      fetchUserTeam();
    } catch (error) {
      console.error("Error joining team:", error);
      toast.error("Failed to join team");
    } finally {
      setJoining(null);
    }
  };

  const leaveTeam = async () => {
    if (!userTeam) return;

    try {
      const { error } = await supabase
        .from("team_memberships")
        .delete()
        .eq("id", userTeam.id);

      if (error) throw error;

      toast.success("Left team");
      setUserTeam(null);
      fetchTeams();
    } catch (error) {
      console.error("Error leaving team:", error);
      toast.error("Failed to leave team");
    }
  };

  const perks = [
    {
      icon: Zap,
      title: "1.2x Point Multiplier",
      description: "Team members earn 20% bonus points on all quests",
      color: "text-yellow-500",
      bg: "bg-gradient-to-br from-yellow-500/20 to-orange-500/20",
      border: "border-yellow-500/30",
    },
    {
      icon: Target,
      title: "Exclusive Challenges",
      description: "Access team-only challenges with bigger rewards",
      color: "text-blue-500",
      bg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
      border: "border-blue-500/30",
    },
    {
      icon: Users,
      title: "Shared Progress",
      description: "Contribute to team goals and climb the leaderboard together",
      color: "text-green-500",
      bg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20",
      border: "border-green-500/30",
    },
  ];

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: Crown, color: "text-yellow-500", bg: "bg-yellow-500/20" };
    if (index === 1) return { icon: Star, color: "text-gray-400", bg: "bg-gray-400/20" };
    if (index === 2) return { icon: Star, color: "text-amber-600", bg: "bg-amber-600/20" };
    return null;
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="teams-header text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Users className="w-4 h-4 floating-icon" />
            Team Competition
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Join a Team, Earn <span className="gradient-text">More Rewards</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create or join a team to unlock exclusive perks and compete together.
          </p>
        </div>

        {/* Team Perks */}
        <div ref={perksRef} className="grid md:grid-cols-3 gap-6 mb-12">
          {perks.map((perk, index) => (
            <Card 
              key={index} 
              className={`perk-card border-2 ${perk.border} ${perk.bg} cursor-pointer`}
              onMouseEnter={(e) => handleCardHover(e, true)}
              onMouseLeave={(e) => handleCardHover(e, false)}
              style={{ transformStyle: "preserve-3d" }}
            >
              <CardContent className="pt-6">
                <div className={`w-14 h-14 rounded-2xl ${perk.bg} flex items-center justify-center mb-4`}>
                  <perk.icon className={`w-7 h-7 ${perk.color} floating-icon`} />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{perk.title}</h3>
                <p className="text-muted-foreground text-sm">{perk.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Your Team */}
        {userTeam && (
          <>
            {/* Big Team Points Banner */}
            <Card className="mb-6 bg-gradient-to-r from-yellow-500/20 via-amber-500/20 to-orange-500/20 border-yellow-500/30 overflow-hidden">
              <CardContent className="py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-yellow-500/30 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Team Points</p>
                      <p className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        {userTeam.teams.total_points.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <p className="text-sm text-muted-foreground">Team Rank</p>
                    <p className="text-2xl font-bold text-primary">
                      #{teams.findIndex(t => t.id === userTeam.teams.id) + 1 || '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-secondary/5 overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500 floating-icon" />
                  Your Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 ring-4 ring-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl font-bold">
                        {userTeam.teams.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-heading font-bold text-xl">{userTeam.teams.name}</h3>
                      <p className="text-muted-foreground text-sm">
                        {userTeam.teams.member_count} members
                      </p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
                        {userTeam.role}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={leaveTeam} 
                    className="gap-2"
                    onMouseEnter={(e) => handleButtonHover(e, true)}
                    onMouseLeave={(e) => handleButtonHover(e, false)}
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Team
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Features Grid - Chat is biggest, Shop & Members collapsible */}
            <div className="grid lg:grid-cols-12 gap-6 mb-8">
              {/* Team Chat - Takes 6 columns (largest) */}
              <div className="lg:col-span-6 flex flex-col min-h-[500px]">
                <TeamChat
                  teamId={userTeam.teams.id}
                  userId={user?.id || ""}
                />
              </div>

              {/* Team Shop - 3 columns */}
              <div className="lg:col-span-3 flex flex-col">
                <TeamShop
                  teamId={userTeam.teams.id}
                  teamPoints={userTeam.teams.total_points}
                  memberCount={userTeam.teams.member_count}
                  userId={user?.id || ""}
                  isOwner={userTeam.role === "owner"}
                  onPurchase={() => {
                    fetchTeams();
                    fetchUserTeam();
                  }}
                />
              </div>

              {/* Team Members - 3 columns */}
              <div className="lg:col-span-3 flex flex-col">
                <TeamMembersList
                  teamId={userTeam.teams.id}
                  currentUserId={user?.id || ""}
                />
              </div>
            </div>
          </>
        )}

        {/* Create Team Button */}
        {!userTeam && (
          <div className="text-center mb-8">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="gradient-hero rounded-full px-8 py-6 text-lg gap-2 group"
                  onClick={() => {
                    if (!user) {
                      setAuthModalOpen(true);
                      return;
                    }
                  }}
                  onMouseEnter={(e) => handleButtonHover(e, true)}
                  onMouseLeave={(e) => handleButtonHover(e, false)}
                >
                  <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  Create Your Team
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </DialogTrigger>
              {user && (
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Create a New Team
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Team Name</label>
                      <Input
                        placeholder="Eco Warriors"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description (optional)</label>
                      <Textarea
                        placeholder="What's your team about?"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={createTeam}
                      disabled={creating}
                      className="w-full gradient-hero rounded-full"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Create Team
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              )}
            </Dialog>
          </div>
        )}

        {/* Team Leaderboard */}
        <Card ref={leaderboardRef} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500 floating-icon" />
              Team Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No teams yet</p>
                <p className="text-sm">Be the first to create one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team, index) => {
                  const rankBadge = getRankBadge(index);
                  const isUserTeam = userTeam?.teams.id === team.id;
                  
                  return (
                    <div
                      key={team.id}
                      className={`team-card flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        isUserTeam 
                          ? "bg-primary/10 border-2 border-primary/30" 
                          : "bg-muted/50 hover:bg-muted border-2 border-transparent"
                      }`}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Rank */}
                      <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        {rankBadge ? (
                          <div className={`w-10 h-10 rounded-full ${rankBadge.bg} flex items-center justify-center`}>
                            <rankBadge.icon className={`w-5 h-5 ${rankBadge.color}`} />
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                        )}
                      </div>

                      {/* Team Info */}
                      <Avatar className="w-12 h-12 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-primary/60 to-secondary/60 text-white font-bold">
                          {team.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate flex items-center gap-2">
                          {team.name}
                          {isUserTeam && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">You</span>
                          )}
                          {team.member_count >= MAX_TEAM_MEMBERS && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Full</span>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {team.member_count}/{MAX_TEAM_MEMBERS} members
                        </p>
                      </div>

                      {/* Points */}
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">{team.total_points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">points</p>
                      </div>

                      {/* Join Button */}
                      {!isUserTeam && !userTeam && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => joinTeam(team.id)}
                          disabled={joining === team.id || team.member_count >= MAX_TEAM_MEMBERS}
                          className="shrink-0 gap-1"
                        >
                          {joining === team.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : team.member_count >= MAX_TEAM_MEMBERS ? (
                            "Full"
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4" />
                              Join
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </div>
  );
};

export default Teams;
