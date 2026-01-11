import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import InfoTooltip from "@/components/ui/info-tooltip";
import {
  ShoppingBag,
  Gift,
  Trophy,
  Zap,
  TreePine,
  Sparkles,
  Loader2,
  Lock,
  ChevronDown,
  Coins,
} from "lucide-react";
import { toast } from "sonner";

interface TeamShopProps {
  teamId: string;
  teamPoints: number;
  memberCount: number;
  userId: string;
  isOwner: boolean;
  onPurchase?: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: typeof Gift;
  category: "boost" | "cosmetic" | "donation";
}

const shopItems: ShopItem[] = [
  // Boosts
  {
    id: "boost_1.25x",
    name: "Quick Boost 1.25x",
    description: "1.25x points for 6 hours",
    cost: 200,
    icon: Zap,
    category: "boost",
  },
  {
    id: "boost_1.5x",
    name: "Team Boost 1.5x",
    description: "1.5x points for 24 hours",
    cost: 500,
    icon: Zap,
    category: "boost",
  },
  {
    id: "boost_2x",
    name: "Power Boost 2x",
    description: "2x points for 12 hours",
    cost: 800,
    icon: Sparkles,
    category: "boost",
  },
  {
    id: "boost_3x",
    name: "Ultra Boost 3x",
    description: "3x points for 6 hours",
    cost: 1200,
    icon: Sparkles,
    category: "boost",
  },
  // Cosmetics
  {
    id: "badge_rising",
    name: "Rising Star Badge",
    description: "Badge for emerging teams",
    cost: 300,
    icon: Trophy,
    category: "cosmetic",
  },
  {
    id: "badge_elite",
    name: "Elite Team Badge",
    description: "Exclusive badge for all members",
    cost: 750,
    icon: Trophy,
    category: "cosmetic",
  },
  {
    id: "badge_legend",
    name: "Legendary Badge",
    description: "Ultimate team achievement",
    cost: 2000,
    icon: Trophy,
    category: "cosmetic",
  },
  {
    id: "team_banner",
    name: "Custom Team Banner",
    description: "Unique banner for your team",
    cost: 1500,
    icon: Gift,
    category: "cosmetic",
  },
  // Donations
  {
    id: "tree_donation_1",
    name: "Plant 1 Tree",
    description: "Small but meaningful",
    cost: 250,
    icon: TreePine,
    category: "donation",
  },
  {
    id: "tree_donation_5",
    name: "Plant 5 Trees",
    description: "Grove starter pack",
    cost: 1000,
    icon: TreePine,
    category: "donation",
  },
  {
    id: "tree_donation_10",
    name: "Plant 10 Trees",
    description: "Mini forest donation",
    cost: 1800,
    icon: TreePine,
    category: "donation",
  },
  {
    id: "tree_donation_25",
    name: "Plant 25 Trees",
    description: "Major eco impact",
    cost: 4000,
    icon: TreePine,
    category: "donation",
  },
];

const categoryConfig = {
  boost: { label: "Boosts", color: "from-amber-500 to-orange-500", bgColor: "bg-amber-500/10", textColor: "text-amber-600 dark:text-amber-400" },
  cosmetic: { label: "Cosmetics", color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10", textColor: "text-purple-600 dark:text-purple-400" },
  donation: { label: "Donations", color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-500/10", textColor: "text-emerald-600 dark:text-emerald-400" },
};

const TeamShop = ({ teamId, teamPoints, memberCount, userId, isOwner, onPurchase }: TeamShopProps) => {
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [actualIsOwner, setActualIsOwner] = useState(isOwner);
  const [isOpen, setIsOpen] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<SVGSVGElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (!cardRef.current) return;
    
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out", delay: 0.1 }
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

  // Animate items when they appear
  useEffect(() => {
    if (!itemsRef.current || !isOpen) return;
    
    const items = itemsRef.current.querySelectorAll(".shop-item");
    gsap.fromTo(
      items,
      { opacity: 0, y: 10, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.05, ease: "back.out(1.5)" }
    );
  }, [isOpen]);

  // Double-check ownership from database
  useEffect(() => {
    const checkOwnership = async () => {
      if (!userId || !teamId) return;
      
      const { data } = await supabase
        .from("team_memberships")
        .select("role")
        .eq("team_id", teamId)
        .eq("user_id", userId)
        .maybeSingle();
      
      setActualIsOwner(data?.role === "owner");
    };
    
    checkOwnership();
  }, [userId, teamId]);

  const handlePurchase = async (item: ShopItem) => {
    if (!actualIsOwner) {
      toast.error("Only the team owner can make purchases");
      return;
    }

    if (teamPoints < item.cost) {
      toast.error("Not enough team points!");
      return;
    }

    setPurchasing(item.id);

    try {
      const { error } = await supabase
        .from("teams")
        .update({ 
          total_points: teamPoints - item.cost,
          updated_at: new Date().toISOString()
        })
        .eq("id", teamId);

      if (error) throw error;

      toast.success(`🎉 ${item.name} purchased successfully!`);
      onPurchase?.();
    } catch (error) {
      console.error("Error completing purchase:", error);
      toast.error("Failed to complete purchase");
    } finally {
      setPurchasing(null);
    }
  };

  // Group items by category
  const groupedItems = shopItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  return (
    <Card ref={cardRef} className="h-fit border-primary/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full">
            <CardTitle className="flex items-center gap-2 text-base cursor-pointer group">
              <ShoppingBag className="w-5 h-5 text-primary" />
              Team Shop
              <InfoTooltip content="Spend team points on boosts, badges, and eco-donations. Only the team owner can make purchases." />
              <ChevronDown 
                ref={chevronRef}
                className="w-4 h-4 ml-auto text-muted-foreground transition-colors group-hover:text-foreground" 
              />
            </CardTitle>
          </CollapsibleTrigger>
          
          {/* Points display */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Coins className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-primary">{teamPoints.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
            {!actualIsOwner && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="w-3 h-3 mr-1" />
                Owner only
              </Badge>
            )}
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <ScrollArea className="max-h-[350px] pr-2">
              <div ref={itemsRef} className="space-y-3">
                {(["boost", "cosmetic", "donation"] as const).map((category) => {
                  const items = groupedItems[category];
                  if (!items?.length) return null;
                  const config = categoryConfig[category];

                  return (
                    <div key={category}>
                      {/* Category pill header */}
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} mb-2`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>
                          {config.label}
                        </span>
                      </div>

                      {/* Compact items list */}
                      <div className="space-y-1.5">
                        {items.map((item) => {
                          const Icon = item.icon;
                          const canAfford = teamPoints >= item.cost;
                          const isDisabled = !canAfford || !actualIsOwner;

                          return (
                            <div
                              key={item.id}
                              className={`shop-item flex items-center gap-2.5 p-2 rounded-lg border transition-all ${
                                isDisabled
                                  ? "bg-muted/20 border-transparent opacity-50"
                                  : "bg-card/50 border-border/50 hover:border-primary/30 hover:bg-accent/50"
                              }`}
                            >
                              {/* Compact icon */}
                              <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${config.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>

                              {/* Name & description inline */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-medium text-xs text-foreground truncate">{item.name}</span>
                                  <span className="text-[10px] text-muted-foreground hidden sm:inline">· {item.description}</span>
                                </div>
                              </div>

                              {/* Price badge & buy button */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className={`text-xs font-bold tabular-nums ${canAfford ? "text-primary" : "text-muted-foreground"}`}>
                                  {item.cost}
                                </span>
                                <Button
                                  size="sm"
                                  variant={isDisabled ? "ghost" : "default"}
                                  disabled={isDisabled || purchasing === item.id}
                                  onClick={() => handlePurchase(item)}
                                  className="h-6 w-12 text-[10px] font-semibold rounded-md px-0"
                                >
                                  {purchasing === item.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    "Buy"
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default TeamShop;