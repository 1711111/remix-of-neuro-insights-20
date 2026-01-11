import { RefreshCw, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuestHeaderProps {
  className?: string;
  onRefresh: () => void;
  isLoading: boolean;
}

const QuestHeader = ({ className, onRefresh, isLoading }: QuestHeaderProps) => {
  return (
    <div className={className}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground">
              Your Quests
            </h1>
            <p className="text-muted-foreground text-sm">
              Complete challenges, earn points, save the planet
            </p>
          </div>
        </div>
        
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          className="rounded-full"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          New Quests
        </Button>
      </div>
    </div>
  );
};

export default QuestHeader;