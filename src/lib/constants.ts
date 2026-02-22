// ===== Shared Constants for the entire App =====
// Zentralisierte Konfiguration - statt hardcoded Werte in jeder Komponente

// ===== Priority Configuration =====
export const PRIORITY_CONFIG = {
  URGENT: {
    label: "Dringend",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    dotColor: "bg-red-500",
    order: 0,
  },
  CRITICAL: {
    label: "Kritisch",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    dotColor: "bg-red-500",
    order: 0,
  },
  HIGH: {
    label: "Hoch",
    color: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    dotColor: "bg-orange-500",
    order: 1,
  },
  MEDIUM: {
    label: "Mittel",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    dotColor: "bg-yellow-500",
    order: 2,
  },
  NORMAL: {
    label: "Normal",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    dotColor: "bg-blue-500",
    order: 2,
  },
  LOW: {
    label: "Niedrig",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    dotColor: "bg-gray-500",
    order: 3,
  },
} as const;

// ===== Status Configuration =====
export const ACTION_STATUS_CONFIG = {
  OPEN: {
    label: "Offen",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    dotColor: "bg-gray-500",
  },
  IN_PROGRESS: {
    label: "In Bearbeitung",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  COMPLETED: {
    label: "Abgeschlossen",
    color: "bg-green-500/10 text-green-700 border-green-500/20",
    dotColor: "bg-green-500",
  },
} as const;

export const PROJECT_STATUS_CONFIG = {
  PLANNED: {
    label: "Geplant",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    dotColor: "bg-gray-500",
  },
  IN_PROGRESS: {
    label: "In Bearbeitung",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  ON_HOLD: {
    label: "Pausiert",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    dotColor: "bg-yellow-500",
  },
  COMPLETED: {
    label: "Abgeschlossen",
    color: "bg-green-500/10 text-green-700 border-green-500/20",
    dotColor: "bg-green-500",
  },
  CANCELLED: {
    label: "Abgebrochen",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    dotColor: "bg-red-500",
  },
} as const;

export const TASK_STATUS_CONFIG = {
  TODO: {
    label: "Offen",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    dotColor: "bg-gray-500",
  },
  PENDING: {
    label: "Ausstehend",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    dotColor: "bg-gray-500",
  },
  IN_PROGRESS: {
    label: "In Bearbeitung",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  REVIEW: {
    label: "Review",
    color: "bg-purple-500/10 text-purple-700 border-purple-500/20",
    dotColor: "bg-purple-500",
  },
  DONE: {
    label: "Erledigt",
    color: "bg-green-500/10 text-green-700 border-green-500/20",
    dotColor: "bg-green-500",
  },
} as const;

export const FAILURE_STATUS_CONFIG = {
  REPORTED: {
    label: "Gemeldet",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    dotColor: "bg-red-500",
  },
  IN_REVIEW: {
    label: "In Prüfung",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    dotColor: "bg-yellow-500",
  },
  CONVERTED_TO_ACTION: {
    label: "Als Action",
    color: "bg-blue-500/10 text-blue-700 border-blue-500/20",
    dotColor: "bg-blue-500",
  },
  RESOLVED: {
    label: "Gelöst",
    color: "bg-green-500/10 text-green-700 border-green-500/20",
    dotColor: "bg-green-500",
  },
} as const;

export const SEVERITY_CONFIG = {
  LOW: {
    label: "Niedrig",
    color: "bg-gray-500/10 text-gray-700 border-gray-500/20",
    dotColor: "bg-gray-500",
  },
  MEDIUM: {
    label: "Mittel",
    color: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    dotColor: "bg-yellow-500",
  },
  HIGH: {
    label: "Hoch",
    color: "bg-orange-500/10 text-orange-700 border-orange-500/20",
    dotColor: "bg-orange-500",
  },
  CRITICAL: {
    label: "Kritisch",
    color: "bg-red-500/10 text-red-700 border-red-500/20",
    dotColor: "bg-red-500",
  },
} as const;

// ===== Plant / Location Configuration =====
// Known plants — extended dynamically via useRigs hook where possible
export const PLANTS = ["T700", "T46", "T203", "T208", "T207", "T350"] as const;

export const LOCATIONS = [
  "TD",
  "DW",
  "MP1",
  "MP2",
  "MP3",
  "PCR",
  "Generatoren",
  "Grid Container",
  "Mud System",
] as const;

export const DISCIPLINES = [
  { value: "MECHANIK", label: "Mechanik" },
  { value: "ELEKTRIK", label: "Elektrik" },
  { value: "ANLAGE", label: "Anlage" },
] as const;

export const CATEGORIES = [
  { value: "ALLGEMEIN", label: "Allgemein" },
  { value: "RIGMOVE", label: "Rigmove" },
] as const;

// ===== Date Helpers =====
/**
 * Returns the current year dynamically instead of hardcoded values.
 */
export const getCurrentYear = (): number => new Date().getFullYear();

/**
 * Returns today's date as a Date object (avoiding hardcoded dates).
 */
export const getToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

/**
 * Generates month names for a given year.
 */
export const getMonthNames = (year: number): string[] => {
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return months.map((m) => `${m} ${year}`);
};

/**
 * Get days in a specific month/year.
 */
export const getDaysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

/**
 * Calculate days until a deadline from today.
 */
export const getDaysUntilDeadline = (deadline: string | Date): number => {
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const today = getToday();
  return Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Format a date for German locale display.
 */
export const formatDateDE = (dateStr?: string | Date): string => {
  if (!dateStr) return "";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Get relative date description in German.
 */
export const getRelativeDateDE = (dateStr?: string): string => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const today = getToday();
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)} Tage überfällig`;
  if (diffDays === 0) return "Heute fällig";
  if (diffDays === 1) return "Morgen fällig";
  if (diffDays <= 7) return `In ${diffDays} Tagen`;

  return formatDateDE(dateStr);
};

// ===== User List Cache (shared) =====
export interface CachedUserList {
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    assignedPlant?: string;
  }>;
  timestamp: number;
}

const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

let _userListCache: CachedUserList | null = null;

export const getUserListCache = (): CachedUserList | null => {
  if (_userListCache && Date.now() - _userListCache.timestamp < USER_CACHE_TTL) {
    return _userListCache;
  }
  return null;
};

export const setUserListCache = (users: CachedUserList["users"]): void => {
  _userListCache = { users, timestamp: Date.now() };
};

export const invalidateUserListCache = (): void => {
  _userListCache = null;
};

// ===== App Version =====
export const APP_VERSION = "1.0.0";
