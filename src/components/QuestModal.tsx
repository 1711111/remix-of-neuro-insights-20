import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Camera, CheckCircle2, XCircle, Upload, Trophy, Leaf, X, Plus, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Quest {
  title: string;
  description: string;
  points: number;
  category: string;
  verification_hint: string;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  feedback: string;
  pointsAwarded: number;
}

interface QuestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type QuestStep = "idle" | "generating" | "active" | "uploading" | "verifying" | "result";

const QuestModal = ({ open, onOpenChange }: QuestModalProps) => {
  const [step, setStep] = useState<QuestStep>("idle");
  const [quest, setQuest] = useState<Quest | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateQuest = async () => {
    setStep("generating");
    try {
      const { data, error } = await supabase.functions.invoke("generate-quest", {
        body: { count: 1 }
      });
      
      if (error) {
        console.error("Error generating quest:", error);
        toast.error("Failed to generate quest. Please try again.");
        setStep("idle");
        return;
      }

      // The edge function returns { quests: [...] }, so we pick the first one
      if (data?.quests && data.quests.length > 0) {
        setQuest(data.quests[0]);
        setStep("active");
        toast.success("Quest generated! 🌱");
      } else {
        throw new Error("No quest data received");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate quest. Please try again.");
      setStep("idle");
    }
  };

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

    if (validFiles.length + uploadedImages.length > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [...prev, e.target?.result as string]);
        setStep("uploading");
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
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
    if (uploadedImages.length === 0 || !quest) return;
    
    setStep("verifying");
    try {
      const { data, error } = await supabase.functions.invoke("verify-quest", {
        body: { images: uploadedImages, quest }
      });

      if (error) {
        console.error("Error verifying quest:", error);
        toast.error("Failed to verify quest. Please try again.");
        setStep("uploading");
        return;
      }

      if (data?.result) {
        setVerificationResult(data.result);
        setStep("result");
        if (data.result.verified) {
          toast.success(`Quest verified! You earned ${data.result.pointsAwarded} points! 🎉`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to verify quest. Please try again.");
      setStep("uploading");
    }
  };

  const resetQuest = () => {
    setStep("idle");
    setQuest(null);
    setVerificationResult(null);
    setUploadedImages([]);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      recycling: "bg-green-500",
      energy: "bg-yellow-500",
      transport: "bg-blue-500",
      waste: "bg-orange-500",
      nature: "bg-emerald-500",
    };
    return colors[category] || "bg-primary";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            {step === "idle" && "Start Your Quest"}
            {step === "generating" && "Generating Quest..."}
            {step === "active" && "Your Quest"}
            {step === "uploading" && "Prove Your Quest"}
            {step === "verifying" && "Verifying..."}
            {step === "result" && (verificationResult?.verified ? "Quest Complete!" : "Not Quite...")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Idle State */}
          {step === "idle" && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <p className="text-muted-foreground mb-6">
                Ready to make a difference? AI will generate a personalized eco-challenge just for you!
              </p>
              <Button onClick={generateQuest} className="rounded-full gradient-hero hover:opacity-90">
                Generate My Quest
                <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Generating State */}
          {step === "generating" && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Creating your eco-challenge...</p>
            </div>
          )}

          {/* Active Quest State */}
          {step === "active" && quest && (
            <div className="space-y-4">
              <div className="bg-accent/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold text-white px-2 py-1 rounded-full ${getCategoryColor(quest.category)}`}>
                    {quest.category}
                  </span>
                  <span className="text-sm font-semibold text-primary ml-auto">
                    +{quest.points} pts
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">
                  {quest.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {quest.description}
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  <Camera className="w-3 h-3 inline mr-1" />
                  <strong>Photo tip:</strong> {quest.verification_hint}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={resetQuest} className="flex-1 rounded-full">
                  Cancel
                </Button>
                <Button onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-full gradient-hero hover:opacity-90">
                  <Upload className="w-4 h-4 mr-2" />
                  Done! Upload Proof
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

          {/* Uploading State - Multiple Photos */}
          {step === "uploading" && uploadedImages.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative rounded-xl overflow-hidden aspect-square">
                    <img
                      src={img}
                      alt={`Proof ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:opacity-90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {uploadedImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary transition-colors"
                  >
                    <ImagePlus className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add More</span>
                  </button>
                )}
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                {uploadedImages.length}/5 photos uploaded
              </p>
              
              {quest && (
                <div className="bg-accent/50 rounded-xl p-3">
                  <p className="text-sm font-medium text-foreground">{quest.title}</p>
                  <p className="text-xs text-muted-foreground">{quest.verification_hint}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 rounded-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Photo
                </Button>
                <Button onClick={verifyQuest} className="flex-1 rounded-full gradient-hero hover:opacity-90">
                  Verify with AI
                  <Sparkles className="w-4 h-4 ml-2" />
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
              <div className={`text-center py-6 rounded-2xl ${verificationResult.verified ? "bg-success/10" : "bg-destructive/10"}`}>
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

              <Button onClick={resetQuest} className="w-full rounded-full gradient-hero hover:opacity-90">
                {verificationResult.verified ? "Start New Quest" : "Try Again"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuestModal;
