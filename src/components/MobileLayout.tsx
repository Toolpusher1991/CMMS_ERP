import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, LogOut, FileText, User } from "lucide-react";

interface MobileLayoutProps {
  children?: React.ReactNode;
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

/**
 * Mobile-optimized layout
 * Shows only essential features: Login, Failure Reporting, Logout
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  isLoggedIn,
  userName,
  onLogout,
  onNavigate,
}) => {
  const handleFailureReport = () => {
    onNavigate("failures");
  };

  if (!isLoggedIn) {
    // Show login prompt
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              📱 CMMS Mobile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Melde dich an, um Schadensmeldungen zu erstellen
            </p>
            <Button
              onClick={() => onNavigate("login")}
              className="w-full h-14 text-lg"
              size="lg"
            >
              <User className="mr-2 h-5 w-5" />
              Anmelden
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in - show mobile menu
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              MaintAIn Mobile
            </h1>
            <p className="text-sm text-gray-400">{userName}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-red-400 hover:text-red-300"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {children || (
          <div className="space-y-4 mt-8">
            {/* Primary Action: Create Failure Report */}
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="p-6">
                <Button
                  onClick={handleFailureReport}
                  className="w-full h-20 text-xl"
                  size="lg"
                >
                  <Camera className="mr-3 h-8 w-8" />
                  Schadensmeldung erstellen
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  Deine Meldungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Erstelle schnell und einfach Schadensmeldungen mit deinem
                  Handy. Fotos können direkt mit der Kamera aufgenommen werden.
                </p>
                <Button
                  variant="outline"
                  onClick={handleFailureReport}
                  className="w-full"
                >
                  Zu den Meldungen
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
