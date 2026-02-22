// ProjectList utility functions
import type { Category, Project } from "./types";

// Status mapping: backend → frontend
export function mapBackendStatus(
  status: string,
): "Aktiv" | "Abgeschlossen" | "Geplant" {
  switch (status) {
    case "IN_PROGRESS":
      return "Aktiv";
    case "COMPLETED":
      return "Abgeschlossen";
    case "PLANNED":
    default:
      return "Geplant";
  }
}

// Status mapping: frontend → backend
export function mapFrontendStatus(
  status: string,
): "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "ON_HOLD" {
  switch (status) {
    case "Aktiv":
      return "IN_PROGRESS";
    case "Abgeschlossen":
      return "COMPLETED";
    case "Geplant":
    default:
      return "PLANNED";
  }
}

// Category mapping: frontend → backend
export function mapFrontendCategory(
  category: Category,
): "MECHANICAL" | "ELECTRICAL" | "FACILITY" {
  switch (category) {
    case "Mechanisch":
      return "MECHANICAL";
    case "Elektrisch":
      return "ELECTRICAL";
    case "Anlage":
      return "FACILITY";
    default:
      return "MECHANICAL";
  }
}

// Category mapping: backend → frontend
export function mapBackendCategory(
  backendCategory: "MECHANICAL" | "ELECTRICAL" | "FACILITY",
): Category {
  switch (backendCategory) {
    case "MECHANICAL":
      return "Mechanisch";
    case "ELECTRICAL":
      return "Elektrisch";
    case "FACILITY":
      return "Anlage";
    default:
      return "Mechanisch";
  }
}

// Status → CSS color class
export function getStatusColor(status: string): string {
  switch (status) {
    case "Aktiv":
      return "bg-green-500";
    case "Abgeschlossen":
      return "bg-blue-500";
    case "Geplant":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
}

// Category → CSS color class
export function getCategoryColor(category: Category): string {
  switch (category) {
    case "Mechanisch":
      return "bg-orange-500";
    case "Elektrisch":
      return "bg-purple-500";
    case "Anlage":
      return "bg-cyan-500";
    default:
      return "bg-gray-500";
  }
}

// Calculate Gantt chart data for a project
export function calculateGanttData(project: Project) {
  const today = new Date();
  const start = new Date(project.startDate);
  const end = new Date(project.endDate);

  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const elapsedDays = Math.ceil(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const timeProgress = Math.max(
    0,
    Math.min(100, (elapsedDays / totalDays) * 100),
  );

  const isOnTrack = project.progress >= timeProgress - 10;
  const isDelayed = project.progress < timeProgress - 10;
  const isAhead = project.progress > timeProgress + 10;

  return {
    totalDays,
    elapsedDays,
    timeProgress: Math.round(timeProgress),
    isOnTrack,
    isDelayed,
    isAhead,
    daysRemaining: totalDays - elapsedDays,
  };
}

// Format date without timezone issues
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Check if a project is overdue
export function isOverdue(endDate: string | null, status: string): boolean {
  if (!endDate || status === "Abgeschlossen") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(endDate);
  target.setHours(0, 0, 0, 0);
  return target < today;
}

// Format number as EUR currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

// Format bytes into human-readable size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Resolve user ID or email to display name
export function getUserDisplayName(
  userIdOrEmail: string,
  users: Array<{ id: string; email: string; firstName: string; lastName: string }>,
): string {
  if (!userIdOrEmail) return "Nicht zugewiesen";

  if (userIdOrEmail.includes(" ") && !userIdOrEmail.includes("@")) {
    return userIdOrEmail;
  }

  const userById = users.find((u) => u.id === userIdOrEmail);
  if (userById) return `${userById.firstName} ${userById.lastName}`;

  const userByEmail = users.find((u) => u.email === userIdOrEmail);
  if (userByEmail) return `${userByEmail.firstName} ${userByEmail.lastName}`;

  if (userIdOrEmail.includes("@")) return userIdOrEmail.split("@")[0];

  if (userIdOrEmail.length > 20) return "Unbekannter User";

  return userIdOrEmail;
}
