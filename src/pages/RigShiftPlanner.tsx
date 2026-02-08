import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANTS = ["T208", "T207", "T46", "T700"];
const MONTHS = [
  "Januar 2026",
  "Februar 2026",
  "März 2026",
  "April 2026",
  "Mai 2026",
  "Juni 2026",
  "Juli 2026",
  "August 2026",
  "September 2026",
  "Oktober 2026",
  "November 2026",
  "Dezember 2026",
];

interface Personnel {
  id: string;
  code: string;
  position: string;
  isBackToBack: boolean;
}

interface Position {
  id: string;
  name: string;
  displayName: string;
  order: number;
}

interface Assignment {
  id: string;
  personnelId: string;
  positionId: string;
  year: number;
  month: number;
  startDay: number;
  endDay: number;
  isOff: boolean;
  isHandover: boolean;
  personnel: Personnel;
  position: Position;
}

const RigShiftPlanner: React.FC = () => {
  const { toast } = useToast();
  const [selectedPlant, setSelectedPlant] = useState<string>("T208");
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-11
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [positions, setPositions] = useState<Position[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const API_URL = "http://localhost:5137/api/shift-planner";

  // Load positions for selected plant
  const loadPositions = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/positions/${selectedPlant}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load positions");
      const data = await res.json();
      setPositions(data);
    } catch (error) {
      console.error("Error loading positions:", error);
    }
  }, [selectedPlant]);

  // Load personnel for selected plant
  const loadPersonnel = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/personnel/${selectedPlant}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load personnel");
      const data = await res.json();
      setPersonnel(data);
    } catch (error) {
      console.error("Error loading personnel:", error);
    }
  }, [selectedPlant]);

  // Load assignments for selected plant and month
  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${API_URL}/assignments/${selectedPlant}?year=2026&startMonth=${currentMonth + 1}&endMonth=${currentMonth + 1}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed to load assignments");
      const data = await res.json();
      setAssignments(data);
    } catch (error) {
      console.error("Error loading assignments:", error);
      toast({
        title: "Fehler",
        description: "Schichtplan konnte nicht geladen werden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPlant, currentMonth, toast]);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  useEffect(() => {
    loadPersonnel();
  }, [loadPersonnel]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const generateRotation = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/generate-rotation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plant: selectedPlant,
          startYear: 2026,
          startMonth: 2, // Februar
          endYear: 2026,
          endMonth: 8, // August
          workDays: 28,
          offDays: 28,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate rotation");

      const result = await res.json();
      toast({
        title: "Rotation generiert",
        description: `${result.created} Schichten für ${selectedPlant} erstellt (Feb-Aug 2026)`,
      });

      // Reload assignments
      await loadAssignments();
    } catch (error) {
      console.error("Error generating rotation:", error);
      toast({
        title: "Fehler",
        description: "Rotation konnte nicht generiert werden",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDaysInMonth = (monthIndex: number) => {
    const daysInMonths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // 2026
    return daysInMonths[monthIndex];
  };

  const days = Array.from(
    { length: getDaysInMonth(currentMonth) },
    (_, i) => i + 1,
  );

  const getAssignmentForDay = (
    positionId: string,
    personnelCode: string,
    day: number,
  ) => {
    return assignments.find(
      (a) =>
        a.positionId === positionId &&
        a.personnel.code === personnelCode &&
        day >= a.startDay &&
        day <= a.endDay &&
        !a.isOff,
    );
  };

  const isToday = (monthIndex: number, day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === 2026 &&
      today.getMonth() === monthIndex &&
      today.getDate() === day
    );
  };

  const previousMonth = () => {
    setCurrentMonth((prev) => (prev > 0 ? prev - 1 : 11));
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => (prev < 11 ? prev + 1 : 0));
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Schichtplaner - Bohranlagen
            </CardTitle>

            <div className="flex items-center gap-4">
              {/* Plant Selection */}
              <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANTS.map((plant) => (
                    <SelectItem key={plant} value={plant}>
                      {plant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Generate Rotation Button */}
              <Button
                onClick={generateRotation}
                disabled={generating}
                variant="outline"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generiere...
                  </>
                ) : (
                  "Rotation generieren (Feb-Aug)"
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[200px] text-center">
              {MONTHS[currentMonth]}
            </h2>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted sticky left-0 z-10 min-w-[150px]">
                      Position
                    </th>
                    <th className="border p-2 bg-muted">Team</th>
                    {days.map((day) => (
                      <th
                        key={day}
                        className={cn(
                          "border p-2 min-w-[40px]",
                          isToday(currentMonth, day) &&
                            "bg-cyan-100 dark:bg-cyan-950",
                        )}
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((position) => {
                    const posPersonnel = personnel.filter(
                      (p) => p.position === position.name,
                    );

                    return posPersonnel.map((person) => (
                      <tr key={`${position.id}-${person.id}`}>
                        <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                          {position.displayName}
                        </td>
                        <td className="border p-2">
                          <span
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              person.isBackToBack
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
                            )}
                          >
                            {person.code}
                          </span>
                        </td>
                        {days.map((day) => {
                          const assignment = getAssignmentForDay(
                            position.id,
                            person.code,
                            day,
                          );

                          return (
                            <td
                              key={day}
                              className={cn(
                                "border p-1 text-center",
                                assignment && "bg-green-100 dark:bg-green-950",
                                isToday(currentMonth, day) &&
                                  "ring-2 ring-cyan-500 ring-inset",
                              )}
                            >
                              {assignment && (
                                <div
                                  className="w-full h-full"
                                  title={`${person.code} on duty`}
                                >
                                  ●
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 rounded p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                Anlage
              </p>
              <p className="text-xl font-bold">{selectedPlant}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded p-3">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                Positionen
              </p>
              <p className="text-xl font-bold">{positions.length}</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 rounded p-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                Personal
              </p>
              <p className="text-xl font-bold">{personnel.length}</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-950 rounded p-3">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                Schichten
              </p>
              <p className="text-xl font-bold">{assignments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RigShiftPlanner;
