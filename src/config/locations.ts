/**
 * Zentralisierte Standort-Konfiguration
 * Diese Standorte werden in ActionTracker und FailureReporting verwendet
 */

export interface Location {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

// Standard-Standorte
export const DEFAULT_LOCATIONS: Location[] = [
  { id: "TD", name: "TD", description: "Top Drive", active: true },
  { id: "DW", name: "DW", description: "Drawworks", active: true },
  { id: "MP1", name: "MP1", description: "Mud Pump 1", active: true },
  { id: "MP2", name: "MP2", description: "Mud Pump 2", active: true },
  { id: "MP3", name: "MP3", description: "Mud Pump 3", active: true },
  { id: "PCR", name: "PCR", description: "Pipe Handling", active: true },
  { id: "GENERATOREN", name: "Generatoren", description: "Generator System", active: true },
  { id: "GRID_CONTAINER", name: "Grid Container", description: "Power Distribution", active: true },
  { id: "MUD_SYSTEM", name: "Mud System", description: "Mud Treatment", active: true },
];

/**
 * Lade Standorte aus localStorage (mit Admin-Anpassungen)
 */
export const getLocations = (): Location[] => {
  try {
    const stored = localStorage.getItem('customLocations');
    if (stored) {
      const custom = JSON.parse(stored) as Location[];
      return custom.length > 0 ? custom : DEFAULT_LOCATIONS;
    }
  } catch (error) {
    console.error('Fehler beim Laden der Standorte:', error);
  }
  return DEFAULT_LOCATIONS;
};

/**
 * Speichere Standorte in localStorage (nur für Admins)
 */
export const saveLocations = (locations: Location[]): void => {
  try {
    localStorage.setItem('customLocations', JSON.stringify(locations));
  } catch (error) {
    console.error('Fehler beim Speichern der Standorte:', error);
  }
};

/**
 * Setze Standorte auf Standard zurück
 */
export const resetLocations = (): void => {
  localStorage.removeItem('customLocations');
};

/**
 * Hole nur aktive Standorte
 */
export const getActiveLocations = (): Location[] => {
  return getLocations().filter(loc => loc.active);
};
