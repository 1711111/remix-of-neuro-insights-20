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
import AuthModal from "@/components/AuthModal";
import ProfileSettings from "@/components/ProfileSettings";
import {
  Leaf,
  TrendingUp,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Loader2,
  Sparkles,
  Globe,
  X,
  ArrowRight,
  Verified,
  Settings,
  Flag,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
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

const EcoFeedsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const feedOverlayRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<FeedCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
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

  // Create floating particles
  const createParticles = useCallback(() => {
    if (!particlesRef.current) return;
    
    const container = particlesRef.current;
    container.innerHTML = "";
    
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement("div");
      particle.className = "absolute rounded-full bg-primary/10 pointer-events-none";
      const size = Math.random() * 15 + 5;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      container.appendChild(particle);
      
      gsap.to(particle, {
        y: -80 - Math.random() * 100,
        x: Math.random() * 60 - 30,
        opacity: 0,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        delay: Math.random() * 2,
        ease: "power1.out",
      });
    }
  }, []);

  // Section entrance animations with ScrollTrigger
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Create particles
      createParticles();

      // Section badge
      gsap.fromTo(
        ".eco-badge",
        { y: 30, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "elastic.out(1, 0.6)",
          scrollTrigger: {
            trigger: ".eco-badge",
            start: "top 85%",
          },
        }
      );

      // Title lines
      gsap.fromTo(
        ".eco-title-line",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".eco-title-line",
            start: "top 85%",
          },
        }
      );

      // Subtitle
      gsap.fromTo(
        ".eco-subtitle",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          delay: 0.3,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".eco-subtitle",
            start: "top 85%",
          },
        }
      );

      // Feature cards with 3D effect
      gsap.fromTo(
        ".eco-feature-card",
        { 
          y: 60, 
          opacity: 0,
          rotateX: -20,
          transformPerspective: 1000,
        },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".eco-feature-card",
            start: "top 90%",
          },
        }
      );

      // Floating icons
      gsap.utils.toArray(".eco-floating-icon").forEach((icon: any) => {
        gsap.to(icon, {
          y: "random(-12, 12)",
          x: "random(-8, 8)",
          rotation: "random(-8, 8)",
          duration: "random(2, 3.5)",
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });
      });

      // CTA button
      gsap.fromTo(
        ".eco-cta-button",
        { y: 30, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          ease: "back.out(1.5)",
          scrollTrigger: {
            trigger: ".eco-cta-button",
            start: "top 90%",
          },
        }
      );

      // Button glow pulse
      gsap.to(".eco-cta-button", {
        boxShadow: "0 0 35px hsla(var(--primary), 0.35)",
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });

    }, sectionRef);

    return () => ctx.revert();
  }, [createParticles]);

  // Open feed with animation
  const openFeed = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    if (!credentials) {
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
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setFeedOpen(true);
    document.body.style.overflow = "hidden";
    
    setTimeout(() => {
      if (feedOverlayRef.current) {
        // Overlay entrance
        gsap.fromTo(
          feedOverlayRef.current,
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
        );
        
        // Feed content stagger
        gsap.fromTo(
          ".feed-overlay-item",
          { y: 30, opacity: 0 },
          { 
            y: 0, 
            opacity: 1, 
            duration: 0.5, 
            stagger: 0.08,
            delay: 0.2, 
            ease: "power3.out" 
          }
        );
      }
    }, 50);
  };

  // Close feed with animation
  const closeFeed = () => {
    if (feedOverlayRef.current) {
      gsap.to(feedOverlayRef.current, {
        opacity: 0,
        scale: 0.98,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => {
          setFeedOpen(false);
          document.body.style.overflow = "";
        },
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
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

    useEffect(() => {
      if (!activityRef.current) return;
      
      const el = activityRef.current;
      
      const onEnter = () => {
        gsap.to(el, { scale: 1.01, duration: 0.2, ease: "power2.out" });
      };
      
      const onLeave = () => {
        gsap.to(el, { scale: 1, duration: 0.2, ease: "power2.out" });
      };
      
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      
      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    }, []);
    
    return (
      <div ref={activityRef}>
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

  // Preview Section
  const PreviewSection = () => (
    <section ref={sectionRef} id="feeds" className="py-24 bg-gradient-to-b from-background to-muted/20 relative overflow-hidden">
      {/* Floating particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <span className="eco-badge inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-full text-sm font-medium mb-8">
            <Leaf className="w-4 h-4 eco-floating-icon" />
            Eco Feed
            <Heart className="w-3 h-3 text-red-400 eco-floating-icon" />
          </span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground mb-6">
            <span className="eco-title-line block">Your Sustainability</span>
            <span className="eco-title-line block gradient-text">Community Hub</span>
          </h2>
          
          <p className="eco-subtitle text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Connect with eco-creators, discover sustainability tips, and share your green journey with a community that cares.
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="eco-feature-card bg-card rounded-3xl border border-border p-8 text-left hover:border-primary/50 hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-green-500 eco-floating-icon" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-3">Share Tips</h3>
              <p className="text-muted-foreground">Post your sustainability tips and eco-friendly practices with the community.</p>
            </div>
            
            <div className="eco-feature-card bg-card rounded-3xl border border-border p-8 text-left hover:border-primary/50 hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-7 h-7 text-blue-500 eco-floating-icon" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-3">Connect</h3>
              <p className="text-muted-foreground">Join a vibrant community of environmental advocates and like-minded individuals.</p>
            </div>
            
            <div className="eco-feature-card bg-card rounded-3xl border border-border p-8 text-left hover:border-primary/50 hover:shadow-xl transition-all duration-500 group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-7 h-7 text-purple-500 eco-floating-icon" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-3">Make Impact</h3>
              <p className="text-muted-foreground">Inspire others with your eco journey and contribute to global sustainability.</p>
            </div>
          </div>

          <Button 
            onClick={openFeed}
            disabled={loading}
            size="lg"
            className="eco-cta-button rounded-full gradient-hero hover:opacity-90 px-10 py-7 text-lg group"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <span>Enter Eco Feed</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>

          {error && (
            <p className="text-destructive text-sm mt-4">{error}</p>
          )}

          <p className="text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {user ? "Click to enter the feed" : "Sign in to join the community"}
          </p>
        </div>
      </div>
    </section>
  );

  // Fullscreen Feed Overlay
  const FeedOverlay = () => (
    <div 
      ref={feedOverlayRef}
      className="fixed inset-0 z-50 bg-background dark:bg-[hsl(160,30%,4%)] overflow-hidden"
    >
      {/* Header */}
      <div className="feed-overlay-item sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between max-w-2xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-hero flex items-center justify-center">
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-base sm:text-lg">Eco Feed</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Community sustainability tips</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ProfileSettings 
              trigger={
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 sm:h-10 sm:w-10">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              }
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={closeFeed}
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Feed Content */}
      <div className="h-[calc(100vh-57px)] sm:h-[calc(100vh-73px)] overflow-y-auto overscroll-contain">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-2xl pb-safe space-y-4">
          {credentials ? (
            <StreamApp
              apiKey={credentials.apiKey}
              appId={credentials.appId}
              token={credentials.token}
            >
              {/* User Profile Card */}
              <div className="feed-overlay-item bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
                <Avatar className="w-12 h-12 ring-2 ring-primary/20">
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
              <div className="feed-overlay-item bg-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-primary" />
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
                  <div className="feed-overlay-item bg-card rounded-2xl border border-border overflow-hidden mb-4 hover:border-primary/20 transition-colors">
                    <EcoActivity activity={props.activity} />
                  </div>
                )}
                notify
                Placeholder={() => (
                  <div className="feed-overlay-item text-center py-16">
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
          ) : (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading feed...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PreviewSection />
      {feedOpen && <FeedOverlay />}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
};

export default EcoFeedsSection;
