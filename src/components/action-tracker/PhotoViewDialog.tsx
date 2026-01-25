import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PhotoViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoUrl: string | null;
}

export function PhotoViewDialog({
  open,
  onOpenChange,
  photoUrl,
}: PhotoViewDialogProps) {
  const { toast } = useToast();

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 gap-0">
        {/* Close Button - Top Right */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white"
          onClick={handleClose}
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Full Screen Photo */}
        <div className="flex items-center justify-center bg-black/90 min-h-[80vh] p-4">
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Failure Report Foto"
              className="max-w-full max-h-[85vh] object-contain"
              onError={() => {
                console.error("Fehler beim Laden des Fotos:", photoUrl);
                toast({
                  title: "Fehler",
                  description: "Foto konnte nicht geladen werden.",
                  variant: "destructive",
                });
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
