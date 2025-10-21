import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Image as ImageIcon, X, Upload, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CameraUploadProps {
  onPhotoCapture: (file: File) => void;
  actionId?: string;
  actionTitle?: string;
}

export const CameraUpload = ({
  onPhotoCapture,
  actionId,
  actionTitle,
}: CameraUploadProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection from gallery
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  // Handle file processing
  const handleFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bilddatei aus.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Maximale Dateigröße: 10MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle photo upload
  const handleUpload = () => {
    if (selectedFile) {
      onPhotoCapture(selectedFile);
      toast({
        title: "Foto hochgeladen",
        description: `Foto wurde zu "${actionTitle || "Action"}" hinzugefügt.`,
      });
      handleClose();
    }
  };

  // Reset and close
  const handleClose = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Camera className="h-4 w-4" />
        Foto hinzufügen
      </Button>

      {/* Camera Upload Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto aufnehmen</DialogTitle>
            <DialogDescription>
              Nehmen Sie ein Foto auf oder wählen Sie eines aus der Galerie
              {actionTitle && (
                <span className="block mt-2 font-semibold text-foreground">
                  für: {actionTitle}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview */}
            {previewUrl ? (
              <Card>
                <CardContent className="p-4 relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-6 right-6 h-8 w-8"
                    onClick={() => {
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  {selectedFile && (
                    <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                      <span>{selectedFile.name}</span>
                      <Badge variant="outline">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Camera Capture */}
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent
                    className="p-6 flex flex-col items-center justify-center gap-3"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Kamera</p>
                      <p className="text-xs text-muted-foreground">
                        Foto aufnehmen
                      </p>
                    </div>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </CardContent>
                </Card>

                {/* Gallery Selection */}
                <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent
                    className="p-6 flex flex-col items-center justify-center gap-3"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Galerie</p>
                      <p className="text-xs text-muted-foreground">
                        Foto auswählen
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Info Text */}
            <div className="text-xs text-muted-foreground text-center">
              <p>Maximale Dateigröße: 10MB</p>
              <p>Unterstützte Formate: JPG, PNG, WEBP</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Abbrechen
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="gap-2"
            >
              {selectedFile ? (
                <>
                  <Check className="h-4 w-4" />
                  Hochladen
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Foto wählen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
