import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, Filter, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WorkOrder {
  id: string;
  orderType: string; // Spalte A
  mainWorkCtr: string; // Spalte B - HAUPT-FILTER
  order: string; // Spalte C
  description: string; // Spalte D
  actualRelease: string | null; // Spalte G
  basicStartDate: string | null; // Spalte H
  category: string;
  priority: string;
  status: string;
}

const WorkOrderManagement = () => {
  const { toast } = useToast();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [mainWorkCtrFilter, setMainWorkCtrFilter] = useState<string>("all");
  const [availableWorkCtrs, setAvailableWorkCtrs] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState("");

  // Excel Import Handler mit Main WorkCtr Filter
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportStatus("📖 Excel-Datei wird gelesen...");

      try {
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Excel zu JSON konvertieren
            const jsonData = XLSX.utils.sheet_to_json<(string | number)[]>(
              worksheet,
              {
                header: 1,
                defval: "",
              }
            );

            console.log("Excel Data:", jsonData.slice(0, 3)); // Erste 3 Zeilen zur Kontrolle

            // Header-Zeile (Zeile 1) überspringen
            const rows = jsonData.slice(1);

            // Daten verarbeiten und kategorisieren
            const processedOrders: WorkOrder[] = rows
              .filter((row: (string | number)[]) => row[0] && row[2]) // Nur Zeilen mit Order Type und Order Number
              .map((row: (string | number)[], index: number) => {
                const orderType = String(row[0] || "").trim();
                const mainWorkCtr = String(row[1] || "").trim();
                const order = String(row[2] || "").trim();
                const description = String(row[3] || "").trim();
                const actualRelease = row[6] ? String(row[6]).trim() : null;
                const basicStartDate = row[7] ? String(row[7]).trim() : null;

                // Priorität bestimmen
                const priority = determinePriority(orderType, description);

                // Kategorie basierend auf Order Type
                let category = "MAINTENANCE";
                if (orderType.includes("INSP")) category = "INSPECTION";
                else if (orderType.includes("SUP")) category = "SUPPLY";
                else if (orderType === "TOP") category = "TOPSIDE";
                else if (orderType === "MECH") category = "MECHANICAL";
                else if (orderType === "ELEC") category = "ELECTRICAL";

                return {
                  id: `import-${Date.now()}-${index}`,
                  orderType,
                  mainWorkCtr,
                  order,
                  description,
                  actualRelease,
                  basicStartDate,
                  category,
                  priority,
                  status: actualRelease ? "RELEASED" : "CREATED",
                };
              });

            if (processedOrders.length === 0) {
              toast({
                variant: "destructive",
                title: "❌ Keine Daten gefunden",
                description:
                  "Die Excel-Datei enthält keine gültigen Work Orders.",
              });
              setImportStatus("");
              return;
            }

            setWorkOrders(processedOrders);
            setFilteredOrders(processedOrders);

            // Verfügbare Work Centers extrahieren
            const uniqueWorkCtrs = Array.from(
              new Set(
                processedOrders.map((wo) => wo.mainWorkCtr).filter(Boolean)
              )
            ).sort();
            setAvailableWorkCtrs(uniqueWorkCtrs);

            setImportStatus(
              `✅ Erfolgreich ${processedOrders.length} Work Orders importiert!`
            );

            toast({
              title: "✅ Import erfolgreich!",
              description: `${processedOrders.length} Work Orders wurden importiert. ${uniqueWorkCtrs.length} Work Centers gefunden.`,
            });

            // Status nach 5 Sekunden zurücksetzen
            setTimeout(() => setImportStatus(""), 5000);
          } catch (error) {
            console.error("Excel parse error:", error);
            toast({
              variant: "destructive",
              title: "❌ Excel-Fehler",
              description: `Die Excel-Datei konnte nicht gelesen werden: ${error}`,
            });
            setImportStatus("");
          }
        };

        reader.onerror = () => {
          toast({
            variant: "destructive",
            title: "❌ Datei-Fehler",
            description: "Die Datei konnte nicht gelesen werden.",
          });
          setImportStatus("");
        };

        reader.readAsBinaryString(file);
      } catch (error) {
        console.error("File upload error:", error);
        toast({
          variant: "destructive",
          title: "❌ Upload-Fehler",
          description: `Beim Hochladen ist ein Fehler aufgetreten: ${error}`,
        });
        setImportStatus("");
      }

      // Input zurücksetzen für erneuten Upload
      event.target.value = "";
    },
    [toast]
  );

  // Priorität bestimmen
  const determinePriority = (
    orderType: string,
    description: string
  ): string => {
    const text = description.toLowerCase();

    if (
      text.includes("urgent") ||
      text.includes("emergency") ||
      text.includes("critical")
    ) {
      return "URGENT";
    }
    if (
      text.includes("high") ||
      text.includes("important") ||
      orderType === "PM01"
    ) {
      return "HIGH";
    }
    if (text.includes("low") || orderType === "PM06") {
      return "LOW";
    }
    return "MEDIUM";
  };

  // Filter nach Main WorkCenter
  React.useEffect(() => {
    let filtered = workOrders;

    // Nach Main WorkCenter filtern
    if (mainWorkCtrFilter !== "all") {
      filtered = filtered.filter((wo) => wo.mainWorkCtr === mainWorkCtrFilter);
    }

    setFilteredOrders(filtered);
  }, [workOrders, mainWorkCtrFilter]);

  // Filter zurücksetzen
  const clearFilters = () => {
    setMainWorkCtrFilter("all");
  };

  // Prioritäts-Farben
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-500 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-black";
      case "LOW":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Statistiken berechnen
  const stats = {
    total: workOrders.length,
    filtered: filteredOrders.length,
    byWorkCtr: availableWorkCtrs.reduce((acc, wc) => {
      acc[wc] = workOrders.filter((wo) => wo.mainWorkCtr === wc).length;
      return acc;
    }, {} as Record<string, number>),
    byPriority: {
      URGENT: workOrders.filter((wo) => wo.priority === "URGENT").length,
      HIGH: workOrders.filter((wo) => wo.priority === "HIGH").length,
      MEDIUM: workOrders.filter((wo) => wo.priority === "MEDIUM").length,
      LOW: workOrders.filter((wo) => wo.priority === "LOW").length,
    },
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Work Order Management System
        </h1>
        <p className="text-muted-foreground">
          Importieren und verwalten Sie SAP Work Orders nach Main WorkCenter
        </p>
      </div>

      {/* Import Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            SAP Excel Import
          </CardTitle>
          <CardDescription>
            Excel-Format: Order Type (A) | Main WorkCtr (B) | Order (C) |
            Description (D) | ... | Actual release (G) | Bas. (H)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="file-upload" className="cursor-pointer">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors">
              <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Click to upload SAP Excel file (.xlsx, .xls)
              </span>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Unterstützt: PM02, PM06, SUP, RM-INSP, TP-INSP, MECH, ELEC, TOP,
                etc.
              </div>
            </div>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </Label>

          {importStatus && (
            <Alert
              className={`mt-4 ${
                importStatus.includes("❌")
                  ? "border-red-200 bg-red-50 dark:bg-red-950"
                  : importStatus.includes("✅")
                  ? "border-green-200 bg-green-50 dark:bg-green-950"
                  : "border-blue-200 bg-blue-50 dark:bg-blue-950"
              }`}
            >
              <AlertDescription
                className={
                  importStatus.includes("❌")
                    ? "text-red-700 dark:text-red-300"
                    : importStatus.includes("✅")
                    ? "text-green-700 dark:text-green-300"
                    : "text-blue-700 dark:text-blue-300"
                }
              >
                {importStatus}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Statistiken */}
      {workOrders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Work Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gefiltert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.filtered}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Work Centers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {availableWorkCtrs.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Urgent Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.byPriority.URGENT}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter Section */}
      {workOrders.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filter nach Main WorkCenter
              </span>
              {mainWorkCtrFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Filter zurücksetzen
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={mainWorkCtrFilter === "all" ? "default" : "outline"}
                onClick={() => setMainWorkCtrFilter("all")}
                className="h-9"
              >
                Alle ({stats.total})
              </Button>
              {availableWorkCtrs.map((wc) => (
                <Button
                  key={wc}
                  variant={mainWorkCtrFilter === wc ? "default" : "outline"}
                  onClick={() => setMainWorkCtrFilter(wc)}
                  className="h-9"
                >
                  {wc} ({stats.byWorkCtr[wc]})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Orders Tabelle */}
      {filteredOrders.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Work Orders{" "}
              {mainWorkCtrFilter !== "all" && `- ${mainWorkCtrFilter}`}
            </CardTitle>
            <CardDescription>
              {filteredOrders.length} Work Order
              {filteredOrders.length !== 1 ? "s" : ""}
              {mainWorkCtrFilter !== "all" && ` für ${mainWorkCtrFilter}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Main WorkCtr
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actual Release
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            {order.orderType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-semibold">
                            {order.mainWorkCtr}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-mono text-sm font-medium">
                          {order.order}
                        </td>
                        <td
                          className="px-4 py-3 text-sm max-w-md truncate"
                          title={order.description}
                        >
                          {order.description}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge
                            className={`${getPriorityColor(
                              order.priority
                            )} text-xs`}
                          >
                            {order.priority}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge variant="secondary" className="text-xs">
                            {order.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {order.actualRelease || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {order.basicStartDate || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : workOrders.length > 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Filter className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                Keine Work Orders gefunden
              </h3>
              <p className="text-muted-foreground mb-4">
                Keine Work Orders entsprechen den aktuellen Filterkriterien.
              </p>
              <Button onClick={clearFilters} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Filter zurücksetzen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">Keine Work Orders</h3>
              <p className="text-muted-foreground">
                Importieren Sie eine Excel-Datei, um loszulegen
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkOrderManagement;
