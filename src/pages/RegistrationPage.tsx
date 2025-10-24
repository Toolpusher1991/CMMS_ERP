import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { authService } from "@/services/auth.service";

interface RegistrationPageProps {
  onBackToLogin: () => void;
}

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  onBackToLogin,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = (): boolean => {
    if (
      !formData.email ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName
    ) {
      setError("Bitte fülle alle Pflichtfelder aus");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Passwort muss mindestens 8 Zeichen lang sein");
      return false;
    }

    // Prüfe auf Großbuchstaben
    if (!/[A-Z]/.test(formData.password)) {
      setError("Passwort muss mindestens einen Großbuchstaben enthalten");
      return false;
    }

    // Prüfe auf Kleinbuchstaben
    if (!/[a-z]/.test(formData.password)) {
      setError("Passwort muss mindestens einen Kleinbuchstaben enthalten");
      return false;
    }

    // Prüfe auf Zahlen
    if (!/[0-9]/.test(formData.password)) {
      setError("Passwort muss mindestens eine Zahl enthalten");
      return false;
    }

    // Prüfe auf Sonderzeichen
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError(
        "Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&* etc.)"
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwörter stimmen nicht überein");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(
        error.response?.data?.error ||
          "Registrierung fehlgeschlagen. Bitte versuche es erneut."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              Registrierung erfolgreich!
            </CardTitle>
            <CardDescription>
              Dein Account wartet auf Freigabe durch einen Administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Was passiert jetzt?</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>
                    Ein Administrator wird über deine Registrierung
                    benachrichtigt
                  </li>
                  <li>Nach der Freigabe erhältst du Zugriff auf das System</li>
                  <li>
                    Du kannst dich dann mit deiner E-Mail und deinem Passwort
                    anmelden
                  </li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button
              onClick={onBackToLogin}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            {/* MaintAIn Logo */}
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                MaintAIn
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Maintenance Intelligence
              </p>
            </div>
          </div>
          <CardTitle className="text-2xl flex items-center gap-2 justify-center">
            <UserPlus className="h-6 w-6" />
            Registrierung
          </CardTitle>
          <CardDescription className="text-center">
            Erstelle einen neuen Account für das CMMS/ERP System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Vorname *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Max"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nachname *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="max.mustermann@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Mindestens 8 Zeichen"
              />
              {formData.password && (
                <div className="text-xs space-y-1 mt-2">
                  <p className="font-medium text-muted-foreground">
                    Passwort muss enthalten:
                  </p>
                  <div className="space-y-0.5">
                    <p
                      className={
                        formData.password.length >= 8
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {formData.password.length >= 8 ? "✓" : "○"} Mindestens 8
                      Zeichen
                    </p>
                    <p
                      className={
                        /[A-Z]/.test(formData.password)
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {/[A-Z]/.test(formData.password) ? "✓" : "○"} Einen
                      Großbuchstaben
                    </p>
                    <p
                      className={
                        /[a-z]/.test(formData.password)
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {/[a-z]/.test(formData.password) ? "✓" : "○"} Einen
                      Kleinbuchstaben
                    </p>
                    <p
                      className={
                        /[0-9]/.test(formData.password)
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {/[0-9]/.test(formData.password) ? "✓" : "○"} Eine Zahl
                    </p>
                    <p
                      className={
                        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                          formData.password
                        )
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    >
                      {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                        formData.password
                      )
                        ? "✓"
                        : "○"}{" "}
                      Ein Sonderzeichen (!@#$%^&* etc.)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Passwort wiederholen"
              />
            </div>

            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registriere...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrieren
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={onBackToLogin}
                variant="ghost"
                className="w-full"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
