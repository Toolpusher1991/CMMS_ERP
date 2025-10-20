# 🚀 Quick Start Guide: Erste Features entwickeln

**Ziel:** In 2-3 Stunden dein erstes CMMS Feature entwickeln!

---

## 📋 Feature-Template: Equipment Management

Dieses Template zeigt dir Step-by-Step, wie du ein neues Feature hinzufügst.  
**Kopiere einfach diesen Ansatz für weitere Features (Tasks, Work Orders, etc.)!**

---

## 🎯 Step 1: Database Schema erweitern (5 Minuten)

### 1.1 Prisma Schema bearbeiten

```prisma
// backend/prisma/schema.prisma

// Am Ende der Datei hinzufügen:
model Equipment {
  id            String   @id @default(uuid())
  name          String
  serialNumber  String?
  manufacturer  String?
  model         String?
  category      String   // "HVAC", "ELECTRICAL", "MECHANICAL", etc.
  location      String?
  status        String   @default("ACTIVE") // "ACTIVE", "INACTIVE", "MAINTENANCE", "BROKEN"
  purchaseDate  DateTime?
  warrantyUntil DateTime?
  notes         String?

  // Relations
  createdBy     String
  user          User     @relation(fields: [createdBy], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("equipment")
}

// User Model erweitern:
model User {
  // ... existing fields ...
  equipment     Equipment[]  // NEUE ZEILE HINZUFÜGEN
  // ... rest ...
}
```

### 1.2 Migration ausführen

```bash
cd backend
npx prisma migrate dev --name add_equipment
```

**✅ Checkpoint:** Database hat jetzt `equipment` Table!

---

## 🎯 Step 2: Backend API erstellen (20-30 Minuten)

### 2.1 Controller erstellen

```typescript
// backend/src/controllers/equipment.controller.ts

import { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Validation Schemas
const createEquipmentSchema = z.object({
  name: z.string().min(1).max(100),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  category: z.string().min(1),
  location: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "BROKEN"]).optional(),
  purchaseDate: z.string().optional(),
  warrantyUntil: z.string().optional(),
  notes: z.string().optional(),
});

const updateEquipmentSchema = createEquipmentSchema.partial();

// GET /api/equipment - Get all equipment
export const getAllEquipment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/equipment/:id - Get equipment by ID
export const getEquipmentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!equipment) {
      throw new AppError("Equipment not found", 404);
    }

    res.json({
      success: true,
      data: equipment,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/equipment - Create new equipment
export const createEquipment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = createEquipmentSchema.parse(req.body);
    const userId = req.user!.id;

    const equipment = await prisma.equipment.create({
      data: {
        ...validated,
        createdBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Equipment created successfully",
      data: equipment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

// PUT /api/equipment/:id - Update equipment
export const updateEquipment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const validated = updateEquipmentSchema.parse(req.body);

    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      throw new AppError("Equipment not found", 404);
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data: validated,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Equipment updated successfully",
      data: equipment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError(error.errors[0].message, 400));
    }
    next(error);
  }
};

// DELETE /api/equipment/:id - Delete equipment
export const deleteEquipment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      throw new AppError("Equipment not found", 404);
    }

    await prisma.equipment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Equipment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
```

### 2.2 Routes erstellen

```typescript
// backend/src/routes/equipment.routes.ts

import { Router } from "express";
import {
  getAllEquipment,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipment.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/equipment - All users can view equipment
router.get("/", getAllEquipment);

// GET /api/equipment/:id - All users can view equipment details
router.get("/:id", getEquipmentById);

// POST /api/equipment - Admin and Manager can create
router.post("/", authorize("ADMIN", "MANAGER"), createEquipment);

// PUT /api/equipment/:id - Admin and Manager can update
router.put("/:id", authorize("ADMIN", "MANAGER"), updateEquipment);

// DELETE /api/equipment/:id - Only Admin can delete
router.delete("/:id", authorize("ADMIN"), deleteEquipment);

export default router;
```

### 2.3 Routes in index.ts registrieren

```typescript
// backend/src/index.ts

// Oben hinzufügen:
import equipmentRoutes from "./routes/equipment.routes";

// Bei den anderen Routes hinzufügen (nach userRoutes):
app.use("/api/equipment", equipmentRoutes);
```

**✅ Checkpoint:** Backend API ist fertig! Test mit Postman/Thunder Client.

---

## 🎯 Step 3: Frontend Service erstellen (10 Minuten)

```typescript
// src/services/equipment.service.ts

import { apiClient } from "./api";

export interface Equipment {
  id: string;
  name: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  category: string;
  location?: string;
  status: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  notes?: string;
  createdBy: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipmentData {
  name: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  category: string;
  location?: string;
  status?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  notes?: string;
}

export interface UpdateEquipmentData extends Partial<CreateEquipmentData> {}

export interface EquipmentListResponse {
  success: boolean;
  data: Equipment[];
}

export interface EquipmentResponse {
  success: boolean;
  data: Equipment;
  message?: string;
}

export const equipmentService = {
  async getAll(): Promise<EquipmentListResponse> {
    return apiClient.get<EquipmentListResponse>("/equipment");
  },

  async getById(id: string): Promise<EquipmentResponse> {
    return apiClient.get<EquipmentResponse>(`/equipment/${id}`);
  },

  async create(data: CreateEquipmentData): Promise<EquipmentResponse> {
    return apiClient.post<EquipmentResponse>("/equipment", data);
  },

  async update(
    id: string,
    data: UpdateEquipmentData
  ): Promise<EquipmentResponse> {
    return apiClient.put<EquipmentResponse>(`/equipment/${id}`, data);
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/equipment/${id}`);
  },
};
```

**✅ Checkpoint:** Service Layer ist fertig!

---

## 🎯 Step 4: Frontend Page erstellen (30-40 Minuten)

```tsx
// src/pages/EquipmentPage.tsx

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { equipmentService, type Equipment } from "@/services/equipment.service";

export function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    manufacturer: "",
    model: "",
    category: "",
    location: "",
    status: "ACTIVE",
    notes: "",
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setIsLoading(true);
      const response = await equipmentService.getAll();
      setEquipment(response.data);
    } catch (error) {
      console.error("Failed to load equipment:", error);
      alert("Fehler beim Laden der Geräte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await equipmentService.create(formData);
      setIsCreateDialogOpen(false);
      resetForm();
      loadEquipment();
      alert("Gerät erfolgreich erstellt");
    } catch (error: any) {
      alert(error.message || "Fehler beim Erstellen");
    }
  };

  const handleEdit = async () => {
    if (!selectedEquipment) return;
    try {
      await equipmentService.update(selectedEquipment.id, formData);
      setIsEditDialogOpen(false);
      resetForm();
      loadEquipment();
      alert("Gerät erfolgreich aktualisiert");
    } catch (error: any) {
      alert(error.message || "Fehler beim Aktualisieren");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Möchten Sie dieses Gerät wirklich löschen?")) return;
    try {
      await equipmentService.delete(id);
      loadEquipment();
      alert("Gerät erfolgreich gelöscht");
    } catch (error: any) {
      alert(error.message || "Fehler beim Löschen");
    }
  };

  const openEditDialog = (item: Equipment) => {
    setSelectedEquipment(item);
    setFormData({
      name: item.name,
      serialNumber: item.serialNumber || "",
      manufacturer: item.manufacturer || "",
      model: item.model || "",
      category: item.category,
      location: item.location || "",
      status: item.status,
      notes: item.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      serialNumber: "",
      manufacturer: "",
      model: "",
      category: "",
      location: "",
      status: "ACTIVE",
      notes: "",
    });
    setSelectedEquipment(null);
  };

  const filteredEquipment = equipment.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "BROKEN":
        return "bg-red-100 text-red-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Equipment Management</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie alle Geräte und Anlagen
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Gerät
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Geräte ({filteredEquipment.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Standort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hersteller</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Keine Geräte gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.location || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>{item.manufacturer || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Neues Gerät erstellen</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="category">Kategorie *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="HVAC, Electrical, etc."
              />
            </div>
            <div>
              <Label htmlFor="serialNumber">Seriennummer</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, serialNumber: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="manufacturer">Hersteller</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="model">Modell</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="location">Standort</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notizen</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreate}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerät bearbeiten</DialogTitle>
          </DialogHeader>
          {/* Same form fields as Create Dialog */}
          <div className="grid grid-cols-2 gap-4">
            {/* ... same fields ... */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleEdit}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**✅ Checkpoint:** Frontend Page ist fertig!

---

## 🎯 Step 5: In App.tsx integrieren (5 Minuten)

```tsx
// src/App.tsx

// Import hinzufügen:
import { EquipmentPage } from "@/pages/EquipmentPage";

// In renderPage() Function:
const renderPage = () => {
  switch (currentPage) {
    case "dashboard":
      return <DashboardPage />;
    case "users":
      return <UserAdminPage />;
    case "equipment": // NEU
      return <EquipmentPage />; // NEU
    case "settings":
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Einstellungen</h2>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      );
    // ... rest ...
  }
};
```

### Navigation im Sidebar hinzufügen:

```tsx
// src/components/DashboardLayout.tsx

// Bei den Navigation Items hinzufügen:
const navigation = [
  { name: "Dashboard", href: "dashboard", icon: Home },
  { name: "Equipment", href: "equipment", icon: Package }, // NEU (Package Icon importieren)
  { name: "Benutzer", href: "users", icon: Users, adminOnly: true },
  { name: "Einstellungen", href: "settings", icon: Settings },
];
```

**✅ Checkpoint:** Feature ist komplett integriert!

---

## 🧪 Step 6: Testen (10 Minuten)

### Backend Test:

```bash
cd backend
npm run dev
```

### Frontend Test:

```bash
# In neuem Terminal:
npm run dev
```

### Test Checklist:

- ✅ Login funktioniert
- ✅ Equipment Page wird angezeigt
- ✅ Equipment erstellen
- ✅ Equipment Liste wird angezeigt
- ✅ Equipment bearbeiten
- ✅ Equipment löschen
- ✅ Suche funktioniert

---

## 🎉 Fertig! In ~2 Stunden!

### Was du jetzt hast:

- ✅ Vollständiges Equipment CRUD
- ✅ Backend API mit Auth & Validation
- ✅ Frontend Page mit shadcn/ui
- ✅ Suche & Filter
- ✅ Role-based Permissions

---

## 🔄 Nächste Features (Copy & Paste):

### 1. Maintenance Tasks

- **Gleiche Schritte** wie Equipment
- Relation zu Equipment: `equipmentId`
- Fields: `title`, `description`, `priority`, `dueDate`, `status`

### 2. Work Orders

- **Gleiche Schritte** wie Equipment
- Relations: `equipmentId`, `assignedTo`, `tasks`
- Fields: `title`, `description`, `priority`, `status`, `startDate`, `endDate`

### 3. Spare Parts Inventory

- **Gleiche Schritte** wie Equipment
- Fields: `name`, `partNumber`, `quantity`, `minQuantity`, `location`, `supplier`

---

## 💡 Pro Tips

### 1. Code Reusability

Erstelle wiederverwendbare Components:

```tsx
// src/components/shared/DataTable.tsx
// src/components/shared/FormDialog.tsx
// src/components/shared/DeleteConfirmation.tsx
```

### 2. Form Validation

Nutze Zod auch im Frontend:

```typescript
import { z } from "zod";

const equipmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
});

// In Component:
const validateForm = () => {
  try {
    equipmentSchema.parse(formData);
    return true;
  } catch (error) {
    // Show validation errors
    return false;
  }
};
```

### 3. Loading States

Nutze Skeletons statt Spinner:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

{
  isLoading ? <Skeleton className="h-12 w-full" /> : <Table>...</Table>;
}
```

### 4. Error Handling

Erstelle einen Toast Service:

```typescript
// src/lib/toast.ts
import { toast } from "sonner"; // npm install sonner

export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
```

---

## 📚 Weitere Ressourcen

- **shadcn/ui Components:** https://ui.shadcn.com/docs/components
- **Prisma Docs:** https://www.prisma.io/docs
- **Zod Validation:** https://zod.dev
- **React Patterns:** https://reactpatterns.com

---

**Happy Coding! 🚀**

Bei Fragen einfach melden!
