// Asset Integrity utility functions
import type React from "react";
import type { AssetRig } from "./types";

// Calculate days until a date
export function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Determine rig priority status based on overdue items
export function getRigPriorityStatus(
  rig: AssetRig,
): "ok" | "upcoming" | "due-soon" | "overdue" {
  let minDays = Infinity;
  let hasOverdue = false;

  rig.inspections.forEach((inspection) => {
    if (inspection.status === "overdue") {
      hasOverdue = true;
    } else if (inspection.status !== "completed") {
      const days = getDaysUntil(inspection.dueDate);
      if (days < minDays) minDays = days;
    }
  });

  rig.issues.forEach((issue) => {
    if (issue.dueDate && issue.status !== "closed") {
      const days = getDaysUntil(issue.dueDate);
      if (days < 0) hasOverdue = true;
      else if (days < minDays) minDays = days;
    }
  });

  if (hasOverdue) return "overdue";
  if (minDays <= 7) return "due-soon";
  if (minDays <= 30) return "upcoming";
  return "ok";
}

// Priority status → CSS border/bg classes
export function getPriorityColor(
  status: "ok" | "upcoming" | "due-soon" | "overdue",
): string {
  switch (status) {
    case "ok":
      return "border-green-500/50 bg-green-500/10";
    case "upcoming":
      return "border-yellow-500/50 bg-yellow-500/10";
    case "due-soon":
      return "border-orange-500/50 bg-orange-500/10";
    case "overdue":
      return "border-red-500/50 bg-red-500/20";
    default:
      return "border-border";
  }
}

// Contract status → badge color classes (enhanced, more prominent)
export function getContractStatusColor(status: string): string {
  switch (status) {
    case "operational":
      return "bg-[rgba(0,217,255,0.15)] text-[#00d9ff] border border-[rgba(0,217,255,0.3)] px-3 py-1 text-xs font-semibold tracking-wide uppercase";
    case "stacked":
      return "bg-[rgba(100,116,139,0.15)] text-[#94a3b8] border border-[rgba(100,116,139,0.3)] px-3 py-1 text-xs font-semibold tracking-wide uppercase";
    case "overhaul":
      return "bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)] px-3 py-1 text-xs font-semibold tracking-wide uppercase";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// Inspection status → badge color classes
export function getInspectionStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "upcoming":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "due":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "overdue":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// Severity → badge color classes
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "low":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "high":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "critical":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// Improvement priority → badge color classes
export function getImprovementPriorityColor(priority: string): string {
  switch (priority) {
    case "low":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "high":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

// Check if a generalInfo note is overdue
export function isNoteOverdue(note: { deadline?: string }): boolean {
  if (!note.deadline) return false;
  const deadline = new Date(note.deadline);
  deadline.setHours(23, 59, 59, 999);
  const today = new Date();
  return deadline < today;
}

// Get number of days a note is overdue
export function getDaysOverdue(note: { deadline?: string }): number {
  if (!note.deadline) return 0;
  const deadline = new Date(note.deadline);
  deadline.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = today.getTime() - deadline.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// Calculate total overdue notes across all rigs
export function calculateOverdueNotes(rigs: AssetRig[]): number {
  let count = 0;
  rigs.forEach((rig) => {
    rig.generalInfo?.forEach((note) => {
      if (isNoteOverdue(note)) count++;
    });
  });
  return count;
}

// Get overdue notes from a single rig
export function getOverdueNotesForRig(rig: AssetRig): NonNullable<AssetRig["generalInfo"]> {
  return (rig.generalInfo || []).filter(isNoteOverdue);
}

// Contract status → card gradient style (inline)
export function getContractStatusGradient(
  status: string,
): React.CSSProperties {
  switch (status) {
    case "operational":
      return {
        background:
          "linear-gradient(135deg, rgba(0,217,255,0.08) 0%, rgba(0,217,255,0.02) 50%, transparent 100%)",
      };
    case "stacked":
      return {
        background:
          "linear-gradient(135deg, rgba(100,116,139,0.06) 0%, rgba(100,116,139,0.01) 50%, transparent 100%)",
      };
    case "overhaul":
      return {
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 50%, transparent 100%)",
      };
    default:
      return {};
  }
}

// Contract status → card hover shadow class
export function getContractStatusHoverShadow(status: string): string {
  switch (status) {
    case "operational":
      return "hover:shadow-[0_4px_20px_rgba(0,217,255,0.15)]";
    case "stacked":
      return "hover:shadow-[0_4px_20px_rgba(100,116,139,0.12)]";
    case "overhaul":
      return "hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)]";
    default:
      return "hover:shadow-lg";
  }
}

// Contract status → border-left color class
export function getContractStatusBorderColor(status: string): string {
  switch (status) {
    case "operational":
      return "border-l-[#00d9ff]";
    case "stacked":
      return "border-l-[#64748b]";
    case "overhaul":
      return "border-l-[#f59e0b]";
    default:
      return "border-l-gray-500";
  }
}
