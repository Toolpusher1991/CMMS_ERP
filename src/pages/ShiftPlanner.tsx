import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Calendar,
  Users,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  Plus,
  Edit2,
  Hotel,
  Info,
  UserPlus,
  X,
  ArrowLeftRight,
  Clock,
  Mail,
  HeartPulse,
  Palmtree,
  GraduationCap,
  AlertCircle,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

// Abwesenheitstypen
type AbsenceType = "work" | "off" | "sick" | "vacation" | "training" | "other";

const ABSENCE_TYPES: {
  value: AbsenceType;
  label: string;
  color: string;
  icon: string;
  bgClass: string;
}[] = [
  {
    value: "work",
    label: "Arbeit",
    color: "blue",
    icon: "briefcase",
    bgClass: "bg-blue-600 dark:bg-blue-700",
  },
  {
    value: "off",
    label: "Frei",
    color: "slate",
    icon: "clock",
    bgClass: "bg-slate-500 dark:bg-slate-600",
  },
  {
    value: "sick",
    label: "Krank",
    color: "red",
    icon: "heart",
    bgClass: "bg-red-500 dark:bg-red-600",
  },
  {
    value: "vacation",
    label: "Urlaub",
    color: "green",
    icon: "palm",
    bgClass: "bg-green-500 dark:bg-green-600",
  },
  {
    value: "training",
    label: "Schulung",
    color: "purple",
    icon: "graduation",
    bgClass: "bg-purple-500 dark:bg-purple-600",
  },
  {
    value: "other",
    label: "Sonstiges",
    color: "orange",
    icon: "alert",
    bgClass: "bg-orange-500 dark:bg-orange-600",
  },
];

interface Assignment {
  person: string;
  position: string;
  row: number;
  month: number;
  startDay: number;
  endDay: number;
  days: number;
  isOff: boolean;
  isHandover: boolean; // Übergabetag - beide Schichten gleichzeitig
  workDays: number; // Arbeitstage (Standard 15)
  offDays: number; // Freie Tage (Standard 13)
  absenceType?: AbsenceType; // Abwesenheitstyp
  accommodation: string;
  notes: string;
}

interface DragItem {
  type: "person" | "assignment";
  person?: string;
  key?: string;
}

interface EditingAssignment extends Assignment {
  key: string;
}

const ShiftPlanner: React.FC = () => {
  const { toast } = useToast();
  // Setze aktuellen Monat (Februar 2026 = Index 1)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return now.getMonth(); // 0-11, wobei 0 = Januar
  });
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Assignment>>(
    {},
  );
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [showAddPersonnel, setShowAddPersonnel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<EditingAssignment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "position" | "personnel" | "assignment";
    value: string;
  } | null>(null);

  // State für Mail-Benachrichtigungs-Dialog
  const [pendingDrop, setPendingDrop] = useState<{
    person: string;
    position: string;
    row: number;
    startDay: number;
    isMove: boolean;
    oldAssignments?: Record<string, Assignment>;
    workDays: number;
    offDays: number;
    cycles: number; // Anzahl der Schicht-Zyklen
    accommodation: string;
    notes: string;
  } | null>(null);

  // State für Abwesenheits-Dialog (Krankheit, Urlaub, Schulung, etc.)
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceData, setAbsenceData] = useState<{
    person: string;
    position: string;
    row: number;
    startDay: number;
    endDay: number;
    absenceType: AbsenceType;
    notes: string;
  } | null>(null);

  const [positions, setPositions] = useState<string[]>([
    "TP",
    "NTP",
    "Driller",
    "Assistant Driller",
    "Electrician",
    "Mechanic",
    "RSC",
    "Roughneck 1",
    "Roughneck 2",
    "Roughneck 3",
    "Roughneck 4",
  ]);
  const [newPositionName, setNewPositionName] = useState("");

  const [availablePersonnel, setAvailablePersonnel] = useState<string[]>([
    "TP",
    "NTP",
    "Driller",
    "Assistant Driller",
    "Electrician",
    "Mechanic",
    "RSC",
    "Roughneck 1",
    "Roughneck 2",
    "Roughneck 3",
    "Roughneck 4",
  ]);
  const [newPersonnelName, setNewPersonnelName] = useState("");

  const months = useMemo(
    () => [
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
    ],
    [],
  );

  const getDaysInMonth = useCallback((monthIndex: number): number => {
    return new Date(2026, monthIndex + 1, 0).getDate();
  }, []);

  const getWeekday = useCallback((monthIndex: number, day: number): string => {
    const date = new Date(2026, monthIndex, day);
    const days = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
    return days[date.getDay()];
  }, []);

  const isWeekend = useCallback((monthIndex: number, day: number): boolean => {
    const date = new Date(2026, monthIndex, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  }, []);

  // Prüft ob ein Tag der heutige Tag ist
  const isToday = useCallback((monthIndex: number, day: number): boolean => {
    const today = new Date();
    const checkDate = new Date(2026, monthIndex, day);
    return (
      checkDate.getDate() === today.getDate() &&
      checkDate.getMonth() === today.getMonth() &&
      checkDate.getFullYear() === today.getFullYear()
    );
  }, []);

  const days = useMemo(
    () => Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1),
    [currentMonth, getDaysInMonth],
  );

  const generateUniqueId = useCallback((): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, item: DragItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const createAssignmentPeriods = useCallback(
    (
      person: string,
      position: string,
      startMonth: number,
      startDay: number,
      row: number,
      accommodation = "",
      notes = "",
      workDays = 15, // Arbeitstage - Standard 15, anpassbar
      offDays = 13, // Freie Tage - Standard 13, anpassbar
      cycles = 1, // Anzahl der Schicht-Zyklen
    ): Record<string, Assignment> => {
      const newAssignments: Record<string, Assignment> = {};
      let currentMonthIdx = startMonth;
      let currentDay = startDay;

      // Schleife über alle gewünschten Zyklen
      for (let cycle = 0; cycle < cycles; cycle++) {
        if (currentMonthIdx > 11) break;

        let remainingWorkDays = workDays;
        let remainingOffDays = offDays;
        let isWorkPeriod = true;

        while (remainingWorkDays > 0 || remainingOffDays > 0) {
          if (currentMonthIdx > 11) break;

          const daysInCurrentMonth = getDaysInMonth(currentMonthIdx);
          const daysLeftInMonth = daysInCurrentMonth - currentDay + 1;

          if (isWorkPeriod && remainingWorkDays > 0) {
            const daysToAssign = Math.min(remainingWorkDays, daysLeftInMonth);
            const endDay = currentDay + daysToAssign - 1;

            // Der letzte Arbeitstag ist der Übergabetag
            const isLastWorkBlock = remainingWorkDays - daysToAssign === 0;

            const key = generateUniqueId();
            newAssignments[key] = {
              person,
              position,
              row,
              month: currentMonthIdx,
              startDay: currentDay,
              endDay,
              days: daysToAssign,
              isOff: false,
              isHandover: isLastWorkBlock, // Markiert Block mit Übergabetag am Ende
              workDays,
              offDays,
              absenceType: "work",
              accommodation,
              notes,
            };

            remainingWorkDays -= daysToAssign;
            currentDay = endDay + 1;

            if (currentDay > daysInCurrentMonth) {
              currentMonthIdx++;
              currentDay = 1;
            }

            if (remainingWorkDays === 0) {
              isWorkPeriod = false;
            }
          } else if (!isWorkPeriod && remainingOffDays > 0) {
            const daysToAssign = Math.min(remainingOffDays, daysLeftInMonth);
            const endDay = currentDay + daysToAssign - 1;

            const key = generateUniqueId();
            newAssignments[key] = {
              person,
              position,
              row,
              month: currentMonthIdx,
              startDay: currentDay,
              endDay,
              days: daysToAssign,
              isOff: true,
              isHandover: false,
              workDays,
              offDays,
              absenceType: "off",
              accommodation,
              notes,
            };

            remainingOffDays -= daysToAssign;
            currentDay = endDay + 1;

            if (currentDay > daysInCurrentMonth) {
              currentMonthIdx++;
              currentDay = 1;
            }

            if (remainingOffDays === 0) {
              break; // Beende diesen Zyklus, starte nächsten
            }
          }
        }
      }

      return newAssignments;
    },
    [getDaysInMonth, generateUniqueId],
  );

  const removeRelatedAssignments = useCallback(
    (
      person: string,
      position: string,
      row: number,
      startMonth: number,
    ): Record<string, Assignment> => {
      const newAssignments = { ...assignments };
      Object.keys(newAssignments).forEach((key) => {
        const assignment = newAssignments[key];
        if (
          assignment.person === person &&
          assignment.position === position &&
          assignment.row === row &&
          assignment.month >= startMonth
        ) {
          delete newAssignments[key];
        }
      });
      return newAssignments;
    },
    [assignments],
  );

  // Erstellt einen einzelnen Abwesenheits-Eintrag (Krankheit, Urlaub, Schulung, etc.)
  const createAbsenceEntry = useCallback(
    (
      person: string,
      position: string,
      row: number,
      month: number,
      startDay: number,
      endDay: number,
      absenceType: AbsenceType,
      notes = "",
    ): Record<string, Assignment> => {
      const newAssignments: Record<string, Assignment> = {};

      // Wenn endDay < startDay, geht es über Monatsende
      if (endDay < startDay) {
        // Erster Block: startDay bis Monatsende
        const daysInMonth = getDaysInMonth(month);
        const firstBlockDays = daysInMonth - startDay + 1;
        const key1 = generateUniqueId();
        newAssignments[key1] = {
          person,
          position,
          row,
          month: month,
          startDay: startDay,
          endDay: daysInMonth,
          days: firstBlockDays,
          isOff: absenceType !== "work",
          isHandover: false,
          workDays: 0,
          offDays: 0,
          absenceType,
          accommodation: "",
          notes,
        };

        // Zweiter Block: 1 bis endDay im nächsten Monat
        if (month < 11) {
          const key2 = generateUniqueId();
          newAssignments[key2] = {
            person,
            position,
            row,
            month: month + 1,
            startDay: 1,
            endDay: endDay,
            days: endDay,
            isOff: absenceType !== "work",
            isHandover: false,
            workDays: 0,
            offDays: 0,
            absenceType,
            accommodation: "",
            notes,
          };
        }
      } else {
        // Normaler Fall: innerhalb eines Monats
        const key = generateUniqueId();
        newAssignments[key] = {
          person,
          position,
          row,
          month: month,
          startDay,
          endDay,
          days: endDay - startDay + 1,
          isOff: absenceType !== "work",
          isHandover: false,
          workDays: 0,
          offDays: 0,
          absenceType,
          accommodation: "",
          notes,
        };
      }

      return newAssignments;
    },
    [getDaysInMonth, generateUniqueId],
  );

  // Prüft ob eine Person bereits in einem Zeitraum gebucht ist
  const checkOverlap = useCallback(
    (
      person: string,
      newAssignments: Record<string, Assignment>,
      excludePosition?: string,
      excludeRow?: number,
    ): {
      hasOverlap: boolean;
      overlappingAssignment?: Assignment;
    } => {
      // Prüfe alle neuen Zuweisungen gegen existierende
      for (const newAssignment of Object.values(newAssignments)) {
        for (const [_key, existing] of Object.entries(assignments)) {
          // Überspringe wenn es die gleiche Person an der gleichen Position/Zeile ist (Move-Operation)
          if (
            existing.person === person &&
            existing.position === excludePosition &&
            existing.row === excludeRow
          ) {
            continue;
          }

          // Nur prüfen wenn es die gleiche Person ist
          if (existing.person !== person) continue;

          // Nur prüfen wenn es im gleichen Monat ist
          if (existing.month !== newAssignment.month) continue;

          // Prüfe auf Überschneidung der Tage
          const existingStart = existing.startDay;
          const existingEnd = existing.endDay;
          const newStart = newAssignment.startDay;
          const newEnd = newAssignment.endDay;

          // Überschneidung liegt vor wenn:
          // - neuer Start liegt innerhalb des existierenden Zeitraums
          // - neues Ende liegt innerhalb des existierenden Zeitraums
          // - neuer Zeitraum umschließt den existierenden komplett
          const overlaps =
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd);

          if (overlaps) {
            return {
              hasOverlap: true,
              overlappingAssignment: existing,
            };
          }
        }
      }

      return { hasOverlap: false };
    },
    [assignments],
  );

  // Speichert Abwesenheits-Eintrag
  const saveAbsence = useCallback(() => {
    if (!absenceData) return;

    const { person, position, row, startDay, endDay, absenceType, notes } =
      absenceData;

    const newEntries = createAbsenceEntry(
      person,
      position,
      row,
      currentMonth,
      startDay,
      endDay,
      absenceType,
      notes,
    );

    // Prüfe auf Überschneidungen mit existierenden Zuweisungen
    const { hasOverlap, overlappingAssignment } = checkOverlap(
      person,
      newEntries,
    );

    if (hasOverlap && overlappingAssignment) {
      toast({
        title: "Überschneidung erkannt",
        description: `${person} ist bereits von Tag ${overlappingAssignment.startDay} bis ${overlappingAssignment.endDay} bei "${overlappingAssignment.position}" eingeteilt. Bitte entfernen Sie zuerst die bestehende Zuweisung.`,
        variant: "destructive",
      });
      setShowAbsenceModal(false);
      setAbsenceData(null);
      return;
    }

    setAssignments({ ...assignments, ...newEntries });

    const typeLabel =
      ABSENCE_TYPES.find((t) => t.value === absenceType)?.label || absenceType;
    toast({
      title: "Abwesenheit eingetragen",
      description: `${typeLabel} für ${person}: Tag ${startDay}-${endDay}`,
    });

    setShowAbsenceModal(false);
    setAbsenceData(null);
  }, [
    absenceData,
    assignments,
    currentMonth,
    createAbsenceEntry,
    checkOverlap,
    toast,
  ]);

  const handleDrop = useCallback(
    (e: React.DragEvent, position: string, row: number, startDay: number) => {
      e.preventDefault();

      if (!draggedItem) return;

      if (draggedItem.type === "assignment" && draggedItem.key) {
        const oldData = assignments[draggedItem.key];

        const clearedAssignments = removeRelatedAssignments(
          oldData.person,
          oldData.position,
          oldData.row,
          oldData.month,
        );

        // Zeige Bestätigungsdialog mit Mail-Option
        setPendingDrop({
          person: oldData.person,
          position,
          row,
          startDay,
          isMove: true,
          oldAssignments: clearedAssignments,
          workDays: oldData.workDays ?? 15,
          offDays: oldData.offDays ?? 13,
          cycles: 1,
          accommodation: oldData.accommodation,
          notes: oldData.notes,
        });
      } else if (draggedItem.type === "person" && draggedItem.person) {
        // Zeige Bestätigungsdialog mit Mail-Option
        setPendingDrop({
          person: draggedItem.person,
          position,
          row,
          startDay,
          isMove: false,
          workDays: 15,
          offDays: 13,
          cycles: 1,
          accommodation: "",
          notes: "",
        });
      }

      setDraggedItem(null);
    },
    [draggedItem, assignments, removeRelatedAssignments],
  );

  // Bestätigt den Drop und erstellt die Zuweisung
  const confirmDrop = useCallback(
    (sendEmail: boolean) => {
      if (!pendingDrop) return;

      const {
        person,
        position,
        row,
        startDay,
        isMove,
        oldAssignments,
        workDays,
        offDays,
        cycles,
        accommodation,
        notes,
      } = pendingDrop;

      const newPeriods = createAssignmentPeriods(
        person,
        position,
        currentMonth,
        startDay,
        row,
        accommodation,
        notes,
        workDays,
        offDays,
        cycles,
      );

      // Prüfe auf Überschneidungen (außer bei Move der gleichen Position)
      const { hasOverlap, overlappingAssignment } = checkOverlap(
        person,
        newPeriods,
        isMove ? position : undefined,
        isMove ? row : undefined,
      );

      if (hasOverlap && overlappingAssignment) {
        toast({
          title: "Überschneidung erkannt",
          description: `${person} ist bereits von Tag ${overlappingAssignment.startDay} bis ${overlappingAssignment.endDay} bei "${overlappingAssignment.position}" eingeteilt.`,
          variant: "destructive",
        });
        setPendingDrop(null);
        return;
      }

      if (isMove && oldAssignments) {
        setAssignments({ ...oldAssignments, ...newPeriods });
      } else {
        setAssignments({ ...assignments, ...newPeriods });
      }

      // Toast mit Feedback
      const cycleText = cycles > 1 ? ` (${cycles} Zyklen)` : "";
      toast({
        title: isMove ? "Schicht verschoben" : "Schicht zugewiesen",
        description: sendEmail
          ? `${person} wurde zu ${position} zugewiesen${cycleText}. E-Mail Benachrichtigung wird gesendet.`
          : `${person} wurde zu ${position} zugewiesen${cycleText}.`,
      });

      // Hier könnte die echte E-Mail-Logik implementiert werden
      if (sendEmail) {
        console.log(
          `[EMAIL] Benachrichtigung an ${person} für Position ${position}, Start: Tag ${startDay}`,
        );
        // TODO: API-Call für E-Mail-Versand
      }

      setPendingDrop(null);
    },
    [
      pendingDrop,
      assignments,
      currentMonth,
      createAssignmentPeriods,
      checkOverlap,
      toast,
    ],
  );

  const cancelDrop = useCallback(() => {
    setPendingDrop(null);
  }, []);

  const handleRemove = useCallback(
    (key: string) => {
      const assignment = assignments[key];
      const newAssignments = removeRelatedAssignments(
        assignment.person,
        assignment.position,
        assignment.row,
        assignment.month,
      );
      setAssignments(newAssignments);
      toast({
        title: "Schicht entfernt",
        description: `${assignment.person} wurde von ${assignment.position} entfernt.`,
      });
      setDeleteConfirm(null);
    },
    [assignments, removeRelatedAssignments, toast],
  );

  const handleEdit = useCallback((key: string, data: Assignment) => {
    setEditingAssignment({
      key,
      ...data,
      workDays: data.workDays ?? 15,
      offDays: data.offDays ?? 13,
    });
    setShowEditModal(true);
  }, []);

  // Funktion zum Neuberechnen der Schicht mit neuen Freizeit-Tagen
  const recalculateAssignment = useCallback(() => {
    if (!editingAssignment) return;

    const { person, position, row, accommodation, notes, workDays, offDays } =
      editingAssignment;

    // Finde den frühesten Starttag dieser Schichtzuweisung
    const relatedAssignments = Object.entries(assignments)
      .filter(
        ([, a]) =>
          a.person === person &&
          a.position === position &&
          a.row === row &&
          !a.isOff,
      )
      .sort((a, b) => {
        if (a[1].month !== b[1].month) return a[1].month - b[1].month;
        return a[1].startDay - b[1].startDay;
      });

    if (relatedAssignments.length === 0) return;

    const firstAssignment = relatedAssignments[0][1];
    const startMonth = firstAssignment.month;
    const startDay = firstAssignment.startDay;

    // Entferne alle alten Zuweisungen für diese Person/Position/Row
    const clearedAssignments = removeRelatedAssignments(
      person,
      position,
      row,
      startMonth,
    );

    // Erstelle neue Zuweisungen mit den angepassten Tagen
    const newPeriods = createAssignmentPeriods(
      person,
      position,
      startMonth,
      startDay,
      row,
      accommodation,
      notes,
      workDays ?? 15,
      offDays ?? 13,
    );

    setAssignments({ ...clearedAssignments, ...newPeriods });
    setShowEditModal(false);
    setEditingAssignment(null);
    toast({
      title: "Schicht aktualisiert",
      description: `${workDays ?? 15} Arbeitstage, ${offDays ?? 13} freie Tage.`,
    });
  }, [
    editingAssignment,
    assignments,
    removeRelatedAssignments,
    createAssignmentPeriods,
    toast,
  ]);

  const handleSaveEdit = useCallback(() => {
    if (editingAssignment) {
      const originalAssignment = assignments[editingAssignment.key];
      const workDaysChanged =
        originalAssignment &&
        (originalAssignment.workDays ?? 15) !==
          (editingAssignment.workDays ?? 15);
      const offDaysChanged =
        originalAssignment &&
        (originalAssignment.offDays ?? 13) !==
          (editingAssignment.offDays ?? 13);

      if (workDaysChanged || offDaysChanged) {
        // Wenn Arbeits- oder Freizeit geändert wurde, komplett neu berechnen
        recalculateAssignment();
        return;
      }

      // Ansonsten nur Unterkunft und Notizen aktualisieren
      const newAssignments = { ...assignments };
      const { key, ...data } = editingAssignment;
      newAssignments[key] = data;

      const {
        person,
        position,
        row,
        month,
        accommodation,
        notes,
        workDays,
        offDays,
      } = data;

      // Update all related assignments with same accommodation/notes/workDays/offDays
      Object.keys(newAssignments).forEach((k) => {
        if (
          newAssignments[k].person === person &&
          newAssignments[k].position === position &&
          newAssignments[k].row === row &&
          newAssignments[k].month >= month
        ) {
          newAssignments[k].accommodation = accommodation;
          newAssignments[k].notes = notes;
          newAssignments[k].workDays = workDays;
          newAssignments[k].offDays = offDays;
        }
      });

      setAssignments(newAssignments);
      setShowEditModal(false);
      setEditingAssignment(null);
      toast({
        title: "Gespeichert",
        description: "Die Schichtdetails wurden aktualisiert.",
      });
    }
  }, [editingAssignment, assignments, toast, recalculateAssignment]);

  const isDateInAssignment = useCallback(
    (
      position: string,
      row: number,
      day: number,
    ): { key: string; data: Assignment } | null => {
      const assignmentsForPosition = Object.entries(assignments).filter(
        ([, data]) =>
          data.position === position &&
          data.row === row &&
          data.month === currentMonth,
      );

      for (const [key, data] of assignmentsForPosition) {
        if (day >= data.startDay && day <= data.endDay) {
          return { key, data };
        }
      }
      return null;
    },
    [assignments, currentMonth],
  );

  const handleAddPosition = useCallback(() => {
    if (newPositionName.trim()) {
      if (positions.includes(newPositionName.trim())) {
        toast({
          title: "Fehler",
          description: "Diese Position existiert bereits.",
          variant: "destructive",
        });
        return;
      }
      setPositions([...positions, newPositionName.trim()]);
      setNewPositionName("");
      setShowAddPosition(false);
      toast({
        title: "Position hinzugefügt",
        description: `"${newPositionName.trim()}" wurde hinzugefügt.`,
      });
    }
  }, [newPositionName, positions, toast]);

  const handleRemovePosition = useCallback(
    (position: string) => {
      setPositions(positions.filter((p) => p !== position));
      const newAssignments = { ...assignments };
      Object.keys(newAssignments).forEach((key) => {
        if (newAssignments[key].position === position) {
          delete newAssignments[key];
        }
      });
      setAssignments(newAssignments);
      setDeleteConfirm(null);
      toast({
        title: "Position entfernt",
        description: `"${position}" wurde entfernt.`,
      });
    },
    [positions, assignments, toast],
  );

  const handleAddPersonnel = useCallback(() => {
    if (newPersonnelName.trim()) {
      if (availablePersonnel.includes(newPersonnelName.trim())) {
        toast({
          title: "Fehler",
          description: "Diese Person existiert bereits.",
          variant: "destructive",
        });
        return;
      }
      setAvailablePersonnel([...availablePersonnel, newPersonnelName.trim()]);
      setNewPersonnelName("");
      setShowAddPersonnel(false);
      toast({
        title: "Mitarbeiter hinzugefügt",
        description: `"${newPersonnelName.trim()}" wurde hinzugefügt.`,
      });
    }
  }, [newPersonnelName, availablePersonnel, toast]);

  const handleRemovePersonnel = useCallback(
    (person: string) => {
      setAvailablePersonnel(availablePersonnel.filter((p) => p !== person));
      // Also remove all assignments for this person
      const newAssignments = { ...assignments };
      Object.keys(newAssignments).forEach((key) => {
        if (newAssignments[key].person === person) {
          delete newAssignments[key];
        }
      });
      setAssignments(newAssignments);
      setDeleteConfirm(null);
      toast({
        title: "Mitarbeiter entfernt",
        description: `"${person}" wurde entfernt.`,
      });
    },
    [availablePersonnel, assignments, toast],
  );

  const exportData = useCallback(() => {
    const dataStr = JSON.stringify(
      { assignments, positions, availablePersonnel },
      null,
      2,
    );
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `personalplan_${months[currentMonth].replace(" ", "_")}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
    toast({
      title: "Export erfolgreich",
      description: "Der Schichtplan wurde exportiert.",
    });
  }, [assignments, positions, availablePersonnel, currentMonth, months, toast]);

  // Speichern in localStorage
  const saveData = useCallback(() => {
    const data = {
      assignments,
      positions,
      availablePersonnel,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("shiftPlannerData", JSON.stringify(data));
    toast({
      title: "Gespeichert",
      description: "Der Schichtplan wurde erfolgreich gespeichert.",
    });
  }, [assignments, positions, availablePersonnel, toast]);

  // Laden aus localStorage beim Start - DEAKTIVIERT für Präsentation
  useEffect(() => {
    const savedData = localStorage.getItem("shiftPlannerData");
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.assignments) setAssignments(data.assignments);
        if (data.positions) setPositions(data.positions);
        // availablePersonnel NICHT laden - verwende Standard-Namen
        // if (data.availablePersonnel)
        //   setAvailablePersonnel(data.availablePersonnel);
        console.log("Schichtplan geladen:", data.savedAt);
      } catch (error) {
        console.error("Fehler beim Laden des Schichtplans:", error);
      }
    }
  }, []);

  const importData = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.assignments) setAssignments(data.assignments);
            if (data.positions) setPositions(data.positions);
            if (data.availablePersonnel)
              setAvailablePersonnel(data.availablePersonnel);
            toast({
              title: "Import erfolgreich",
              description: "Der Schichtplan wurde importiert.",
            });
          } catch {
            toast({
              title: "Import fehlgeschlagen",
              description: "Die Datei konnte nicht gelesen werden.",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
      // Reset input
      e.target.value = "";
    },
    [toast],
  );

  const stats = useMemo(() => {
    const currentAssignments = Object.values(assignments).filter(
      (a) => a.month === currentMonth && !a.isOff,
    );
    const assignedSlots = new Set(
      currentAssignments.map((a) => `${a.position}-${a.row}`),
    ).size;
    const totalPersonnel = new Set(currentAssignments.map((a) => a.person))
      .size;
    const offDuty = Object.values(assignments).filter(
      (a) => a.month === currentMonth && a.isOff,
    ).length;

    const allWorkAssignments = Object.values(assignments).filter(
      (a) => !a.isOff,
    );
    const totalActivePersonnel = new Set(
      allWorkAssignments.map((a) => a.person),
    ).size;

    // Abwesenheitsstatistiken
    const currentMonthAssignments = Object.values(assignments).filter(
      (a) => a.month === currentMonth,
    );
    const sickCount = currentMonthAssignments.filter(
      (a) => a.absenceType === "sick",
    ).length;
    const vacationCount = currentMonthAssignments.filter(
      (a) => a.absenceType === "vacation",
    ).length;
    const trainingCount = currentMonthAssignments.filter(
      (a) => a.absenceType === "training",
    ).length;

    return {
      assignedSlots,
      totalSlots: positions.length * 3, // 3 Zeilen: Hauptschicht, Vertretung, Krankh./Urlaub
      totalPersonnel,
      offDuty,
      totalActivePersonnel,
      sickCount,
      vacationCount,
      trainingCount,
    };
  }, [assignments, currentMonth, positions.length]);

  const renderAssignmentBlock = useCallback(
    (assignment: { key: string; data: Assignment }, day: number) => {
      if (day !== assignment.data.startDay) return null;

      const width = assignment.data.endDay - assignment.data.startDay + 1;
      const isHandoverBlock =
        assignment.data.isHandover && !assignment.data.isOff;

      // Farben basierend auf absenceType
      const absenceType =
        assignment.data.absenceType || (assignment.data.isOff ? "off" : "work");
      const typeConfig =
        ABSENCE_TYPES.find((t) => t.value === absenceType) || ABSENCE_TYPES[0];
      const bgColor = typeConfig.bgClass;

      // Schicht-Typ für Driller, ADs und Roughnecks - 7-1-7 Rotation mit Gradient
      const getShiftGradient = () => {
        const person = assignment.data.person;
        
        // Nur für Driller, AD und Roughnecks
        const isDriller = person === "Driller";
        const isAD = person === "Assistant Driller";
        const isRoughneck = person.startsWith("Roughneck");
        
        if (!isDriller && !isAD && !isRoughneck) return null;
        if (absenceType !== "work") return null;
        
        const totalDays = width;
        
        // Für 15-Tage-Rotation: 7 Tage Nacht (46.67%) + 1 Tag Wechsel (6.67%) + 7 Tage Tag (46.67%)
        const nightPercent = (7 / totalDays) * 100;
        const handoverStart = nightPercent;
        const handoverEnd = ((7 + 1) / totalDays) * 100;
        
        return `linear-gradient(to right, 
          #1d4ed8 0%, 
          #1d4ed8 ${nightPercent}%, 
          #f97316 ${nightPercent}%, 
          #f97316 ${handoverEnd}%, 
          #fbbf24 ${handoverEnd}%, 
          #fbbf24 100%)`;
      };

      const customShiftGradient = getShiftGradient();

      // Übergabetag-Block bekommt einen dezenten rechten Rand
      const borderStyle = isHandoverBlock ? "border-r-4 border-amber-400" : "";

      // Icon basierend auf Typ
      const renderTypeIcon = () => {
        switch (absenceType) {
          case "sick":
            return (
              <HeartPulse className="w-3 h-3 text-white/90 flex-shrink-0" />
            );
          case "vacation":
            return <Palmtree className="w-3 h-3 text-white/90 flex-shrink-0" />;
          case "training":
            return (
              <GraduationCap className="w-3 h-3 text-white/90 flex-shrink-0" />
            );
          case "other":
            return (
              <AlertCircle className="w-3 h-3 text-white/90 flex-shrink-0" />
            );
          default:
            return null;
        }
      };

      // Label für Abwesenheitstyp
      const getTypeLabel = () => {
        switch (absenceType) {
          case "off":
            return "FREI";
          case "sick":
            return "KRANK";
          case "vacation":
            return "URLAUB";
          case "training":
            return "SCHULUNG";
          case "other":
            return "SONSTIG";
          default:
            return null;
        }
      };

      return (
        <div
          key={assignment.key}
          draggable
          onDragStart={(e) =>
            handleDragStart(e, {
              type: "assignment",
              key: assignment.key,
            })
          }
          className={cn(
            "flex items-center justify-between rounded-md px-2 py-1 cursor-move hover:opacity-90 shadow-sm transition-opacity relative",
            !customShiftGradient && bgColor,
            borderStyle,
          )}
          style={{
            background: customShiftGradient || undefined,
            width: `${width * 3}rem`,
            height: "44px",
            marginTop: "2px",
          }}
        >
          {/* Schicht-Labels für Driller, ADs und Roughnecks */}
          {customShiftGradient && (
            <>
              <span className="absolute top-1 text-xs font-bold text-white pointer-events-none" style={{ left: '23%', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Nacht
              </span>
              <span className="absolute top-1 text-xs font-bold text-white pointer-events-none" style={{ left: '50%', transform: 'translateX(-50%)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                W
              </span>
              <span className="absolute top-1 text-xs font-bold text-white pointer-events-none" style={{ left: '77%', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Tag
              </span>
            </>
          )}
          <div className="flex items-center justify-between h-full w-full relative z-10">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <GripVertical className="w-3 h-3 text-white/70 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-white truncate">
                    {assignment.data.person}
                  </span>
                  {renderTypeIcon()}
                  {getTypeLabel() && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1 py-0 h-4 bg-white/20 text-white"
                    >
                      {getTypeLabel()}
                    </Badge>
                  )}
                  {isHandoverBlock && (
                    <span title="Übergabetag" className="flex items-center">
                      <ArrowLeftRight className="w-3 h-3 text-amber-300 flex-shrink-0" />
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/80">
                  {assignment.data.days}T ({assignment.data.startDay}-
                  {assignment.data.endDay})
                  {absenceType === "work" &&
                    assignment.data.workDays !== undefined &&
                    assignment.data.workDays !== 15 && (
                      <span className="ml-1">
                        • {assignment.data.workDays}d
                      </span>
                    )}
                  {absenceType === "off" &&
                    assignment.data.offDays !== undefined &&
                    assignment.data.offDays !== 13 && (
                      <span className="ml-1">
                        • {assignment.data.offDays}d frei
                      </span>
                    )}
                </span>
              </div>
            </div>
            <div className="flex gap-0.5 ml-1">
              {assignment.data.accommodation && (
                <Hotel className="w-3 h-3 text-white/70" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(assignment.key, assignment.data);
                }}
                className="text-white/80 hover:text-white p-0.5"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm({
                    type: "assignment",
                    value: assignment.key,
                  });
                }}
                className="text-white/80 hover:text-white p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      );
    },
    [handleDragStart, handleEdit],
  );

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment?.absenceType === "work" ||
              (!editingAssignment?.absenceType && !editingAssignment?.isOff)
                ? "Arbeitsperiode - Details"
                : `${ABSENCE_TYPES.find((t) => t.value === editingAssignment?.absenceType)?.label || "Abwesenheit"} - Details`}
            </DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Details für diese Schicht.
            </DialogDescription>
          </DialogHeader>

          {editingAssignment && (
            <div className="space-y-4">
              <div>
                <Label>Mitarbeiter</Label>
                <Input
                  value={editingAssignment.person}
                  disabled
                  className="bg-muted"
                />
              </div>

              {/* Abwesenheitstyp ändern */}
              <div>
                <Label className="mb-2 block">Typ ändern</Label>
                <div className="flex gap-2 flex-wrap">
                  {ABSENCE_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={
                        (editingAssignment.absenceType ||
                          (editingAssignment.isOff ? "off" : "work")) ===
                        type.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setEditingAssignment({
                          ...editingAssignment,
                          absenceType: type.value,
                          isOff: type.value !== "work",
                        })
                      }
                      className={cn(
                        "text-xs",
                        (editingAssignment.absenceType ||
                          (editingAssignment.isOff ? "off" : "work")) ===
                          type.value && type.bgClass,
                      )}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Arbeitstage anpassen - nur bei Arbeitsblöcken */}
              {(editingAssignment.absenceType === "work" ||
                (!editingAssignment.absenceType &&
                  !editingAssignment.isOff)) && (
                <div>
                  <Label className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Arbeitstage
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      value={editingAssignment.workDays ?? 15}
                      onChange={(e) =>
                        setEditingAssignment({
                          ...editingAssignment,
                          workDays: Math.max(
                            1,
                            Math.min(28, parseInt(e.target.value) || 15),
                          ),
                        })
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      Tage (Standard: 15)
                    </span>
                  </div>
                  {/* Quick-Select Buttons für Arbeitstage */}
                  <div className="flex gap-2 mt-2">
                    {[7, 14, 15, 21].map((days) => (
                      <Button
                        key={days}
                        variant={
                          (editingAssignment.workDays ?? 15) === days
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setEditingAssignment({
                            ...editingAssignment,
                            workDays: days,
                          })
                        }
                      >
                        {days}T
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <ArrowLeftRight className="w-3 h-3" />
                    Letzter Arbeitstag = Übergabetag (beide Schichten auf
                    Anlage)
                  </p>
                </div>
              )}

              {/* Freizeit anpassen - für alle Blöcke */}
              <div>
                <Label className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Freie Tage nach Schicht
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    value={editingAssignment.offDays ?? 13}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        offDays: Math.max(
                          0,
                          Math.min(20, parseInt(e.target.value) || 13),
                        ),
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    Tage (Standard: 13)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Weniger Tage = frühere Anreise zum nächsten Einsatz
                </p>
                {/* Quick-Select Buttons */}
                <div className="flex gap-2 mt-2">
                  {[10, 11, 12, 13].map((days) => (
                    <Button
                      key={days}
                      variant={
                        (editingAssignment.offDays ?? 13) === days
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setEditingAssignment({
                          ...editingAssignment,
                          offDays: days,
                        })
                      }
                    >
                      {days}T
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Hotel className="w-4 h-4" />
                  Unterkunft (Hotel/Container)
                </Label>
                <Input
                  value={editingAssignment.accommodation || ""}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      accommodation: e.target.value,
                    })
                  }
                  placeholder="z.B. Hotel Maritim, Container 5A"
                />
              </div>

              <div>
                <Label className="flex items-center gap-1">
                  <Info className="w-4 h-4" />
                  Zusätzliche Notizen
                </Label>
                <Textarea
                  value={editingAssignment.notes || ""}
                  onChange={(e) =>
                    setEditingAssignment({
                      ...editingAssignment,
                      notes: e.target.value,
                    })
                  }
                  placeholder="z.B. Anreise, besondere Hinweise..."
                  rows={3}
                />
              </div>

              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p>
                  <strong>Aktueller Block:</strong>{" "}
                  {months[editingAssignment.month]}, Tag{" "}
                  {editingAssignment.startDay} - {editingAssignment.endDay} (
                  {editingAssignment.days} Tage)
                </p>
                <p>
                  <strong>Position:</strong> {editingAssignment.position}{" "}
                  {editingAssignment.row === 2 ? "(Vertretung)" : ""}
                </p>
                {editingAssignment.isHandover && !editingAssignment.isOff && (
                  <p className="text-amber-600 dark:text-amber-400">
                    <ArrowLeftRight className="w-3 h-3 inline mr-1" />
                    Dieser Block enthält den Übergabetag
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveEdit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "position" &&
                `Die Position "${deleteConfirm.value}" und alle zugehörigen Schichten werden gelöscht.`}
              {deleteConfirm?.type === "personnel" &&
                `"${deleteConfirm.value}" und alle zugehörigen Schichten werden gelöscht.`}
              {deleteConfirm?.type === "assignment" &&
                "Diese Schichtzuweisung wird gelöscht."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirm?.type === "position") {
                  handleRemovePosition(deleteConfirm.value);
                } else if (deleteConfirm?.type === "personnel") {
                  handleRemovePersonnel(deleteConfirm.value);
                } else if (deleteConfirm?.type === "assignment") {
                  handleRemove(deleteConfirm.value);
                }
              }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mail-Benachrichtigungs-Dialog */}
      <Dialog open={!!pendingDrop} onOpenChange={() => cancelDrop()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Schichtzuweisung konfigurieren
            </DialogTitle>
            <DialogDescription>
              Legen Sie die Schichtplanung für diesen Mitarbeiter fest.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mitarbeiter Info */}
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="font-semibold text-blue-900 dark:text-blue-100">
                {pendingDrop?.person}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                → {pendingDrop?.position} (
                {pendingDrop?.row === 1 ? "Hauptschicht" : "Vertretung"})
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Start: {pendingDrop?.startDay}. {months[currentMonth]}
              </p>
            </div>

            {/* Anzahl Schicht-Zyklen */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                <Calendar className="w-4 h-4" />
                Wie viele Schichten planen?
              </Label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <Button
                    key={num}
                    variant={
                      pendingDrop?.cycles === num ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      pendingDrop &&
                      setPendingDrop({ ...pendingDrop, cycles: num })
                    }
                  >
                    {num}x
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingDrop?.cycles ?? 1} Zyklus ={" "}
                {(pendingDrop?.cycles ?? 1) *
                  ((pendingDrop?.workDays ?? 15) +
                    (pendingDrop?.offDays ?? 13))}{" "}
                Tage total
              </p>
            </div>

            {/* Arbeitstage pro Zyklus */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                Arbeitstage pro Schicht
              </Label>
              <div className="flex gap-2 flex-wrap">
                {[7, 14, 15, 21, 28].map((days) => (
                  <Button
                    key={days}
                    variant={
                      pendingDrop?.workDays === days ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      pendingDrop &&
                      setPendingDrop({ ...pendingDrop, workDays: days })
                    }
                  >
                    {days}T
                  </Button>
                ))}
              </div>
            </div>

            {/* Freie Tage pro Zyklus */}
            <div>
              <Label className="flex items-center gap-1 mb-2">
                Freie Tage nach Schicht
              </Label>
              <div className="flex gap-2 flex-wrap">
                {[10, 11, 12, 13, 14].map((days) => (
                  <Button
                    key={days}
                    variant={
                      pendingDrop?.offDays === days ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      pendingDrop &&
                      setPendingDrop({ ...pendingDrop, offDays: days })
                    }
                  >
                    {days}T
                  </Button>
                ))}
              </div>
            </div>

            {/* Zusammenfassung */}
            <div className="bg-muted rounded-lg p-3 text-sm">
              <p className="font-medium">Zusammenfassung:</p>
              <p className="text-muted-foreground">
                {pendingDrop?.cycles ?? 1} × ({pendingDrop?.workDays ?? 15}{" "}
                Arbeitstage + {pendingDrop?.offDays ?? 13} Freitag) ={" "}
                <strong>
                  {(pendingDrop?.cycles ?? 1) *
                    ((pendingDrop?.workDays ?? 15) +
                      (pendingDrop?.offDays ?? 13))}{" "}
                  Tage
                </strong>
              </p>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Mitarbeiter per E-Mail benachrichtigen?
            </p>
          </div>

          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => cancelDrop()}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              variant="secondary"
              onClick={() => confirmDrop(false)}
              className="flex-1"
            >
              Nur speichern
            </Button>
            <Button
              onClick={() => confirmDrop(true)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="w-4 h-4 mr-2" />
              Mit E-Mail
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Abwesenheits-Dialog (Krankheit, Urlaub, Schulung, etc.) */}
      <Dialog open={showAbsenceModal} onOpenChange={setShowAbsenceModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Abwesenheit eintragen</DialogTitle>
            <DialogDescription>
              Krankheit, Urlaub, Schulung oder andere Abwesenheit eintragen.
            </DialogDescription>
          </DialogHeader>

          {absenceData && (
            <div className="space-y-4">
              {/* Person Info */}
              <div className="bg-muted rounded-lg p-3">
                <p className="font-semibold">{absenceData.person}</p>
              </div>

              {/* Position auswählen */}
              <div>
                <Label className="mb-2 block">Position</Label>
                <div className="flex gap-2 flex-wrap">
                  {positions.slice(0, 6).map((pos) => (
                    <Button
                      key={pos}
                      variant={
                        absenceData.position === pos ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setAbsenceData({ ...absenceData, position: pos })
                      }
                    >
                      {pos}
                    </Button>
                  ))}
                </div>
                {positions.length > 6 && (
                  <select
                    className="mt-2 w-full p-2 rounded border bg-background text-sm"
                    value={absenceData.position}
                    onChange={(e) =>
                      setAbsenceData({
                        ...absenceData,
                        position: e.target.value,
                      })
                    }
                  >
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Abwesenheitstyp */}
              <div>
                <Label className="mb-2 block">Art der Abwesenheit</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ABSENCE_TYPES.filter((t) => t.value !== "work").map(
                    (type) => (
                      <Button
                        key={type.value}
                        variant={
                          absenceData.absenceType === type.value
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          setAbsenceData({
                            ...absenceData,
                            absenceType: type.value,
                          })
                        }
                        className={cn(
                          "justify-start",
                          absenceData.absenceType === type.value &&
                            type.bgClass,
                        )}
                      >
                        {type.value === "sick" && (
                          <HeartPulse className="w-4 h-4 mr-2" />
                        )}
                        {type.value === "vacation" && (
                          <Palmtree className="w-4 h-4 mr-2" />
                        )}
                        {type.value === "training" && (
                          <GraduationCap className="w-4 h-4 mr-2" />
                        )}
                        {type.value === "off" && (
                          <Clock className="w-4 h-4 mr-2" />
                        )}
                        {type.value === "other" && (
                          <AlertCircle className="w-4 h-4 mr-2" />
                        )}
                        {type.label}
                      </Button>
                    ),
                  )}
                </div>
              </div>

              {/* Zeitraum */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Von (Tag)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={getDaysInMonth(currentMonth)}
                    value={absenceData.startDay}
                    onChange={(e) =>
                      setAbsenceData({
                        ...absenceData,
                        startDay: Math.max(
                          1,
                          Math.min(
                            getDaysInMonth(currentMonth),
                            parseInt(e.target.value) || 1,
                          ),
                        ),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Bis (Tag)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={getDaysInMonth(currentMonth)}
                    value={absenceData.endDay}
                    onChange={(e) =>
                      setAbsenceData({
                        ...absenceData,
                        endDay: Math.max(
                          1,
                          Math.min(
                            getDaysInMonth(currentMonth),
                            parseInt(e.target.value) || 1,
                          ),
                        ),
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {months[currentMonth]} •{" "}
                {absenceData.endDay >= absenceData.startDay
                  ? `${absenceData.endDay - absenceData.startDay + 1} Tage`
                  : "Über Monatsende"}
              </p>

              {/* Notizen */}
              <div>
                <Label>Notizen (optional)</Label>
                <Textarea
                  value={absenceData.notes}
                  onChange={(e) =>
                    setAbsenceData({ ...absenceData, notes: e.target.value })
                  }
                  placeholder="z.B. Arzttermin, Weiterbildung..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAbsenceModal(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={saveAbsence}>Eintragen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Personalplanung</CardTitle>
                <p className="text-sm text-muted-foreground">
                  15 Tage Arbeit • Übergabe am letzten Tag • Freizeit variabel
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveData} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Speichern
              </Button>
              <Button onClick={exportData} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-muted rounded-lg p-3">
            <Button
              onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
              disabled={currentMonth === 0}
              variant="ghost"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>

            <h2 className="text-lg font-bold">{months[currentMonth]}</h2>

            <Button
              onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))}
              disabled={currentMonth === 11}
              variant="ghost"
              size="sm"
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                Schichten besetzt
              </p>
              <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                {stats.assignedSlots}/{stats.totalSlots}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                Mitarbeiter (aktuell)
              </p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {stats.totalPersonnel}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                Freie Perioden
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {stats.offDuty}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
                Gesamt im Einsatz
              </p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {stats.totalActivePersonnel}/{availablePersonnel.length}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                <HeartPulse className="w-3 h-3" /> Krank
              </p>
              <p className="text-xl font-bold text-red-900 dark:text-red-100">
                {stats.sickCount}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3">
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                <Palmtree className="w-3 h-3" /> Urlaub
              </p>
              <p className="text-xl font-bold text-green-900 dark:text-green-100">
                {stats.vacationCount}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 rounded-lg p-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                <GraduationCap className="w-3 h-3" /> Schulung
              </p>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                {stats.trainingCount}
              </p>
            </div>
          </div>

          {/* Legende */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="font-medium text-muted-foreground">Legende:</span>
            {ABSENCE_TYPES.map((type) => (
              <div key={type.value} className="flex items-center gap-1">
                <div className={cn("w-3 h-3 rounded", type.bgClass)} />
                <span>{type.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-600 border-r-2 border-amber-400" />
              <span>Übergabetag</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnel Pool - Sticky */}
      <Card className="sticky top-4 z-30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Verfügbares Personal</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddPersonnel(!showAddPersonnel)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddPersonnel && (
            <div className="bg-muted rounded-lg p-3 mb-3 flex gap-2">
              <Input
                value={newPersonnelName}
                onChange={(e) => setNewPersonnelName(e.target.value)}
                placeholder="Name des Mitarbeiters..."
                onKeyPress={(e) => e.key === "Enter" && handleAddPersonnel()}
              />
              <Button onClick={handleAddPersonnel} size="sm">
                OK
              </Button>
              <Button
                onClick={() => setShowAddPersonnel(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {availablePersonnel.map((person) => (
              <div
                key={person}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, { type: "person", person })
                }
                className="group relative bg-primary text-primary-foreground px-3 py-2 rounded-lg cursor-move hover:bg-primary/90 transition-all shadow-sm text-sm font-medium flex items-center gap-1"
              >
                <GripVertical className="w-3 h-3 opacity-70" />
                <span className="truncate max-w-[120px]">{person}</span>
                {/* Abwesenheit eintragen Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setAbsenceData({
                      person,
                      position: positions[0] || "TP",
                      row: 1,
                      startDay: 1,
                      endDay: 7,
                      absenceType: "sick",
                      notes: "",
                    });
                    setShowAbsenceModal(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-300 transition-opacity"
                  title="Abwesenheit eintragen"
                >
                  <HeartPulse className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm({ type: "personnel", value: person });
                  }}
                  className="opacity-0 group-hover:opacity-100 ml-1 hover:text-destructive transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Schichtplan</CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAddPosition(!showAddPosition)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Position hinzufügen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddPosition && (
            <div className="bg-muted rounded-lg p-3 mb-3 flex gap-2">
              <Input
                value={newPositionName}
                onChange={(e) => setNewPositionName(e.target.value)}
                placeholder="Neue Position..."
                onKeyPress={(e) => e.key === "Enter" && handleAddPosition()}
              />
              <Button onClick={handleAddPosition} size="sm">
                OK
              </Button>
              <Button
                onClick={() => setShowAddPosition(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Date Headers */}
              <div className="flex mb-1">
                <div className="w-32 flex-shrink-0"></div>
                <div className="flex">
                  {days.map((day) => {
                    const isTodayDate = isToday(currentMonth, day);
                    return (
                      <div
                        key={day}
                        className={cn(
                          "w-12 text-center relative",
                          isWeekend(currentMonth, day) && "bg-muted/50",
                          isTodayDate &&
                            "bg-cyan-500/20 border-2 border-cyan-500 rounded-md",
                        )}
                      >
                        <div
                          className={cn(
                            "text-xs font-medium",
                            isTodayDate
                              ? "text-cyan-600 font-bold"
                              : isWeekend(currentMonth, day)
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {getWeekday(currentMonth, day)}
                        </div>
                        <div
                          className={cn(
                            "text-sm font-bold",
                            isTodayDate
                              ? "text-cyan-600"
                              : isWeekend(currentMonth, day)
                                ? "text-destructive"
                                : "",
                          )}
                        >
                          {day}
                        </div>
                        {isTodayDate && (
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Position Rows */}
              {positions.map((position) => (
                <div key={position} className="mb-2">
                  {/* Row 1 - Main Shift */}
                  <div className="flex mb-1 relative">
                    <div className="w-32 flex-shrink-0 bg-muted p-2 flex items-center justify-between group text-sm font-medium border-b">
                      <span className="truncate">{position}</span>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            type: "position",
                            value: position,
                          })
                        }
                        className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive/80 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div
                      className="flex flex-1 relative"
                      style={{ minHeight: "48px" }}
                    >
                      {days.map((day) => {
                        const assignment = isDateInAssignment(position, 1, day);

                        if (assignment && day === assignment.data.startDay) {
                          return renderAssignmentBlock(assignment, day);
                        }

                        if (!assignment) {
                          return (
                            <div
                              key={`${position}-1-${day}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, position, 1, day)}
                              className={cn(
                                "w-12 h-12 border border-dashed border-border hover:bg-primary/10 hover:border-primary cursor-pointer transition-colors relative z-20",
                                isWeekend(currentMonth, day) && "bg-muted/30",
                                isToday(currentMonth, day) &&
                                  "ring-2 ring-cyan-500 ring-inset bg-cyan-500/5",
                              )}
                            />
                          );
                        }

                        // Zelle ist Teil eines Assignments - nicht rendern (Block deckt ab)
                        return null;
                      })}
                    </div>
                  </div>

                  {/* Row 2 - Backup Shift */}
                  <div className="flex mb-1 relative">
                    <div className="w-32 flex-shrink-0 bg-muted/50 p-2 text-sm font-medium text-muted-foreground border-b">
                      <span className="text-xs">↳ Vertretung</span>
                    </div>
                    <div
                      className="flex flex-1 relative"
                      style={{ minHeight: "48px" }}
                    >
                      {days.map((day) => {
                        const assignment = isDateInAssignment(position, 2, day);

                        if (assignment && day === assignment.data.startDay) {
                          return renderAssignmentBlock(assignment, day);
                        }

                        if (!assignment) {
                          return (
                            <div
                              key={`${position}-2-${day}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, position, 2, day)}
                              className={cn(
                                "w-12 h-12 border border-dashed border-border/50 hover:bg-primary/10 hover:border-primary cursor-pointer transition-colors relative z-20",
                                isWeekend(currentMonth, day) && "bg-muted/30",
                                isToday(currentMonth, day) &&
                                  "ring-2 ring-cyan-500 ring-inset bg-cyan-500/5",
                              )}
                            />
                          );
                        }

                        // Zelle ist Teil eines Assignments - nicht rendern (Block deckt ab)
                        return null;
                      })}
                    </div>
                  </div>

                  {/* Row 3 - Urlaubs-/Krankheitsvertretung */}
                  <div className="flex mb-1 relative">
                    <div className="w-32 flex-shrink-0 bg-red-950/30 dark:bg-red-950/50 p-2 text-sm font-medium text-red-400 border-b border-red-900/30">
                      <span className="text-xs flex items-center gap-1">
                        <HeartPulse className="w-3 h-3" />
                        Krankh./Urlaub
                      </span>
                    </div>
                    <div
                      className="flex flex-1 relative"
                      style={{ minHeight: "48px" }}
                    >
                      {days.map((day) => {
                        const assignment = isDateInAssignment(position, 3, day);

                        if (assignment && day === assignment.data.startDay) {
                          return renderAssignmentBlock(assignment, day);
                        }

                        if (!assignment) {
                          return (
                            <div
                              key={`${position}-3-${day}`}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDrop(e, position, 3, day)}
                              className={cn(
                                "w-12 h-12 border border-dashed border-red-900/30 hover:bg-red-500/10 hover:border-red-500 cursor-pointer transition-colors relative z-20",
                                isWeekend(currentMonth, day) && "bg-muted/30",
                                isToday(currentMonth, day) &&
                                  "ring-2 ring-cyan-500 ring-inset bg-cyan-500/5",
                              )}
                            />
                          );
                        }

                        // Zelle ist Teil eines Assignments - nicht rendern (Block deckt ab)
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600"></div>
              <span>Arbeitsperiode</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-600 border-r-4 border-amber-400"></div>
              <span>Mit Übergabetag</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-500"></div>
              <span>Freie Tage</span>
            </div>
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4" />
              <span>Drag & Drop</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShiftPlanner;
