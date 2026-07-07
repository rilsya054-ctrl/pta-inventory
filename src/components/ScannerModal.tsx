import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, RefreshCw, Plus, Minus, Search, AlertCircle, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string, mode: "normal" | "add" | "subtract") => void;
}

export default function ScannerModal({ isOpen, onClose, onScanSuccess }: ScannerModalProps) {
  const [scanMode, setScanMode] = useState<"normal" | "add" | "subtract">("normal");
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraId, setCurrentCameraId] = useState<string | null>(null);
  
  const qrCodeInstanceRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "realtime-qr-scanner-view";

  // Play audio beep on success (using synthesized Web Audio API so it's instant and requires no static asset files!)
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(650, audioCtx.currentTime); // high-pitched clear beep
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio context not supported or blocked by user gesture", e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    setIsInitializing(true);
    setScannerError(null);
    setFeedbackMsg(null);

    // Give the DOM a tiny frame to ensure the div with scannerContainerId is fully rendered
    const timeoutId = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isOpen, currentCameraId]);

  const startScanner = async () => {
    try {
      // 1. Check for cameras or permission
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        throw new Error("Kamera tidak ditemukan atau izin ditolak.");
      }

      setAvailableCameras(cameras);
      
      // Determine camera to use
      let cameraToUseId = currentCameraId;
      if (!cameraToUseId) {
        // Prefer back camera if available
        const backCam = cameras.find(
          (cam) => cam.label.toLowerCase().includes("back") || cam.label.toLowerCase().includes("rear")
        );
        cameraToUseId = backCam ? backCam.id : cameras[0].id;
        setCurrentCameraId(cameraToUseId);
      }

      // Initialize the Html5Qrcode scanner
      const html5Qrcode = new Html5Qrcode(scannerContainerId, {
        verbose: false,
        useBarCodeDetectorIfSupported: true, // Native scanning acceleration if browser supports it
      });
      qrCodeInstanceRef.current = html5Qrcode;

      const formats = [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODABAR,
        Html5QrcodeSupportedFormats.ITF
      ];

      await html5Qrcode.start(
        cameraToUseId,
        {
          fps: 15,
          // Scanning box area
          qrbox: (width, height) => {
            const minSide = Math.min(width, height);
            // Dynamic box: wider rectangle for barcodes, or perfect square
            return {
              width: Math.floor(minSide * 0.75),
              height: Math.floor(minSide * 0.45), // Slightly rectangular to easily fit bar codes as well
            };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Trigger instant success feedback
          playBeep();
          setFeedbackMsg(`Terdeteksi: ${decodedText}`);
          
          // Temporary success screen state
          setTimeout(() => {
            onScanSuccess(decodedText, scanMode);
            setFeedbackMsg(null);
          }, 600);
        },
        () => {
          // Verbose error logging ignored to keep execution silent during standard search frames
        }
      );

      setIsInitializing(false);
    } catch (err: any) {
      console.error("Gagal memulai scanner:", err);
      setScannerError(
        err.message || "Izin kamera diblokir atau gagal mengakses kamera perangkat Anda."
      );
      setIsInitializing(false);
    }
  };

  const stopScanner = async () => {
    if (qrCodeInstanceRef.current) {
      if (qrCodeInstanceRef.current.isScanning) {
        try {
          await qrCodeInstanceRef.current.stop();
        } catch (err) {
          console.error("Gagal menghentikan pemindaian:", err);
        }
      }
      qrCodeInstanceRef.current = null;
    }
  };

  const switchCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIndex = availableCameras.findIndex((c) => c.id === currentCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    setCurrentCameraId(availableCameras[nextIndex].id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[640px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold text-slate-100">Pemindai Real-Time</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900 border-b border-slate-800">
            <button
              onClick={() => setScanMode("normal")}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${
                scanMode === "normal"
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Search className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Cari / Tambah</span>
            </button>
            <button
              onClick={() => setScanMode("add")}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${
                scanMode === "add"
                  ? "bg-slate-800 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Stok Masuk (+1)</span>
            </button>
            <button
              onClick={() => setScanMode("subtract")}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${
                scanMode === "subtract"
                  ? "bg-slate-800 text-amber-400 border border-amber-500/30"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Minus className="w-4 h-4" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Stok Keluar (-1)</span>
            </button>
          </div>

          {/* Camera View Area */}
          <div className="relative flex-1 bg-black flex flex-col justify-center items-center overflow-hidden">
            {/* Real-time container required by html5-qrcode */}
            <div
              id={scannerContainerId}
              className="w-full h-full max-h-[420px] object-cover"
              style={{ minHeight: "260px" }}
            />

            {/* Custom Overlay (Guide and Frame lines) */}
            {!scannerError && !isInitializing && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center py-8">
                {/* Visual feedback overlay */}
                {feedbackMsg ? (
                  <div className="bg-emerald-500/90 text-white px-4 py-2 rounded-full font-medium text-xs shadow-lg animate-bounce flex items-center gap-2">
                    <Volume2 className="w-3.5 h-3.5" />
                    {feedbackMsg}
                  </div>
                ) : (
                  <div className="bg-slate-900/80 backdrop-blur-sm text-slate-200 px-3 py-1.5 rounded-full text-xs font-mono font-medium border border-slate-700/50 shadow-md">
                    {scanMode === "normal" && "Posisikan Barcode / QR di dalam kotak"}
                    {scanMode === "add" && "Mode Pemindaian Stok Masuk (+1)"}
                    {scanMode === "subtract" && "Mode Pemindaian Stok Keluar (-1)"}
                  </div>
                )}

                {/* Aesthetic scanner reticle */}
                <div className="relative w-[75%] h-[40%] flex items-center justify-center">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl border-emerald-400"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr border-emerald-400"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl border-emerald-400"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br border-emerald-400"></div>
                  
                  {/* Glowing Laser Scan Line */}
                  <div className="absolute left-1.5 right-1.5 h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444] animate-[pulse_1.5s_infinite] top-[50%]" />
                </div>

                <div className="text-[10px] text-slate-500 text-center px-4 max-w-xs font-mono">
                  Mendukung QR Code, EAN-13, EAN-8, Code-128, Code-39, UPC-A, dan UPC-E.
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isInitializing && (
              <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm text-slate-300 font-medium">Menghubungkan kamera perangkat...</p>
              </div>
            )}

            {/* Permission or Access Error */}
            {scannerError && (
              <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-full text-red-400">
                  <AlertCircle className="w-10 h-10" />
                </div>
                <div className="space-y-1 max-w-xs">
                  <h4 className="font-semibold text-slate-100 text-base">Akses Kamera Gagal</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{scannerError}</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
                  <button
                    onClick={startScanner}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Coba Lagi
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Camera Switcher Controls */}
          {!scannerError && !isInitializing && availableCameras.length > 1 && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-center">
              <button
                onClick={switchCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg border border-slate-700/50 transition-colors active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Ganti Kamera ({availableCameras.length})
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
