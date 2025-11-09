import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

/**
 * Loading Spinner Component
 * 
 * Used as fallback for lazy-loaded components
 * Shows centered spinner with optional message
 */
export function LoadingSpinner({ 
  message = "Laden...", 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen 
    ? "min-h-screen flex items-center justify-center bg-background"
    : "flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
