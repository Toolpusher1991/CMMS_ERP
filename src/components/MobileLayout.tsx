import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, LogOut, FileText, User, ClipboardList } from "lucide-react";

interface MobileLayoutProps {
  children?: React.ReactNode;
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

/**
 * Mobile-optimized layout
 * Shows only essential features: Create Failure Reports and Action Points
 * Editing/Management happens on Desktop/Tablet only
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

  const handleActionTracker = () => {
    onNavigate("actions");
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
            {/* Primary Actions Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Schadensmeldung */}
              <Card className="bg-red-500/10 border-red-500/20">
                <CardContent className="p-6">
                  <Button
                    onClick={handleFailureReport}
                    className="w-full h-20 text-xl bg-red-600 hover:bg-red-700"
                    size="lg"
                  >
                    <Camera className="mr-3 h-8 w-8" />
                    Schadensmeldung
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Schaden mit Foto dokumentieren
                  </p>
                </CardContent>
              </Card>

              {/* Action Point */}
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-6">
                  <Button
                    onClick={handleActionTracker}
                    className="w-full h-20 text-xl bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <ClipboardList className="mr-3 h-8 w-8" />
                    Action Point
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Aufgabe vor Ort erstellen
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <FileText className="mr-2 h-5 w-5" />
                  Mobile Funktionen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Camera className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
                    <div>
                      <p className="font-semibold text-foreground">Schadensmeldungen</p>
                      <p>Schnelle Dokumentation mit Kamera-Integration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ClipboardList className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-semibold text-foreground">Action Points</p>
                      <p>Aufgaben direkt vor Ort erfassen</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-xs">
                      💡 <strong>Hinweis:</strong> Bearbeitung und Verwaltung erfolgt am Desktop oder Tablet
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
