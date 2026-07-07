import { InventoryItem } from "../types";
import { AlertOctagon, RefreshCw, Pencil, ChevronRight, PackageCheck } from "lucide-react";
import { motion } from "motion/react";

interface LowStockAlertsProps {
  items: InventoryItem[];
  onQuickRestock: (itemId: string, currentStock: number) => void;
  onEditItem: (item: InventoryItem) => void;
}

export default function LowStockAlerts({ items, onQuickRestock, onEditItem }: LowStockAlertsProps) {
  const lowStockItems = items.filter((item) => item.stock <= item.minStock);

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${lowStockItems.length > 0 ? "bg-red-500/10 text-red-600 animate-pulse" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Notifikasi Peringatan Stok</h3>
            <p className="text-[11px] text-slate-500">Pemantauan otomatis batas minimum produk.</p>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
          lowStockItems.length > 0 ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"
        }`}>
          {lowStockItems.length > 0 ? `${lowStockItems.length} Menipis` : "Aman / Stabil"}
        </span>
      </div>

      {/* Alert Content */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
        {lowStockItems.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-500">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-700">Semua Stok Terpenuhi!</p>
              <p className="text-[10px] text-slate-500">Tidak ada produk yang berada di bawah batas minimum.</p>
            </div>
          </div>
        ) : (
          lowStockItems.map((item) => {
            const isCriticallyEmpty = item.stock === 0;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isCriticallyEmpty 
                    ? "bg-red-50/50 border-red-200 shadow-sm shadow-red-50" 
                    : "bg-amber-50/50 border-amber-200"
                }`}
              >
                {/* Details */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-800 text-xs truncate">{item.name}</span>
                    <span className="text-[9px] font-mono font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200/40">
                      SKU: {item.sku}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      isCriticallyEmpty ? "bg-red-500 text-white" : "bg-amber-100 text-amber-900"
                    }`}>
                      {isCriticallyEmpty ? "Habis (0)" : `Sisa ${item.stock} Unit`}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Batas Min: {item.minStock} unit
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="text-[10px] text-slate-500 font-medium font-mono">
                      Rp {item.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
                    title="Edit barang"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onQuickRestock(item.id, item.stock)}
                    className="flex items-center gap-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-bold rounded-lg transition-all shadow-md shadow-emerald-600/10"
                    title="Tambah +10 unit stok instan"
                  >
                    <RefreshCw className="w-3 h-3" />
                    +10 Restock
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
