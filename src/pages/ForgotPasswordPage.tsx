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
import { CheckCircle2, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { apiClient } from "@/services/api";

interface ForgotPasswordPageProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({
  onBackToLogin,
}) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Bitte gib deine E-Mail-Adresse ein");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Bitte gib eine gültige E-Mail-Adresse ein");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await apiClient.post("/api/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(
        error.response?.data?.error ||
          "Ein Fehler ist aufgetreten. Bitte versuche es erneut."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
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
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Anfrage gesendet!</CardTitle>
            <CardDescription>
              Ein Administrator wurde über deine Passwort-Anfrage benachrichtigt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Nächste Schritte:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Ein Administrator wird deine Anfrage prüfen</li>
                  <li>Der Administrator kann dein Passwort zurücksetzen</li>
                  <li>Du wirst über die weitere Vorgehensweise informiert</li>
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
            <KeyRound className="h-6 w-6" />
            Passwort vergessen
          </CardTitle>
          <CardDescription className="text-center">
            Gib deine E-Mail-Adresse ein und ein Administrator wird
            benachrichtigt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                placeholder="deine@email.com"
                autoFocus
              />
            </div>

            <Alert>
              <AlertDescription className="text-xs text-muted-foreground">
                Da dieses System keine automatischen E-Mails versendet, wird ein
                Administrator manuell benachrichtigt und kann dein Passwort
                zurücksetzen.
              </AlertDescription>
            </Alert>

            <div className="pt-2 space-y-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sende Anfrage...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Passwort-Reset anfordern
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
