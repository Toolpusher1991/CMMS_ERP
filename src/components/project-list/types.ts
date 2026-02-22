// ProjectList shared types

export type Anlage = string;
export type Category = "Mechanisch" | "Elektrisch" | "Anlage";

export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  assignedUser: string;
  assignedUserId?: string;
  dueDate: string;
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
  checkedOutBy?: string | null;
  checkedOutByName?: string | null;
  checkedOutAt?: string | null;
}

export interface Project {
  id: string;
  name: string;
  anlage: Anlage;
  category: Category;
  status: "Aktiv" | "Abgeschlossen" | "Geplant";
  startDate: string;
  endDate: string;
  description: string;
  budget: number;
  assignedUser: string;
  assignedUserId?: string;
  progress: number;
  notes: string;
  tasks: Task[];
  files: FileAttachment[];
}

export interface ProjectListProps {
  initialProjectId?: string;
  showOnlyMyProjects?: boolean;
  onOpenFlow?: (projectId: string) => void;
}
