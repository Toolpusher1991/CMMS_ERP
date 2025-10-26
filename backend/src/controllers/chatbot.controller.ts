import { Request, Response, NextFunction } from 'express';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt that defines the chatbot's personality and capabilities
const SYSTEM_PROMPT = `Du bist ein hilfreicher Assistent für ein CMMS/ERP-System (Computerized Maintenance Management System).
Deine Aufgabe ist es, Benutzern bei folgenden Tätigkeiten zu helfen:

1. **Actions (Wartungsaufgaben)** erstellen, verwalten und anzeigen
   - Multi-User Assignment (mehrere Zuständige pro Action)
   - Status-Abfragen an alle beteiligten User senden
   - User zu bestehenden Actions hinzufügen/entfernen
2. **Projekte** erstellen, verwalten und anzeigen  
3. **Schadensberichte (Failure Reports)** erstellen
4. **Materialien** bestellen und Status verfolgen
5. **Benachrichtigungen** anzeigen und verwalten
6. **Kommentare** zu Actions und Projekten hinzufügen
7. **Tender-Konfigurationen** verwalten
8. **Status-Requests** für Manager-Abfragen

**Verfügbare Anlagen:** T208, T207, T700, T46

**Action Features:**
- **Multi-User Assignment**: Actions können mehreren Usern zugewiesen werden
- **Status-Abfragen**: Manager können Status-Updates von allen Beteiligten anfordern
- **Smart User Filtering**: Admins, Manager und anlagenspezifische User

**Action Status:** OPEN (Offen), IN_PROGRESS (In Bearbeitung), COMPLETED (Abgeschlossen)
**Action Priorität:** LOW (Niedrig), MEDIUM (Mittel), HIGH (Hoch), URGENT (Dringend)
**Projekt Status:** PLANNED (Geplant), IN_PROGRESS (In Bearbeitung), COMPLETED (Abgeschlossen), ON_HOLD (Pausiert)
**Projekt Priorität:** LOW (Niedrig), NORMAL (Normal), HIGH (Hoch), URGENT (Dringend)
**Material Status:** NICHT_BESTELLT, BESTELLT, UNTERWEGS, GELIEFERT

**WICHTIG für Projekt-Suche:**
- Wenn ein Benutzer nach einem Projekt für eine bestimmte Anlage fragt (z.B. "Projekt für T208" oder "Netzcontainer"), nutze den projectNumber Filter!
- Anlagen-Namen (T208, T207, T700, T46) sind Projekt-Nummern (projectNumber)
- Beispiel: "Projekte für T208" → get_user_projects mit projectNumber: "T208"

**Multi-User Beispiele:**
- "Erstelle Action für T208 und weise sie Tom, Lisa und dem Admin zu"
- "Füge Max zur Action T208-001 hinzu"
- "Frage den Status von Action T208-001 ab"
- "Wer ist alles für Action T208-001 zuständig?"

Du antwortest immer auf Deutsch und bist freundlich, präzise und hilfreich.
Wenn du eine Aktion ausführen sollst (z.B. "Erstelle eine Action"), nutze die verfügbaren Funktionen.
Wenn du Informationen benötigst, frage konkret nach (z.B. "Für welche Anlage soll ich die Action erstellen?").

Halte deine Antworten kurz und prägnant. Nutze Emojis sparsam aber sinnvoll (📋 für Actions, 🔧 für Wartung, ⚠️ für Schäden, 🏗️ für Projekte, 👥 für Multi-User, 📞 für Status-Abfragen, etc.).`;

// Get user context (recent actions, projects, etc.)
async function getUserContext(userId: string): Promise<string> {
  try {
    // Get recent actions (all actions for overview)
    const recentActions = await prisma.action.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        plant: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    // Get user's notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    // Get user's recent failure reports
    const recentReports = await prisma.failureReport.findMany({
      where: { reportedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        plant: true,
        severity: true,
        status: true,
      },
    });

    // Get recent projects (all projects for overview)
    const recentProjects = await prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        projectNumber: true,
        name: true,
        status: true,
        priority: true,
        progress: true,
      },
    });

    // Build context string
    let context = `\n\n--- BENUTZER-KONTEXT ---\n`;
    
    if (recentActions.length > 0) {
      context += `\nLetzte Actions:\n`;
      recentActions.forEach(action => {
        context += `- ${action.title} (${action.plant}, Status: ${action.status}, Priorität: ${action.priority})\n`;
      });
    }

    if (recentProjects.length > 0) {
      context += `\nProjekte:\n`;
      recentProjects.forEach(project => {
        context += `- ${project.name} (${project.projectNumber}, Status: ${project.status}, Fortschritt: ${project.progress}%)\n`;
      });
    }

    if (unreadNotifications > 0) {
      context += `\nDu hast ${unreadNotifications} ungelesene Benachrichtigungen.\n`;
    }

    if (recentReports.length > 0) {
      context += `\nLetzte Schadensberichte:\n`;
      recentReports.forEach(report => {
        context += `- ${report.title} (${report.plant}, ${report.severity})\n`;
      });
    }

    return context;
  } catch (error) {
    console.error('Error getting user context:', error);
    return '';
  }
}

// Available tools/functions the AI can call
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_actions',
      description: 'Ruft alle Actions (Wartungsaufgaben) im System ab. Kann nach Anlage, Status gefiltert werden. Jeder Benutzer kann alle Actions sehen.',
      parameters: {
        type: 'object',
        properties: {
          plant: {
            type: 'string',
            enum: ['T208', 'T207', 'T700', 'T46'],
            description: 'Filtere nach Anlage',
          },
          status: {
            type: 'string',
            enum: ['OPEN', 'IN_PROGRESS', 'COMPLETED'],
            description: 'Filtere nach Status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_action',
      description: 'Erstellt eine neue Action (Wartungsaufgabe)',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Titel der Action',
          },
          plant: {
            type: 'string',
            enum: ['T208', 'T207', 'T700', 'T46'],
            description: 'Anlage',
          },
          description: {
            type: 'string',
            description: 'Beschreibung der Aufgabe',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            description: 'Priorität',
          },
          assignedTo: {
            type: 'string',
            description: 'Email des zugewiesenen Benutzers',
          },
          dueDate: {
            type: 'string',
            description: 'Fälligkeitsdatum (YYYY-MM-DD)',
          },
        },
        required: ['title', 'plant', 'priority', 'assignedTo', 'dueDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_materials',
      description: 'Ruft Materialien ab, optional gefiltert nach Status',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['NICHT_BESTELLT', 'BESTELLT', 'UNTERWEGS', 'GELIEFERT'],
            description: 'Filtere nach Material-Status',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_failure_report',
      description: 'Erstellt einen neuen Schadensbericht',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Titel des Schadensberichts',
          },
          plant: {
            type: 'string',
            enum: ['T208', 'T207', 'T700', 'T46'],
            description: 'Anlage',
          },
          severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            description: 'Schweregrad',
          },
          description: {
            type: 'string',
            description: 'Beschreibung des Schadens',
          },
        },
        required: ['title', 'plant', 'severity', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_user_projects',
      description: 'Ruft alle Projekte im System ab. Kann nach Anlage (projectNumber), Status oder Priorität gefiltert werden. Jeder Benutzer kann alle Projekte sehen.',
      parameters: {
        type: 'object',
        properties: {
          projectNumber: {
            type: 'string',
            description: 'Filtere nach Projekt-Nummer/Anlage (z.B. T208, T207, T700, T46)',
          },
          status: {
            type: 'string',
            enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'],
            description: 'Filtere nach Projekt-Status',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
            description: 'Filtere nach Priorität',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description: 'Erstellt ein neues Projekt',
      parameters: {
        type: 'object',
        properties: {
          projectNumber: {
            type: 'string',
            description: 'Projekt-Nummer/Kürzel (z.B. T208, T700)',
          },
          name: {
            type: 'string',
            description: 'Name des Projekts',
          },
          description: {
            type: 'string',
            description: 'Beschreibung des Projekts',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
            description: 'Priorität',
          },
          startDate: {
            type: 'string',
            description: 'Startdatum (YYYY-MM-DD)',
          },
          endDate: {
            type: 'string',
            description: 'Enddatum (YYYY-MM-DD)',
          },
        },
        required: ['projectNumber', 'name', 'priority'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_project_details',
      description: 'Ruft detaillierte Informationen zu einem spezifischen Projekt ab',
      parameters: {
        type: 'object',
        properties: {
          projectNumber: {
            type: 'string',
            description: 'Projekt-Nummer (z.B. T208, T700)',
          },
        },
        required: ['projectNumber'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_action_with_multiple_users',
      description: 'Erstellt eine neue Action mit Multi-User Assignment (mehrere Zuständige)',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Titel der Action',
          },
          plant: {
            type: 'string',
            enum: ['T208', 'T207', 'T700', 'T46'],
            description: 'Anlage',
          },
          description: {
            type: 'string',
            description: 'Beschreibung der Aufgabe',
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            description: 'Priorität',
          },
          assignedTo: {
            type: 'string',
            description: 'Email des hauptzuständigen Benutzers',
          },
          assignedUsers: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array von User-IDs oder Emails der zusätzlich zuständigen User',
          },
          dueDate: {
            type: 'string',
            description: 'Fälligkeitsdatum (YYYY-MM-DD)',
          },
        },
        required: ['title', 'plant', 'priority', 'assignedTo', 'dueDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_users_to_action',
      description: 'Fügt User zu einer bestehenden Action hinzu',
      parameters: {
        type: 'object',
        properties: {
          actionId: {
            type: 'string',
            description: 'ID der Action',
          },
          userEmails: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array von User-Emails die hinzugefügt werden sollen',
          },
        },
        required: ['actionId', 'userEmails'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_status_request',
      description: 'Sendet eine Status-Abfrage an alle beteiligten User einer Action',
      parameters: {
        type: 'object',
        properties: {
          actionId: {
            type: 'string',
            description: 'ID der Action für die Status-Abfrage',
          },
          message: {
            type: 'string',
            description: 'Optionale zusätzliche Nachricht für die Status-Abfrage',
          },
        },
        required: ['actionId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_action_details',
      description: 'Ruft detaillierte Informationen zu einer Action ab, inklusive aller zuständigen User',
      parameters: {
        type: 'object',
        properties: {
          actionId: {
            type: 'string',
            description: 'ID der Action',
          },
        },
        required: ['actionId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tender_configurations',
      description: 'Ruft alle Tender-Konfigurationen ab',
      parameters: {
        type: 'object',
        properties: {
          plant: {
            type: 'string',
            enum: ['T208', 'T207', 'T700', 'T46'],
            description: 'Filtere nach Anlage',
          },
          contractStatus: {
            type: 'boolean',
            description: 'Filtere nach Vertragsstatus (true = unter Vertrag, false = ausstehend)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_users',
      description: 'Ruft alle verfügbaren User für Zuweisungen ab',
      parameters: {
        type: 'object',
        properties: {
          plant: {
            type: 'string',
            enum: ['T208', 'T207', 'T700', 'T46'],
            description: 'Filtere User nach Anlage (inkl. Admins und Manager)',
          },
          role: {
            type: 'string',
            enum: ['ADMIN', 'MANAGER', 'USER'],
            description: 'Filtere nach Benutzerrolle',
          },
        },
      },
    },
  },
];

// Execute function calls from AI
async function executeFunction(
  functionName: string,
  args: any,
  userId: string,
  userEmail: string
): Promise<string> {
  try {
    switch (functionName) {
      case 'get_user_actions': {
        const where: Record<string, unknown> = {};
        
        // Jeder kann alle Actions sehen (für Manager-Übersicht)
        if (args.plant) where.plant = args.plant;
        if (args.status) where.status = args.status;

        const actions = await prisma.action.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        return JSON.stringify({
          success: true,
          data: actions,
          count: actions.length,
        });
      }

      case 'create_action': {
        // Find assigned user
        const assignedUser = await prisma.user.findUnique({
          where: { email: args.assignedTo },
        });

        if (!assignedUser) {
          return JSON.stringify({
            success: false,
            error: `Benutzer mit Email ${args.assignedTo} nicht gefunden`,
          });
        }

        const action = await prisma.action.create({
          data: {
            title: args.title,
            plant: args.plant,
            description: args.description || '',
            priority: args.priority,
            status: 'OPEN',
            assignedTo: args.assignedTo,
            dueDate: new Date(args.dueDate),
            createdBy: userId,
          },
        });

        return JSON.stringify({
          success: true,
          data: action,
          message: `Action "${args.title}" erfolgreich erstellt`,
        });
      }

      case 'get_materials': {
        // This is a simplified version - in reality you'd query from actions
        const actions = await prisma.action.findMany({
          where: {
            description: {
              contains: '--- Materialien ---',
            },
          },
          select: {
            id: true,
            title: true,
            description: true,
          },
        });

        return JSON.stringify({
          success: true,
          data: actions,
          message: `${actions.length} Actions mit Materialien gefunden`,
        });
      }

      case 'create_failure_report': {
        const report = await prisma.failureReport.create({
          data: {
            title: args.title,
            plant: args.plant,
            severity: args.severity,
            description: args.description,
            reportedBy: userId,
            reportedByName: userEmail,
            status: 'PENDING',
          },
        });

        return JSON.stringify({
          success: true,
          data: report,
          message: `Schadensbericht "${args.title}" erfolgreich erstellt`,
        });
      }

      case 'get_user_projects': {
        const where: Record<string, unknown> = {};
        
        // Jeder kann alle Projekte sehen (für Manager-Übersicht)
        if (args.projectNumber) where.projectNumber = args.projectNumber;
        if (args.status) where.status = args.status;
        if (args.priority) where.priority = args.priority;

        const projects = await prisma.project.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            manager: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            tasks: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });

        // Calculate task statistics
        const projectsWithStats = projects.map(project => {
          const totalTasks = project.tasks.length;
          const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
          const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return {
            ...project,
            totalTasks,
            completedTasks,
            taskProgress,
          };
        });

        return JSON.stringify({
          success: true,
          data: projectsWithStats,
          count: projectsWithStats.length,
        });
      }

      case 'create_project': {
        const project = await prisma.project.create({
          data: {
            projectNumber: args.projectNumber,
            name: args.name,
            description: args.description || '',
            priority: args.priority,
            status: 'PLANNED',
            progress: 0,
            startDate: args.startDate ? new Date(args.startDate) : null,
            endDate: args.endDate ? new Date(args.endDate) : null,
            createdBy: userId,
            managerId: userId, // Creator is also manager by default
          },
        });

        return JSON.stringify({
          success: true,
          data: project,
          message: `Projekt "${args.name}" (${args.projectNumber}) erfolgreich erstellt`,
        });
      }

      case 'get_project_details': {
        const project = await prisma.project.findUnique({
          where: { projectNumber: args.projectNumber },
          include: {
            manager: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            creator: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            tasks: {
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            files: {
              orderBy: { uploadedAt: 'desc' },
              take: 10,
            },
          },
        });

        if (!project) {
          return JSON.stringify({
            success: false,
            error: `Projekt mit Nummer ${args.projectNumber} nicht gefunden`,
          });
        }

        // Calculate statistics
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
        const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const pendingTasks = project.tasks.filter(t => t.status === 'PENDING').length;

        return JSON.stringify({
          success: true,
          data: {
            ...project,
            statistics: {
              totalTasks,
              completedTasks,
              inProgressTasks,
              pendingTasks,
              taskProgress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            },
          },
        });
      }

      case 'create_action_with_multiple_users': {
        // Find all assigned users
        const assignedUserIds = [];
        
        // Add main assigned user
        const mainUser = await prisma.user.findFirst({
          where: { email: args.assignedTo },
        });
        if (mainUser) {
          assignedUserIds.push(mainUser.id);
        }
        
        // Add additional users
        if (args.assignedUsers) {
          for (const userIdentifier of args.assignedUsers) {
            const user = await prisma.user.findFirst({
              where: { 
                OR: [
                  { id: userIdentifier },
                  { email: userIdentifier }
                ]
              },
            });
            if (user && !assignedUserIds.includes(user.id)) {
              assignedUserIds.push(user.id);
            }
          }
        }
        
        // Create action with multiple users
        const action = await prisma.action.create({
          data: {
            title: args.title,
            plant: args.plant,
            description: args.description,
            priority: args.priority,
            status: 'OPEN',
            assignedTo: args.assignedTo,
            assignedUsers: assignedUserIds,
            dueDate: new Date(args.dueDate),
            createdBy: userId,
          },
        });

        return JSON.stringify({
          success: true,
          data: action,
          message: `Action "${args.title}" mit ${assignedUserIds.length} zuständigen Usern erstellt`,
        });
      }

      case 'add_users_to_action': {
        // Find users by email
        const userIds = [];
        for (const email of args.userEmails) {
          const user = await prisma.user.findUnique({
            where: { email },
          });
          if (user) {
            userIds.push(user.id);
          }
        }

        // Get current action
        const action = await prisma.action.findUnique({
          where: { id: args.actionId },
        });

        if (!action) {
          return JSON.stringify({
            success: false,
            error: 'Action nicht gefunden',
          });
        }

        // Merge with existing assigned users
        const currentUsers = action.assignedUsers || [];
        const newUsers = userIds.filter(id => !currentUsers.includes(id));
        const updatedUsers = [...currentUsers, ...newUsers];

        // Update action
        const updatedAction = await prisma.action.update({
          where: { id: args.actionId },
          data: {
            assignedUsers: updatedUsers,
          },
        });

        return JSON.stringify({
          success: true,
          data: updatedAction,
          message: `${newUsers.length} neue User zur Action hinzugefügt`,
        });
      }

      case 'send_status_request': {
        // Get action with assigned users
        const action = await prisma.action.findUnique({
          where: { id: args.actionId },
          include: {
            creator: true,
          }
        });

        if (!action) {
          return JSON.stringify({
            success: false,
            error: 'Action nicht gefunden',
          });
        }

        // Get all involved users (assigned users + creator)
        const involvedUserIds = [...(action.assignedUsers || [])];
        if (action.createdBy && !involvedUserIds.includes(action.createdBy)) {
          involvedUserIds.push(action.createdBy);
        }

        // Send notifications to all involved users
        const notifications = [];
        for (const userId of involvedUserIds) {
          const notification = await prisma.notification.create({
            data: {
              userId,
              type: 'STATUS_REQUEST',
              title: 'Status-Abfrage',
              message: `Manager fordert Status-Update für Action: ${action.title}${args.message ? ` - ${args.message}` : ''}`,
              relatedId: action.id,
              metadata: {
                actionId: action.id,
                actionTitle: action.title,
                plant: action.plant,
                requestMessage: args.message || null,
              },
            },
          });
          notifications.push(notification);
        }

        return JSON.stringify({
          success: true,
          data: { notifications, action },
          message: `Status-Abfrage an ${notifications.length} User gesendet`,
        });
      }

      case 'get_action_details': {
        const action = await prisma.action.findUnique({
          where: { id: args.actionId },
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (!action) {
          return JSON.stringify({
            success: false,
            error: 'Action nicht gefunden',
          });
        }

        // Get assigned users details
        let assignedUsersDetails = [];
        if (action.assignedUsers && action.assignedUsers.length > 0) {
          assignedUsersDetails = await prisma.user.findMany({
            where: {
              id: { in: action.assignedUsers },
            },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              plant: true,
            },
          });
        }

        return JSON.stringify({
          success: true,
          data: {
            ...action,
            assignedUsersDetails,
          },
        });
      }

      case 'get_tender_configurations': {
        const where: any = {};
        if (args.plant) where.plant = args.plant;
        if (args.contractStatus !== undefined) where.underContract = args.contractStatus;

        const tenders = await prisma.tenderConfiguration.findMany({
          where,
          orderBy: { createdAt: 'desc' },
        });

        return JSON.stringify({
          success: true,
          data: tenders,
          count: tenders.length,
        });
      }

      case 'get_available_users': {
        const where: any = {};
        
        if (args.role) {
          where.role = args.role;
        } else if (args.plant) {
          // Get users for specific plant + admins and managers
          where.OR = [
            { plant: args.plant },
            { role: { in: ['ADMIN', 'MANAGER'] } },
          ];
        }

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            plant: true,
          },
          orderBy: [
            { role: 'asc' },
            { firstName: 'asc' },
          ],
        });

        return JSON.stringify({
          success: true,
          data: users,
          count: users.length,
        });
      }

      default:
        return JSON.stringify({
          success: false,
          error: `Unbekannte Funktion: ${functionName}`,
        });
    }
  } catch (error: any) {
    console.error(`Error executing function ${functionName}:`, error);
    return JSON.stringify({
      success: false,
      error: error.message || 'Fehler bei der Ausführung',
    });
  }
}

// Main chat endpoint
export const chat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, conversationHistory } = req.body;
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    if (!message || typeof message !== 'string') {
      throw new AppError('Message is required', 400);
    }

    if (!process.env.OPENAI_API_KEY) {
      throw new AppError('OpenAI API key not configured', 500);
    }

    // Get user context
    const userContext = await getUserContext(userId);

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + userContext,
      },
      ...(conversationHistory || []),
      {
        role: 'user',
        content: message,
      },
    ];

    // Initial API call
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages,
      tools: TOOLS,
      temperature: 0.7,
      max_tokens: 500,
    });

    let assistantMessage = response.choices[0].message;

    // Handle tool calls (function calling)
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      // Add assistant message with tool calls to history
      messages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        // Type guard: Only process function tool calls
        if (toolCall.type !== 'function') continue;
        
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`🤖 Executing function: ${functionName}`, functionArgs);

        const functionResult = await executeFunction(
          functionName,
          functionArgs,
          userId,
          userEmail
        );

        // Add function result to messages
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: functionResult,
        });
      }

      // Get final response after function execution
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      assistantMessage = response.choices[0].message;
    }

    // Return response
    res.json({
      message: assistantMessage.content,
      conversationHistory: [
        ...(conversationHistory || []),
        { role: 'user', content: message },
        { role: 'assistant', content: assistantMessage.content },
      ],
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    if (error.status === 401) {
      next(new AppError('OpenAI API key is invalid', 500));
    } else {
      next(error);
    }
  }
};

// Get quick action suggestions
export const getQuickActions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;

    // Get user's open actions count
    const openActionsCount = await prisma.action.count({
      where: {
        assignedTo: { contains: userId },
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    });

    // Get unread notifications count
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    // Get active projects count
    const activeProjectsCount = await prisma.project.count({
      where: {
        OR: [
          { managerId: userId },
          { createdBy: userId },
        ],
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
      },
    });

    const suggestions = [
      {
        id: 'create-action',
        icon: '📋',
        title: 'Action erstellen',
        description: 'Neue Wartungsaufgabe anlegen',
      },
      {
        id: 'view-actions',
        icon: '👀',
        title: 'Meine Actions',
        description: `${openActionsCount} offene Aufgaben`,
        badge: openActionsCount > 0 ? openActionsCount : undefined,
      },
      {
        id: 'view-projects',
        icon: '🏗️',
        title: 'Meine Projekte',
        description: `${activeProjectsCount} aktive Projekte`,
        badge: activeProjectsCount > 0 ? activeProjectsCount : undefined,
      },
      {
        id: 'report-damage',
        icon: '⚠️',
        title: 'Schaden melden',
        description: 'Neuen Schadensbericht erstellen',
      },
      {
        id: 'check-notifications',
        icon: '🔔',
        title: 'Benachrichtigungen',
        description: `${unreadNotifications} ungelesen`,
        badge: unreadNotifications > 0 ? unreadNotifications : undefined,
      },
    ];

    res.json({ suggestions });
  } catch (error) {
    next(error);
  }
};
