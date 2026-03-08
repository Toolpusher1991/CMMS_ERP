import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  tenderService,
  TENDER_STATUS_LABELS,
  TENDER_STATUS_COLORS,
  type TenderConfiguration,
  type TenderStatus,
  type TenderComment,
  type TenderStatusHistoryEntry,
} from "@/services/tender.service";
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

import { Label } from "@/components/ui/label";

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

  // ── Available transitions ──
  const availableTransitions = useMemo(
    () => VALID_TRANSITIONS[tender.status] ?? [],
    [tender.status],
  );

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
                    {availableTransitions.map((toStatus) => (
                      <TransitionButton
                        key={toStatus}
                        toStatus={toStatus}
                        disabled={transitionMutation.isPending}
                        isAdmin={isAdminOrManager}
                        onClick={() => handleTransition(toStatus)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Tabs ── */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="gap-1">
                <FileText className="h-4 w-4" />
                Übersicht
              </TabsTrigger>
              <TabsTrigger value="equipment" className="gap-1">
                <Shield className="h-4 w-4" />
                Equipment
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1">
                <MessageSquare className="h-4 w-4" />
                Kommentare
                {comments.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 text-xs">
                    {comments.length}
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

            {/* ── Equipment Tab ── */}
            <TabsContent value="equipment" className="space-y-4 mt-4">
              {tender.selectedEquipment &&
              Object.keys(tender.selectedEquipment).length > 0 ? (
                Object.entries(tender.selectedEquipment).map(
                  ([category, items]) => (
                    <Card key={category}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium capitalize">
                          {category.replace(/_/g, " ")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(Array.isArray(items) ? items : []).map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (item: any, idx: number) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                              >
                                <span>
                                  {item.name ||
                                    item.label ||
                                    JSON.stringify(item)}
                                </span>
                                {item.dailyRate != null && (
                                  <span className="text-emerald-600 font-medium">
                                    €
                                    {Number(item.dailyRate).toLocaleString(
                                      "de-DE",
                                    )}
                                    /d
                                  </span>
                                )}
                              </div>
                            ),
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ),
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Kein Equipment ausgewählt
                </div>
              )}
            </TabsContent>

            {/* ── Comments Tab ── */}
            <TabsContent value="comments" className="space-y-4 mt-4">
              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Kommentar schreiben..."
                  className="min-h-[60px]"
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
                <p className="text-center text-sm text-muted-foreground py-4">
                  Noch keine Kommentare
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((c) => (
                    <CommentCard key={c.id} comment={c} />
                  ))}
                </div>
              )}
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
