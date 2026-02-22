// Action Tracker shared types

export interface ActionFile {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  isPhoto: boolean;
}

export interface MaterialItem {
  id: string;
  mmNumber: string;
  description: string;
  quantity: number;
  unit: string;
  status?: "NICHT_BESTELLT" | "BESTELLT" | "UNTERWEGS" | "GELIEFERT";
}

export interface ActionTask {
  id: string;
  title: string;
  description?: string;
  assignedUser?: string;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
}

export interface Action {
  id: string;
  plant: string;
  category?: "ALLGEMEIN" | "RIGMOVE";
  discipline?: "MECHANIK" | "ELEKTRIK" | "ANLAGE";
  location?: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assignedTo: string;
  assignedUsers?: string[];
  dueDate: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  files: ActionFile[];
  materials?: MaterialItem[];
  comments?: Comment[];
  tasks: ActionTask[];
}

export interface ApiActionFile {
  id: string;
  filename: string;
  originalName?: string;
  fileType?: string;
  filePath?: string;
  uploadedAt: string;
  isPhoto?: boolean;
}

export interface ActionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  plant: string;
}

export interface ApiAction {
  id: string;
  plant: string;
  location?: string;
  category?: string;
  discipline?: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignedTo?: string;
  assignedUsers?: string[];
  dueDate?: string;
  completedAt?: string;
  createdBy?: string;
  createdAt?: string;
  actionFiles?: ApiActionFile[];
}

export interface ActionTrackerProps {
  initialActionId?: string;
  showOnlyMyActions?: boolean;
  onNavigateBack?: () => void;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  assignedPlant?: string;
}

// Helper functions

export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function extractPhotoFromDescription(
  description: string,
): string | null {
  const match = description.match(/📸 Photo: (.+?)(?:\n|$)/i);
  return match ? match[1].trim() : null;
}

export function parseMaterialsFromDescription(
  description: string,
): MaterialItem[] {
  const materialsSection = description.split("--- Materialien ---")[1];
  if (!materialsSection) return [];

  const lines = materialsSection.trim().split("\n");
  return lines
    .filter((line) => line.startsWith("📦"))
    .map((line, index) => {
      const parts = line
        .substring(2)
        .split("|")
        .map((p) => p.trim());
      const [mmNumber, description, quantityUnit, status] = parts;

      const qtyMatch = quantityUnit?.match(/^(\d+)\s*(.+)$/);
      const quantity = qtyMatch ? parseInt(qtyMatch[1]) : 1;
      const unit = qtyMatch ? qtyMatch[2] : "Stk";

      return {
        id: `${Date.now()}-${index}`,
        mmNumber: mmNumber || "",
        description: description || "",
        quantity,
        unit,
        status: (status as MaterialItem["status"]) || "NICHT_BESTELLT",
      };
    });
}

export function isOverdue(dueDate?: string, status?: string): boolean {
  if (!dueDate || status === "COMPLETED") return false;
  return new Date(dueDate) < new Date();
}
