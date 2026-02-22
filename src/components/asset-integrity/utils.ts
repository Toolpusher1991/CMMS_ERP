// Asset Integrity utility functions
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

// Contract status → badge color classes
export function getContractStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "idle":
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    case "standby":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "maintenance":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
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
