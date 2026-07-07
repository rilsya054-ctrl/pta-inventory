import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import QRCode from "qrcode";

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Define types for item and history
interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface HistoryLog {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: "in" | "out" | "edit" | "create" | "delete";
  quantityChange: number;
  previousStock: number;
  newStock: number;
  timestamp: string;
  note: string;
}

interface DBStructure {
  items: InventoryItem[];
  history: HistoryLog[];
}

// Initial Indonesian seed data for a rich, ready-to-use localized demo
const initialSeed: DBStructure = {
  items: [
    {
      id: "item-1",
      name: "Indomie Goreng Spesial",
      sku: "070563244194",
      category: "Makanan",
      stock: 45,
      minStock: 15,
      price: 3100,
      description: "Mie instan goreng rasa spesial dari Indofood.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-2",
      name: "Teh Botol Sosro Kotak 250ml",
      sku: "8991002101234",
      category: "Minuman",
      stock: 4,
      minStock: 12,
      price: 3500,
      description: "Teh melati manis dalam kemasan kotak yang menyegarkan.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-3",
      name: "Aqua Gelas 220ml",
      sku: "8998899001012",
      category: "Minuman",
      stock: 120,
      minStock: 30,
      price: 1000,
      description: "Air minum dalam kemasan gelas plastik praktis.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-4",
      name: "Kopi Kapal Api Mantap 165g",
      sku: "8991001111123",
      category: "Minuman",
      stock: 2,
      minStock: 8,
      price: 14500,
      description: "Kopi bubuk hitam murni dengan aroma mantap.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-5",
      name: "Sabun Mandi Lifebuoy Merah 85g",
      sku: "8999999042211",
      category: "Peralatan Mandi",
      stock: 18,
      minStock: 5,
      price: 4200,
      description: "Sabun batang perlindungan kuman dan kesehatan kulit.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "item-6",
      name: "Pepsodent Pencegah Gigi Berlubang 190g",
      sku: "8999999051107",
      category: "Peralatan Mandi",
      stock: 3,
      minStock: 6,
      price: 12500,
      description: "Pasta gigi perlindungan ganda dari gigi berlubang.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  history: [
    {
      id: "log-1",
      itemId: "item-1",
      itemName: "Indomie Goreng Spesial",
      sku: "070563244194",
      type: "create",
      quantityChange: 45,
      previousStock: 0,
      newStock: 45,
      timestamp: new Date().toISOString(),
      note: "Stok awal sistem",
    },
    {
      id: "log-2",
      itemId: "item-2",
      itemName: "Teh Botol Sosro Kotak 250ml",
      sku: "8991002101234",
      type: "create",
      quantityChange: 4,
      previousStock: 0,
      newStock: 4,
      timestamp: new Date().toISOString(),
      note: "Stok awal sistem - Perlu restock",
    },
  ],
};

// Help helper to read database
function readDB(): DBStructure {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSeed, null, 2), "utf8");
    return initialSeed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading database file, resetting to initial seed", e);
    return initialSeed;
  }
}

// Helper helper to write database
function writeDB(data: DBStructure) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Ensure DB initialized
  readDB();

  // 1. GET ALL ITEMS
  app.get("/api/inventory", (req, res) => {
    const db = readDB();
    res.json(db.items);
  });

  // 2. GET ITEM BY ID OR SKU
  app.get("/api/inventory/search/:query", (req, res) => {
    const query = req.params.query;
    const db = readDB();
    const item = db.items.find(
      (i) => i.id === query || i.sku.toLowerCase() === query.toLowerCase()
    );
    if (!item) {
      return res.status(404).json({ error: "Barang tidak ditemukan" });
    }
    res.json(item);
  });

  // 3. CREATE NEW ITEM
  app.post("/api/inventory", (req, res) => {
    const { name, sku, category, stock, minStock, price, description } = req.body;

    if (!name || !sku) {
      return res.status(400).json({ error: "Nama barang dan SKU wajib diisi" });
    }

    const db = readDB();
    
    // Check if duplicate SKU
    const existing = db.items.find((i) => i.sku.toLowerCase() === sku.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: `Barang dengan SKU/Barcode "${sku}" sudah ada: ${existing.name}` });
    }

    const newItem: InventoryItem = {
      id: "item-" + Date.now(),
      name,
      sku,
      category: category || "Umum",
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      price: Number(price) || 0,
      description: description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.items.push(newItem);

    // Record creation in log
    const log: HistoryLog = {
      id: "log-" + Date.now(),
      itemId: newItem.id,
      itemName: newItem.name,
      sku: newItem.sku,
      type: "create",
      quantityChange: newItem.stock,
      previousStock: 0,
      newStock: newItem.stock,
      timestamp: new Date().toISOString(),
      note: "Barang baru didaftarkan",
    };
    db.history.unshift(log);

    writeDB(db);
    res.status(201).json(newItem);
  });

  // 4. UPDATE ITEM
  app.put("/api/inventory/:id", (req, res) => {
    const id = req.params.id;
    const { name, sku, category, stock, minStock, price, description, note } = req.body;

    const db = readDB();
    const itemIndex = db.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Barang tidak ditemukan" });
    }

    const currentItem = db.items[itemIndex];

    // Check duplicate SKU if it changed
    if (sku && sku.toLowerCase() !== currentItem.sku.toLowerCase()) {
      const duplicate = db.items.find((i) => i.id !== id && i.sku.toLowerCase() === sku.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ error: `SKU/Barcode "${sku}" sudah dipakai oleh barang lain: ${duplicate.name}` });
      }
    }

    const prevStock = currentItem.stock;
    const nextStock = stock !== undefined ? Number(stock) : prevStock;
    const stockDiff = nextStock - prevStock;

    const updatedItem: InventoryItem = {
      ...currentItem,
      name: name || currentItem.name,
      sku: sku || currentItem.sku,
      category: category || currentItem.category,
      stock: nextStock,
      minStock: minStock !== undefined ? Number(minStock) : currentItem.minStock,
      price: price !== undefined ? Number(price) : currentItem.price,
      description: description !== undefined ? description : currentItem.description,
      updatedAt: new Date().toISOString(),
    };

    db.items[itemIndex] = updatedItem;

    // Log the update if stock or other major attributes changed
    if (stockDiff !== 0) {
      const log: HistoryLog = {
        id: "log-" + Date.now(),
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        sku: updatedItem.sku,
        type: stockDiff > 0 ? "in" : "out",
        quantityChange: Math.abs(stockDiff),
        previousStock: prevStock,
        newStock: nextStock,
        timestamp: new Date().toISOString(),
        note: note || (stockDiff > 0 ? "Penambahan stok manual" : "Pengurangan stok manual"),
      };
      db.history.unshift(log);
    } else {
      const log: HistoryLog = {
        id: "log-" + Date.now(),
        itemId: updatedItem.id,
        itemName: updatedItem.name,
        sku: updatedItem.sku,
        type: "edit",
        quantityChange: 0,
        previousStock: prevStock,
        newStock: prevStock,
        timestamp: new Date().toISOString(),
        note: note || "Update detail informasi barang",
      };
      db.history.unshift(log);
    }

    writeDB(db);
    res.json(updatedItem);
  });

  // 5. QUICK SCAN TRANSITION (add or subtract 1 item by scanning)
  app.post("/api/inventory/scan-quick", (req, res) => {
    const { sku, action } = req.body; // action: "add" | "subtract" | "view"
    if (!sku) {
      return res.status(400).json({ error: "SKU/Barcode wajib diisi" });
    }

    const db = readDB();
    const itemIndex = db.items.findIndex((i) => i.sku.toLowerCase() === sku.toLowerCase());
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Barang belum terdaftar", scanSku: sku });
    }

    const item = db.items[itemIndex];
    const prevStock = item.stock;

    if (action === "add") {
      item.stock += 1;
      item.updatedAt = new Date().toISOString();
      db.history.unshift({
        id: "log-" + Date.now(),
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: "in",
        quantityChange: 1,
        previousStock: prevStock,
        newStock: item.stock,
        timestamp: new Date().toISOString(),
        note: "Stok masuk via Pemindaian Cepat",
      });
    } else if (action === "subtract") {
      if (item.stock <= 0) {
        return res.status(400).json({ error: `Stok "${item.name}" sudah habis (0). Tidak bisa dikurangi lagi.` });
      }
      item.stock -= 1;
      item.updatedAt = new Date().toISOString();
      db.history.unshift({
        id: "log-" + Date.now(),
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        type: "out",
        quantityChange: 1,
        previousStock: prevStock,
        newStock: item.stock,
        timestamp: new Date().toISOString(),
        note: "Stok keluar via Pemindaian Cepat",
      });
    }

    writeDB(db);
    res.json({ message: "Berhasil memproses pemindaian", item });
  });

  // 6. DELETE ITEM
  app.delete("/api/inventory/:id", (req, res) => {
    const id = req.params.id;
    const db = readDB();
    const itemIndex = db.items.findIndex((i) => i.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: "Barang tidak ditemukan" });
    }

    const item = db.items[itemIndex];
    db.items.splice(itemIndex, 1);

    db.history.unshift({
      id: "log-" + Date.now(),
      itemId: id,
      itemName: item.name,
      sku: item.sku,
      type: "delete",
      quantityChange: item.stock,
      previousStock: item.stock,
      newStock: 0,
      timestamp: new Date().toISOString(),
      note: "Barang dihapus dari sistem",
    });

    writeDB(db);
    res.json({ message: "Barang berhasil dihapus" });
  });

  // 7. GET HISTORY LOGS
  app.get("/api/history", (req, res) => {
    const db = readDB();
    res.json(db.history);
  });

  // 8. DYNAMIC QR CODE GENERATOR (Returns Base64 image URL)
  app.get("/api/qrcode", async (req, res) => {
    const text = req.query.text as string;
    if (!text) {
      return res.status(400).json({ error: "Parameter 'text' wajib diisi" });
    }
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 300,
        color: {
          dark: "#1e293b", // Slate 800
          light: "#ffffff", // White
        },
      });
      res.json({ dataUrl });
    } catch (err) {
      console.error("Error generating QR", err);
      res.status(500).json({ error: "Gagal membuat QR Code" });
    }
  });

  // Vite development vs production asset serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
}

startServer();
