import { useState } from "react";
import { StreamChat } from "stream-chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: StreamChat | null;
  onChannelCreated: () => void;
}

const CreateChannelModal = ({
  open,
  onOpenChange,
  client,
  onChannelCreated,
}: CreateChannelModalProps) => {
  const [channelName, setChannelName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateChannel = async () => {
    if (!client || !channelName.trim()) {
      toast.error("Please enter a channel name");
      return;
    }

    setLoading(true);
    try {
      // Create a URL-friendly channel ID from the name
      const channelId = channelName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50);

      if (!channelId) {
        toast.error("Please enter a valid channel name");
        setLoading(false);
        return;
      }

      const channel = client.channel("messaging", channelId, {
        name: channelName.trim(),
        created_by_id: client.userID,
        members: [client.userID],
      } as Record<string, unknown>);

      await channel.create();
      await channel.watch();

      toast.success(`Channel "${channelName}" created successfully!`);
      setChannelName("");
      setChannelDescription("");
      onOpenChange(false);
      onChannelCreated();
    } catch (error) {
      console.error("Error creating channel:", error);
      toast.error("Failed to create channel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Channel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="channel-name">Channel Name *</Label>
            <Input
              id="channel-name"
              placeholder="e.g., Zero Waste Tips"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="channel-description">Description (optional)</Label>
            <Textarea
              id="channel-description"
              placeholder="What is this channel about?"
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateChannel}
            disabled={loading || !channelName.trim()}
            className="gradient-hero"
          >
            {loading ? "Creating..." : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelModal;
