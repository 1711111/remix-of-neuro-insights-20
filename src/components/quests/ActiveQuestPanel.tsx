import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Camera, X, Plus, ImagePlus, Loader2, CheckCircle2, XCircle, Trophy, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Quest } from "@/pages/Quests";

interface ActiveQuestPanelProps {
  quest: Quest;
  onComplete: (quest?: Quest) => void;
  onCancel: () => void;
}

type Step = "active" | "uploading" | "verifying" | "result";

interface VerificationResult {
  verified: boolean;
  confidence: number;
  feedback: string;
  pointsAwarded: number;
}

const ActiveQuestPanel = ({ quest, onComplete, onCancel }: ActiveQuestPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const [step, setStep] = useState<Step>("active");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Check if this challenge was already completed
  useEffect(() => {
    const checkIfCompleted = async () => {
      if (!user || !quest.challenge_id) return;
      
      const { data } = await supabase
        .from("challenge_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", quest.challenge_id)
        .maybeSingle();
      
      if (data) {
        setAlreadyCompleted(true);
        toast.error("You've already completed this challenge!");
      }
    };
    
    checkIfCompleted();
  }, [user, quest.challenge_id]);

  useEffect(() => {
    if (!panelRef.current) return;

    gsap.fromTo(
      panelRef.current,
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }
    );
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }
      validFiles.push(file);
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, e.target?.result as string]);
        setStep("uploading");
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    if (uploadedImages.length <= 1) {
      setStep("active");
    }
  };

  const verifyQuest = async () => {
    if (uploadedImages.length === 0 || !user) return;

    setStep("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("verify-quest", {
        body: { images: uploadedImages, quest }
      });

      if (error) {
        console.error("Error verifying quest:", error);
        toast.error("Failed to verify quest");
        setStep("uploading");
        return;
      }

      if (data?.result) {
        setVerificationResult(data.result);
        setStep("result");

        if (data.result.verified) {
          // Update user stats
          await updateUserStats(data.result.pointsAwarded);
          toast.success(`Quest verified! +${data.result.pointsAwarded} points! 🎉`);
        }
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to verify quest");
      setStep("uploading");
    }
  };

  const updateUserStats = async (points: number) => {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const isTeamQuest = quest.is_team_quest && quest.team_id;

    // Get current stats including team_id
    const { data: currentStats } = await supabase
      .from("user_stats")
      .select("*, team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Also check team membership
    const { data: membership } = await supabase
      .from("team_memberships")
      .select("team_id")
      .eq("user_id", user.id)
      .maybeSingle();

    const teamId = quest.team_id || membership?.team_id || currentStats?.team_id || null;

    // For team quests, points go to team only, not user
    const userPoints = isTeamQuest ? 0 : points;

    if (currentStats) {
      // Calculate streak
      let newStreak = 1;
      if (currentStats.last_quest_date) {
        const lastDate = new Date(currentStats.last_quest_date);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak = currentStats.current_streak + 1;
        } else if (diffDays === 0) {
          newStreak = currentStats.current_streak;
        }
      }

      await supabase
        .from("user_stats")
        .update({
          total_points: currentStats.total_points + userPoints,
          current_streak: newStreak,
          longest_streak: Math.max(currentStats.longest_streak, newStreak),
          quests_completed: currentStats.quests_completed + 1,
          last_quest_date: today,
          quests_since_last_survey: (currentStats.quests_since_last_survey || 0) + 1,
          team_id: teamId,
        })
        .eq("user_id", user.id);
    } else {
      // Create new stats record
      await supabase.from("user_stats").insert({
        user_id: user.id,
        total_points: userPoints,
        current_streak: 1,
        longest_streak: 1,
        quests_completed: 1,
        last_quest_date: today,
        quests_since_last_survey: 1,
        team_id: teamId,
      });
    }

    // Record completed quest
    await supabase.from("completed_quests").insert({
      user_id: user.id,
      quest_title: quest.title,
      quest_category: quest.category,
      points_earned: points, // Record full points even for team quests (for history)
    });

    // If this is a challenge (has challenge_id), record the challenge completion
    if (quest.challenge_id) {
      await supabase.from("challenge_completions").insert({
        user_id: user.id,
        challenge_id: quest.challenge_id,
        points_earned: points,
        team_id: teamId,
      });
    }

    // Update team total points if this is a team quest or user is in a team
    if (isTeamQuest && teamId) {
      // Team quest - give all points to team
      const { data: team } = await supabase
        .from("teams")
        .select("total_points")
        .eq("id", teamId)
        .single();
      
      if (team) {
        await supabase
          .from("teams")
          .update({ 
            total_points: team.total_points + points,
            updated_at: new Date().toISOString()
          })
          .eq("id", teamId);
      }
      toast.info(`+${points} points awarded to your team! 🏆`);
    } else if (teamId && !isTeamQuest) {
      // Regular quest but user is in team - still contribute partial points
      await supabase.rpc("get_user_team_id", { _user_id: user.id }).then(async () => {
        const { data: team } = await supabase
          .from("teams")
          .select("total_points")
          .eq("id", teamId)
          .single();
        
        if (team) {
          await supabase
            .from("teams")
            .update({ 
              total_points: team.total_points + points,
              updated_at: new Date().toISOString()
            })
            .eq("id", teamId);
        }
      });
    }
  };

  return (
    <div ref={panelRef} className="bg-card rounded-3xl border border-border p-6">
      {/* Quest Info */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Active Quest
            </span>
            {quest.is_team_quest && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                <Users className="w-3 h-3 mr-1" />
                Team Quest
              </Badge>
            )}
          </div>
          <h2 className="font-heading font-bold text-xl text-foreground mt-1">
            {quest.title}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {quest.description}
          </p>
          {quest.is_team_quest && (
            <p className="text-xs text-blue-400 mt-2">
              🎯 Points from this quest will go to your team
            </p>
          )}
        </div>
        <span className="font-bold text-primary text-lg">+{quest.points} pts</span>
      </div>

      {/* Already Completed State */}
      {alreadyCompleted && (
        <div className="space-y-4">
          <div className="text-center py-6 rounded-2xl bg-green-500/10">
            <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-3" />
            <h3 className="font-heading font-bold text-xl text-success mb-2">
              Already Completed!
            </h3>
            <p className="text-sm text-muted-foreground px-4">
              You've already completed this challenge. Try a different one!
            </p>
          </div>
          <Button
            onClick={onCancel}
            className="w-full rounded-full gradient-hero hover:opacity-90"
          >
            Back to Quests
          </Button>
        </div>
      )}

      {/* Active State */}
      {step === "active" && !alreadyCompleted && (
        <div className="space-y-4">
          <div className="bg-accent/50 rounded-xl p-4">
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Camera className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Photo tip:</strong> {quest.verification_hint}
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1 rounded-full">
              Cancel
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-full gradient-hero hover:opacity-90"
            >
              <Camera className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Uploading State */}
      {step === "uploading" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {uploadedImages.map((img, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden aspect-square">
                <img src={img} alt={`Proof ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add</span>
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {uploadedImages.length} photo(s) uploaded • Add as many as you need
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-full">
              <Plus className="w-4 h-4 mr-1" />
              More Photos
            </Button>
            <Button onClick={verifyQuest} className="flex-1 rounded-full gradient-hero hover:opacity-90">
              <Sparkles className="w-4 h-4 mr-2" />
              Verify Quest
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Verifying State */}
      {step === "verifying" && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">AI is analyzing your photos...</p>
        </div>
      )}

      {/* Result State */}
      {step === "result" && verificationResult && (
        <div className="space-y-4">
          <div
            className={`text-center py-6 rounded-2xl ${
              verificationResult.verified ? "bg-success/10" : "bg-destructive/10"
            }`}
          >
            {verificationResult.verified ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-3" />
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-warning" />
                  <span className="font-heading font-bold text-2xl text-success">
                    +{verificationResult.pointsAwarded} points!
                  </span>
                </div>
              </>
            ) : (
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-3" />
            )}
            <p className="text-sm text-muted-foreground px-4">
              {verificationResult.feedback}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Confidence: {verificationResult.confidence}%
            </p>
          </div>

          <Button
            onClick={verificationResult.verified ? () => onComplete(quest) : () => setStep("active")}
            className="w-full rounded-full gradient-hero hover:opacity-90"
          >
            {verificationResult.verified ? "Continue" : "Try Again"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActiveQuestPanel;