import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import InfoTooltip from "@/components/ui/info-tooltip";
import { Users, Crown, Shield, User, Loader2, Trophy, ChevronDown } from "lucide-react";

interface TeamMembersListProps {
  teamId: string;
  currentUserId: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name: string | null;
  avatar_url: string | null;
  total_points: number;
}

const TeamMembersList = ({ teamId, currentUserId }: TeamMembersListProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  // GSAP entrance animation
  useEffect(() => {
    if (!cardRef.current) return;
    
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  // Animate chevron on open/close
  useEffect(() => {
    if (!chevronRef.current) return;
    
    gsap.to(chevronRef.current, {
      rotation: isOpen ? 0 : -90,
      duration: 0.3,
      ease: "power2.out",
    });
  }, [isOpen]);

  // Animate members when they appear
  useEffect(() => {
    if (!listRef.current || !isOpen || members.length === 0) return;
    
    const items = listRef.current.querySelectorAll(".member-item");
    gsap.fromTo(
      items,
      { opacity: 0, x: -15 },
      { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" }
    );
  }, [isOpen, members]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: memberships, error: memberError } = await supabase
        .from("team_memberships")
        .select("id, user_id, role, joined_at")
        .eq("team_id", teamId)
        .order("role", { ascending: true });

      if (memberError) throw memberError;

      if (!memberships || memberships.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const userIds = memberships.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const { data: stats } = await supabase
        .from("user_stats")
        .select("user_id, total_points")
        .in("user_id", userIds);

      const combinedMembers: TeamMember[] = memberships.map((m) => {
        const profile = profiles?.find((p) => p.id === m.user_id);
        const stat = stats?.find((s) => s.user_id === m.user_id);

        let displayName = profile?.display_name;
        if (!displayName || displayName.startsWith("User_") || displayName === "User") {
          displayName = `Eco Warrior`;
        }

        return {
          id: m.id,
          user_id: m.user_id,
          role: m.role,
          joined_at: m.joined_at,
          display_name: displayName,
          avatar_url: profile?.avatar_url || null,
          total_points: stat?.total_points || 0,
        };
      });

      combinedMembers.sort((a, b) => {
        if (a.role === "owner") return -1;
        if (b.role === "owner") return 1;
        return b.total_points - a.total_points;
      });

      setMembers(combinedMembers);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case "admin":
        return <Shield className="w-3 h-3 text-blue-500" />;
      default:
        return <User className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-xs px-1.5 py-0">
            Owner
          </Badge>
        );
      case "admin":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-xs px-1.5 py-0">
            Admin
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            Member
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card ref={cardRef} className="h-fit">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full">
            <CardTitle className="flex items-center gap-2 text-base cursor-pointer group">
              <Users className="w-5 h-5 text-primary" />
              Team Members
              <InfoTooltip content="View all team members, their roles, and individual point contributions." />
              <Badge variant="outline" className="ml-auto mr-2">
                {members.length}/10
              </Badge>
              <ChevronDown 
                ref={chevronRef}
                className="w-4 h-4 text-muted-foreground transition-colors group-hover:text-foreground" 
              />
            </CardTitle>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[300px]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                  No members found
                </div>
              ) : (
                <div ref={listRef} className="divide-y">
                  {members.map((member) => {
                    const isCurrentUser = member.user_id === currentUserId;

                    return (
                      <div
                        key={member.id}
                        className={`member-item flex items-center gap-2 px-4 py-2.5 transition-colors ${
                          isCurrentUser ? "bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/60 to-secondary/60 text-white font-bold text-xs">
                            {member.display_name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-sm truncate">
                              {member.display_name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] text-muted-foreground">(you)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {getRoleIcon(member.role)}
                            <span>Joined {formatDate(member.joined_at)}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-0.5">
                          {getRoleBadge(member.role)}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Trophy className="w-3 h-3 text-primary" />
                            <span>{member.total_points.toLocaleString()} pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TeamMembersList;
