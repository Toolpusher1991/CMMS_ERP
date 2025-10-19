import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardPage() {
  const stats = [
    { title: "Gesamt Benutzer", value: "0", icon: "👥", color: "bg-blue-500" },
    { title: "Aktive Aufgaben", value: "0", icon: "📋", color: "bg-green-500" },
    { title: "Wartungen", value: "0", icon: "🔧", color: "bg-yellow-500" },
    {
      title: "Benachrichtigungen",
      value: "0",
      icon: "🔔",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Willkommen im CMMS ERP System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div
                className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center text-white text-xl`}
              >
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">Stand: Heute</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Aktivitäten</CardTitle>
            <CardDescription>Ihre letzten Aktionen im System</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Keine Aktivitäten vorhanden
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anstehende Aufgaben</CardTitle>
            <CardDescription>Ihre nächsten To-Dos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground text-center py-8">
              Keine Aufgaben vorhanden
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Schnellzugriff</CardTitle>
          <CardDescription>Häufig verwendete Funktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="text-2xl mb-2">➕</div>
              <div className="font-medium">Neue Wartung</div>
              <div className="text-sm text-muted-foreground">
                Wartungsauftrag erstellen
              </div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium">Berichte</div>
              <div className="text-sm text-muted-foreground">
                Statistiken ansehen
              </div>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">Dokumentation</div>
              <div className="text-sm text-muted-foreground">
                Anleitungen & Hilfe
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
