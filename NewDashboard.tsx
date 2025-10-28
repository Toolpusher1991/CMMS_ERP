import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { actionService, type Action } from "@/services/action.service";
import { projectService, type Project } from "@/services/project.service";
import {
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  ListTodo,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  myTasks: number;
  myProjects: number;
  myActions: number;
  completed: number;
}

interface QuickAccessItem {
  id: string;
  type: "project" | "action" | "task";
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  projectId?: string;
  isOverdue: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ 
    id: string; 
    firstName: string; 
    lastName: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
      }

      const [actionsData, projectsData] = await Promise.all([
        actionService.getAll(),
        projectService.getProjects(),
      ]);
      
      setActions(actionsData);
      setProjects(projectsData.projects);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };
