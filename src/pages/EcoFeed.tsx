import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  StreamApp, 
  FlatFeed, 
  StatusUpdateForm,
  Activity,
  CommentList,
  CommentField,
  LikeButton,
} from "react-activity-feed";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import ProfileSettings from "@/components/ProfileSettings";
import InfoTooltip from "@/components/ui/info-tooltip";
import {
  Leaf,
  TrendingUp,
  Users,
  MessageCircle,
  Share2,
  Loader2,
  Sparkles,
  Globe,
  Verified,
  Settings,
  Flag,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Heart,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import "react-activity-feed/dist/index.css";

gsap.registerPlugin(ScrollTrigger);

interface FeedCredentials {
  token: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  apiKey: string;
  appId: string;
  communityEnabled?: boolean;
}

const EcoFeed = () => {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const floatingParticlesRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<FeedCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [userProfile, setUserProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  // Check moderator status and load profile
  useEffect(() => {
    const checkModeratorStatus = async () => {
      if (!user) return;
      
      const { data } = await supabase.rpc("is_moderator", { _user_id: user.id });
      setIsModerator(data || false);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      
      setUserProfile(profile);
    };

    checkModeratorStatus();
  }, [user]);

  // Load feed credentials
  useEffect(() => {
    const loadCredentials = async () => {
      if (!user) return;

      setLoading(true);
      setError(null);
      try {
        const { data, error: fnError } = await supabase.functions.invoke<FeedCredentials>(
          "getstream-feed-token"
        );
        if (fnError || !data) {
          throw new Error(fnError?.message || "Failed to get feed credentials");
        }
        setCredentials(data);
      } catch (err) {
        console.error("Feed initialization error:", err);
        setError(err instanceof Error ? err.message : "Failed to connect to feed");
      }
      setLoading(false);
    };

    loadCredentials();
  }, [user]);

  // Create floating particles
  const createParticles = useCallback(() => {
    if (!floatingParticlesRef.current) return;
    
    const container = floatingParticlesRef.current;
    container.innerHTML = "";
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute rounded-full bg-primary/20 pointer-events-none";
      const size = Math.random() * 20 + 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      container.appendChild(particle);
      
      gsap.to(particle, {
        y: -100 - Math.random() * 200,
        x: Math.random() * 100 - 50,
        opacity: 0,
        duration: 3 + Math.random() * 3,
        repeat: -1,
        delay: Math.random() * 2,
        ease: "power1.out",
      });
    }
  }, []);

  // Hero animations for non-authenticated users
  useEffect(() => {
    if (!pageRef.current || user) return;

    const ctx = gsap.context(() => {
      // Create particles
      createParticles();

      // Hero badge animation
      gsap.fromTo(
        ".hero-badge",
        { y: -30, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.5)",
        }
      );

      // Main title reveal with split text effect
      gsap.fromTo(
        ".hero-title-line",
        { y: 60, opacity: 0, rotationX: -45 },
        {
          y: 0,
          opacity: 1,
          rotationX: 0,
          duration: 1,
          stagger: 0.2,
          delay: 0.3,
          ease: "power3.out",
        }
      );

      // Subtitle fade in
      gsap.fromTo(
        ".hero-subtitle",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay: 0.8,
          ease: "power2.out",
        }
      );

      // Feature cards with 3D flip effect
      gsap.fromTo(
        ".feature-card",
        { 
          y: 80, 
          opacity: 0, 
          rotateY: -30,
          transformPerspective: 1000,
        },
        {
          y: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.8,
          stagger: 0.15,
          delay: 1,
          ease: "power3.out",
        }
      );

      // Floating icons with random movement
      gsap.utils.toArray(".floating-icon").forEach((icon: any) => {
        gsap.to(icon, {
          y: "random(-15, 15)",
          x: "random(-10, 10)",
          rotation: "random(-10, 10)",
          duration: "random(2, 4)",
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      // CTA button pulse
      gsap.to(".cta-button", {
        boxShadow: "0 0 40px hsla(var(--primary), 0.4)",
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

      // Sparkle effect on button
      gsap.to(".cta-sparkle", {
        rotation: 360,
        duration: 3,
        repeat: -1,
        ease: "none",
      });

    }, pageRef);

    return () => ctx.revert();
  }, [user, createParticles]);

  // Feed page animations for authenticated users
  useEffect(() => {
    if (!pageRef.current || !credentials) return;

    const ctx = gsap.context(() => {
      // Header slide in with bounce
      gsap.fromTo(
        ".feed-header",
        { y: -50, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
        }
      );

      // Profile card entrance
      gsap.fromTo(
        ".profile-card",
        { x: -50, opacity: 0, rotateY: -15 },
        {
          x: 0,
          opacity: 1,
          rotateY: 0,
          duration: 0.7,
          delay: 0.2,
          ease: "power3.out",
        }
      );

      // Composer card with scale
      gsap.fromTo(
        ".composer-card",
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          delay: 0.4,
          ease: "power3.out",
        }
      );

      // Feed items stagger animation
      gsap.fromTo(
        ".feed-item",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          delay: 0.6,
          ease: "power2.out",
        }
      );

      // Continuous glow effect on primary elements
      gsap.to(".glow-effect", {
        boxShadow: "0 0 30px hsla(var(--primary), 0.3)",
        duration: 2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

    }, pageRef);

    return () => ctx.revert();
  }, [credentials]);

  // Animate new posts when they appear
  const animateNewPost = useCallback((element: HTMLElement) => {
    gsap.fromTo(
      element,
      { y: -20, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "power2.out",
      }
    );
  }, []);

  const handleReport = () => {
    toast.success("Post reported. Our moderators will review it.");
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({
        title: "Eco Tip",
        text: text,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Post copied to clipboard!");
    }
  };

  // Custom Activity Component
  const EcoActivity = ({ activity }: { activity: any }) => {
    const [showComments, setShowComments] = useState(false);
    const activityRef = useRef<HTMLDivElement>(null);
    const isOwnPost = activity.actor?.id === credentials?.userId;

    // Hover effect
    useEffect(() => {
      if (!activityRef.current) return;
      
      const element = activityRef.current;
      
      const handleMouseEnter = () => {
        gsap.to(element, {
          scale: 1.01,
          boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
          duration: 0.3,
          ease: "power2.out",
        });
      };
      
      const handleMouseLeave = () => {
        gsap.to(element, {
          scale: 1,
          boxShadow: "0 0 0 rgba(0,0,0,0)",
          duration: 0.3,
          ease: "power2.out",
        });
      };
      
      element.addEventListener("mouseenter", handleMouseEnter);
      element.addEventListener("mouseleave", handleMouseLeave);
      
      return () => {
        element.removeEventListener("mouseenter", handleMouseEnter);
        element.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, []);
    
    return (
      <div ref={activityRef} className="feed-item">
        <Activity
          activity={activity}
          Footer={() => (
            <div className="border-t border-border/50">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <LikeButton activity={activity} />
                  
                  <button 
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">{activity.reaction_counts?.comment || 0}</span>
                    {showComments ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button 
                    onClick={() => handleShare(activity.object || "")}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-secondary transition-colors group"
                  >
                    <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleReport} className="gap-2">
                      <Flag className="w-4 h-4" />
                      Report Post
                    </DropdownMenuItem>
                    {(isModerator || isOwnPost) && (
                      <DropdownMenuItem 
                        className="gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Post
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {showComments && (
                <div className="px-4 pb-4 border-t border-border/50">
                  <div className="pt-4 space-y-4">
                    <CommentList 
                      activityId={activity.id}
                      CommentItem={({ comment }: { comment: any }) => (
                        <div className="flex gap-3 mb-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={comment.user?.data?.profileImage} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                              {comment.user?.data?.name?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 bg-muted/50 rounded-xl p-3">
                            <p className="text-sm font-medium">{comment.user?.data?.name || "User"}</p>
                            <p className="text-sm text-muted-foreground">{comment.data?.text}</p>
                          </div>
                        </div>
                      )}
                    />
                    <CommentField 
                      activity={activity}
                      placeholder="Add a comment..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          Header={() => (
            <div className="p-4 flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src={activity.actor?.data?.profileImage} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                  {activity.actor?.data?.name?.charAt(0)?.toUpperCase() || "E"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground text-sm">
                    {activity.actor?.data?.name || "Eco Warrior"}
                  </span>
                  <Verified className="w-4 h-4 text-primary fill-primary" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(activity.time).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
          Content={() => (
            <div className="px-4 pb-2">
              <p className="text-foreground text-sm leading-relaxed">{activity.object}</p>
            </div>
          )}
        />
      </div>
    );
  };

  // Unauthenticated landing page
  if (!user) {
    return (
      <div ref={pageRef} className="min-h-screen bg-background overflow-hidden">
        <Navbar />
        
        {/* Floating particles container */}
        <div 
          ref={floatingParticlesRef} 
          className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        />
        
        <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center" ref={heroRef}>
            {/* Hero Badge */}
            <span className="hero-badge inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Leaf className="w-4 h-4 floating-icon" />
              Eco Feed
              <Heart className="w-3 h-3 text-red-400 floating-icon" />
            </span>
            
            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-4 perspective-1000">
              <span className="hero-title-line block">Your Sustainability</span>
              <span className="hero-title-line block gradient-text">Community Hub</span>
            </h1>
            
            {/* Subtitle */}
            <p className="hero-subtitle text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
              Connect with eco-creators, discover sustainability tips, and share your green journey with a community that cares.
            </p>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="feature-card bg-card rounded-3xl border border-border p-8 text-left hover:border-primary/50 transition-all duration-500 group">
                <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-5 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 floating-icon" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">Share Tips</h3>
                <p className="text-muted-foreground">Post your sustainability tips and eco-friendly practices with the community.</p>
              </div>
              
              <div className="feature-card bg-card rounded-3xl border border-border p-8 text-left hover:border-primary/50 transition-all duration-500 group">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-5 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 floating-icon" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">Connect</h3>
                <p className="text-muted-foreground">Join a vibrant community of environmental advocates and like-minded individuals.</p>
              </div>
              
              <div className="feature-card bg-card rounded-3xl border border-border p-8 text-left hover:border-primary/50 transition-all duration-500 group">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-5 group-hover:scale-110 transition-transform">
                  <Globe className="w-7 h-7 floating-icon" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">Make Impact</h3>
                <p className="text-muted-foreground">Inspire others with your eco journey and contribute to global sustainability.</p>
              </div>
            </div>

            {/* CTA Button */}
            <Button 
              onClick={() => setAuthModalOpen(true)}
              size="lg"
              className="cta-button rounded-full gradient-hero hover:opacity-90 px-10 py-7 text-lg group"
            >
              <span>Sign In to Join</span>
              <Sparkles className="cta-sparkle w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              Join thousands of eco-warriors making a difference
            </p>
          </div>
        </main>
        
        <Footer />
        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </div>
    );
  }

  // Authenticated feed page
  return (
    <div ref={pageRef} className="min-h-screen bg-background dark:bg-[hsl(160,30%,4%)]">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24 max-w-2xl" ref={feedContainerRef}>
        {/* Header */}
        <div className="feed-header flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="glow-effect w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-xl">Eco Feed</h1>
                <InfoTooltip content="Share eco tips, connect with other eco-warriors, and get inspired by the community's sustainability journey!" />
              </div>
              <p className="text-xs text-muted-foreground">Community sustainability tips</p>
            </div>
          </div>
          <ProfileSettings 
            trigger={
              <Button variant="outline" size="sm" className="gap-2 hover:border-primary/50">
                <Settings className="w-4 h-4" />
                Profile
              </Button>
            }
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full bg-primary/20 animate-ping" />
            </div>
            <p className="text-muted-foreground">Connecting to feed...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 text-destructive" />
            </div>
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {/* Feed Content */}
        {credentials && (
          <div className="space-y-6">
            <StreamApp
              apiKey={credentials.apiKey}
              appId={credentials.appId}
              token={credentials.token}
            >
              {/* User Profile Card */}
              <div className="profile-card bg-card rounded-2xl border border-border p-5 flex items-center gap-4 hover:border-primary/30 transition-colors">
                <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                  <AvatarImage src={userProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold">
                    {userProfile?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{userProfile?.display_name || "Eco Warrior"}</p>
                  <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                </div>
                <ProfileSettings 
                  trigger={
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <Settings className="w-4 h-4" />
                      Edit
                    </Button>
                  }
                />
              </div>

              {/* Post Composer */}
              <div className="composer-card bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-semibold text-foreground">
                    {credentials.communityEnabled ? "Share to the community" : "Share an eco tip or story"}
                  </span>
                </div>
                <StatusUpdateForm
                  feedGroup={credentials.communityEnabled ? "community" : "user"}
                  userId={credentials.communityEnabled ? "global" : credentials.userId}
                />
              </div>

              {/* Feed */}
              <FlatFeed
                feedGroup={credentials.communityEnabled ? "community" : "user"}
                userId={credentials.communityEnabled ? "global" : credentials.userId}
                Activity={(props) => (
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 transition-colors">
                    <EcoActivity activity={props.activity} />
                  </div>
                )}
                notify
                Placeholder={() => (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <Leaf className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-xl mb-2">No posts yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Be the first to share an eco tip with the community!
                    </p>
                  </div>
                )}
              />
            </StreamApp>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default EcoFeed;
