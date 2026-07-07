import { useEffect, useState } from "react";
import { X, Download, Printer, Copy, Check, QrCode, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem } from "../types";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

export default function QRCodeModal({ isOpen, onClose, item }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    const fetchQRCode = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/qrcode?text=${encodeURIComponent(item.sku)}`);
        const data = await res.json();
        if (res.ok && data.dataUrl) {
          setQrDataUrl(data.dataUrl);
        } else {
          console.error("Failed to generate QR code:", data.error);
        }
      } catch (err) {
        console.error("Error generating QR code", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
    setCopied(false);
  }, [isOpen, item]);

  const handleCopySku = () => {
    if (!item) return;
    navigator.clipboard.writeText(item.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl || !item) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR_${item.name.replace(/\s+/g, "_")}_${item.sku}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrDataUrl || !item) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Label QR - ${item.name}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .label-card {
              border: 2px dashed #000;
              padding: 24px;
              border-radius: 12px;
              max-width: 320px;
            }
            .qr-img {
              width: 200px;
              height: 200px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin-top: 12px;
              margin-bottom: 4px;
            }
            .sku {
              font-family: monospace;
              font-size: 14px;
              color: #555;
              letter-spacing: 1px;
            }
            .price {
              font-size: 16px;
              font-weight: 600;
              color: #059669;
              margin-top: 8px;
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
            <div class="title">${item.name}</div>
            <div class="sku">${item.sku}</div>
            <div class="price">Rp ${item.price.toLocaleString("id-ID")}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-slate-800">Label QR Otomatis</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Label Content Box */}
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center w-full max-w-[240px] aspect-square">
              {loading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-slate-400">Membuat QR Code...</span>
                </div>
              ) : qrDataUrl ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <span className="text-xs text-red-500 font-medium">Gagal me-load QR Code</span>
              )}
              
              <div className="absolute top-2 right-2 flex gap-1">
                <div className="bg-slate-900 text-white p-1 rounded-full text-[8px] font-bold tracking-wider uppercase flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-spin" />
                  SISTEM QR
                </div>
              </div>
            </div>

            {/* Label Metadata */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {item.category}
              </span>
              <h4 className="font-bold text-slate-800 text-base leading-tight pt-1">{item.name}</h4>
              <div className="flex items-center justify-center gap-1.5">
                <span className="font-mono text-xs text-slate-500 font-semibold">{item.sku}</span>
                <button
                  onClick={handleCopySku}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                  title="Salin SKU"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="text-emerald-700 font-bold text-lg pt-1">
                Rp {item.price.toLocaleString("id-ID")}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 border-t border-slate-100">
            <button
              onClick={handlePrint}
              disabled={loading || !qrDataUrl}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl transition-colors disabled:opacity-50 active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Cetak Label
            </button>
            <button
              onClick={handleDownload}
              disabled={loading || !qrDataUrl}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-xl shadow-lg shadow-emerald-600/10 transition-all disabled:opacity-50 active:scale-95"
            >
              <Download className="w-4 h-4" />
              Unduh Gambar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
