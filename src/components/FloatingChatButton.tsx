import React, { useState, useEffect } from "react";
import { MessageCircle, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatWindow } from "./ChatWindow";
import { chatService } from "@/services/chat.service";

export const FloatingChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnreadSuggestions, setHasUnreadSuggestions] = useState(false);

  useEffect(() => {
    // Check if user has unread suggestions
    const checkSuggestions = async () => {
      try {
        const suggestions = await chatService.getQuickActions();
        setHasUnreadSuggestions(
          suggestions.some((s) => s.badge && s.badge > 0)
        );
      } catch (error) {
        console.error("Failed to check suggestions:", error);
      }
    };

    checkSuggestions();
    // Check every 60 seconds
    const interval = setInterval(checkSuggestions, 60000);

    return () => clearInterval(interval);
  }, []);

  // Escape key closes the chat
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    console.log("Closing chat"); // Debug log
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 relative group"
          >
            <MessageCircle className="h-6 w-6 text-white" />
            {hasUnreadSuggestions && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-pulse"
              >
                !
              </Badge>
            )}

            {/* Ripple effect */}
            <span className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity"></span>
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <>
          {/* Backdrop for mobile - click outside to close */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={handleClose}
          />

          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-background border-2 rounded-2xl shadow-2xl w-[400px] h-[600px] flex flex-col overflow-hidden relative">
              {/* Header with close button */}
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 flex items-center justify-between shrink-0 relative z-[9999]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">
                      MaintAIn Assistant
                    </h3>
                    <p className="text-xs text-white/80">Hier um zu helfen 🤖</p>
                  </div>
                </div>
                
                {/* Minimize and Close Buttons - Always on top */}
                <div className="flex items-center gap-2 relative z-[10000]">
                  {/* Minimize Button */}
                  <button
                    type="button"
                    onClick={handleClose}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleClose();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleClose();
                    }}
                    className="text-white hover:bg-white/20 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer bg-white/10"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Chatbot minimieren"
                    title="Minimieren"
                  >
                    <Minus className="h-6 w-6" />
                  </button>

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={handleClose}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleClose();
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      handleClose();
                    }}
                    className="text-white hover:bg-white/20 h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer bg-white/10"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    aria-label="Chatbot schließen"
                    title="Schließen"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Chat Content */}
              <ChatWindow onClose={handleClose} />
            </div>
          </div>
        </>
      )}
    </>
  );
};
