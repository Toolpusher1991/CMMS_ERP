import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Terminal, Users, MapPin } from "lucide-react";
import SystemDebug from "@/pages/SystemDebug";
import { EnhancedUserAdminPage } from "@/pages/EnhancedUserAdminPage";
import { LocationManagement } from "@/components/LocationManagement";

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
              <SystemDebug />
            </TabsContent>

            <TabsContent value="users" className="mt-6">
              <EnhancedUserAdminPage />
            </TabsContent>

            <TabsContent value="locations" className="mt-6">
              <LocationManagement />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
