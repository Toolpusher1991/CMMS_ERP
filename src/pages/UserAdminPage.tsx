import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userService } from "@/services/user.service";
import type { User } from "@/services/auth.service";

export function UserAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "USER",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      alert("Fehler beim Laden der Benutzer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await userService.createUser(formData);
      await loadUsers();
      setIsCreateDialogOpen(false);
      resetForm();
      alert("Benutzer erfolgreich erstellt");
    } catch (error: any) {
      console.error("Failed to create user:", error);
      alert(error.message || "Fehler beim Erstellen des Benutzers");
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const { password, ...updateData } = formData;
      await userService.updateUser(selectedUser.id, updateData);
      await loadUsers();
      setIsEditDialogOpen(false);
      resetForm();
      alert("Benutzer erfolgreich aktualisiert");
    } catch (error: any) {
      console.error("Failed to update user:", error);
      alert(error.message || "Fehler beim Aktualisieren des Benutzers");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Möchten Sie diesen Benutzer wirklich löschen?")) return;

    try {
      await userService.deleteUser(userId);
      await loadUsers();
      alert("Benutzer erfolgreich gelöscht");
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      alert(error.message || "Fehler beim Löschen des Benutzers");
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      await userService.updateUser(userId, { isActive: !user.isActive });
      await loadUsers();
    } catch (error: any) {
      console.error("Failed to toggle user status:", error);
      alert(error.message || "Fehler beim Ändern des Status");
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "USER",
    });
    setSelectedUser(null);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MANAGER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Benutzerverwaltung
          </h2>
          <p className="text-muted-foreground">
            Verwalten Sie Benutzer und deren Berechtigungen
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          ➕ Neuer Benutzer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Benutzer ({users.length})</CardTitle>
          <CardDescription>Liste aller Benutzer im System</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Lade Benutzer...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Benutzer gefunden
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.isActive ? "✓ Aktiv" : "✗ Inaktiv"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        ✏️
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(user.id)}
                      >
                        {user.isActive ? "🔒" : "🔓"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        🗑️
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Benutzer</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Benutzer für das System
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <select
                id="role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleCreate}>Erstellen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Aktualisieren Sie die Benutzerdaten
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">Vorname</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Nachname</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">E-Mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rolle</Label>
              <select
                id="edit-role"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              >
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button onClick={handleUpdate}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
