import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  chatService,
  type ChatMessage,
  type QuickAction,
} from "@/services/chat.service";
import { useToast } from "@/components/ui/use-toast";

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load conversation history and quick actions on mount
  useEffect(() => {
    const history = chatService.getHistory();
    setMessages(history);
    setShowQuickActions(history.length === 0);

    loadQuickActions();
  }, []);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadQuickActions = async () => {
    try {
      const actions = await chatService.getQuickActions();
      setQuickActions(actions);
    } catch (error) {
      console.error("Failed to load quick actions:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    // Optimistic update
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setShowQuickActions(false);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(userMessage.content);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        role: "assistant",
        content:
          "Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Fehler",
        description: error.message || "Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    let message = "";

    switch (action.id) {
      case "create-action":
        message = "Ich möchte eine neue Action erstellen";
        break;
      case "view-actions":
        message = "Zeige mir meine offenen Actions";
        break;
      case "view-projects":
        message = "Zeige mir meine Projekte";
        break;
      case "report-damage":
        message = "Ich möchte einen Schaden melden";
        break;
      case "check-notifications":
        message = "Zeige mir meine Benachrichtigungen";
        break;
      default:
        message = action.title;
    }

    setInputMessage(message);
    setShowQuickActions(false);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <Sparkles className="h-16 w-16 mx-auto text-primary relative animate-pulse" />
              </div>
              <h4 className="font-bold text-xl mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Willkommen beim MaintAIn Assistant!
              </h4>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                Ich kann dir bei Actions, Projekten und Schadensberichten
                helfen. Frag mich einfach! 💬
              </p>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && quickActions.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <span className="h-px flex-1 bg-border"></span>
                Schnellaktionen
                <span className="h-px flex-1 bg-border"></span>
              </p>
              {quickActions.map((action) => (
                <Card
                  key={action.id}
                  className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:border-primary/50 transition-all duration-200 hover:shadow-md group"
                  onClick={() => handleQuickAction(action)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-3xl group-hover:scale-110 transition-transform">
                      {action.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-sm">
                          {action.title}
                        </h5>
                        {action.badge !== undefined && action.badge > 0 && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 shadow-sm">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                    : "bg-white dark:bg-muted border border-border"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
                    <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      MaintAIn Assistant
                    </span>
                  </div>
                )}
                <p
                  className={`text-sm whitespace-pre-wrap leading-relaxed ${
                    message.role === "user" ? "text-white" : "text-foreground"
                  }`}
                >
                  {message.content}
                </p>
                {message.timestamp && (
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-white/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-muted border border-border rounded-2xl p-4 max-w-[85%] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  </div>
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"></span>
                    <span
                      className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></span>
                    <span
                      className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></span>
                  </div>
                  <span className="text-sm text-muted-foreground font-medium">
                    Denke nach...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-white/50 dark:bg-muted/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Stelle mir eine Frage..."
            className="min-h-[60px] max-h-[120px] resize-none border-2 focus:border-primary/50 bg-white dark:bg-background"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
            className="h-[60px] w-[60px] rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-2">
          <kbd className="px-2 py-0.5 bg-muted rounded text-xs">Enter</kbd>
          <span>zum Senden</span>
          <span>•</span>
          <kbd className="px-2 py-0.5 bg-muted rounded text-xs">
            Shift+Enter
          </kbd>
          <span>für neue Zeile</span>
        </p>
      </div>
    </div>
  );
};
