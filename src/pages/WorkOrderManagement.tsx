import React, { useState, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface WorkOrder {
  id: string;
  orderType: string;
  mainWorkCtr: string;
  order: string;
  description: string;
  actualRelease: string | null;
  basicStartDate: string | null;
  equipment: string;
  equipmentDesc?: string;
  equipmentType?: string;
  functionalLoc: string;
  systemStatus: string;
  category: string;
  trade: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const WorkOrderManagement = () => {
  const { toast } = useToast();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<WorkOrder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState("all");
  const [importStatus, setImportStatus] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<WorkOrder | null>(null);

  // Kategorisierung basierend auf Functional Location
  const categorizeByLocation = (functionalLoc: string): string => {
    if (!functionalLoc) return "UNKNOWN";
    const loc = functionalLoc.toString().toUpperCase();
    if (loc.includes("T208") || loc.includes("T0208")) return "T208";
    if (loc.includes("T207") || loc.includes("T0207")) return "T207";
    if (loc.includes("T46") || loc.includes("T046")) return "T46";
    if (loc.includes("T700") || loc.includes("T0700")) return "T700";
    return "OTHER";
  };

  // Gewerk-Kategorisierung
  const categorizeByTrade = (
    description: string,
    workCenter: string,
    equipment: string
  ): string => {
    const text = `${description} ${workCenter} ${equipment}`.toLowerCase();

    if (
      text.includes("electrical") ||
      text.includes("elec") ||
      text.includes("cable") ||
      text.includes("power") ||
      text.includes("motor") ||
      text.includes("switch")
    ) {
      return "ELEC";
    }
    if (
      text.includes("mechanical") ||
      text.includes("mech") ||
      text.includes("valve") ||
      text.includes("pump") ||
      text.includes("bearing") ||
      text.includes("gear")
    ) {
      return "MECH";
    }
    if (
      text.includes("esp") ||
      text.includes("submersible") ||
      text.includes("downhole")
    ) {
      return "ESP";
    }
    if (
      text.includes("instrument") ||
      text.includes("control") ||
      text.includes("sensor") ||
      text.includes("gauge") ||
      text.includes("insp")
    ) {
      return "INST";
    }
    if (
      text.includes("structure") ||
      text.includes("civil") ||
      text.includes("platform") ||
      text.includes("steel")
    ) {
      return "CIVIL";
    }
    return "GENERAL";
  };

  // Mock-Daten für Demonstration
  const generateMockData = (): Omit<
    WorkOrder,
    | "id"
    | "category"
    | "trade"
    | "priority"
    | "status"
    | "createdAt"
    | "updatedAt"
  >[] => {
    return [
      {
        orderType: "PM02",
        mainWorkCtr: "SUP",
        order: "200848281",
        description: "Shear Rams for BOPs, MSP",
        actualRelease: null,
        basicStartDate: "2025-05-31",
        equipment: "E0406128",
        equipmentDesc: "SHEAR RAMS: 13-5/8IN 3K-10KPSI MODEL ISR",
        equipmentType: "Double Ram Preventer",
        functionalLoc: "T0208-WCON-331-030",
        systemStatus: "CRTD MANC NMAT NTUP PRC",
      },
      {
        orderType: "PM06",
        mainWorkCtr: "RM-INSP",
        order: "500047777",
        description: "Camp replacement estimate, INSP",
        actualRelease: null,
        basicStartDate: "2025-06-25",
        equipment: "",
        equipmentDesc: "",
        equipmentType: "Main Camp",
        functionalLoc: "T0208-RSBF-510-020",
        systemStatus: "CRTD ESTC MANC NMAT NTUP",
      },
      {
        orderType: "PM02",
        mainWorkCtr: "TP-INSP",
        order: "201618006",
        description: "Cert. Registr.- Lifting Points Inspection",
        actualRelease: null,
        basicStartDate: "2025-06-28",
        equipment: "E0849825",
        equipmentDesc: "LIFTING BEAM: BIG BAG TBB 2000KG",
        equipmentType: "Lifting Devices",
        functionalLoc: "T0208-LITR-454-070",
        systemStatus: "CRTD MANC NMAT PRC",
      },
      {
        orderType: "PM02",
        mainWorkCtr: "ELEC",
        order: "200848282",
        description: "Motor electrical maintenance",
        actualRelease: null,
        basicStartDate: "2025-10-15",
        equipment: "E0406129",
        equipmentDesc: "ELECTRIC MOTOR 400V 50Hz",
        equipmentType: "Electric Motor",
        functionalLoc: "T207-ELEC-100-001",
        systemStatus: "CRTD MANC NMAT PRC",
      },
      {
        orderType: "PM03",
        mainWorkCtr: "MECH",
        order: "200848283",
        description: "Pump mechanical overhaul",
        actualRelease: null,
        basicStartDate: "2025-10-10",
        equipment: "E0406130",
        equipmentDesc: "CENTRIFUGAL PUMP 150m3/h",
        equipmentType: "Pump",
        functionalLoc: "T46-MECH-200-001",
        systemStatus: "CRTD MANC NMAT PRC",
      },
      {
        orderType: "PM06",
        mainWorkCtr: "ESP",
        order: "200848284",
        description: "ESP downhole inspection",
        actualRelease: null,
        basicStartDate: "2025-06-10",
        equipment: "E0406131",
        equipmentDesc: "ESP SUBMERSIBLE PUMP 200HP",
        equipmentType: "ESP System",
        functionalLoc: "T700-ESP-001-001",
        systemStatus: "CRTD MANC NMAT PRC",
      },
    ];
  };

  // Excel Import Handler
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportStatus("Reading Excel file...");

      try {
        // Für Demo-Zwecke verwenden wir Mock-Daten
        const mockData = generateMockData();

        // Daten verarbeiten und kategorisieren
        const processedOrders: WorkOrder[] = mockData.map((order) => ({
          ...order,
          id: order.order,
          category: categorizeByLocation(order.functionalLoc),
          trade: categorizeByTrade(
            order.description,
            order.mainWorkCtr,
            order.equipmentDesc || ""
          ),
          priority: order.orderType === "PM02" ? "HIGH" : "MEDIUM",
          status: "OPEN",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setWorkOrders(processedOrders);
        setFilteredOrders(processedOrders);
        setImportStatus(
          `Import successful! ${processedOrders.length} work orders imported.`
        );

        toast({
          title: "Import erfolgreich",
          description: `${processedOrders.length} Work Orders wurden importiert.`,
        });

        setTimeout(() => setImportStatus(""), 5000);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        setImportStatus(`Import failed: ${message}`);
        toast({
          title: "Import fehlgeschlagen",
          description: message,
          variant: "destructive",
        });
        setTimeout(() => setImportStatus(""), 10000);
      }
    },
    [toast]
  );

  // Filter-Funktionen
  const applyFilters = useCallback(() => {
    let filtered = [...workOrders];

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (order) => order.category === selectedCategory
      );
    }

    if (selectedTrade !== "all") {
      filtered = filtered.filter((order) => order.trade === selectedTrade);
    }

    setFilteredOrders(filtered);
  }, [workOrders, selectedCategory, selectedTrade]);

  React.useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Work Order Form Component
  interface WorkOrderFormProps {
    order: WorkOrder | null;
    onSave: (order: WorkOrder) => void;
    onCancel: () => void;
  }

  const WorkOrderForm: React.FC<WorkOrderFormProps> = ({
    order,
    onSave,
    onCancel,
  }) => {
    const [formData, setFormData] = useState<Partial<WorkOrder>>(
      order || {
        orderType: "PM02",
        description: "",
        basicStartDate: "",
        equipment: "",
        functionalLoc: "",
        mainWorkCtr: "",
        priority: "MEDIUM",
        status: "OPEN",
      }
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const processedOrder: WorkOrder = {
        id: formData.id || Date.now().toString(),
        order: formData.order || Date.now().toString(),
        orderType: formData.orderType || "PM02",
        description: formData.description || "",
        basicStartDate: formData.basicStartDate || null,
        equipment: formData.equipment || "",
        functionalLoc: formData.functionalLoc || "",
        mainWorkCtr: formData.mainWorkCtr || "",
        systemStatus: formData.systemStatus || "OPEN",
        actualRelease: null,
        category: categorizeByLocation(formData.functionalLoc || ""),
        trade: categorizeByTrade(
          formData.description || "",
          formData.mainWorkCtr || "",
          formData.equipment || ""
        ),
        priority: formData.priority || "MEDIUM",
        status: formData.status || "OPEN",
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(processedOrder);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="orderType">Order Type</Label>
            <Select
              value={formData.orderType}
              onValueChange={(value) =>
                setFormData({ ...formData, orderType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PM02">PM02 - Maintenance</SelectItem>
                <SelectItem value="PM06">PM06 - Inspection</SelectItem>
                <SelectItem value="PM03">PM03 - Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) =>
                setFormData({ ...formData, priority: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="equipment">Equipment</Label>
            <Input
              id="equipment"
              value={formData.equipment}
              onChange={(e) =>
                setFormData({ ...formData, equipment: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="functionalLoc">Functional Location</Label>
            <Input
              id="functionalLoc"
              value={formData.functionalLoc}
              onChange={(e) =>
                setFormData({ ...formData, functionalLoc: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="mainWorkCtr">Main Work Center</Label>
            <Input
              id="mainWorkCtr"
              value={formData.mainWorkCtr}
              onChange={(e) =>
                setFormData({ ...formData, mainWorkCtr: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="basicStartDate">Basic Start Date</Label>
            <Input
              id="basicStartDate"
              type="date"
              value={formData.basicStartDate || ""}
              onChange={(e) =>
                setFormData({ ...formData, basicStartDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {order ? "Update" : "Create"} Work Order
          </Button>
        </div>
      </form>
    );
  };

  // Work Order Table Component
  interface WorkOrderTableProps {
    orders: WorkOrder[];
  }

  const WorkOrderTable: React.FC<WorkOrderTableProps> = ({ orders }) => {
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

    const getTradeColor = (trade: string) => {
      switch (trade) {
        case "ESP":
          return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "ELEC":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
        case "MECH":
          return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "INST":
          return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
        case "CIVIL":
          return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        default:
          return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      }
    };

    const isOverdue = (startDate: string | null) => {
      if (!startDate) return false;
      const today = new Date();
      const start = new Date(startDate);
      return start < today;
    };

    const getDaysOverdue = (startDate: string | null) => {
      if (!startDate) return 0;
      const today = new Date();
      const start = new Date(startDate);
      const diffTime = today.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };

    const getRowClassName = (order: WorkOrder) => {
      if (isOverdue(order.basicStartDate)) {
        return "hover:bg-red-50 dark:hover:bg-red-950 bg-red-25 border-l-4 border-l-red-500";
      }
      return "hover:bg-gray-50 dark:hover:bg-gray-800";
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trade
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className={getRowClassName(order)}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {order.order}
                  </td>
                  <td
                    className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate"
                    title={order.description}
                  >
                    {order.description}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {order.orderType}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge
                      className={`${getPriorityColor(order.priority)} text-xs`}
                    >
                      {order.priority}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge className={`${getTradeColor(order.trade)} text-xs`}>
                      {order.trade}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Badge variant="outline" className="text-xs">
                      {order.category}
                    </Badge>
                  </td>
                  <td
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-32 truncate"
                    title={order.equipment}
                  >
                    {order.equipment || "N/A"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {order.basicStartDate ? (
                      <div className="flex items-center space-x-2">
                        <span
                          className={
                            isOverdue(order.basicStartDate)
                              ? "text-red-600 font-semibold"
                              : "text-gray-500 dark:text-gray-400"
                          }
                        >
                          {order.basicStartDate}
                        </span>
                        {isOverdue(order.basicStartDate) && (
                          <Badge
                            className="bg-red-500 text-white text-xs px-1 py-0"
                            title={`${getDaysOverdue(
                              order.basicStartDate
                            )} days overdue`}
                          >
                            {getDaysOverdue(order.basicStartDate)}d
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingOrder(order);
                          setIsDialogOpen(true);
                        }}
                        className="h-7 px-2"
                        title="Edit Work Order"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrder(order)}
                        className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Delete Work Order"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleSaveOrder = (orderData: WorkOrder) => {
    if (editingOrder) {
      setWorkOrders((prev) =>
        prev.map((order) => (order.id === editingOrder.id ? orderData : order))
      );
      toast({
        title: "Work Order aktualisiert",
        description: `Order ${orderData.order} wurde erfolgreich aktualisiert.`,
      });
    } else {
      setWorkOrders((prev) => [...prev, orderData]);
      toast({
        title: "Work Order erstellt",
        description: `Order ${orderData.order} wurde erfolgreich erstellt.`,
      });
    }
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = (order: WorkOrder) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      setWorkOrders((prev) =>
        prev.filter((order) => order.id !== orderToDelete.id)
      );
      toast({
        title: "Work Order gelöscht",
        description: `Order ${orderToDelete.order} wurde erfolgreich gelöscht.`,
      });
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setOrderToDelete(null);
  };

  // Demo-Daten laden
  const loadDemoData = () => {
    const mockData = generateMockData();
    const processedOrders: WorkOrder[] = mockData.map((order) => ({
      ...order,
      id: order.order,
      category: categorizeByLocation(order.functionalLoc),
      trade: categorizeByTrade(
        order.description,
        order.mainWorkCtr,
        order.equipmentDesc || ""
      ),
      priority: order.orderType === "PM02" ? "HIGH" : "MEDIUM",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setWorkOrders(processedOrders);
    setFilteredOrders(processedOrders);
    toast({
      title: "Demo-Daten geladen",
      description: `${processedOrders.length} Work Orders wurden geladen.`,
    });
  };

  const groupedOrders = filteredOrders.reduce<Record<string, WorkOrder[]>>(
    (acc, order) => {
      if (!acc[order.trade]) {
        acc[order.trade] = [];
      }
      acc[order.trade].push(order);
      return acc;
    },
    {}
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Work Order Management System
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie Work Orders und Inspektionen mit SAP Excel Import
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
            Importieren Sie Work Orders aus SAP Excel-Export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Click to upload SAP Excel file (.xlsx, .xls)
                  </span>
                  <div className="text-xs text-gray-500 mt-2">
                    Supports: Order Type, Description, Functional Location,
                    Equipment, Dates, etc.
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
            </div>
            <Button onClick={loadDemoData} variant="outline">
              Load Demo Data
            </Button>
          </div>
          {importStatus && (
            <Alert
              className={`mt-4 ${
                importStatus.includes("failed")
                  ? "border-red-200 bg-red-50"
                  : importStatus.includes("successful")
                  ? "border-green-200 bg-green-50"
                  : ""
              }`}
            >
              <AlertDescription
                className={
                  importStatus.includes("failed")
                    ? "text-red-700"
                    : importStatus.includes("successful")
                    ? "text-green-700"
                    : ""
                }
              >
                {importStatus}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex space-x-4">
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="T208">T208</SelectItem>
                    <SelectItem value="T207">T207</SelectItem>
                    <SelectItem value="T46">T46</SelectItem>
                    <SelectItem value="T700">T700</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trade-filter">Trade</Label>
                <Select value={selectedTrade} onValueChange={setSelectedTrade}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trades</SelectItem>
                    <SelectItem value="ESP">ESP</SelectItem>
                    <SelectItem value="ELEC">Electrical</SelectItem>
                    <SelectItem value="MECH">Mechanical</SelectItem>
                    <SelectItem value="INST">Instrumentation</SelectItem>
                    <SelectItem value="CIVIL">Civil</SelectItem>
                    <SelectItem value="GENERAL">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex space-x-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingOrder(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Work Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingOrder
                        ? "Edit Work Order"
                        : "Create New Work Order"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingOrder
                        ? "Update work order details"
                        : "Fill in the details for the new work order"}
                    </DialogDescription>
                  </DialogHeader>
                  <WorkOrderForm
                    order={editingOrder}
                    onSave={handleSaveOrder}
                    onCancel={() => {
                      setIsDialogOpen(false);
                      setEditingOrder(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                onClick={() => {
                  setWorkOrders([]);
                  setFilteredOrders([]);
                  toast({
                    title: "Alle Work Orders gelöscht",
                    description: "Die Liste wurde geleert.",
                  });
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders Display */}
      {Object.keys(groupedOrders).length > 0 ? (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">All ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="ESP">
              ESP ({groupedOrders.ESP?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="ELEC">
              ELEC ({groupedOrders.ELEC?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="MECH">
              MECH ({groupedOrders.MECH?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="INST">
              INST ({groupedOrders.INST?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="CIVIL">
              CIVIL ({groupedOrders.CIVIL?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="GENERAL">
              General ({groupedOrders.GENERAL?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <WorkOrderTable orders={filteredOrders} />
          </TabsContent>

          {Object.entries(groupedOrders).map(([trade, orders]) => (
            <TabsContent key={trade} value={trade} className="mt-6">
              <WorkOrderTable orders={orders} />
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No Work Orders</h3>
            <p className="text-muted-foreground mb-4">
              Import an Excel file or create a new work order to get started
            </p>
            <Button onClick={loadDemoData}>Load Demo Data</Button>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Delete Work Order
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this work order? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {orderToDelete && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
              <div className="text-sm">
                <strong>Order:</strong> {orderToDelete.order}
                <br />
                <strong>Description:</strong> {orderToDelete.description}
                <br />
                <strong>Category:</strong> {orderToDelete.category}
                <br />
                <strong>Trade:</strong> {orderToDelete.trade}
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Work Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistics */}
      {workOrders.length > 0 && (
        <div className="mt-8 grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{workOrders.length}</div>
              <p className="text-xs text-muted-foreground">Total Work Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {
                  workOrders.filter(
                    (o) => o.priority === "HIGH" || o.priority === "URGENT"
                  ).length
                }
              </div>
              <p className="text-xs text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(workOrders.map((o) => o.category)).size}
              </div>
              <p className="text-xs text-muted-foreground">Categories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {
                  workOrders.filter((o) => {
                    if (!o.basicStartDate) return false;
                    const today = new Date();
                    const start = new Date(o.basicStartDate);
                    return start < today;
                  }).length
                }
              </div>
              <p className="text-xs text-muted-foreground">Overdue Orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {new Set(workOrders.map((o) => o.trade)).size}
              </div>
              <p className="text-xs text-muted-foreground">Trades</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WorkOrderManagement;
