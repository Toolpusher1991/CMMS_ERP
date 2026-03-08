import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  tenderService,
  TENDER_STATUS_LABELS,
  TENDER_STATUS_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  type TenderConfiguration,
  type TenderStatus,
  type TenderComment,
  type TenderStatusHistoryEntry,
  type TenderEquipmentTask,
  type TaskStatus,
  type TaskPriority,
} from "@/services/tender.service";
import { useUserList } from "@/hooks/useQueryHooks";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FileText,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  MessageSquare,
  History,
  Send,
  AlertTriangle,
  Shield,
  User,
  Loader2,
  Plus,
  Trash2,
  CalendarDays,
  ListTodo,
  CircleDot,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Transition map (mirrors backend) ──
const VALID_TRANSITIONS: Record<string, TenderStatus[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["TECHNICAL_REVIEW", "REJECTED", "CANCELLED"],
  TECHNICAL_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["QUOTED", "REJECTED"],
  QUOTED: ["CONTRACTED", "REJECTED", "CANCELLED"],
  REJECTED: ["DRAFT"],
  CONTRACTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: ["DRAFT"],
};

interface Props {
  tender: TenderConfiguration;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TenderDetailDialog({ tender, open, onOpenChange }: Props) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const isAdminOrManager = user?.role === "ADMIN" || user?.role === "MANAGER";

  // ── Comments Query ──
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: queryKeys.tenders.comments(tender.id),
    queryFn: () => tenderService.getComments(tender.id),
    enabled: open,
  });

  // ── History Query ──
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: queryKeys.tenders.history(tender.id),
    queryFn: () => tenderService.getHistory(tender.id),
    enabled: open,
  });

  // ── Equipment Tasks ──
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: queryKeys.tenders.tasks(tender.id),
    queryFn: () => tenderService.getTasks(tender.id),
    enabled: open,
  });

  const { data: userListData } = useUserList();
  const availableUsers = (userListData ?? []).map((u) => ({
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
  }));

  const tasksByCategory = useMemo(() => {
    const map: Record<string, TenderEquipmentTask[]> = {};
    for (const task of tasks) {
      if (!map[task.equipmentCategory]) map[task.equipmentCategory] = [];
      map[task.equipmentCategory].push(task);
    }
    return map;
  }, [tasks]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "DONE").length;
    const open = tasks.filter((t) => t.status === "OPEN").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    return { total, done, open, inProgress };
  }, [tasks]);

  // ── Transition Mutation ──
  const transitionMutation = useMutation({
    mutationFn: ({
      toStatus,
      reason,
    }: {
      toStatus: TenderStatus;
      reason?: string;
    }) => tenderService.transitionStatus(tender.id, { toStatus, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tenders.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenders.history(tender.id),
      });
      toast({ variant: "success" as const, title: "Status aktualisiert" });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: err.message,
      });
    },
  });

  // ── Comment Mutation ──
  const commentMutation = useMutation({
    mutationFn: (text: string) => tenderService.addComment(tender.id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenders.comments(tender.id),
      });
      setCommentText("");
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: err.message,
      });
    },
  });

  // ── Task Mutations ──
  const createTaskMutation = useMutation({
    mutationFn: (data: {
      equipmentCategory: string;
      title: string;
      description?: string;
      priority?: TaskPriority;
      assignedTo?: string;
      assignedToUserId?: string;
      dueDate?: string;
    }) => tenderService.createTask(tender.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenders.tasks(tender.id),
      });
      toast({ variant: "success" as const, title: "Aufgabe erstellt" });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: err.message,
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      ...data
    }: {
      taskId: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      assignedTo?: string;
      assignedToUserId?: string;
      dueDate?: string;
    }) => tenderService.updateTask(tender.id, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenders.tasks(tender.id),
      });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: err.message,
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => tenderService.deleteTask(tender.id, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tenders.tasks(tender.id),
      });
      toast({ variant: "success" as const, title: "Aufgabe gelöscht" });
    },
    onError: (err: Error) => {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: err.message,
      });
    },
  });

  // ── Available transitions ──
  const availableTransitions = useMemo(
    () => VALID_TRANSITIONS[tender.status] ?? [],
    [tender.status],
  );

  // Forward transitions require all tasks to be DONE
  const BYPASS_TASK_CHECK: TenderStatus[] = ["REJECTED", "CANCELLED", "DRAFT"];
  const hasOpenTasks = taskStats.total > 0 && taskStats.done < taskStats.total;

  const handleTransition = (toStatus: TenderStatus) => {
    if (toStatus === "REJECTED") {
      setRejectOpen(true);
    } else {
      transitionMutation.mutate({ toStatus });
    }
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    transitionMutation.mutate({
      toStatus: "REJECTED",
      reason: rejectReason,
    });
    setRejectOpen(false);
    setRejectReason("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl">
                  {tender.projectName}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {tender.tenderNumber && (
                    <span className="text-sm font-mono text-muted-foreground">
                      {tender.tenderNumber}
                    </span>
                  )}
                  <Badge
                    className={cn(
                      "text-xs",
                      TENDER_STATUS_COLORS[tender.status],
                    )}
                  >
                    {TENDER_STATUS_LABELS[tender.status]}
                  </Badge>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* ── Workflow Actions ── */}
          {availableTransitions.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium">Workflow-Aktionen</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {availableTransitions.map((toStatus) => {
                      const isForward = !BYPASS_TASK_CHECK.includes(toStatus);
                      const blocked = isForward && hasOpenTasks;
                      return (
                        <TransitionButton
                          key={toStatus}
                          toStatus={toStatus}
                          disabled={transitionMutation.isPending || blocked}
                          isAdmin={isAdminOrManager}
                          onClick={() => handleTransition(toStatus)}
                        />
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task completion warning */}
          {hasOpenTasks && availableTransitions.some((s) => !BYPASS_TASK_CHECK.includes(s)) && (
            <div className="flex items-center gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{taskStats.total - taskStats.done} Aufgabe(n)</strong> noch offen — alle Aufgaben müssen erledigt sein, bevor der Tender weitergeleitet werden kann.
              </span>
            </div>
          )}

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview" className="gap-1">
                <FileText className="h-4 w-4" />
                Übersicht
              </TabsTrigger>
              <TabsTrigger value="equipment" className="gap-1">
                <Shield className="h-4 w-4" />
                Equipment
                {taskStats.total > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    {taskStats.done}/{taskStats.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="h-4 w-4" />
                Verlauf
              </TabsTrigger>
            </TabsList>

            {/* ── Overview Tab ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Projektinformationen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <InfoRow label="Projekt" value={tender.projectName} />
                    <InfoRow label="Kunde" value={tender.clientName} />
                    <InfoRow label="Standort" value={tender.location} />
                    <InfoRow label="Dauer" value={tender.projectDuration} />
                    <InfoRow
                      label="Tagesrate"
                      value={`€${tender.totalPrice?.toLocaleString("de-DE")}`}
                    />
                  </CardContent>
                </Card>

                {/* Rig Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Rig Konfiguration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <InfoRow
                      label="Rig"
                      value={tender.selectedRig?.name || "—"}
                    />
                    <InfoRow
                      label="Typ"
                      value={tender.selectedRig?.type || "—"}
                    />
                    {tender.assetScore && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Asset Score
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-bold", {
                            "border-green-500 text-green-600":
                              tender.assetScore === "A",
                            "border-yellow-500 text-yellow-600":
                              tender.assetScore === "B",
                            "border-orange-500 text-orange-600":
                              tender.assetScore === "C",
                            "border-red-500 text-red-600":
                              tender.assetScore === "D",
                          })}
                        >
                          {tender.assetScore}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Workflow Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Workflow
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <InfoRow
                      label="Erstellt"
                      value={
                        tender.createdAt
                          ? new Date(tender.createdAt).toLocaleDateString(
                              "de-DE",
                            )
                          : undefined
                      }
                    />
                    <InfoRow
                      label="Gültig bis"
                      value={
                        tender.validUntil
                          ? new Date(tender.validUntil).toLocaleDateString(
                              "de-DE",
                            )
                          : undefined
                      }
                    />
                    <InfoRow
                      label="Eingereicht"
                      value={
                        tender.submittedAt
                          ? new Date(tender.submittedAt).toLocaleDateString(
                              "de-DE",
                            )
                          : undefined
                      }
                    />
                    <InfoRow
                      label="Geprüft"
                      value={
                        tender.reviewedAt
                          ? new Date(tender.reviewedAt).toLocaleDateString(
                              "de-DE",
                            )
                          : undefined
                      }
                    />
                    <InfoRow
                      label="Genehmigt"
                      value={
                        tender.approvedAt
                          ? new Date(tender.approvedAt).toLocaleDateString(
                              "de-DE",
                            )
                          : undefined
                      }
                    />
                    {tender.rejectionReason && (
                      <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-red-700 dark:text-red-400 text-xs">
                        <strong>Ablehnungsgrund:</strong>{" "}
                        {tender.rejectionReason}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Creator Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Ersteller
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {tender.createdByUser ? (
                      <>
                        <InfoRow
                          label="Name"
                          value={`${tender.createdByUser.firstName} ${tender.createdByUser.lastName}`}
                        />
                        <InfoRow
                          label="E-Mail"
                          value={tender.createdByUser.email}
                        />
                      </>
                    ) : (
                      <p className="text-muted-foreground">Unbekannt</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              {tender.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">
                      Notizen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {tender.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ── Equipment Tab (mit Aufgaben & Kommentare) ── */}
            <TabsContent value="equipment" className="space-y-4 mt-4">
              {/* Rig Core Equipment */}
              {tender.selectedRig && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {tender.selectedRig.name} — Hauptausrüstung
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tender.selectedRig.drawworks && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Drawworks
                          </span>
                          <p className="text-sm font-medium">
                            {tender.selectedRig.drawworks}
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.mudPumps && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Mud Pumps
                          </span>
                          <p className="text-sm font-medium">
                            {tender.selectedRig.mudPumps}
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.topDrive && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Top Drive
                          </span>
                          <p className="text-sm font-medium">
                            {tender.selectedRig.topDrive}
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.derrickCapacity && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Derrick
                          </span>
                          <p className="text-sm font-medium">
                            {tender.selectedRig.derrickCapacity}
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.maxDepth && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Max. Tiefe
                          </span>
                          <p className="text-sm font-medium">
                            {Number(tender.selectedRig.maxDepth).toLocaleString(
                              "de-DE",
                            )}{" "}
                            m
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.maxHookLoad && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Hakenlast
                          </span>
                          <p className="text-sm font-medium">
                            {Number(
                              tender.selectedRig.maxHookLoad,
                            ).toLocaleString("de-DE")}{" "}
                            t
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.rotaryTorque && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Drehmoment
                          </span>
                          <p className="text-sm font-medium">
                            {Number(
                              tender.selectedRig.rotaryTorque,
                            ).toLocaleString("de-DE")}{" "}
                            Nm
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.pumpPressure && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Pumpendruck
                          </span>
                          <p className="text-sm font-medium">
                            {Number(
                              tender.selectedRig.pumpPressure,
                            ).toLocaleString("de-DE")}{" "}
                            psi
                          </p>
                        </div>
                      )}
                      {tender.selectedRig.dayRate && (
                        <div className="p-2 bg-muted/50 rounded">
                          <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                            Tagesrate
                          </span>
                          <p className="text-sm font-medium text-emerald-500">
                            €
                            {Number(tender.selectedRig.dayRate).toLocaleString(
                              "de-DE",
                            )}
                            /d
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Task stats summary */}
              {taskStats.total > 0 && (
                <div className="flex items-center gap-4 text-sm px-1">
                  <div className="flex items-center gap-1.5">
                    <CircleDot className="h-3.5 w-3.5 text-blue-500" />
                    <span>{taskStats.open} Offen</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    <span>{taskStats.inProgress} In Bearbeitung</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span>{taskStats.done} Erledigt</span>
                  </div>
                </div>
              )}

              {/* Equipment categories with inline tasks */}
              {tender.selectedEquipment &&
              Object.keys(tender.selectedEquipment).length > 0 ? (
                <EquipmentWithTasks
                  equipment={tender.selectedEquipment}
                  tasksByCategory={tasksByCategory}
                  users={availableUsers}
                  tasksLoading={tasksLoading}
                  onCreateTask={(data) => createTaskMutation.mutate(data)}
                  onUpdateTask={(taskId, data) =>
                    updateTaskMutation.mutate({ taskId, ...data })
                  }
                  onDeleteTask={(taskId) => deleteTaskMutation.mutate(taskId)}
                  isCreating={createTaskMutation.isPending}
                />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Kein Equipment ausgewählt
                </div>
              )}

              {/* Kommentare Sektion */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">
                    Kommentare
                    {comments.length > 0 && (
                      <span className="text-muted-foreground ml-1">
                        ({comments.length})
                      </span>
                    )}
                  </h3>
                </div>

                {/* Add Comment */}
                <div className="flex gap-2 mb-3">
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Kommentar schreiben..."
                    className="min-h-[50px]"
                  />
                  <Button
                    size="icon"
                    disabled={!commentText.trim() || commentMutation.isPending}
                    onClick={() => commentMutation.mutate(commentText.trim())}
                  >
                    {commentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Comment List */}
                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    Noch keine Kommentare
                  </p>
                ) : (
                  <div className="space-y-2">
                    {comments.map((c) => (
                      <CommentCard key={c.id} comment={c} />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── History Tab ── */}
            <TabsContent value="history" className="space-y-4 mt-4">
              {historyLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Keine Verlaufseinträge
                </p>
              ) : (
                <div className="relative pl-4 border-l-2 border-muted space-y-4">
                  {history.map((entry) => (
                    <HistoryEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Rejection Dialog ── */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Tender ablehnen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion setzt den Tender auf „Abgelehnt". Bitte geben Sie
              einen Grund an.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label htmlFor="reject-reason">Ablehnungsgrund</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Grund der Ablehnung eingeben..."
              className="mt-1"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              disabled={!rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
            >
              Ablehnen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
//  Sub-components
// ═══════════════════════════════════════════════════════════

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

function TransitionButton({
  toStatus,
  disabled,
  isAdmin,
  onClick,
}: {
  toStatus: TenderStatus;
  disabled: boolean;
  isAdmin: boolean;
  onClick: () => void;
}) {
  const styles: Record<
    string,
    {
      icon: React.ReactNode;
      variant:
        | "default"
        | "destructive"
        | "outline"
        | "secondary"
        | "ghost"
        | "link";
    }
  > = {
    SUBMITTED: {
      icon: <Send className="h-3.5 w-3.5" />,
      variant: "default",
    },
    TECHNICAL_REVIEW: {
      icon: <Shield className="h-3.5 w-3.5" />,
      variant: "default",
    },
    APPROVED: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      variant: "default",
    },
    QUOTED: {
      icon: <DollarSign className="h-3.5 w-3.5" />,
      variant: "default",
    },
    CONTRACTED: {
      icon: <FileText className="h-3.5 w-3.5" />,
      variant: "default",
    },
    COMPLETED: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      variant: "default",
    },
    REJECTED: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      variant: "destructive",
    },
    CANCELLED: {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      variant: "outline",
    },
    DRAFT: {
      icon: <ArrowRight className="h-3.5 w-3.5" />,
      variant: "outline",
    },
  };

  const style = styles[toStatus] || {
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    variant: "outline",
  };

  // Some transitions require admin/manager
  const needsAdmin = ["TECHNICAL_REVIEW", "APPROVED"].includes(toStatus);
  if (needsAdmin && !isAdmin) return null;

  return (
    <Button
      size="sm"
      variant={style.variant}
      disabled={disabled}
      onClick={onClick}
      className="gap-1"
    >
      {style.icon}
      {TENDER_STATUS_LABELS[toStatus]}
    </Button>
  );
}

function CommentCard({ comment }: { comment: TenderComment }) {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">
            {comment.user?.firstName} {comment.user?.lastName}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleString("de-DE")}
          </span>
        </div>
        <p className="text-sm">{comment.text}</p>
      </CardContent>
    </Card>
  );
}

function HistoryEntry({ entry }: { entry: TenderStatusHistoryEntry }) {
  const fromLabel =
    TENDER_STATUS_LABELS[entry.fromStatus as TenderStatus] ?? entry.fromStatus;
  const toLabel =
    TENDER_STATUS_LABELS[entry.toStatus as TenderStatus] ?? entry.toStatus;
  const toColor =
    TENDER_STATUS_COLORS[entry.toStatus as TenderStatus] ??
    "bg-gray-100 text-gray-700";

  return (
    <div className="relative">
      {/* Dot */}
      <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" />

      <div className="pl-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {fromLabel}
          </Badge>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <Badge className={cn("text-xs", toColor)}>{toLabel}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(entry.createdAt).toLocaleString("de-DE")}
        </p>
        {entry.reason && (
          <p className="text-xs mt-1 italic text-muted-foreground">
            „{entry.reason}"
          </p>
        )}
      </div>
    </div>
  );
}

// ── Combined Equipment + Tasks Section ──────────────────────

const NEXT_STATUS: Record<string, TaskStatus> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "OPEN",
  CANCELLED: "OPEN",
};

function EquipmentWithTasks({
  equipment,
  tasksByCategory,
  users,
  tasksLoading,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  isCreating,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  equipment: Record<string, any[]>;
  tasksByCategory: Record<string, TenderEquipmentTask[]>;
  users: { id: string; name: string }[];
  tasksLoading: boolean;
  onCreateTask: (data: {
    equipmentCategory: string;
    title: string;
    description?: string;
    priority?: TaskPriority;
    assignedTo?: string;
    assignedToUserId?: string;
    dueDate?: string;
  }) => void;
  onUpdateTask: (
    taskId: string,
    data: {
      status?: TaskStatus;
      assignedTo?: string;
      assignedToUserId?: string;
    },
  ) => void;
  onDeleteTask: (taskId: string) => void;
  isCreating: boolean;
}) {
  const [expandedForm, setExpandedForm] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as TaskPriority,
    assignedToUserId: "",
    dueDate: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      assignedToUserId: "",
      dueDate: "",
    });
    setExpandedForm(null);
  };

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSubmit = (category: string) => {
    if (!formData.title.trim()) return;
    const selectedUser = users.find((u) => u.id === formData.assignedToUserId);
    onCreateTask({
      equipmentCategory: category,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      assignedTo: selectedUser?.name || undefined,
      assignedToUserId: formData.assignedToUserId || undefined,
      dueDate: formData.dueDate || undefined,
    });
    resetForm();
  };

  return (
    <div className="space-y-3">
      {Object.entries(equipment).map(([category, items]) => {
        const catTasks = tasksByCategory[category] || [];
        const catDone = catTasks.filter((t) => t.status === "DONE").length;
        const itemArr = Array.isArray(items) ? items : [];
        const isExpanded = expandedCategories.has(category);
        const isFormOpen = expandedForm === category;

        return (
          <Card key={category}>
            <CardHeader
              className="pb-2 cursor-pointer"
              onClick={() => toggleCategory(category)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium capitalize">
                    {category.replace(/_/g, " ")}
                  </CardTitle>
                  {itemArr.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {itemArr.length}{" "}
                      {itemArr.length === 1 ? "Position" : "Positionen"}
                    </Badge>
                  )}
                  {catTasks.length > 0 && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 gap-1",
                        catDone === catTasks.length
                          ? "border-green-500 text-green-600"
                          : "",
                      )}
                    >
                      <ListTodo className="h-3 w-3" />
                      {catDone}/{catTasks.length}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFormOpen) {
                        resetForm();
                      } else {
                        setExpandedForm(category);
                        if (!isExpanded)
                          setExpandedCategories((p) =>
                            new Set(p).add(category),
                          );
                      }
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Aufgabe
                  </Button>
                  <span className="text-muted-foreground text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0 space-y-3">
                {/* Equipment items */}
                {itemArr.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {itemArr.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                      >
                        <span className="truncate">
                          {item.name || item.label || JSON.stringify(item)}
                        </span>
                        {(item.dailyRate != null || item.price != null) && (
                          <span className="text-emerald-600 font-medium text-xs ml-2 flex-shrink-0">
                            €
                            {Number(
                              item.dailyRate ?? item.price,
                            ).toLocaleString("de-DE")}
                            /d
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline create form */}
                {isFormOpen && (
                  <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="z.B. Preis für Drill Pipes klären..."
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, title: e.target.value }))
                        }
                        className="text-sm"
                        autoFocus
                      />
                      <Textarea
                        placeholder="Beschreibung (optional)..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            description: e.target.value,
                          }))
                        }
                        className="text-sm min-h-[50px]"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Zuständig
                        </Label>
                        <Select
                          value={formData.assignedToUserId}
                          onValueChange={(v) =>
                            setFormData((p) => ({ ...p, assignedToUserId: v }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Person wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem
                                key={u.id}
                                value={u.id}
                                className="text-xs"
                              >
                                {u.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Priorität
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={(v) =>
                            setFormData((p) => ({
                              ...p,
                              priority: v as TaskPriority,
                            }))
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              [
                                "LOW",
                                "MEDIUM",
                                "HIGH",
                                "CRITICAL",
                              ] as TaskPriority[]
                            ).map((p) => (
                              <SelectItem key={p} value={p} className="text-xs">
                                {TASK_PRIORITY_LABELS[p]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Fällig am
                        </Label>
                        <Input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) =>
                            setFormData((p) => ({
                              ...p,
                              dueDate: e.target.value,
                            }))
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={resetForm}
                        className="h-7 text-xs"
                      >
                        Abbrechen
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSubmit(category)}
                        disabled={!formData.title.trim() || isCreating}
                        className="h-7 text-xs gap-1"
                      >
                        {isCreating ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3" />
                        )}
                        Erstellen
                      </Button>
                    </div>
                  </div>
                )}

                {/* Task list */}
                {tasksLoading ? (
                  <div className="flex justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  catTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      users={users}
                      onToggleStatus={() => {
                        const next = NEXT_STATUS[task.status] || "OPEN";
                        onUpdateTask(task.id, { status: next });
                      }}
                      onReassign={(userId, userName) => {
                        onUpdateTask(task.id, {
                          assignedTo: userName,
                          assignedToUserId: userId,
                        });
                      }}
                      onDelete={() => onDeleteTask(task.id)}
                    />
                  ))
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function TaskCard({
  task,
  users,
  onToggleStatus,
  onReassign,
  onDelete,
}: {
  task: TenderEquipmentTask;
  users: { id: string; name: string }[];
  onToggleStatus: () => void;
  onReassign: (userId: string, userName: string) => void;
  onDelete: () => void;
}) {
  const isDone = task.status === "DONE";
  const isOverdue =
    task.dueDate && !isDone && new Date(task.dueDate) < new Date();

  return (
    <div
      className={cn(
        "group flex items-start gap-3 p-3 rounded-lg border transition-colors",
        isDone
          ? "bg-muted/30 border-muted opacity-70"
          : isOverdue
            ? "bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
            : "bg-background hover:bg-muted/20",
      )}
    >
      {/* Status toggle */}
      <button
        onClick={onToggleStatus}
        className={cn(
          "mt-0.5 flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
          isDone
            ? "bg-green-500 border-green-500 text-white"
            : task.status === "IN_PROGRESS"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30"
              : "border-muted-foreground/30 hover:border-primary",
        )}
        title={`Status: ${TASK_STATUS_LABELS[task.status]} → Klicken zum Wechseln`}
      >
        {isDone && <CheckCircle2 className="h-3 w-3" />}
        {task.status === "IN_PROGRESS" && (
          <div className="h-2 w-2 rounded-full bg-amber-400" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              isDone && "line-through text-muted-foreground",
            )}
          >
            {task.title}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Löschen"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            className={cn(
              "text-[10px] px-1.5 py-0",
              TASK_STATUS_COLORS[task.status],
            )}
          >
            {TASK_STATUS_LABELS[task.status]}
          </Badge>

          <span
            className={cn(
              "text-[10px] font-medium",
              TASK_PRIORITY_COLORS[task.priority],
            )}
          >
            {TASK_PRIORITY_LABELS[task.priority]}
          </span>

          {task.assignedTo && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{task.assignedTo}</span>
            </div>
          )}

          {!task.assignedTo && (
            <Select
              onValueChange={(userId) => {
                const u = users.find((x) => x.id === userId);
                if (u) onReassign(userId, u.name);
              }}
            >
              <SelectTrigger className="h-5 w-auto gap-1 border-dashed text-[10px] px-1.5 py-0">
                <UserPlus className="h-3 w-3" />
                <span>Zuweisen</span>
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {task.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-[10px]",
                isOverdue
                  ? "text-red-600 font-medium"
                  : "text-muted-foreground",
              )}
            >
              <CalendarDays className="h-3 w-3" />
              <span>
                {new Date(task.dueDate).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              {isOverdue && <span className="text-red-600">überfällig</span>}
            </div>
          )}

          {task.completedAt && (
            <span className="text-[10px] text-green-600">
              ✓ {new Date(task.completedAt).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
