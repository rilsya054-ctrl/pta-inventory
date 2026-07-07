import { HistoryLog } from "../types";
import { ArrowDownLeft, ArrowUpRight, Plus, Pencil, Trash, Clock, FileText, Search } from "lucide-react";
import { useState } from "react";

interface HistoryPanelProps {
  logs: HistoryLog[];
}

export default function HistoryPanel({ logs }: HistoryPanelProps) {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === "all" || log.type === filterType;
    const matchesSearch =
      log.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.note.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getLogConfig = (type: HistoryLog["type"]) => {
    switch (type) {
      case "in":
        return {
          bg: "bg-emerald-50 border-emerald-100",
          text: "text-emerald-700",
          icon: <ArrowDownLeft className="w-4 h-4 text-emerald-600" />,
          label: "Stok Masuk",
        };
      case "out":
        return {
          bg: "bg-amber-50 border-amber-100",
          text: "text-amber-700",
          icon: <ArrowUpRight className="w-4 h-4 text-amber-600" />,
          label: "Stok Keluar",
        };
      case "create":
        return {
          bg: "bg-sky-50 border-sky-100",
          text: "text-sky-700",
          icon: <Plus className="w-4 h-4 text-sky-600" />,
          label: "Pendaftaran",
        };
      case "edit":
        return {
          bg: "bg-indigo-50 border-indigo-100",
          text: "text-indigo-700",
          icon: <Pencil className="w-4 h-4 text-indigo-600" />,
          label: "Update",
        };
      case "delete":
        return {
          bg: "bg-rose-50 border-rose-100",
          text: "text-rose-700",
          icon: <Trash className="w-4 h-4 text-rose-600" />,
          label: "Penghapusan",
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-100",
          text: "text-slate-700",
          icon: <Clock className="w-4 h-4 text-slate-600" />,
          label: "Sistem",
        };
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Riwayat Pergerakan Barang</h3>
          <p className="text-xs text-slate-500">Log transaksi masuk, keluar, dan pembaruan inventaris.</p>
        </div>
        <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full self-start sm:self-center">
          Total Log: {logs.length} entri
        </div>
      </div>

      {/* Filters and Searches */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama barang, barcode, atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-xl focus:ring-2 focus:ring-emerald-500/10 transition-all text-slate-800"
          />
        </div>

        {/* Filter select */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-slate-700"
        >
          <option value="all">Semua Tipe Riwayat</option>
          <option value="in">Stok Masuk (+)</option>
          <option value="out">Stok Keluar (-)</option>
          <option value="create">Pendaftaran Barang</option>
          <option value="edit">Update Informasi</option>
          <option value="delete">Penghapusan</option>
        </select>
      </div>

      {/* Logs List container */}
      <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-2">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium">Belum ada catatan riwayat yang sesuai filter.</p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const config = getLogConfig(log.type);
            return (
              <div
                key={log.id}
                className={`p-3 border rounded-xl flex items-start gap-3 transition-colors ${config.bg}`}
              >
                {/* Icon wrapper */}
                <div className="p-1.5 bg-white rounded-lg shadow-sm shrink-0 mt-0.5">
                  {config.icon}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h4 className="font-bold text-slate-800 text-xs truncate">
                      {log.itemName}
                    </h4>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[10px] font-mono text-slate-500 bg-white border border-slate-100 px-1.5 py-0.2 rounded">
                      SKU: {log.sku}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase ${config.text}`}>
                      {config.label}
                    </span>
                    {log.quantityChange > 0 && (
                      <span className="text-[10px] font-mono font-bold">
                        {log.type === "in" ? "+" : "-"}{log.quantityChange} Unit (Dari {log.previousStock} → {log.newStock})
                      </span>
                    )}
                  </div>

                  {log.note && (
                    <p className="text-[11px] text-slate-600 bg-white/60 px-2 py-1 rounded border border-slate-50 italic">
                      Catatan: {log.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
