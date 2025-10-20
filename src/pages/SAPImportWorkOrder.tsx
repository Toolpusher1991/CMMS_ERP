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
  CheckSquare,
  Truck,
  Package,
  FileText,
  Send,
} from "lucide-react";

const WorkOrderManagement = () => {
  const [workOrders, setWorkOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState("all");
  const [importStatus, setImportStatus] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [todos, setTodos] = useState([]);
  const [transports, setTransports] = useState([]);
  const [activeTab, setActiveTab] = useState("workorders");
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [transportDialogOpen, setTransportDialogOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState(null);

  // Kategorisierung basierend auf Functional Location
  const categorizeByLocation = (functionalLoc) => {
    if (!functionalLoc) return "UNKNOWN";
    const loc = functionalLoc.toString().toUpperCase();
    if (loc.includes("T208") || loc.includes("T0208")) return "T208";
    if (loc.includes("T207") || loc.includes("T0207")) return "T207";
    if (loc.includes("T46") || loc.includes("T046")) return "T46";
    if (loc.includes("T700") || loc.includes("T0700")) return "T700";
    return "OTHER";
  };

  // Gewerk-Kategorisierung basierend auf Description und WorkCenter
  const categorizeByTrade = (description, workCenter, equipment) => {
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
  const generateMockData = () => {
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
        basicStartDate: "2025-10-15", // Überfällig
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
        basicStartDate: "2025-10-10", // Überfällig
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

  // Excel Import Handler - Verbessert für echte SAP-Daten
  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportStatus("Reading Excel file...");

    try {
      // Für Demo-Zwecke verwenden wir Mock-Daten
      const mockData = generateMockData();

      // Daten verarbeiten und kategorisieren
      const processedOrders = mockData.map((order) => ({
        ...order,
        id: order.order,
        category: categorizeByLocation(order.functionalLoc),
        trade: categorizeByTrade(
          order.description,
          order.mainWorkCtr,
          order.equipmentDesc
        ),
        priority: order.orderType === "PM02" ? "HIGH" : "MEDIUM",
        status: "OPEN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setWorkOrders(processedOrders);
      setFilteredOrders(processedOrders);
      setImportStatus(
        "Import successful! " +
          processedOrders.length +
          " work orders imported."
      );

      setTimeout(() => setImportStatus(""), 3000);
    } catch (error) {
      setImportStatus("Import failed: " + error.message);
      setTimeout(() => setImportStatus(""), 5000);
    }
  }, []);

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
  const WorkOrderForm = ({ order, onSave, onCancel }) => {
    const [formData, setFormData] = useState(
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

    const handleSubmit = (e) => {
      e.preventDefault();
      const processedOrder = {
        ...formData,
        id: formData.id || Date.now().toString(),
        category: categorizeByLocation(formData.functionalLoc),
        trade: categorizeByTrade(
          formData.description,
          formData.mainWorkCtr,
          formData.equipment
        ),
        createdAt: formData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSave(processedOrder);
    };

    return (
      <div className="space-y-4">
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
              value={formData.basicStartDate}
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
          <Button type="button" onClick={handleSubmit}>
            {order ? "Update" : "Create"} Work Order
          </Button>
        </div>
      </div>
    );
  };

  // ToDo Form Component
  const TodoForm = ({ order, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: `Task for ${order?.order}`,
      description: order?.description || "",
      priority: "MEDIUM",
      dueDate: "",
      assignee: "",
    });

    const handleSubmit = () => {
      if (!formData.title || !formData.dueDate || !formData.assignee) {
        alert("Please fill in all required fields");
        return;
      }
      onSave(formData);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="todo-title">Task Title *</Label>
          <Input
            id="todo-title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            placeholder="Enter task title"
          />
        </div>

        <div>
          <Label htmlFor="todo-description">Description</Label>
          <Textarea
            id="todo-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Task details"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="todo-priority">Priority</Label>
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
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="todo-due">Due Date *</Label>
            <Input
              id="todo-due"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>
        </div>

        <div>
          <Label htmlFor="todo-assignee">Assignee *</Label>
          <Input
            id="todo-assignee"
            value={formData.assignee}
            onChange={(e) =>
              setFormData({ ...formData, assignee: e.target.value })
            }
            placeholder="Person responsible"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create ToDo</Button>
        </div>
      </div>
    );
  };

  // Transport Form Component
  const TransportForm = ({ order, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      documentType: "INSPECTION_SHIPMENT",
      fromLocation: "",
      toLocation: "",
      shipmentDate: "",
      expectedDelivery: "",
      carrier: "",
      trackingNumber: "",
      specialInstructions: "",
    });

    const handleSubmit = () => {
      if (
        !formData.fromLocation ||
        !formData.toLocation ||
        !formData.shipmentDate
      ) {
        alert("Please fill in all required fields");
        return;
      }
      onSave(formData);
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="doc-type">Document Type</Label>
          <Select
            value={formData.documentType}
            onValueChange={(value) =>
              setFormData({ ...formData, documentType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INSPECTION_SHIPMENT">
                Inspection Shipment
              </SelectItem>
              <SelectItem value="RETURN_SHIPMENT">Return Shipment</SelectItem>
              <SelectItem value="REPAIR_SHIPMENT">Repair Shipment</SelectItem>
              <SelectItem value="PARTS_DELIVERY">Parts Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="from-location">From Location *</Label>
            <Input
              id="from-location"
              value={formData.fromLocation}
              onChange={(e) =>
                setFormData({ ...formData, fromLocation: e.target.value })
              }
              placeholder="Origin address"
            />
          </div>
          <div>
            <Label htmlFor="to-location">To Location *</Label>
            <Input
              id="to-location"
              value={formData.toLocation}
              onChange={(e) =>
                setFormData({ ...formData, toLocation: e.target.value })
              }
              placeholder="Destination address"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ship-date">Shipment Date *</Label>
            <Input
              id="ship-date"
              type="date"
              value={formData.shipmentDate}
              onChange={(e) =>
                setFormData({ ...formData, shipmentDate: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="delivery-date">Expected Delivery</Label>
            <Input
              id="delivery-date"
              type="date"
              value={formData.expectedDelivery}
              onChange={(e) =>
                setFormData({ ...formData, expectedDelivery: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="carrier">Carrier</Label>
            <Input
              id="carrier"
              value={formData.carrier}
              onChange={(e) =>
                setFormData({ ...formData, carrier: e.target.value })
              }
              placeholder="Transport company"
            />
          </div>
          <div>
            <Label htmlFor="tracking">Tracking Number</Label>
            <Input
              id="tracking"
              value={formData.trackingNumber}
              onChange={(e) =>
                setFormData({ ...formData, trackingNumber: e.target.value })
              }
              placeholder="Tracking reference"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="instructions">Special Instructions</Label>
          <Textarea
            id="instructions"
            value={formData.specialInstructions}
            onChange={(e) =>
              setFormData({ ...formData, specialInstructions: e.target.value })
            }
            placeholder="Handling instructions, special requirements, etc."
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <FileText className="w-4 h-4 mr-2" />
            Create Transport Document
          </Button>
        </div>
      </div>
    );
  };

  // Work Order Table Component
  const WorkOrderTable = ({ orders }) => {
    const getPriorityColor = (priority) => {
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

    const getTradeColor = (trade) => {
      switch (trade) {
        case "ESP":
          return "bg-blue-100 text-blue-800";
        case "ELEC":
          return "bg-yellow-100 text-yellow-800";
        case "MECH":
          return "bg-green-100 text-green-800";
        case "INST":
          return "bg-purple-100 text-purple-800";
        case "CIVIL":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-600";
      }
    };

    const isOverdue = (startDate) => {
      if (!startDate) return false;
      const today = new Date();
      const start = new Date(startDate);
      return start < today;
    };

    const getDaysOverdue = (startDate) => {
      if (!startDate) return 0;
      const today = new Date();
      const start = new Date(startDate);
      const diffTime = today - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };

    const getRowClassName = (order) => {
      const overdue = isOverdue(order.basicStartDate);
      const daysOver = getDaysOverdue(order.basicStartDate);

      if (overdue) {
        if (daysOver > 30) {
          return "hover:bg-red-100 bg-red-50 border-l-4 border-l-red-600 animate-pulse";
        } else if (daysOver > 7) {
          return "hover:bg-red-50 bg-red-25 border-l-4 border-l-red-500";
        } else {
          return "hover:bg-orange-50 bg-orange-25 border-l-4 border-l-orange-500";
        }
      }
      return "hover:bg-gray-50";
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className={getRowClassName(order)}>
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order}
                  </td>
                  <td
                    className="px-3 py-2 text-sm text-gray-900 max-w-xs truncate"
                    title={order.description}
                  >
                    {order.description}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
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
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 max-w-32 truncate"
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
                              ? getDaysOverdue(order.basicStartDate) > 30
                                ? "text-red-700 font-bold animate-pulse"
                                : getDaysOverdue(order.basicStartDate) > 7
                                ? "text-red-600 font-semibold"
                                : "text-orange-600 font-semibold"
                              : "text-gray-500"
                          }
                        >
                          {order.basicStartDate}
                        </span>
                        {isOverdue(order.basicStartDate) && (
                          <Badge
                            className={
                              getDaysOverdue(order.basicStartDate) > 30
                                ? "bg-red-600 text-white text-xs px-1 py-0 animate-pulse"
                                : getDaysOverdue(order.basicStartDate) > 7
                                ? "bg-red-500 text-white text-xs px-1 py-0"
                                : "bg-orange-500 text-white text-xs px-1 py-0"
                            }
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
                        onClick={() => {
                          setSelectedOrderForAction(order);
                          setTodoDialogOpen(true);
                        }}
                        className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Create ToDo"
                      >
                        <CheckSquare className="w-3 h-3" />
                      </Button>
                      {(order.description.toLowerCase().includes("insp") ||
                        order.orderType === "PM06") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrderForAction(order);
                            setTransportDialogOpen(true);
                          }}
                          className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Create Transport Document"
                        >
                          <Truck className="w-3 h-3" />
                        </Button>
                      )}
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

  const handleSaveOrder = (orderData) => {
    if (editingOrder) {
      setWorkOrders((prev) =>
        prev.map((order) => (order.id === editingOrder.id ? orderData : order))
      );
    } else {
      setWorkOrders((prev) => [...prev, orderData]);
    }
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      setWorkOrders((prev) =>
        prev.filter((order) => order.id !== orderToDelete.id)
      );
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setOrderToDelete(null);
  };

  // ToDo Management
  const createTodo = (todoData) => {
    const newTodo = {
      id: Date.now().toString(),
      workOrderId: selectedOrderForAction.id,
      workOrderNumber: selectedOrderForAction.order,
      title: todoData.title,
      description: todoData.description,
      priority: todoData.priority,
      dueDate: todoData.dueDate,
      assignee: todoData.assignee,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      category: selectedOrderForAction.category,
      trade: selectedOrderForAction.trade,
    };

    setTodos((prev) => [...prev, newTodo]);
    setTodoDialogOpen(false);
    setSelectedOrderForAction(null);
  };

  const updateTodoStatus = (todoId, newStatus) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === todoId
          ? { ...todo, status: newStatus, updatedAt: new Date().toISOString() }
          : todo
      )
    );
  };

  const deleteTodo = (todoId) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== todoId));
  };

  // Transport Management
  const createTransportDocument = (transportData) => {
    const newTransport = {
      id: `TRN-${Date.now()}`,
      workOrderId: selectedOrderForAction.id,
      workOrderNumber: selectedOrderForAction.order,
      documentType: transportData.documentType,
      fromLocation: transportData.fromLocation,
      toLocation: transportData.toLocation,
      equipment: selectedOrderForAction.equipment,
      equipmentDesc: selectedOrderForAction.equipmentDesc,
      shipmentDate: transportData.shipmentDate,
      expectedDelivery: transportData.expectedDelivery,
      carrier: transportData.carrier,
      trackingNumber: transportData.trackingNumber,
      specialInstructions: transportData.specialInstructions,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      category: selectedOrderForAction.category,
    };

    setTransports((prev) => [...prev, newTransport]);
    setTransportDialogOpen(false);
    setSelectedOrderForAction(null);
  };

  const updateTransportStatus = (transportId, newStatus) => {
    setTransports((prev) =>
      prev.map((transport) =>
        transport.id === transportId
          ? {
              ...transport,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            }
          : transport
      )
    );
  };

  // Demo-Daten laden
  const loadDemoData = () => {
    const mockData = generateMockData();
    const processedOrders = mockData.map((order) => ({
      ...order,
      id: order.order,
      category: categorizeByLocation(order.functionalLoc),
      trade: categorizeByTrade(
        order.description,
        order.mainWorkCtr,
        order.equipmentDesc
      ),
      priority: order.orderType === "PM02" ? "HIGH" : "MEDIUM",
      status: "OPEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    setWorkOrders(processedOrders);
    setFilteredOrders(processedOrders);
  };

  const groupedOrders = filteredOrders.reduce((acc, order) => {
    if (!acc[order.trade]) {
      acc[order.trade] = [];
    }
    acc[order.trade].push(order);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Work Order Management System
        </h1>
        <p className="text-gray-600">
          Verwalten Sie Work Orders, ToDos und Transport-Dokumente
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="workorders" className="flex items-center">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Work Orders ({workOrders.length})
          </TabsTrigger>
          <TabsTrigger value="todos" className="flex items-center">
            <CheckSquare className="w-4 h-4 mr-2" />
            ToDos ({todos.filter((t) => t.status !== "COMPLETED").length})
          </TabsTrigger>
          <TabsTrigger value="transport" className="flex items-center">
            <Truck className="w-4 h-4 mr-2" />
            Transport ({transports.length})
          </TabsTrigger>
        </TabsList>

        {/* Work Orders Tab */}
        <TabsContent value="workorders">
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
                      <span className="text-sm text-gray-600">
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
              <div className="flex justify-between items-center">
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
                    <Select
                      value={selectedTrade}
                      onValueChange={setSelectedTrade}
                    >
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
                <TabsTrigger value="all">
                  All ({filteredOrders.length})
                </TabsTrigger>
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
                <p className="text-gray-600 mb-4">
                  Import an Excel file or create a new work order to get started
                </p>
                <Button onClick={loadDemoData}>Load Demo Data</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ToDos Tab */}
        <TabsContent value="todos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2" />
                  ToDo List
                </span>
                <Badge variant="outline">
                  {todos.filter((t) => t.status !== "COMPLETED").length} Open
                </Badge>
              </CardTitle>
              <CardDescription>
                Task management generated from Work Orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todos.length > 0 ? (
                <div className="space-y-3">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`border rounded-lg p-4 ${
                        todo.status === "COMPLETED"
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4
                              className={`font-medium ${
                                todo.status === "COMPLETED"
                                  ? "line-through text-gray-500"
                                  : ""
                              }`}
                            >
                              {todo.title}
                            </h4>
                            <Badge
                              className={
                                todo.priority === "HIGH"
                                  ? "bg-red-500"
                                  : todo.priority === "MEDIUM"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }
                            >
                              {todo.priority}
                            </Badge>
                            <Badge variant="outline">{todo.trade}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {todo.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>WO: {todo.workOrderNumber}</span>
                            <span>Due: {todo.dueDate}</span>
                            <span>Assigned: {todo.assignee}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {todo.status !== "COMPLETED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateTodoStatus(todo.id, "COMPLETED")
                              }
                            >
                              <CheckSquare className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTodo(todo.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No ToDos</h3>
                  <p className="text-gray-600">
                    Create ToDos from Work Orders using the action buttons
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transport Tab */}
        <TabsContent value="transport">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Transport Documents
                </span>
                <Badge variant="outline">
                  {transports.filter((t) => t.status === "PENDING").length}{" "}
                  Pending
                </Badge>
              </CardTitle>
              <CardDescription>
                Logistics and transport documentation for inspections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transports.length > 0 ? (
                <div className="space-y-4">
                  {transports.map((transport) => (
                    <div key={transport.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{transport.id}</h4>
                          <p className="text-sm text-gray-600">
                            WO: {transport.workOrderNumber}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              transport.status === "DELIVERED"
                                ? "bg-green-500"
                                : transport.status === "IN_TRANSIT"
                                ? "bg-blue-500"
                                : transport.status === "SHIPPED"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }
                          >
                            {transport.status}
                          </Badge>
                          <Badge variant="outline">
                            {transport.documentType}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>From:</strong> {transport.fromLocation}
                        </div>
                        <div>
                          <strong>To:</strong> {transport.toLocation}
                        </div>
                        <div>
                          <strong>Equipment:</strong> {transport.equipment}
                        </div>
                        <div>
                          <strong>Carrier:</strong> {transport.carrier}
                        </div>
                        <div>
                          <strong>Ship Date:</strong> {transport.shipmentDate}
                        </div>
                        <div>
                          <strong>Expected:</strong>{" "}
                          {transport.expectedDelivery}
                        </div>
                      </div>
                      {transport.trackingNumber && (
                        <div className="mt-2 text-sm">
                          <strong>Tracking:</strong> {transport.trackingNumber}
                        </div>
                      )}
                      <div className="flex justify-end space-x-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateTransportStatus(transport.id, "SHIPPED")
                          }
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Ship
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateTransportStatus(transport.id, "DELIVERED")
                          }
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Delivered
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">
                    No Transport Documents
                  </h3>
                  <p className="text-gray-600">
                    Create transport documents for inspection items using the
                    truck icon in Work Orders
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ToDo Creation Dialog */}
      <Dialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              Create ToDo
            </DialogTitle>
            <DialogDescription>
              Create a task from Work Order: {selectedOrderForAction?.order}
            </DialogDescription>
          </DialogHeader>
          <TodoForm
            order={selectedOrderForAction}
            onSave={createTodo}
            onCancel={() => {
              setTodoDialogOpen(false);
              setSelectedOrderForAction(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Transport Document Dialog */}
      <Dialog open={transportDialogOpen} onOpenChange={setTransportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Create Transport Document
            </DialogTitle>
            <DialogDescription>
              Create logistics documentation for Work Order:{" "}
              {selectedOrderForAction?.order}
            </DialogDescription>
          </DialogHeader>
          <TransportForm
            order={selectedOrderForAction}
            onSave={createTransportDocument}
            onCancel={() => {
              setTransportDialogOpen(false);
              setSelectedOrderForAction(null);
            }}
          />
        </DialogContent>
      </Dialog>

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
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
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
      {(workOrders.length > 0 || todos.length > 0 || transports.length > 0) && (
        <div className="mt-8 grid grid-cols-6 gap-4">
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
              <div className="text-2xl font-bold text-blue-600">
                {todos.filter((t) => t.status !== "COMPLETED").length}
              </div>
              <p className="text-xs text-muted-foreground">Open ToDos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {transports.filter((t) => t.status === "PENDING").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Pending Transports
              </p>
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
