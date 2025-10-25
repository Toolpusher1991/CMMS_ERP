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
import {
  userManagementService,
  type PendingUser,
  type UserStatistics,
} from "@/services/user-management.service";
import type { User } from "@/services/auth.service";
import {
  UserPlus,
  Check,
  X,
  Key,
  Unlock,
  Search,
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  QrCode,
} from "lucide-react";

type TabType = "all" | "pending" | "statistics";

export function EnhancedUserAdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isQRCodeDialogOpen, setIsQRCodeDialogOpen] = useState(false);
  const [qrCodeUrl, setQRCodeUrl] = useState<string>("");

  const [selectedUser, setSelectedUser] = useState<User | PendingUser | null>(
    null
  );
  const [approvalAction, setApprovalAction] = useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "USER",
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "all") {
        await loadUsers();
      } else if (activeTab === "pending") {
        await loadPendingUsers();
      } else if (activeTab === "statistics") {
        await loadStatistics();
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await userService.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
      alert("Fehler beim Laden der Benutzer");
    }
  };

  const loadPendingUsers = async () => {
    try {
      const response = await userManagementService.getPendingUsers();
      setPendingUsers(response.data);
    } catch (error) {
      console.error("Failed to load pending users:", error);
      alert("Fehler beim Laden der wartenden Benutzer");
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await userManagementService.getUserStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error("Failed to load statistics:", error);
      alert("Fehler beim Laden der Statistiken");
    }
  };

  /**
   * QR-Code für User anzeigen
   */
  const handleShowQRCode = async (user: User) => {
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5137/api";
    const token = localStorage.getItem("accessToken");

    if (!token) {
      alert("Nicht authentifiziert");
      return;
    }

    // URL zum QR-Code Bild
    const qrUrl = `${API_BASE_URL.replace("/api", "")}/api/qr/users/${
      user.id
    }/qr-code?token=${token}`;

    setSelectedUser(user);
    setQRCodeUrl(qrUrl);
    setIsQRCodeDialogOpen(true);
  };

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  const handleCreate = async () => {
    if (
      !formData.email ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.password
    ) {
      alert("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

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

  // ============================================
  // USER APPROVAL
  // ============================================

  const handleApprovalDialog = (
    user: PendingUser,
    action: "APPROVED" | "REJECTED"
  ) => {
    setSelectedUser(user);
    setApprovalAction(action);
    setIsApprovalDialogOpen(true);
  };

  const handleApproval = async () => {
    if (!selectedUser) return;

    try {
      await userManagementService.approveUser(selectedUser.id, {
        approvalStatus: approvalAction,
        rejectionReason:
          approvalAction === "REJECTED" ? rejectionReason : undefined,
      });

      setIsApprovalDialogOpen(false);
      setRejectionReason("");
      await loadPendingUsers();

      alert(
        approvalAction === "APPROVED"
          ? "Benutzer erfolgreich genehmigt"
          : "Benutzer erfolgreich abgelehnt"
      );
    } catch (error: any) {
      console.error("Failed to approve/reject user:", error);
      alert(error.message || "Fehler bei der Genehmigung");
    }
  };

  // ============================================
  // PASSWORD MANAGEMENT
  // ============================================

  const handlePasswordDialog = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: "", confirmPassword: "" });
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwörter stimmen nicht überein");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      alert("Passwort muss mindestens 8 Zeichen lang sein");
      return;
    }

    try {
      await userManagementService.changeUserPassword(selectedUser.id, {
        newPassword: passwordData.newPassword,
      });

      setIsPasswordDialogOpen(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
      alert("Passwort erfolgreich geändert");
    } catch (error: any) {
      console.error("Failed to change password:", error);
      alert(error.message || "Fehler beim Ändern des Passworts");
    }
  };

  // ============================================
  // ACCOUNT UNLOCK
  // ============================================

  const handleUnlockAccount = async (userId: string) => {
    if (!confirm("Möchten Sie dieses Konto entsperren?")) return;

    try {
      await userManagementService.unlockUserAccount(userId);
      await loadUsers();
      alert("Konto erfolgreich entsperrt");
    } catch (error: any) {
      console.error("Failed to unlock account:", error);
      alert(error.message || "Fehler beim Entsperren des Kontos");
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

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
        return "bg-red-100 text-red-800 border-red-200";
      case "MANAGER":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 border-green-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Benutzerverwaltung
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Verwalten Sie Benutzer, Genehmigungen und Berechtigungen
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full sm:w-auto"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Neuer Benutzer
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b overflow-x-auto">
        <div className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="inline-block mr-2 h-4 w-4" />
            Alle Benutzer ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("pending")}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserCheck className="inline-block mr-2 h-4 w-4" />
            Wartend ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("statistics")}
            className={`pb-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
              activeTab === "statistics"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldAlert className="inline-block mr-2 h-4 w-4" />
            Statistiken
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Laden...</p>
          </div>
        </div>
      ) : (
        <>
          {/* ALL USERS TAB */}
          {activeTab === "all" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Alle Benutzer ({filteredUsers.length})
                    </CardTitle>
                    <CardDescription>
                      Verwalten Sie alle Systembenutzer
                    </CardDescription>
                  </div>
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
                      <TableHead className="py-2">Name</TableHead>
                      <TableHead className="py-2">E-Mail</TableHead>
                      <TableHead className="py-2">Rolle</TableHead>
                      <TableHead className="py-2">Status</TableHead>
                      <TableHead className="py-2">Erstellt</TableHead>
                      <TableHead className="text-right py-2">
                        Aktionen
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          Keine Benutzer gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium py-2 text-sm">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell className="py-2 text-sm">
                            {user.email}
                          </TableCell>
                          <TableCell className="py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadgeColor(
                                user.isActive
                              )}`}
                            >
                              {user.isActive ? "✓ Aktiv" : "✗ Inaktiv"}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 text-xs">
                            {new Date(user.createdAt).toLocaleDateString(
                              "de-DE"
                            )}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowQRCode(user)}
                                title="QR-Code anzeigen"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(user)}
                                title="Bearbeiten"
                              >
                                ✏️
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePasswordDialog(user)}
                                title="Passwort ändern"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleActive(user.id)}
                                title={
                                  user.isActive ? "Deaktivieren" : "Aktivieren"
                                }
                              >
                                {user.isActive ? "🔒" : "🔓"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnlockAccount(user.id)}
                                title="Konto entsperren"
                              >
                                <Unlock className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Löschen"
                              >
                                🗑️
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* PENDING USERS TAB */}
          {activeTab === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Wartende Benutzer ({pendingUsers.length})</CardTitle>
                <CardDescription>
                  Genehmigen oder lehnen Sie neue Benutzerregistrierungen ab
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-lg font-medium">
                      Keine wartenden Benutzer
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Alle Registrierungen wurden bearbeitet
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Registriert</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                user.role
                              )}`}
                            >
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString(
                              "de-DE",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleApprovalDialog(user, "APPROVED")
                                }
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="mr-1 h-4 w-4" />
                                Genehmigen
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleApprovalDialog(user, "REJECTED")
                                }
                              >
                                <X className="mr-1 h-4 w-4" />
                                Ablehnen
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* STATISTICS TAB */}
          {activeTab === "statistics" && statistics && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gesamt Benutzer
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statistics.totalUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Alle registrierten Benutzer
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Aktive Benutzer
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.activeUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Genehmigte und aktive Accounts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Wartende Benutzer
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {statistics.pendingUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Warten auf Genehmigung
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Abgelehnte Benutzer
                  </CardTitle>
                  <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {statistics.rejectedUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registrierung abgelehnt
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gesperrte Accounts
                  </CardTitle>
                  <ShieldAlert className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {statistics.lockedUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Temporär gesperrt
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Benutzer nach Rolle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {statistics.usersByRole.map((item) => (
                      <div
                        key={item.role}
                        className="flex items-center justify-between"
                      >
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                            item.role
                          )}`}
                        >
                          {item.role}
                        </span>
                        <span className="text-sm font-medium">
                          {item.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* CREATE USER DIALOG */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Benutzer erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Benutzer im System
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create-firstName">Vorname *</Label>
              <Input
                id="create-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                placeholder="Max"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-lastName">Nachname *</Label>
              <Input
                id="create-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Mustermann"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-email">E-Mail *</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="max@beispiel.de"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-password">Passwort *</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">
                Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-role">Rolle *</Label>
              <select
                id="create-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="USER">USER - Standard Benutzer</option>
                <option value="MANAGER">MANAGER - Erweiterte Rechte</option>
                <option value="ADMIN">ADMIN - Vollzugriff</option>
              </select>
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

      {/* EDIT USER DIALOG */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Benutzer bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Benutzerdaten
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-firstName">Vorname</Label>
              <Input
                id="edit-firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lastName">Nachname</Label>
              <Input
                id="edit-lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
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
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Rolle</Label>
              <select
                id="edit-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleUpdate}>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PASSWORD CHANGE DIALOG */}
      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={setIsPasswordDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Passwort ändern</DialogTitle>
            <DialogDescription>
              Setzen Sie ein neues Passwort für{" "}
              {selectedUser && "firstName" in selectedUser
                ? `${selectedUser.firstName} ${selectedUser.lastName}`
                : "den Benutzer"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="password-new">Neues Passwort</Label>
              <Input
                id="password-new"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password-confirm">Passwort bestätigen</Label>
              <Input
                id="password-confirm"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="••••••••"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Mind. 8 Zeichen, Groß-/Kleinbuchstaben, Zahlen, Sonderzeichen
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setPasswordData({ newPassword: "", confirmPassword: "" });
              }}
            >
              Abbrechen
            </Button>
            <Button onClick={handleChangePassword}>Passwort ändern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* APPROVAL DIALOG */}
      <Dialog
        open={isApprovalDialogOpen}
        onOpenChange={setIsApprovalDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "APPROVED"
                ? "Benutzer genehmigen"
                : "Benutzer ablehnen"}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === "APPROVED"
                ? `Möchten Sie ${
                    selectedUser && "firstName" in selectedUser
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : "den Benutzer"
                  } wirklich genehmigen?`
                : `Möchten Sie ${
                    selectedUser && "firstName" in selectedUser
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : "den Benutzer"
                  } wirklich ablehnen?`}
            </DialogDescription>
          </DialogHeader>
          {approvalAction === "REJECTED" && (
            <div className="grid gap-2 py-4">
              <Label htmlFor="rejection-reason">
                Ablehnungsgrund (optional)
              </Label>
              <Input
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="z.B. Ungültige E-Mail-Adresse"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApprovalDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleApproval}
              variant={
                approvalAction === "APPROVED" ? "default" : "destructive"
              }
              className={
                approvalAction === "APPROVED"
                  ? "bg-green-600 hover:bg-green-700"
                  : undefined
              }
            >
              {approvalAction === "APPROVED" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Genehmigen
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Ablehnen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR-CODE DIALOG */}
      <Dialog open={isQRCodeDialogOpen} onOpenChange={setIsQRCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR-Code für Mobile Login</DialogTitle>
            <DialogDescription>
              {selectedUser &&
                `QR-Code für ${(selectedUser as User).firstName} ${
                  (selectedUser as User).lastName
                } (${(selectedUser as User).email})`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {qrCodeUrl ? (
              <>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                  onError={(e) => {
                    console.error("QR-Code konnte nicht geladen werden");
                    e.currentTarget.src =
                      'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><text x="50%" y="50%" text-anchor="middle" fill="red">Fehler</text></svg>';
                  }}
                />
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Dieser QR-Code ermöglicht schnellen Login auf mobilen
                    Geräten
                  </p>
                  <p className="mt-2">
                    Kann ausgedruckt oder auf Keychain gelasert werden
                  </p>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = qrCodeUrl;
                      link.download = `QR_${(selectedUser as User)?.email
                        ?.replace("@", "_")
                        .replace(/\./g, "_")}.png`;
                      link.click();
                    }}
                  >
                    💾 Herunterladen
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => window.print()}
                  >
                    🖨️ Drucken
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-red-500">Kein QR-Code verfügbar</p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsQRCodeDialogOpen(false);
                setQRCodeUrl("");
                setSelectedUser(null);
              }}
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
