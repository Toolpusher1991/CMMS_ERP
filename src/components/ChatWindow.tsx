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
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h4 className="font-semibold text-lg mb-2">
                Willkommen beim MaintAIn Assistant!
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Ich kann dir bei Actions, Projekten und Schadensberichten
                helfen.
              </p>
            </div>
          )}

          {/* Quick Actions */}
          {showQuickActions && quickActions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Häufige Aktionen:</p>
              {quickActions.map((action) => (
                <Card
                  key={action.id}
                  className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleQuickAction(action)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{action.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium text-sm">{action.title}</h5>
                        {action.badge !== undefined && action.badge > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
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
                className={`max-w-[80%] rounded-2xl p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      MaintAIn
                    </span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>
                {message.timestamp && (
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-primary-foreground/70"
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
              <div className="bg-muted rounded-2xl p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Denke nach...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t bg-muted/30">
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
            placeholder="Schreibe eine Nachricht..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            size="icon"
            className="h-[60px] w-[60px] rounded-xl"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Drücke Enter zum Senden • Shift+Enter für neue Zeile
        </p>
      </div>
    </div>
  );
};
