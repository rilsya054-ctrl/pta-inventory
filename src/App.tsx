import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  QrCode,
  Search,
  ScanLine,
  Pencil,
  Trash2,
  TrendingDown,
  AlertOctagon,
  ArrowUpDown,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  XCircle,
  X,
  Volume2,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem, HistoryLog } from "./types";
import ScannerModal from "./components/ScannerModal";
import ItemModal from "./components/ItemModal";
import QRCodeModal from "./components/QRCodeModal";
import LowStockAlerts from "./components/LowStockAlerts";
import HistoryPanel from "./components/HistoryPanel";
import ReportModal from "./components/ReportModal";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "low" | "out">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mobile navigation tabs
  const [activeTab, setActiveTab] = useState<"inventory" | "alerts" | "history">("inventory");

  // Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedQRItem, setSelectedQRItem] = useState<InventoryItem | null>(null);
  const [prefilledSku, setPrefilledSku] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Category List helper
  const [categories, setCategories] = useState<string[]>([]);

  const showToast = (message: string, type: Toast["type"] = "success") => {
    const id = "toast-" + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Gagal mengambil data inventaris");
      const data = await res.json();
      setItems(data);

      // Extract unique categories dynamically
      const cats = Array.from(new Set(data.map((item: InventoryItem) => item.category))) as string[];
      setCategories(cats);
    } catch (err: any) {
      showToast(err.message || "Gagal memuat barang", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Gagal mengambil riwayat transaksi");
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchHistory();
  }, []);

  const handleScanSuccess = async (decodedText: string, mode: "normal" | "add" | "subtract") => {
    setIsScannerOpen(false);

    if (mode === "normal") {
      // Find item
      const found = items.find((item) => item.sku.toLowerCase() === decodedText.toLowerCase());
      if (found) {
        setSearchQuery(found.sku);
        showToast(`Produk Ditemukan: ${found.name}`, "success");
      } else {
        setPrefilledSku(decodedText);
        setEditingItem(null);
        setIsItemModalOpen(true);
        showToast(`SKU/Barcode "${decodedText}" belum terdaftar. Menyiapkan registrasi baru.`, "info");
      }
    } else {
      // Direct adjustment scan
      try {
        const res = await fetch("/api/inventory/scan-quick", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sku: decodedText, action: mode }),
        });
        const data = await res.json();
        if (!res.ok) {
          showToast(data.error || "Gagal merubah stok", "error");
        } else {
          showToast(
            `Berhasil! Stok "${data.item.name}" kini ${data.item.stock} unit.`,
            mode === "add" ? "success" : "warning"
          );
          fetchInventory();
          fetchHistory();
        }
      } catch (err) {
        showToast("Terjadi kesalahan koneksi saat menyesuaikan stok", "error");
      }
    }
  };

  const handleSaveSuccess = () => {
    fetchInventory();
    fetchHistory();
    showToast("Informasi barang berhasil disimpan!", "success");
  };

  const handleQuickRestock = async (itemId: string, currentStock: number) => {
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: currentStock + 10,
          note: "Restock instan +10 Unit dari Widget Peringatan",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gagal melakukan restock", "error");
      } else {
        showToast(`Berhasil restock +10 unit untuk "${data.name}"`, "success");
        fetchInventory();
        fetchHistory();
      }
    } catch (err) {
      showToast("Gagal memproses restock", "error");
    }
  };

  const handleDirectStockChange = async (item: InventoryItem, change: number) => {
    const nextStock = item.stock + change;
    if (nextStock < 0) {
      showToast(`Stok "${item.name}" sudah kosong!`, "error");
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stock: nextStock,
          note: change > 0 ? "Stok bertambah via tombol cepat (+1)" : "Stok berkurang via tombol cepat (-1)",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Gagal merubah stok", "error");
      } else {
        showToast(
          `Stok "${item.name}" disesuaikan ke ${data.stock} unit.`,
          change > 0 ? "success" : "warning"
        );
        fetchInventory();
        fetchHistory();
      }
    } catch (err) {
      showToast("Gagal memperbarui stok barang", "error");
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus "${item.name}" dari sistem?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menghapus barang");
      }
      showToast(`"${item.name}" berhasil dihapus dari sistem`, "success");
      fetchInventory();
      fetchHistory();
    } catch (err: any) {
      showToast(err.message || "Gagal menghapus barang", "error");
    }
  };

  // Calculations for KPI Cards
  const totalItems = items.length;
  const totalStockQuantity = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStockCount = items.filter((item) => item.stock <= item.minStock).length;
  const totalAssetValue = items.reduce((sum, item) => sum + item.stock * item.price, 0);

  // Sorting and Filtering logic
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus === "low") {
        matchesStatus = item.stock <= item.minStock && item.stock > 0;
      } else if (selectedStatus === "out") {
        matchesStatus = item.stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "stock") {
        comparison = a.stock - b.stock;
      } else if (sortBy === "price") {
        comparison = a.price - b.price;
      } else if (sortBy === "updatedAt") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc for quick inspection
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Dynamic Toast Layer */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="pointer-events-auto w-full p-3.5 bg-white border border-slate-100 rounded-xl shadow-lg flex items-start gap-2.5 relative overflow-hidden"
            >
              {toast.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
              {toast.type === "error" && <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
              {toast.type === "warning" && <AlertOctagon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />}
              
              <div className="flex-1 text-xs font-semibold text-slate-700 leading-normal pr-5">
                {toast.message}
              </div>

              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Accent colored line under toast */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                toast.type === "success" ? "bg-emerald-500" :
                toast.type === "error" ? "bg-red-500" :
                toast.type === "warning" ? "bg-amber-500" : "bg-sky-500"
              }`} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Beautiful Header Navigation */}
      <header className="bg-white border-b border-slate-150 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex sm:py-3.5 items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-2.5 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20 shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <h1 className="font-extrabold text-slate-900 text-sm sm:text-lg tracking-tight leading-none sm:leading-normal">
                  <span className="hidden xs:inline">Sistem </span>Inventaris
                </h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-0.5 leading-none shrink-0">
                  <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Live
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium hidden sm:block">Manajemen Stok & Barcode Pintar</p>
            </div>
          </div>

          {/* Quick Scanner & Add Header Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl text-xs font-bold transition-all hover:border-slate-300 shadow-sm active:scale-95 shrink-0"
              title="Cetak Laporan / PDF"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="hidden md:inline">Cetak Laporan</span>
              <span className="inline md:hidden text-[10px] sm:text-xs">Cetak</span>
            </button>
            <button
              onClick={() => {
                setPrefilledSku(null);
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg sm:rounded-xl text-xs font-bold transition-all hover:border-slate-300 shadow-sm active:scale-95 shrink-0"
              title="Tambah Barang Baru"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="hidden md:inline">Tambah Barang</span>
              <span className="inline md:hidden text-[10px] sm:text-xs">Tambah</span>
            </button>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 sm:px-4.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg sm:rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/15 active:scale-95 shrink-0"
              title="Pindai Barcode / QR Code"
            >
              <ScanLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Pindai Barcode / QR</span>
              <span className="inline sm:hidden text-[10px]">Pindai</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:py-6 space-y-5">
        
        {/* KPI Dashboard Bento Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-3"
          >
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unik Item (SKU)</p>
              <h3 className="text-xl font-black text-slate-800">{totalItems} <span className="text-xs font-semibold text-slate-400">Barang</span></h3>
            </div>
          </motion.div>

          {/* Total inventory stock */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-3"
          >
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume Stok</p>
              <h3 className="text-xl font-black text-slate-800">{totalStockQuantity} <span className="text-xs font-semibold text-slate-400">Pcs</span></h3>
            </div>
          </motion.div>

          {/* Low stocks */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`border p-4 rounded-2xl shadow-sm flex items-center gap-3 transition-colors ${
              lowStockCount > 0 
                ? "bg-red-50/50 border-red-200 animate-pulse" 
                : "bg-white border-slate-150"
            }`}
          >
            <div className={`p-2.5 rounded-xl ${lowStockCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stok Perlu Restock</p>
              <h3 className={`text-xl font-black ${lowStockCount > 0 ? "text-red-600" : "text-slate-800"}`}>
                {lowStockCount} <span className="text-xs font-semibold text-slate-400">Produk</span>
              </h3>
            </div>
          </motion.div>

          {/* Total assets */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-slate-150 p-4 rounded-2xl shadow-sm flex items-center gap-3"
          >
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Nilai Aset</p>
              <h3 className="text-base font-black text-slate-800">
                Rp {totalAssetValue.toLocaleString("id-ID")}
              </h3>
            </div>
          </motion.div>
        </div>

        {/* Mobile-only tab selectors */}
        <div className="flex lg:hidden bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "inventory" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"
            }`}
          >
            Daftar Barang ({filteredItems.length})
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "alerts" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"
            }`}
          >
            Peringatan ({lowStockCount})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "history" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"
            }`}
          >
            Log Riwayat ({history.length})
          </button>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* Main List Section (2 columns on large screens) */}
          <div className={`lg:col-span-2 space-y-4 ${activeTab === "inventory" ? "block" : "hidden lg:block"}`}>
            
            {/* Table Filters Panel */}
            <div className="bg-white border border-slate-150 rounded-2xl p-4.5 shadow-sm space-y-3.5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama, barcode/SKU, atau kategori..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-xl focus:ring-2 focus:ring-emerald-500/15 transition-all text-sm font-medium text-slate-800"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {/* Categories and Status Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Category select */}
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-slate-700 font-medium"
                    >
                      <option value="all">Semua Kategori</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status select */}
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/10 text-slate-700 font-medium"
                  >
                    <option value="all">Semua Status</option>
                    <option value="low">Menipis (≤ Batas Min)</option>
                    <option value="out">Habis (0)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inventory Table Container */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              
              {/* Desktop Table View (visible on md screens and larger) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 select-none cursor-pointer" onClick={() => toggleSort("name")}>
                        <div className="flex items-center gap-1">
                          Nama Barang & Kategori
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4">SKU / Barcode</th>
                      <th className="py-3 px-4 select-none cursor-pointer" onClick={() => toggleSort("price")}>
                        <div className="flex items-center gap-1">
                          Harga Satuan
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4 select-none cursor-pointer text-center" onClick={() => toggleSort("stock")}>
                        <div className="flex items-center justify-center gap-1">
                          Stok Tersedia
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-4 text-center">Cepat</th>
                      <th className="py-3 px-4 text-right">Opsi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-xs font-semibold">Memuat data barang...</p>
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">Barang Tidak Ditemukan</p>
                          <p className="text-[10px] text-slate-500">Coba ganti filter atau cari kata kunci lain.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => {
                        const isLow = item.stock <= item.minStock;
                        const isOut = item.stock === 0;

                        return (
                          <motion.tr
                            key={item.id}
                            className={`text-xs hover:bg-slate-50/65 transition-colors ${
                              isOut ? "bg-red-50/15" : isLow ? "bg-amber-50/10" : ""
                            }`}
                          >
                            {/* Name & Category */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 text-sm leading-tight">
                                {item.name}
                              </div>
                              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                                {item.category}
                              </div>
                            </td>

                            {/* SKU / Barcode */}
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-500">
                              {item.sku}
                            </td>

                            {/* Price */}
                            <td className="py-3.5 px-4 font-semibold text-slate-700">
                              Rp {item.price.toLocaleString("id-ID")}
                            </td>

                            {/* Stock status bubble */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isOut ? "bg-red-100 text-red-800" :
                                  isLow ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                                }`}>
                                  {item.stock} Pcs
                                </span>
                                {isLow && (
                                  <span className="text-[8px] text-red-500 font-bold mt-0.5 animate-pulse uppercase tracking-wide">
                                    {isOut ? "HABIS" : "MINIMUM"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quick +1 / -1 controls directly in table row */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleDirectStockChange(item, -1)}
                                  className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded text-slate-600 font-extrabold text-sm transition-colors border border-slate-200/50"
                                  title="Kurangi 1 Pcs"
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleDirectStockChange(item, 1)}
                                  className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 rounded text-slate-600 font-extrabold text-sm transition-colors border border-slate-200/50"
                                  title="Tambah 1 Pcs"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Options controls (View QR, Edit, Delete) */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedQRItem(item);
                                    setIsQRModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 border border-transparent rounded-lg transition-colors"
                                  title="Lihat / Cetak QR Code"
                                >
                                  <QrCode className="w-4 h-4 text-slate-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingItem(item);
                                    setIsItemModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent rounded-lg transition-colors"
                                  title="Edit Barang"
                                >
                                  <Pencil className="w-4 h-4 text-indigo-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent rounded-lg transition-colors"
                                  title="Hapus Barang"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards View (visible on screens smaller than md) */}
              <div className="block md:hidden">
                {loading ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs font-semibold">Memuat data barang...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 px-4">
                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Barang Tidak Ditemukan</p>
                    <p className="text-[10px] text-slate-500">Coba ganti filter atau cari kata kunci lain.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredItems.map((item) => {
                      const isLow = item.stock <= item.minStock;
                      const isOut = item.stock === 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-4 space-y-3 transition-colors ${
                            isOut ? "bg-red-50/10" : isLow ? "bg-amber-50/10" : ""
                          }`}
                        >
                          {/* Top row: Name & Category and Stock badge */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-800 text-sm leading-snug break-words">
                                {item.name}
                              </h4>
                              <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1">
                                {item.category}
                              </span>
                            </div>
                            
                            <div className="flex flex-col items-end shrink-0">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold leading-tight ${
                                isOut ? "bg-red-100 text-red-800" :
                                isLow ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                              }`}>
                                {item.stock} Pcs
                              </span>
                              {isLow && (
                                <span className="text-[9px] text-red-500 font-bold mt-0.5 animate-pulse uppercase tracking-wide">
                                  {isOut ? "HABIS" : "MINIMUM"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle row: Barcode and Price details */}
                          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100/70">
                            <div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Harga Satuan</div>
                              <div className="font-bold text-slate-700 mt-0.5 text-xs">
                                Rp {item.price.toLocaleString("id-ID")}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Barcode / SKU</div>
                              <div className="font-mono font-bold text-slate-600 mt-0.5 text-xs truncate" title={item.sku}>
                                {item.sku}
                              </div>
                            </div>
                          </div>

                          {/* Bottom row: Direct adjustment and Action Options */}
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            {/* Stock Quick Adjustment */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stok:</span>
                              <button
                                onClick={() => handleDirectStockChange(item, -1)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-100 active:bg-red-100 hover:text-red-600 rounded-lg text-slate-700 font-extrabold text-base transition-all border border-slate-200/50"
                                title="Kurangi 1 Pcs"
                              >
                                -
                              </button>
                              <button
                                onClick={() => handleDirectStockChange(item, 1)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-100 active:bg-emerald-100 hover:text-emerald-600 rounded-lg text-slate-700 font-extrabold text-base transition-all border border-slate-200/50"
                                title="Tambah 1 Pcs"
                              >
                                +
                              </button>
                            </div>

                            {/* Action Options */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedQRItem(item);
                                  setIsQRModalOpen(true);
                                }}
                                className="p-2 text-slate-500 active:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                                title="Lihat QR Code"
                              >
                                <QrCode className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsItemModalOpen(true);
                                }}
                                className="p-2 text-indigo-500 active:bg-indigo-50 border border-slate-200 rounded-lg transition-colors"
                                title="Edit Barang"
                              >
                                <Pencil className="w-4 h-4 text-indigo-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-2 text-red-500 active:bg-red-50 border border-slate-200 rounded-lg transition-colors"
                                title="Hapus Barang"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Total Row Count indicators */}
              {!loading && (
                <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-between items-center text-[10px] font-semibold text-slate-500">
                  <span>Menampilkan {filteredItems.length} dari {items.length} barang</span>
                  <span className="font-mono">Auto-Sync Database Terhubung</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Section (Low Stock warning and History logs - 1 column on large screens) */}
          <div className="lg:col-span-1 space-y-5">
            {/* Low Stock alerting Widget */}
            <div className={activeTab === "alerts" ? "block" : "hidden lg:block"}>
              <LowStockAlerts
                items={items}
                onQuickRestock={handleQuickRestock}
                onEditItem={(item) => {
                  setEditingItem(item);
                  setIsItemModalOpen(true);
                }}
              />
            </div>

            {/* Transaction log activity Widget */}
            <div className={activeTab === "history" ? "block" : "hidden lg:block"}>
              <HistoryPanel logs={history} />
            </div>
          </div>

        </div>
      </main>

      {/* Elegant Footer branding credit */}
      <footer className="bg-white border-t border-slate-150 py-4.5 text-center text-xs text-slate-400 mt-12 shrink-0">
        <p className="font-semibold">© 2026 Inventory & Barcode System.</p>
        <p className="text-[10px] text-slate-400 mt-1">Dibuat menggunakan React, Tailwind CSS, Node.js & Express.</p>
      </footer>

      {/* Real-time Scanner Modal */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Add / Edit Item Form Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setPrefilledSku(null);
          setEditingItem(null);
        }}
        onSaveSuccess={handleSaveSuccess}
        editingItem={editingItem}
        prefilledSku={prefilledSku}
      />

      {/* QR Code label Modal */}
      <QRCodeModal
        isOpen={isQRModalOpen}
        onClose={() => {
          setIsQRModalOpen(false);
          setSelectedQRItem(null);
        }}
        item={selectedQRItem}
      />

      {/* Summary Report Print Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        items={items}
      />
    </div>
  );
}
