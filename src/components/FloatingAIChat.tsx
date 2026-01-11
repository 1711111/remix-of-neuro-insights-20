import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MessageCircle, X, Send, Loader2, Sparkles, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const FloatingAIChat = () => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Initial button animation
  useEffect(() => {
    if (buttonRef.current) {
      // Floating animation
      gsap.to(buttonRef.current, {
        y: -10,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

      // Pulse glow effect
      gsap.fromTo(
        buttonRef.current,
        { boxShadow: "0 0 20px hsl(152, 76%, 42%, 0.3)" },
        {
          boxShadow: "0 0 40px hsl(152, 76%, 42%, 0.6)",
          duration: 1.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        }
      );
    }
  }, []);

  // Panel open/close animation
  useEffect(() => {
    if (panelRef.current) {
      if (isOpen) {
        gsap.fromTo(
          panelRef.current,
          { scale: 0, opacity: 0, y: 50 },
          { 
            scale: 1, 
            opacity: 1, 
            y: 0, 
            duration: 0.4, 
            ease: "back.out(1.7)" 
          }
        );
      }
    }
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleChat = () => {
    if (isOpen) {
      gsap.to(panelRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 30,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setIsOpen(false),
      });
    } else {
      setIsOpen(true);
      // Add welcome message if no messages
      if (messages.length === 0) {
        setMessages([{
          role: "assistant",
          content: "Hi! 🌱 I'm your GreenQuest AI assistant. Ask me anything about sustainability, eco-friendly tips, or how to complete your quests!"
        }]);
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { messages: [...messages, userMessage] }
      });

      if (error) {
        console.error("Chat error:", error);
        // Check for rate limit error in the error message
        const errorMessage = error.message || String(error);
        if (errorMessage.includes("429") || errorMessage.toLowerCase().includes("rate limit")) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "🕐 I'm getting a lot of questions right now! Please wait a moment and try again."
          }]);
        } else if (errorMessage.includes("402")) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "💳 AI credits have been used up. Please contact the app administrator."
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again later."
          }]);
        }
        return;
      }

      // Check for error in data response (edge function returned error)
      if (data?.error) {
        console.error("Chat error from response:", data.error);
        if (data.error.includes("Rate limit")) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "🕐 I'm getting a lot of questions right now! Please wait a moment and try again."
          }]);
        } else if (data.error.includes("credits")) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "💳 AI credits have been used up. Please contact the app administrator."
          }]);
        } else {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: `Sorry, something went wrong: ${data.error}`
          }]);
        }
        return;
      }

      if (data?.response) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.response
        }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again in a few seconds."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={toggleChat}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full gradient-hero text-primary-foreground shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Sparkles className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-28 right-8 z-50 w-80 sm:w-96 h-[28rem] bg-card rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-accent/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-hero flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-foreground text-sm">
                GreenQuest AI
              </h3>
              <p className="text-xs text-muted-foreground">Powered by Gemini</p>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-accent text-accent-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-accent text-accent-foreground rounded-2xl rounded-bl-sm px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t border-border bg-background/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                className="flex-1 rounded-full text-sm"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="rounded-full gradient-hero hover:opacity-90 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingAIChat;