import { useState } from "react";
import { X, FileText, Printer, AlertTriangle, Sparkles, CheckSquare, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem } from "../types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export default function ReportModal({ isOpen, onClose, items }: ReportModalProps) {
  const [reportType, setReportType] = useState<"all" | "low">("all");
  const [includePrices, setIncludePrices] = useState(true);
  const [includeDescriptions, setIncludeDescriptions] = useState(false);

  const handlePrint = () => {
    // Filter items based on selected report type
    const reportItems = reportType === "all" 
      ? items 
      : items.filter((item) => item.stock <= item.minStock);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Popup blocker menghalangi pembukaan jendela cetak. Izinkan popup untuk mencetak laporan.");
      return;
    }

    const totalVolume = reportItems.reduce((sum, item) => sum + item.stock, 0);
    const totalValue = reportItems.reduce((sum, item) => sum + item.stock * item.price, 0);
    const formattedDate = new Date().toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    const rowsHtml = reportItems.map((item, index) => {
      const isLow = item.stock <= item.minStock;
      const isOut = item.stock === 0;
      const statusLabel = isOut ? "Habis (0)" : isLow ? "Menipis" : "Stabil";
      const statusColor = isOut ? "#ef4444" : isLow ? "#d97706" : "#059669";

      return `
        <tr>
          <td>${index + 1}</td>
          <td class="font-bold">${item.name}</td>
          <td class="font-mono">${item.sku}</td>
          <td>${item.category}</td>
          <td class="text-right">${includePrices ? "Rp " + item.price.toLocaleString("id-ID") : "-"}</td>
          <td class="text-center">
            <span class="badge" style="background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;">
              ${item.stock} Pcs
            </span>
          </td>
          <td class="text-center font-bold" style="color: ${statusColor};">${statusLabel}</td>
          ${includeDescriptions ? `<td>${item.description || "-"}</td>` : ""}
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Inventaris - ${reportType === "all" ? "Semua Stok" : "Stok Menipis"}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              font-size: 13px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-b: 2px solid #e2e8f0;
              padding-bottom: 24px;
              margin-bottom: 30px;
              border-bottom: 3px solid #059669;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 6px 0;
              letter-spacing: -0.5px;
            }
            .subtitle {
              font-size: 13px;
              color: #64748b;
              margin: 0;
              font-weight: 500;
            }
            .meta-info {
              text-align: right;
              font-size: 12px;
              color: #475569;
              line-height: 1.6;
            }
            .grid-summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 35px;
            }
            .card-summary {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
            }
            .card-summary .label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .card-summary .value {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              font-weight: 700;
              text-align: left;
              padding: 12px 10px;
              font-size: 11px;
              text-transform: uppercase;
              border-bottom: 2px solid #cbd5e1;
            }
            td {
              padding: 12px 10px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            .font-mono {
              font-family: monospace;
              font-weight: 500;
            }
            .font-bold {
              font-weight: 700;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .badge {
              padding: 4px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 700;
              display: inline-block;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px dashed #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 0;
              }
              .card-summary {
                background: #f8fafc !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              th {
                background-color: #f1f5f9 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .badge {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">LAPORAN RINGKASAN INVENTARIS</h1>
              <p class="subtitle">Sistem Manajemen Inventaris & Barcode Real-time</p>
            </div>
            <div class="meta-info">
              <div><strong>Tanggal Cetak:</strong> ${formattedDate}</div>
              <div><strong>Tipe Laporan:</strong> ${reportType === "all" ? "Semua Daftar Barang" : "Hanya Stok Menipis/Habis"}</div>
              <div><strong>Pencetak:</strong> Operator Inventaris</div>
            </div>
          </div>

          <div class="grid-summary">
            <div class="card-summary">
              <div class="label">Total Item Laporan</div>
              <div class="value">${reportItems.length} Barang</div>
            </div>
            <div class="card-summary">
              <div class="label">Total Volume Unit</div>
              <div class="value">${totalVolume} Pcs</div>
            </div>
            <div class="card-summary">
              <div class="label">Total Nilai Aset</div>
              <div class="value">Rp ${totalValue.toLocaleString("id-ID")}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 40px;">No</th>
                <th>Nama Barang</th>
                <th style="width: 140px;">SKU / Barcode</th>
                <th>Kategori</th>
                <th style="width: 110px;" class="text-right">Harga Satuan</th>
                <th style="width: 90px;" class="text-center">Sisa Stok</th>
                <th style="width: 90px;" class="text-center">Status</th>
                ${includeDescriptions ? "<th>Keterangan</th>" : ""}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="${includeDescriptions ? 8 : 7}" class="text-center" style="padding: 40px; color: #94a3b8;">Tidak ada data barang untuk ditampilkan.</td></tr>`}
            </tbody>
          </table>

          <div class="footer">
            <p>Laporan ini dibuat secara otomatis oleh Sistem Manajemen Inventaris Real-Time.</p>
            <p>&copy; 2026 Inventory & Barcode System.</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 1000);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4.5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800">Cetak Laporan Inventaris</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Options */}
          <div className="p-5.5 space-y-4">
            
            {/* Choose Report Scope */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Cakupan Laporan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReportType("all")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    reportType === "all"
                      ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
                  }`}
                >
                  <Layers className={`w-4 h-4 ${reportType === "all" ? "text-emerald-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-800 mt-1">Semua Barang</span>
                  <span className="text-[10px] text-slate-400">Total {items.length} item</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType("low")}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    reportType === "low"
                      ? "border-amber-500 bg-amber-50/30 ring-1 ring-amber-500/20"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50"
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 ${reportType === "low" ? "text-amber-600" : "text-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-800 mt-1">Stok Rendah</span>
                  <span className="text-[10px] text-slate-400">
                    Sisa ≤ batas minimum
                  </span>
                </button>
              </div>
            </div>

            {/* Custom Options */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Konfigurasi Kolom Laporan
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition-colors border border-slate-100">
                <input
                  type="checkbox"
                  checked={includePrices}
                  onChange={(e) => setIncludePrices(e.target.checked)}
                  className="w-4.5 h-4.5 accent-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Tampilkan Harga Satuan</div>
                  <div className="text-[10px] text-slate-400">Menyertakan harga dan menghitung total nilai aset.</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 cursor-pointer select-none transition-colors border border-slate-100">
                <input
                  type="checkbox"
                  checked={includeDescriptions}
                  onChange={(e) => setIncludeDescriptions(e.target.checked)}
                  className="w-4.5 h-4.5 accent-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800">Tampilkan Keterangan</div>
                  <div className="text-[10px] text-slate-400">Sertakan kolom keterangan/deskripsi barang di laporan.</div>
                </div>
              </label>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex gap-2.5 items-start">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-700">Format Ramah Cetak & PDF</p>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  Laporan akan dibuka di jendela tab baru yang secara otomatis memicu dialog cetak sistem operasi Anda. Anda dapat memilih "Simpan sebagai PDF" di pengaturan cetak browser untuk menyimpannya sebagai file.
                </p>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-lg shadow-emerald-600/10 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Buka Cetak Laporan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
