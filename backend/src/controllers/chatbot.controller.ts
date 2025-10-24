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
2. **Projekte** erstellen, verwalten und anzeigen  
3. **Schadensberichte (Failure Reports)** erstellen
4. **Materialien** bestellen und Status verfolgen
5. **Benachrichtigungen** anzeigen
6. **Kommentare** zu Actions und Projekten hinzufügen

**Verfügbare Anlagen:** T208, T207, T700, T46

**Action Status:** OPEN (Offen), IN_PROGRESS (In Bearbeitung), COMPLETED (Abgeschlossen)
**Action Priorität:** LOW (Niedrig), MEDIUM (Mittel), HIGH (Hoch), URGENT (Dringend)
**Projekt Status:** PLANNED (Geplant), IN_PROGRESS (In Bearbeitung), COMPLETED (Abgeschlossen), ON_HOLD (Pausiert)
**Projekt Priorität:** LOW (Niedrig), NORMAL (Normal), HIGH (Hoch), URGENT (Dringend)
**Material Status:** NICHT_BESTELLT, BESTELLT, UNTERWEGS, GELIEFERT

**WICHTIG für Projekt-Suche:**
- Wenn ein Benutzer nach einem Projekt für eine bestimmte Anlage fragt (z.B. "Projekt für T208" oder "Netzcontainer"), nutze den projectNumber Filter!
- Anlagen-Namen (T208, T207, T700, T46) sind Projekt-Nummern (projectNumber)
- Beispiel: "Projekte für T208" → get_user_projects mit projectNumber: "T208"

Du antwortest immer auf Deutsch und bist freundlich, präzise und hilfreich.
Wenn du eine Aktion ausführen sollst (z.B. "Erstelle eine Action"), nutze die verfügbaren Funktionen.
Wenn du Informationen benötigst, frage konkret nach (z.B. "Für welche Anlage soll ich die Action erstellen?").

Halte deine Antworten kurz und prägnant. Nutze Emojis sparsam aber sinnvoll (📋 für Actions, 🔧 für Wartung, ⚠️ für Schäden, 🏗️ für Projekte, etc.).`;

// Get user context (recent actions, projects, etc.)
async function getUserContext(userId: string): Promise<string> {
  try {
    // Get user's recent actions
    const recentActions = await prisma.action.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { assignedTo: { contains: userId } },
        ],
      },
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
      description: 'Ruft die Actions (Wartungsaufgaben) des Benutzers ab. Kann nach Anlage, Status oder Priorität gefiltert werden.',
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
        const where: any = {
          OR: [
            { createdBy: userId },
            { assignedTo: { contains: userId } },
          ],
        };
        
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
