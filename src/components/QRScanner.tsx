import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera } from "lucide-react";
import { Button } from "./ui/button";

interface QRScannerProps {
  onScan: (token: string) => void;
  onClose: () => void;
}

/**
 * Mobile QR-Code Scanner Component
 *
 * Features:
 * - Greift auf Handy-Kamera zu
 * - Scannt QR-Codes automatisch
 * - Gibt Token an Parent zurück
 */
export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    const initScanner = async () => {
      await startScanner();
    };

    initScanner();

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setError(null);

      // Initialize scanner
      scannerRef.current = new Html5Qrcode(qrCodeRegionId);

      // Start scanning with rear camera (preferred on mobile)
      await scannerRef.current.start(
        { facingMode: "environment" }, // Rückkamera
        {
          fps: 10, // Scans pro Sekunde
          qrbox: { width: 250, height: 250 }, // Scan-Bereich
        },
        (decodedText) => {
          // QR-Code erfolgreich gescannt
          console.log(
            "[QR-SCANNER] Scanned:",
            decodedText.substring(0, 20) + "..."
          );
          onScan(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Scanning... (normal, kein Error)
        }
      );
    } catch (err) {
      console.error("[QR-SCANNER] Error:", err);
      setError("Kamera-Zugriff fehlgeschlagen. Bitte Berechtigungen prüfen.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("[QR-SCANNER] Stop error:", err);
      } finally {
        setIsScanning(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Camera className="w-6 h-6" />
          <h2 className="text-lg font-semibold">QR-Code scannen</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-gray-800"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Scanner */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div id={qrCodeRegionId} className="w-full max-w-md" />

        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-white text-center max-w-md">
            <p className="font-semibold mb-2">Fehler</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {isScanning && !error && (
          <div className="mt-4 text-white text-center">
            <p className="text-sm opacity-75">QR-Code vor die Kamera halten</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 p-4 text-center text-white text-sm opacity-75">
        <p>Halte deinen persönlichen QR-Code vor die Kamera</p>
      </div>
    </div>
  );
}
