import React, { useEffect, useState } from "react";
import { X, Package, Tag, AlertTriangle, Coins, FileText, Barcode, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem } from "../types";

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedItem: InventoryItem) => void;
  editingItem: InventoryItem | null;
  prefilledSku: string | null;
}

const CATEGORIES = [
  "Makanan",
  "Minuman",
  "Peralatan Mandi",
  "Elektronik",
  "Pakaian",
  "Alat Tulis",
  "Kesehatan & Obat",
  "Lainnya",
];

export default function ItemModal({
  isOpen,
  onClose,
  onSaveSuccess,
  editingItem,
  prefilledSku,
}: ItemModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Makanan");
  const [customCategory, setCustomCategory] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [minStock, setMinStock] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name);
      setSku(editingItem.sku);
      if (CATEGORIES.includes(editingItem.category)) {
        setCategory(editingItem.category);
        setCustomCategory("");
      } else {
        setCategory("Lainnya");
        setCustomCategory(editingItem.category);
      }
      setStock(editingItem.stock);
      setMinStock(editingItem.minStock);
      setPrice(editingItem.price);
      setDescription(editingItem.description);
    } else {
      // Create mode
      setName("");
      setSku(prefilledSku || "");
      setCategory("Makanan");
      setCustomCategory("");
      setStock("");
      setMinStock("");
      setPrice("");
      setDescription("");
    }
    setErrorMsg(null);
  }, [editingItem, prefilledSku, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Nama barang wajib diisi");
      return;
    }
    if (!sku.trim()) {
      setErrorMsg("SKU atau Barcode wajib diisi");
      return;
    }

    const finalCategory = category === "Lainnya" ? (customCategory.trim() || "Lainnya") : category;
    const finalStock = stock === "" ? 0 : Number(stock);
    const finalMinStock = minStock === "" ? 0 : Number(minStock);
    const finalPrice = price === "" ? 0 : Number(price);

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      category: finalCategory,
      stock: finalStock,
      minStock: finalMinStock,
      price: finalPrice,
      description: description.trim(),
    };

    try {
      const url = editingItem ? `/api/inventory/${editingItem.id}` : "/api/inventory";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan barang");
      }

      onSaveSuccess(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menghubungi server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600 animate-pulse" />
              <h3 className="font-semibold text-slate-800">
                {editingItem ? "Edit Detail Barang" : "Registrasi Barang Baru"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 animate-shake">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Field: Barcode/SKU */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-slate-400" />
                Barcode / SKU ID <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Scan barcode atau ketik SKU disini"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-sm border bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono ${
                    prefilledSku ? "border-emerald-300 ring-2 ring-emerald-500/10" : "border-slate-200"
                  }`}
                />
                {prefilledSku && (
                  <span className="absolute right-3 top-2.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Hasil Scan
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                Dapat berupa kode barcode produk ritel standard (EAN/UPC) maupun kode kustom Anda.
              </p>
            </div>

            {/* Field: Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-slate-400" />
                Nama Barang <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Indomie Goreng Spesial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 font-medium"
              />
            </div>

            {/* Field: Category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 bg-slate-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-700"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-slate-400" />
                  Harga Satuan (Rp)
                </label>
                <input
                  type="number"
                  placeholder="Rp 0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Custom Category input if "Lainnya" is selected */}
            {category === "Lainnya" && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-semibold text-slate-700">Tulis Kategori Baru</label>
                <input
                  type="text"
                  placeholder="Contoh: ATK Kantor"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
                />
              </div>
            )}

            {/* Stocks Input */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  Stok Tersedia
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  Batas Stok Minimum
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Notifikasi peringatan stok rendah akan menyala otomatis jika "Stok Tersedia" bernilai kurang dari atau sama dengan "Batas Stok Minimum".
            </p>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                Keterangan / Deskripsi
              </label>
              <textarea
                rows={3}
                placeholder="Tulis spesifikasi, lokasi penyimpanan rak, atau info tambahan lainnya..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 bg-slate-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 resize-none"
              />
            </div>
          </form>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/10 transition-all"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Barang"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
