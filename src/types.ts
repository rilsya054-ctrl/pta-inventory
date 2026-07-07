export interface InventoryItem {
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

export interface HistoryLog {
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
