// ===== Plant Types =====
export type Plant = 'T208' | 'T207' | 'T700' | 'T46';

// ===== Priority & Status =====
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
export type ProjectStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type FailureStatus = 'REPORTED' | 'IN_REVIEW' | 'CONVERTED_TO_ACTION' | 'RESOLVED';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ===== Category & Discipline =====
export type ActionCategory = 'ALLGEMEIN' | 'RIGMOVE';
export type Discipline = 'MECHANIK' | 'ELEKTRIK' | 'ANLAGE';
export type ProjectCategory = 'MECHANICAL' | 'ELECTRICAL' | 'FACILITY';
export type MaterialStatus = 'NICHT_BESTELLT' | 'BESTELLT' | 'UNTERWEGS' | 'GELIEFERT';

// ===== File Types =====
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  isPhoto?: boolean;
  uploadedBy?: string;
  size?: number;
}

// ===== Material =====
export interface MaterialItem {
  id: string;
  mmNumber: string;
  description: string;
  quantity: number;
  unit: string;
  status?: MaterialStatus;
}

// ===== Action Types =====
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
  plant: Plant;
  category?: ActionCategory;
  discipline?: Discipline;
  location?: string;
  title: string;
  description: string;
  status: ActionStatus;
  priority: Priority;
  assignedTo: string;
  assignedUsers?: string[];
  dueDate: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  files: FileAttachment[];
  materials?: MaterialItem[];
  comments?: Comment[];
  tasks: ActionTask[];
}

// ===== Failure Report Types =====
export interface FailureReport {
  id: string;
  ticketNumber: string;
  plant: Plant;
  title: string;
  description: string;
  location?: string;
  severity: Severity;
  status: FailureStatus;
  photoFilename?: string;
  photoPath?: string;
  reportedBy: string;
  reportedByName: string;
  convertedToActionId?: string;
  convertedAt?: string;
  convertedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ===== Project Types =====
export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  assignedTo?: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Project {
  id: string;
  projectNumber: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  totalBudget: number;
  spentBudget: number;
  startDate?: string;
  endDate?: string;
  plant?: Plant;
  category?: ProjectCategory;
  flowData?: string;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  members?: ProjectMember[];
  tasks?: ProjectTask[];
  _count?: {
    tasks: number;
    members: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ===== User Types =====
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'TECHNICIAN' | 'VIEWER';
  assignedPlant?: Plant;
  createdAt?: string;
}

// ===== Comment Types =====
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
}

// ===== Dashboard Types =====
export interface DashboardStats {
  openFailureReports: number;
  myProjects: number;
  myActions: number;
  completed: number;
}

export interface QuickAccessItem {
  id: string;
  type: 'project' | 'action' | 'task' | 'failure';
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId?: string;
  isOverdue: boolean;
  plant?: string;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
