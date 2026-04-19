import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Terminal, Users, MapPin, ArrowLeft, Settings } from "lucide-react";
import { PageErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load heavy sub-panels - only load when the tab is active
const SystemDebug = lazy(() => import("@/pages/SystemDebug"));
const EnhancedUserAdminPage = lazy(() =>
  import("@/pages/EnhancedUserAdminPage").then((m) => ({
    default: m.EnhancedUserAdminPage,
  })),
);
const LocationManagement = lazy(() =>
  import("@/components/LocationManagement").then((m) => ({
    default: m.LocationManagement,
  })),
);

function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-3 text-sm text-muted-foreground">Laden...</p>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("debug");

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* H&P Navy Header */}
      <div className="bg-gradient-to-r from-[#143269] to-[#2B5597] px-6 py-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Admin Panel
            </h1>
            <p className="text-sm text-white/60">
              Zentrale Verwaltung für System-Debugging, Benutzerverwaltung und
              Standorte
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger
                  value="debug"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
                >
                  <Terminal className="h-4 w-4" />
                  <span className="hidden sm:inline">System Debug</span>
                  <span className="sm:hidden">Debug</span>
                </TabsTrigger>
                <TabsTrigger
                  value="users"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Benutzerverwaltung</span>
                  <span className="sm:hidden">User</span>
                </TabsTrigger>
                <TabsTrigger
                  value="locations"
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Standorte</span>
                  <span className="sm:hidden">Orte</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="debug" className="mt-6">
                <PageErrorBoundary>
                  <Suspense fallback={<TabLoadingFallback />}>
                    {activeTab === "debug" && <SystemDebug />}
                  </Suspense>
                </PageErrorBoundary>
              </TabsContent>

              <TabsContent value="users" className="mt-6">
                <PageErrorBoundary>
                  <Suspense fallback={<TabLoadingFallback />}>
                    {activeTab === "users" && <EnhancedUserAdminPage />}
                  </Suspense>
                </PageErrorBoundary>
              </TabsContent>

              <TabsContent value="locations" className="mt-6">
                <PageErrorBoundary>
                  <Suspense fallback={<TabLoadingFallback />}>
                    {activeTab === "locations" && <LocationManagement />}
                  </Suspense>
                </PageErrorBoundary>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
