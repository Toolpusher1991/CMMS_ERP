import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import {
  tenderService,
  KANBAN_COLUMNS,
  TENDER_STATUS_LABELS,
  TENDER_STATUS_COLORS,
  type TenderConfiguration,
  type TenderStatus,
} from "@/services/tender.service";
import { TenderDetailDialog } from "./TenderDetailDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  List,
  Search,
  FileText,
  Users,
  Calendar,
  DollarSign,
  ArrowRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "table";

export default function TenderBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTender, setSelectedTender] =
    useState<TenderConfiguration | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ── Data ──
  const { data: tenders = [], isLoading } = useQuery({
    queryKey: queryKeys.tenders.list(),
    queryFn: () => tenderService.getAllTenders(),
  });

  // ── Filtering ──
  const filteredTenders = useMemo(() => {
    let result = tenders;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.projectName?.toLowerCase().includes(q) ||
          t.clientName?.toLowerCase().includes(q) ||
          t.tenderNumber?.toLowerCase().includes(q) ||
          t.location?.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    return result;
  }, [tenders, searchQuery, statusFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const s = {
      total: tenders.length,
      draft: 0,
      active: 0,
      contracted: 0,
      rejected: 0,
      totalValue: 0,
    };
    for (const t of tenders) {
      if (t.status === "DRAFT") s.draft++;
      else if (
        ["SUBMITTED", "TECHNICAL_REVIEW", "APPROVED", "QUOTED"].includes(
          t.status,
        )
      )
        s.active++;
      else if (t.status === "CONTRACTED" || t.status === "COMPLETED")
        s.contracted++;
      else if (t.status === "REJECTED" || t.status === "CANCELLED")
        s.rejected++;
      s.totalValue += t.totalPrice || 0;
    }
    return s;
  }, [tenders]);

  const openDetail = (tender: TenderConfiguration) => {
    setSelectedTender(tender);
    setDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Gesamt"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Entwürfe"
          value={stats.draft}
          color="gray"
        />
        <StatCard
          icon={<ArrowRight className="h-5 w-5" />}
          label="In Bearbeitung"
          value={stats.active}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Unter Vertrag"
          value={stats.contracted}
          color="green"
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Gesamtwert"
          value={`€${(stats.totalValue / 1000).toFixed(0)}k`}
          color="emerald"
        />
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tender suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            {Object.entries(TENDER_STATUS_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Board
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4 mr-1" />
            Tabelle
          </Button>
        </div>
      </div>

      {/* ── Board / Table ── */}
      {viewMode === "kanban" ? (
        <KanbanView tenders={filteredTenders} onOpen={openDetail} />
      ) : (
        <TableView tenders={filteredTenders} onOpen={openDetail} />
      )}

      {/* ── Detail Dialog ── */}
      {selectedTender && (
        <TenderDetailDialog
          tender={selectedTender}
          open={detailOpen}
          onOpenChange={(open: boolean) => {
            setDetailOpen(open);
            if (!open) setSelectedTender(null);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Stat Card
// ═══════════════════════════════════════════════════════════
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    gray: "bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400",
    purple:
      "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    green: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400",
    emerald:
      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("p-2 rounded-lg", colors[color])}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
//  Kanban View
// ═══════════════════════════════════════════════════════════
function KanbanView({
  tenders,
  onOpen,
}: {
  tenders: TenderConfiguration[];
  onOpen: (t: TenderConfiguration) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-h-[400px]">
      {KANBAN_COLUMNS.map((status) => {
        const columnTenders = tenders.filter((t) => t.status === status);
        return (
          <div key={status} className="space-y-3">
            {/* Column Header */}
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg border",
                TENDER_STATUS_COLORS[status],
              )}
            >
              <span className="text-sm font-semibold">
                {TENDER_STATUS_LABELS[status]}
              </span>
              <Badge variant="secondary" className="h-5 min-w-[20px] text-xs">
                {columnTenders.length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[100px]">
              {columnTenders.map((tender) => (
                <TenderKanbanCard
                  key={tender.id}
                  tender={tender}
                  onClick={() => onOpen(tender)}
                />
              ))}
              {columnTenders.length === 0 && (
                <div className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg text-xs text-muted-foreground">
                  Keine Tender
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TenderKanbanCard({
  tender,
  onClick,
}: {
  tender: TenderConfiguration;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        {/* Tender Number */}
        {tender.tenderNumber && (
          <p className="text-[10px] font-mono text-muted-foreground">
            {tender.tenderNumber}
          </p>
        )}

        {/* Title */}
        <p className="text-sm font-semibold leading-tight line-clamp-2">
          {tender.projectName}
        </p>

        {/* Client & Location */}
        {tender.clientName && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="truncate">{tender.clientName}</span>
          </div>
        )}

        {/* Rig */}
        {tender.selectedRig?.name && (
          <Badge variant="outline" className="text-xs">
            {tender.selectedRig.name}
          </Badge>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            €{tender.totalPrice?.toLocaleString("de-DE")}/Tag
          </span>
          {tender.projectDuration && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {tender.projectDuration}
            </span>
          )}
        </div>

        {/* Asset Score */}
        {tender.assetScore && (
          <Badge
            variant="outline"
            className={cn("text-xs", {
              "border-green-500 text-green-600": tender.assetScore === "A",
              "border-yellow-500 text-yellow-600": tender.assetScore === "B",
              "border-orange-500 text-orange-600": tender.assetScore === "C",
              "border-red-500 text-red-600": tender.assetScore === "D",
            })}
          >
            Score: {tender.assetScore}
          </Badge>
        )}

        {/* Creator */}
        {tender.createdByUser && (
          <p className="text-[10px] text-muted-foreground">
            {tender.createdByUser.firstName} {tender.createdByUser.lastName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
//  Table View
// ═══════════════════════════════════════════════════════════
function TableView({
  tenders,
  onOpen,
}: {
  tenders: TenderConfiguration[];
  onOpen: (t: TenderConfiguration) => void;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Nr.</th>
                <th className="text-left p-3 font-medium">Projekt</th>
                <th className="text-left p-3 font-medium">Kunde</th>
                <th className="text-left p-3 font-medium">Rig</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Tagesrate</th>
                <th className="text-left p-3 font-medium">Erstellt</th>
                <th className="text-left p-3 font-medium">Ersteller</th>
              </tr>
            </thead>
            <tbody>
              {tenders.map((tender) => (
                <tr
                  key={tender.id}
                  className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => onOpen(tender)}
                >
                  <td className="p-3 font-mono text-xs text-muted-foreground">
                    {tender.tenderNumber || "—"}
                  </td>
                  <td className="p-3 font-medium">{tender.projectName}</td>
                  <td className="p-3 text-muted-foreground">
                    {tender.clientName || "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">
                      {tender.selectedRig?.name || "—"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        TENDER_STATUS_COLORS[tender.status as TenderStatus],
                      )}
                    >
                      {TENDER_STATUS_LABELS[tender.status as TenderStatus] ??
                        tender.status}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    €{tender.totalPrice?.toLocaleString("de-DE")}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {tender.createdAt
                      ? new Date(tender.createdAt).toLocaleDateString("de-DE")
                      : "—"}
                  </td>
                  <td className="p-3 text-xs">
                    {tender.createdByUser
                      ? `${tender.createdByUser.firstName} ${tender.createdByUser.lastName}`
                      : "—"}
                  </td>
                </tr>
              ))}
              {tenders.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Keine Tender gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
