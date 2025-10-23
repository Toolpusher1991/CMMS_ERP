import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Middleware um sicherzustellen, dass User nur auf ihre zugewiesene Anlage zugreifen
 */
export const filterByAssignedPlant = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin und Manager haben Zugriff auf alle Anlagen
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      return next();
    }

    // User mit assignedPlant Filter hinzufügen
    if (user.assignedPlant) {
      // Füge Plant-Filter zu Query-Parametern hinzu wenn nicht vorhanden
      if (!req.query.plant) {
        req.query.plant = user.assignedPlant;
      } else if (req.query.plant !== user.assignedPlant) {
        // User versucht auf andere Anlage zuzugreifen
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `You can only access ${user.assignedPlant} plant` 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in plant access middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware um sicherzustellen, dass erstellte/bearbeitete Actions 
 * nur für zugewiesene Anlage sind
 */
export const validatePlantAccess = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Admin und Manager können Actions für alle Anlagen erstellen
    if (user.role === 'ADMIN' || user.role === 'MANAGER') {
      return next();
    }

    // User mit assignedPlant: Prüfe ob plant im Body ihrer Anlage entspricht
    if (user.assignedPlant) {
      const requestedPlant = req.body.plant;
      
      if (!requestedPlant) {
        // Setze automatisch die zugewiesene Anlage
        req.body.plant = user.assignedPlant;
      } else if (requestedPlant !== user.assignedPlant) {
        // User versucht Action für andere Anlage zu erstellen
        return res.status(403).json({ 
          error: 'Access denied', 
          message: `You can only create actions for ${user.assignedPlant} plant` 
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in plant validation middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
