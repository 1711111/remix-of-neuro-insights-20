import { useState, useEffect, useRef } from "react";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import { gsap } from "gsap";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Video,
  Users,
  BookOpen,
  Plus,
  Play,
  Calendar,
  Clock,
  GraduationCap,
  Leaf,
  MessageSquare,
  Headphones,
} from "lucide-react";

interface VirtualClassroomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: StreamChat | null;
  onClassroomCreated: () => void;
  onJoinAudioRoom?: (classroomId: string, classroomName: string) => void;
}

interface Classroom {
  id: string;
  name: string;
  description?: string;
  topic?: string;
  schedule?: string;
  memberCount: number;
  isLive: boolean;
}

const VirtualClassroomModal = ({
  open,
  onOpenChange,
  client,
  onClassroomCreated,
  onJoinAudioRoom,
}: VirtualClassroomModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Create form state
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [classTopic, setClassTopic] = useState("");
  const [classSchedule, setClassSchedule] = useState("");

  // Fetch existing classrooms
  useEffect(() => {
    if (open && client) {
      fetchClassrooms();
    }
  }, [open, client]);

  // GSAP animations
  useEffect(() => {
    if (open && contentRef.current) {
      const cards = contentRef.current.querySelectorAll(".classroom-card");
      gsap.fromTo(
        cards,
        { y: 30, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.4,
          stagger: 0.1,
          ease: "back.out(1.4)",
        }
      );
    }
  }, [open, classrooms, activeTab]);

  const fetchClassrooms = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      // Query channels with classroom type
      const filter = { type: "messaging", classroom: true };
      const channels = await client.queryChannels(filter, { created_at: -1 }, { limit: 20 });
      
      const classroomData: Classroom[] = channels.map((channel) => {
        const data = channel.data as Record<string, unknown> | undefined;
        return {
          id: channel.id || "",
          name: (data?.name as string) || "Untitled Classroom",
          description: data?.description as string | undefined,
          topic: data?.topic as string | undefined,
          schedule: data?.schedule as string | undefined,
          memberCount: Object.keys(channel.state.members || {}).length,
          isLive: (data?.is_live as boolean) || false,
        };
      });
      
      setClassrooms(classroomData);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClassroom = async () => {
    if (!client || !className.trim()) {
      toast.error("Please enter a classroom name");
      return;
    }

    setCreating(true);
    try {
      const channelId = `classroom-${className
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 40)}-${Date.now()}`;

      const channel = client.channel("messaging", channelId, {
        name: className.trim(),
        description: classDescription.trim() || undefined,
        topic: classTopic.trim() || undefined,
        schedule: classSchedule.trim() || undefined,
        classroom: true,
        is_live: false,
        created_by_id: client.userID,
        members: [client.userID],
      } as Record<string, unknown>);

      await channel.create();
      await channel.watch();

      toast.success(`Classroom "${className}" created successfully! 🎓`);
      
      // Reset form
      setClassName("");
      setClassDescription("");
      setClassTopic("");
      setClassSchedule("");
      setActiveTab("browse");
      
      await fetchClassrooms();
      onClassroomCreated();
    } catch (error) {
      console.error("Error creating classroom:", error);
      toast.error("Failed to create classroom. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinClassroom = async (classroomId: string, classroomName: string) => {
    if (!client) return;

    try {
      const channel = client.channel("messaging", classroomId);
      await channel.watch();
      await channel.addMembers([client.userID!]);
      
      toast.success("Joined classroom! Check your channel list.");
      onOpenChange(false);
      onClassroomCreated();
    } catch (error) {
      console.error("Error joining classroom:", error);
      toast.error("Failed to join classroom");
    }
  };

  const handleJoinAudio = (classroomId: string, classroomName: string) => {
    onOpenChange(false);
    onJoinAudioRoom?.(classroomId, classroomName);
  };

  const topicSuggestions = [
    "Climate Action",
    "Renewable Energy",
    "Sustainable Living",
    "Ocean Conservation",
    "Wildlife Protection",
    "Green Technology",
    "Recycling & Waste",
    "Eco-Gardening",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden" ref={contentRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            Virtual Classrooms
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Browse Classrooms
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : classrooms.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-heading font-semibold text-lg mb-2">No classrooms yet</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Be the first to create a virtual classroom!
                  </p>
                  <Button onClick={() => setActiveTab("create")} className="gradient-hero">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Classroom
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {classrooms.map((classroom) => (
                    <Card 
                      key={classroom.id} 
                      className="classroom-card hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-heading font-semibold truncate">
                                {classroom.name}
                              </h4>
                              {classroom.isLive && (
                                <Badge className="bg-red-500 text-white animate-pulse">
                                  <span className="w-2 h-2 bg-white rounded-full mr-1" />
                                  LIVE
                                </Badge>
                              )}
                            </div>
                            {classroom.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                {classroom.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {classroom.topic && (
                                <span className="flex items-center gap-1">
                                  <Leaf className="w-3 h-3" />
                                  {classroom.topic}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {classroom.memberCount} members
                              </span>
                              {classroom.schedule && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {classroom.schedule}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJoinAudio(classroom.id, classroom.name)}
                              className="rounded-full"
                              title="Join Audio Room"
                            >
                              <Headphones className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleJoinClassroom(classroom.id, classroom.name)}
                              className="gradient-hero"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Join
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-name">Classroom Name *</Label>
                  <Input
                    id="class-name"
                    placeholder="e.g., Sustainable Living 101"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-topic">Topic</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {topicSuggestions.map((topic) => (
                      <Badge
                        key={topic}
                        variant={classTopic === topic ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/20 transition-colors"
                        onClick={() => setClassTopic(topic)}
                      >
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <Input
                    id="class-topic"
                    placeholder="Or enter a custom topic..."
                    value={classTopic}
                    onChange={(e) => setClassTopic(e.target.value)}
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-description">Description</Label>
                  <Textarea
                    id="class-description"
                    placeholder="What will students learn in this classroom?"
                    value={classDescription}
                    onChange={(e) => setClassDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-schedule" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Schedule (optional)
                  </Label>
                  <Input
                    id="class-schedule"
                    placeholder="e.g., Every Monday at 3 PM"
                    value={classSchedule}
                    onChange={(e) => setClassSchedule(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="bg-accent/50 rounded-xl p-4 mt-4">
                  <h4 className="font-heading font-semibold text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    What you can do in classrooms:
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Real-time group discussions on sustainability topics</li>
                    <li>• <Headphones className="w-3 h-3 inline" /> Join audio rooms for live voice chats</li>
                    <li>• Share resources, links, and eco-tips</li>
                    <li>• Organize study groups and collaborative projects</li>
                    <li>• Host Q&A sessions with environmental experts</li>
                  </ul>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("browse")}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateClassroom}
                disabled={creating || !className.trim()}
                className="gradient-hero"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Create Classroom
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default VirtualClassroomModal;
