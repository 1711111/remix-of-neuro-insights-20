import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Calendar,
  Users,
  MessageSquare,
  Target,
  Flame,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  challenge_type: string;
  points: number;
  bonus_multiplier: number;
  difficulty: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  total_points: number;
  member_count: number;
  created_at: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  category: string;
  likes: number;
  created_at: string;
}

interface ForumComment {
  id: string;
  content: string;
  author_name: string;
  post_id: string;
  created_at: string;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isModerator, setIsModerator] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [comments, setComments] = useState<ForumComment[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    category: "recycling",
    challenge_type: "daily",
    points: 50,
    bonus_multiplier: 1.5,
    difficulty: "medium",
    verification_hint: "",
    days_duration: 1,
  });

  // Check moderator/admin access
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        return;
      }

      // Check both moderator and admin status
      const [moderatorResult, adminResult] = await Promise.all([
        supabase.rpc("is_moderator", { _user_id: user.id }),
        supabase.rpc("is_admin", { _user_id: user.id }),
      ]);
      
      setIsModerator(moderatorResult.data || adminResult.data || false);
      setCheckingAccess(false);
    };

    if (!authLoading) {
      checkAccess();
    }
  }, [user, authLoading]);

  // Fetch all data
  useEffect(() => {
    if (isModerator) {
      fetchAllData();
    }
  }, [isModerator]);

  // GSAP animations
  useEffect(() => {
    if (!containerRef.current || !isModerator) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".admin-header",
        { y: -30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
      );

      gsap.fromTo(
        ".admin-tabs",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 0.2, ease: "power3.out" }
      );

      gsap.fromTo(
        ".admin-card",
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, delay: 0.3, ease: "back.out(1.7)" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isModerator, challenges]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchChallenges(),
      fetchTeams(),
      fetchPosts(),
      fetchComments(),
    ]);
    setLoading(false);
  };

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setChallenges(data as Challenge[]);
  };

  const fetchTeams = async () => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .order("total_points", { ascending: false });
    if (data) setTeams(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("forum_comments")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setComments(data);
  };

  const saveChallenge = async () => {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + newChallenge.days_duration);

    const challengeData = {
      title: newChallenge.title,
      description: newChallenge.description,
      category: newChallenge.category,
      challenge_type: newChallenge.challenge_type,
      points: newChallenge.points,
      bonus_multiplier: newChallenge.bonus_multiplier,
      difficulty: newChallenge.difficulty,
      verification_hint: newChallenge.verification_hint,
      starts_at: now.toISOString(),
      ends_at: endDate.toISOString(),
      is_active: true,
    };

    if (editingChallenge) {
      const { error } = await supabase
        .from("challenges")
        .update(challengeData)
        .eq("id", editingChallenge.id);
      
      if (error) {
        toast.error("Failed to update challenge");
        return;
      }
      toast.success("Challenge updated!");
    } else {
      const { error } = await supabase
        .from("challenges")
        .insert(challengeData);
      
      if (error) {
        toast.error("Failed to create challenge");
        return;
      }
      toast.success("Challenge created!");
    }

    setChallengeDialogOpen(false);
    setEditingChallenge(null);
    resetChallengeForm();
    fetchChallenges();
  };

  const deleteChallenge = async (id: string) => {
    const { error } = await supabase.from("challenges").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete challenge");
      return;
    }
    toast.success("Challenge deleted");
    fetchChallenges();
  };

  const deleteTeam = async (id: string) => {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete team");
      return;
    }
    toast.success("Team deleted");
    fetchTeams();
  };

  const deletePost = async (id: string) => {
    const { error } = await supabase.from("forum_posts").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete post");
      return;
    }
    toast.success("Post deleted");
    fetchPosts();
  };

  const deleteComment = async (id: string) => {
    const { error } = await supabase.from("forum_comments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete comment");
      return;
    }
    toast.success("Comment deleted");
    fetchComments();
  };

  const toggleChallengeActive = async (challenge: Challenge) => {
    const { error } = await supabase
      .from("challenges")
      .update({ is_active: !challenge.is_active })
      .eq("id", challenge.id);
    
    if (error) {
      toast.error("Failed to update challenge");
      return;
    }
    fetchChallenges();
  };

  const resetChallengeForm = () => {
    setNewChallenge({
      title: "",
      description: "",
      category: "recycling",
      challenge_type: "daily",
      points: 50,
      bonus_multiplier: 1.5,
      difficulty: "medium",
      verification_hint: "",
      days_duration: 1,
    });
  };

  const openEditChallenge = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setNewChallenge({
      title: challenge.title,
      description: challenge.description,
      category: challenge.category,
      challenge_type: challenge.challenge_type,
      points: challenge.points,
      bonus_multiplier: challenge.bonus_multiplier,
      difficulty: challenge.difficulty,
      verification_hint: "",
      days_duration: 1,
    });
    setChallengeDialogOpen(true);
  };

  if (authLoading || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!isModerator) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-muted-foreground mb-4">You need moderator privileges to access this page.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="admin-header flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-hero flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground">Manage challenges, teams, and community content</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Challenges", value: challenges.length, icon: Flame, color: "from-orange-500 to-red-500" },
            { label: "Teams", value: teams.length, icon: Users, color: "from-blue-500 to-cyan-500" },
            { label: "Posts", value: posts.length, icon: MessageSquare, color: "from-purple-500 to-pink-500" },
            { label: "Comments", value: comments.length, icon: Target, color: "from-green-500 to-emerald-500" },
          ].map((stat, i) => (
            <Card key={i} className="admin-card overflow-hidden">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="challenges" className="admin-tabs">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="challenges" className="gap-2">
              <Flame className="w-4 h-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2">
              <Users className="w-4 h-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="posts" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <Target className="w-4 h-4" />
              Comments
            </TabsTrigger>
          </TabsList>

          {/* Challenges Tab */}
          <TabsContent value="challenges">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Manage Challenges</CardTitle>
                <Dialog open={challengeDialogOpen} onOpenChange={(open) => {
                  setChallengeDialogOpen(open);
                  if (!open) {
                    setEditingChallenge(null);
                    resetChallengeForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 gradient-hero">
                      <Plus className="w-4 h-4" />
                      Add Challenge
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        {editingChallenge ? "Edit Challenge" : "Create Challenge"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Title</label>
                        <Input
                          value={newChallenge.title}
                          onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                          placeholder="Challenge title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Textarea
                          value={newChallenge.description}
                          onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                          placeholder="What should users do?"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Type</label>
                          <Select
                            value={newChallenge.challenge_type}
                            onValueChange={(v) => setNewChallenge({ ...newChallenge, challenge_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Daily (1.5x)</SelectItem>
                              <SelectItem value="weekly">Weekly (2x)</SelectItem>
                              <SelectItem value="monthly">Monthly (3x)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Category</label>
                          <Select
                            value={newChallenge.category}
                            onValueChange={(v) => setNewChallenge({ ...newChallenge, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="recycling">Recycling</SelectItem>
                              <SelectItem value="energy">Energy</SelectItem>
                              <SelectItem value="transport">Transport</SelectItem>
                              <SelectItem value="waste">Waste</SelectItem>
                              <SelectItem value="nature">Nature</SelectItem>
                              <SelectItem value="water">Water</SelectItem>
                              <SelectItem value="food">Food</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Difficulty</label>
                          <Select
                            value={newChallenge.difficulty}
                            onValueChange={(v) => setNewChallenge({ ...newChallenge, difficulty: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Easy</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Points</label>
                          <Input
                            type="number"
                            value={newChallenge.points}
                            onChange={(e) => setNewChallenge({ ...newChallenge, points: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Duration (days)</label>
                        <Input
                          type="number"
                          value={newChallenge.days_duration}
                          onChange={(e) => setNewChallenge({ ...newChallenge, days_duration: parseInt(e.target.value) || 1 })}
                          min={1}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Verification Hint</label>
                        <Input
                          value={newChallenge.verification_hint}
                          onChange={(e) => setNewChallenge({ ...newChallenge, verification_hint: e.target.value })}
                          placeholder="What photo should users submit?"
                        />
                      </div>
                      <Button onClick={saveChallenge} className="w-full gradient-hero">
                        {editingChallenge ? "Update Challenge" : "Create Challenge"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {challenges.map((challenge) => (
                      <TableRow key={challenge.id}>
                        <TableCell className="font-medium">{challenge.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {challenge.challenge_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{challenge.points} pts</TableCell>
                        <TableCell>
                          <Badge
                            variant={challenge.is_active ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleChallengeActive(challenge)}
                          >
                            {challenge.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditChallenge(challenge)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteChallenge(challenge.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams">
            <Card>
              <CardHeader>
                <CardTitle>Manage Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teams.map((team) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.member_count}</TableCell>
                        <TableCell>{team.total_points.toLocaleString()}</TableCell>
                        <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTeam(team.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Manage Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                        <TableCell>{post.author_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{post.category}</Badge>
                        </TableCell>
                        <TableCell>{post.likes}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePost(post.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Manage Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="font-medium max-w-[300px] truncate">{comment.content}</TableCell>
                        <TableCell>{comment.author_name}</TableCell>
                        <TableCell>{new Date(comment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
