/* eslint-disable @typescript-eslint/no-explicit-any */
// app/invoice/components/InvoiceScanButton.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { ScanBarcode, X, RefreshCw, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  productId: string;
  name: string;
  unitPrice: number;
  stock: number;
  productCode?: string;
}

interface InvoiceScanButtonProps {
  products: Product[];
  /** Called when a scanned code matches a known product */
  onProductFound: (product: Product) => void;
  /** Called when a scanned code doesn't match anything — lets the parent create a line with the raw code as a name, or just show a toast */
  onProductNotFound: (code: string) => void;
}

/**
 * Standalone "Scanner un article" button that opens an inline camera panel.
 * On a successful decode it looks up products[] by productCode and reports
 * back to the parent via onProductFound / onProductNotFound — the parent
 * decides what to do with the result (e.g. append a new invoice line).
 */
export default function InvoiceScanButton({
  products,
  onProductFound,
  onProductNotFound,
}: InvoiceScanButtonProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ found: boolean; label: string } | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
  };

  const handleDecoded = (code: string) => {
    const match = products.find(
      (p) => p.productCode?.toLowerCase() === code.toLowerCase()
    );
    if (match) {
      setLastResult({ found: true, label: match.name });
      onProductFound(match);
    } else {
      setLastResult({ found: false, label: code });
      onProductNotFound(code);
    }
    // Keep the camera open so multiple items can be scanned in a row;
    // clear the transient result message after a moment.
    setTimeout(() => setLastResult(null), 2200);
  };

  const startCamera = async (deviceId?: string) => {
    if (!videoRef.current) return;
    setScannerError(null);
    stopStream();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setScannerError("Caméra non supportée par ce navigateur.");
        return;
      }

      const constraints: MediaStreamConstraints = deviceId
        ? { video: { deviceId: { exact: deviceId } } }
        : { video: { facingMode: { ideal: "environment" } } };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const vids = all.filter((d) => d.kind === "videoinput");
        if (vids.length > 0) setCameras(vids);
      } catch {
        // non-fatal
      }

      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result) {
          handleDecoded(result.getText());
        }
        if (err && !(err instanceof NotFoundException)) {
          // normal while no barcode is in frame
        }
      });
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setScannerError("Accès refusé — autorisez la caméra dans les paramètres.");
      } else if (err.name === "NotFoundError") {
        setScannerError("Aucune caméra trouvée.");
      } else if (err.name === "NotReadableError") {
        setScannerError("Caméra déjà utilisée par une autre application.");
      } else {
        setScannerError("Erreur : " + (err.message ?? "inconnue"));
      }
    }
  };

  useEffect(() => {
    if (scannerOpen) {
      startCamera();
    } else {
      stopStream();
      setScannerError(null);
      setLastResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  useEffect(() => () => stopStream(), []);

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    const next = (activeCameraIndex + 1) % cameras.length;
    setActiveCameraIndex(next);
    startCamera(cameras[next].deviceId);
  };

  return (
    <div className="mb-4">
      <Button
        type="button"
        variant="outline"
        onClick={() => setScannerOpen((v) => !v)}
        className={cn(
          "w-full h-11 border-dashed transition-colors",
          scannerOpen
            ? "border-emerald-500 bg-emerald-50 text-emerald-700"
            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        )}
      >
        <ScanBarcode className="h-4 w-4 mr-2" />
        {scannerOpen ? "Fermer le scanner" : "Scanner un article"}
      </Button>

      {scannerOpen && (
        <div className="mt-3 rounded-lg overflow-hidden bg-black relative">
          {/* Top bar */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-2"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), transparent)" }}
          >
            <span className="text-white text-xs font-medium flex items-center gap-1.5">
              <PackageSearch className="h-3.5 w-3.5" />
              Scanner pour ajouter un article
            </span>
            <div className="flex gap-1">
              {cameras.length > 1 && (
                <button
                  type="button"
                  onClick={switchCamera}
                  className="text-white p-1 rounded hover:bg-white/10 transition-colors"
                  title="Changer de caméra"
                >
                  <RefreshCw size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="text-white p-1 rounded hover:bg-white/10 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Video */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full block"
            style={{ height: 200, objectFit: "cover" }}
          />

          {/* Scan frame overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative w-56 h-20 z-10">
              {[
                "top-0 left-0 border-t-2 border-l-2 rounded-tl",
                "top-0 right-0 border-t-2 border-r-2 rounded-tr",
                "bottom-0 left-0 border-b-2 border-l-2 rounded-bl",
                "bottom-0 right-0 border-b-2 border-r-2 rounded-br",
              ].map((cls, i) => (
                <div key={i} className={`absolute w-4 h-4 border-emerald-400 ${cls}`} />
              ))}
              <div
                className="absolute left-0 right-0 h-px bg-emerald-400 animate-bounce"
                style={{ boxShadow: "0 0 8px 2px rgba(52,211,153,0.6)", top: "50%" }}
              />
            </div>
          </div>

          {/* Bottom bar — error, instructions, or last scan result */}
          <div
            className="absolute bottom-0 left-0 right-0 z-10 text-center px-3 py-2"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)" }}
          >
            {scannerError ? (
              <div className="flex items-center justify-center gap-2">
                <p className="text-red-400 text-xs">{scannerError}</p>
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="text-white text-xs underline"
                >
                  Réessayer
                </button>
              </div>
            ) : lastResult ? (
              <p className={cn("text-xs font-medium", lastResult.found ? "text-emerald-400" : "text-amber-400")}>
                {lastResult.found
                  ? `✓ Ajouté : ${lastResult.label}`
                  : `⚠ Code inconnu : ${lastResult.label}`}
              </p>
            ) : (
              <p className="text-white/60 text-xs">Placez le code-barres dans le cadre</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}