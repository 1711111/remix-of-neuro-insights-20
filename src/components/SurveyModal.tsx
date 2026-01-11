import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, ClipboardList, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const SurveyModal = ({ open, onOpenChange, onComplete }: SurveyModalProps) => {
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"rating" | "feedback" | "thanks">("rating");

  useEffect(() => {
    if (open && contentRef.current) {
      const ctx = gsap.context(() => {
        // Animate header
        gsap.fromTo(
          ".survey-header",
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }
        );

        // Animate stars with stagger
        if (starsRef.current) {
          gsap.fromTo(
            starsRef.current.querySelectorAll(".star-btn"),
            { scale: 0, rotation: -180 },
            { 
              scale: 1, 
              rotation: 0, 
              duration: 0.5, 
              ease: "back.out(1.7)", 
              stagger: 0.1,
              delay: 0.3 
            }
          );
        }
      }, contentRef);

      return () => ctx.revert();
    }
  }, [open, step]);

  const handleStarClick = (value: number) => {
    setRating(value);
    
    // Animate the selected star
    if (starsRef.current) {
      const selectedStar = starsRef.current.querySelectorAll(".star-btn")[value - 1];
      gsap.to(selectedStar, {
        scale: 1.3,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.out"
      });
    }

    // Transition to feedback step
    setTimeout(() => {
      gsap.to(".rating-section", {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => setStep("feedback")
      });
    }, 500);
  };

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("survey_responses").insert({
        user_id: user.id,
        rating,
        feedback: feedback || null,
      });

      if (error) throw error;

      // Reset survey counter in user_stats
      await supabase
        .from("user_stats")
        .update({ quests_since_last_survey: 0 })
        .eq("user_id", user.id);

      setStep("thanks");
      
      setTimeout(() => {
        toast.success("Thank you for your feedback! 🙏");
        onComplete();
        onOpenChange(false);
        // Reset for next time
        setStep("rating");
        setRating(0);
        setFeedback("");
      }, 2000);
    } catch (error) {
      console.error("Error submitting survey:", error);
      toast.error("Failed to submit survey");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotNow = () => {
    gsap.to(contentRef.current, {
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      onComplete: () => {
        onOpenChange(false);
        setStep("rating");
        setRating(0);
        setFeedback("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <div ref={contentRef}>
          <DialogHeader className="survey-header">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ClipboardList className="w-6 h-6 text-primary" />
              Quick Survey
            </DialogTitle>
          </DialogHeader>

          {step === "rating" && (
            <div className="rating-section mt-6 space-y-6">
              <p className="text-center text-muted-foreground">
                How are you enjoying GreenQuest so far?
              </p>
              
              <div ref={starsRef} className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className="star-btn p-2 transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleStarClick(value)}
                  >
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        value <= (hoverRating || rating)
                          ? "fill-warning text-warning"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  onClick={handleNotNow}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Not now
                </Button>
              </div>
            </div>
          )}

          {step === "feedback" && (
            <div className="feedback-section mt-6 space-y-4 animate-fade-in">
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-6 h-6 ${
                      value <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
              
              <p className="text-center text-muted-foreground">
                {rating >= 4 
                  ? "Awesome! What do you love most?" 
                  : "How can we improve your experience?"}
              </p>
              
              <Textarea
                placeholder="Your feedback helps us grow... (optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[100px] rounded-xl resize-none"
              />

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep("rating")}
                  className="flex-1 rounded-full"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 rounded-full gradient-hero hover:opacity-90"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          )}

          {step === "thanks" && (
            <div className="thanks-section py-12 text-center animate-scale-in">
              <Sparkles className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="font-heading font-bold text-xl text-foreground mb-2">
                Thank you! 💚
              </h3>
              <p className="text-muted-foreground">
                Your feedback helps us make GreenQuest better!
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SurveyModal;