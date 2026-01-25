import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

interface Location {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  assignedPlant?: string;
}

interface ActionFilterCardProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  disciplineFilter: string;
  onDisciplineChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  locationFilter: string;
  onLocationChange: (value: string) => void;
  userFilter: string;
  onUserChange: (value: string) => void;
  users: User[];
  availableLocations: Location[];
}

export function ActionFilterCard({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  disciplineFilter,
  onDisciplineChange,
  priorityFilter,
  onPriorityChange,
  locationFilter,
  onLocationChange,
  userFilter,
  onUserChange,
  users,
  availableLocations,
}: ActionFilterCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-semibold text-sm">Filter</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mt-3">
          {/* Search */}
          <div className="space-y-2">
            <Label>Suche</Label>
            <Input
              placeholder="Action suchen..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="OPEN">Geplant</SelectItem>
                <SelectItem value="IN_PROGRESS">Aktiv</SelectItem>
                <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category/Discipline */}
          <div className="space-y-2">
            <Label>Kategorie</Label>
            <Select value={disciplineFilter} onValueChange={onDisciplineChange}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                <SelectItem value="MECHANIK">Mechanik</SelectItem>
                <SelectItem value="ELEKTRIK">Elektrisch</SelectItem>
                <SelectItem value="ANLAGE">Anlage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priorität</Label>
            <Select value={priorityFilter} onValueChange={onPriorityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Priorität filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                <SelectItem value="LOW">Niedrig</SelectItem>
                <SelectItem value="MEDIUM">Mittel</SelectItem>
                <SelectItem value="HIGH">Hoch</SelectItem>
                <SelectItem value="URGENT">Dringend</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>Standort</Label>
            <Select value={locationFilter} onValueChange={onLocationChange}>
              <SelectTrigger>
                <SelectValue placeholder="Standort filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Standorte</SelectItem>
                {availableLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User */}
          <div className="space-y-2">
            <Label>User</Label>
            <Select value={userFilter} onValueChange={onUserChange}>
              <SelectTrigger>
                <SelectValue placeholder="User filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle User</SelectItem>
                {users.map((user) => {
                  const fullName = `${user.firstName} ${user.lastName}`;
                  return (
                    <SelectItem key={user.id} value={fullName}>
                      {fullName}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
