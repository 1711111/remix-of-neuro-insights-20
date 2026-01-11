import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import InfoTooltip from "@/components/ui/info-tooltip";
import { MessageCircle, Send, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface TeamChatProps {
  teamId: string;
  userId: string;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

const TeamChat = ({ teamId, userId }: TeamChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("User");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    if (!cardRef.current) return;
    
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
    );
  }, []);

  // Fetch the user's consistent display name from profiles
  useEffect(() => {
    const fetchDisplayName = async () => {
      if (!userId) return;
      
      const { data: userData } = await supabase.auth.getUser();
      const authName = userData?.user?.user_metadata?.display_name;
      const emailName = userData?.user?.email?.split("@")[0];
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .maybeSingle();
      
      let name = data?.display_name;
      if (!name || name.startsWith("User_") || name === "User") {
        name = authName || emailName || "Eco Warrior";
      }
      
      setDisplayName(name);
    };
    
    fetchDisplayName();
  }, [userId]);

  // Fetch messages from database
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("team_id", teamId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } else {
        setMessages(data || []);
      }
      setLoading(false);
    };

    fetchMessages();

    const channel = supabase
      .channel(`team_messages_${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Animate new messages
  useEffect(() => {
    if (!messagesRef.current || messages.length === 0) return;
    
    const lastMessage = messagesRef.current.querySelector(".message-item:last-child");
    if (lastMessage) {
      gsap.fromTo(
        lastMessage,
        { opacity: 0, y: 10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(1.5)" }
      );
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("team_messages").insert({
      team_id: teamId,
      user_id: userId,
      user_name: displayName,
      content,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setNewMessage(content);
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const deleteMessage = async (messageId: string) => {
    setDeletingId(messageId);
    const { error } = await supabase
      .from("team_messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      toast.success("Message deleted");
    }
    setDeletingId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card ref={cardRef} className="flex flex-col h-full min-h-[500px]">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-5 h-5 text-primary" />
          Team Chat
          <InfoTooltip content="Chat with your teammates in real-time. Coordinate quests and celebrate achievements together!" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div ref={messagesRef} className="space-y-3 py-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.user_id === userId;
                let showName = msg.user_name;
                if (showName.startsWith("User_") || showName === "User") {
                  showName = "Eco Warrior";
                }

                return (
                  <div
                    key={msg.id}
                    className={`message-item flex gap-2 group ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs font-bold ${
                        isOwn 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        {showName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                      <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? "justify-end" : ""}`}>
                        <span className="text-xs font-medium text-foreground">
                          {isOwn ? "You" : showName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div className={`inline-flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                            isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                        {isOwn && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteMessage(msg.id)}
                            disabled={deletingId === msg.id}
                          >
                            {deletingId === msg.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-full"
              disabled={sending}
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-full"
              disabled={!newMessage.trim() || sending}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamChat;
