import { useState, lazy, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Terminal, Users, MapPin } from "lucide-react";
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
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-6 w-6 text-primary" />
            Admin Panel
          </CardTitle>
          <CardDescription>
            Zentrale Verwaltung für System-Debugging, Benutzerverwaltung und
            Standorte
          </CardDescription>
        </CardHeader>
        <CardContent>
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
  );
}
