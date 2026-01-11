import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Crown, Trophy, ArrowRight, Loader2 } from "lucide-react";
import InfoTooltip from "@/components/ui/info-tooltip";

interface Team {
  id: string;
  name: string;
  total_points: number;
  member_count: number;
}

interface TeamMembership {
  id: string;
  team_id: string;
  role: string;
  teams: Team;
}

const TeamsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userTeam, setUserTeam] = useState<TeamMembership | null>(null);
  const [topTeams, setTopTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch user's team
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("*, teams(*)")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      setUserTeam(membership as TeamMembership);
    }

    // Fetch top 3 teams
    const { data: teams } = await supabase
      .from("teams")
      .select("*")
      .order("total_points", { ascending: false })
      .limit(3);

    if (teams) {
      setTopTeams(teams);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-primary" />
          Teams
          <InfoTooltip content="Join a team to earn bonus points together! Team members can complete team quests for shared rewards." className="ml-1" />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {/* User's Team */}
        {userTeam ? (
          <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm">
                  {userTeam.teams.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate flex items-center gap-1">
                  <Crown className="w-3 h-3 text-yellow-500" />
                  {userTeam.teams.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userTeam.teams.member_count} members • {userTeam.teams.total_points.toLocaleString()} pts
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 rounded-xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground mb-2">You're not in a team yet</p>
            <Button size="sm" variant="outline" onClick={() => navigate("/teams")} className="gap-1">
              Join a Team
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Top Teams */}
        {topTeams.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              <Trophy className="w-3 h-3 inline mr-1" />
              Leaderboard
            </p>
            {topTeams.map((team, index) => (
              <div key={team.id} className="flex items-center gap-3 py-2">
                <span className="w-5 text-center font-bold text-muted-foreground text-sm">
                  #{index + 1}
                </span>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {team.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{team.name}</p>
                </div>
                <span className="text-sm font-semibold text-primary">
                  {team.total_points.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <Button 
          variant="ghost" 
          className="w-full mt-4 gap-1" 
          onClick={() => navigate("/teams")}
        >
          View All Teams
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamsWidget;
