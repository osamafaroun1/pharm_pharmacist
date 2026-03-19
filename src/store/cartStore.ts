import { create } from 'zustand';

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  warehouseId: number;
  warehouseName: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
  loadFromStorage: () => void;
}

// حفظ في localStorage
const STORAGE_KEY = 'cart_items';

const saveToStorage = (items: CartItem[]) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
  catch {}
};

const loadFromStorage = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: loadFromStorage(),  // ← تحميل مباشر عند البداية

  loadFromStorage: () => {
    set({ items: loadFromStorage() });
  },

  addItem: (item) => {
    const items = get().items;
    const existing = items.find(i => i.productId === item.productId);
    let newItems: CartItem[];

    if (existing) {
      newItems = items.map(i =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + item.quantity }
          : i
      );
    } else {
      newItems = [...items, item];
    }

    set({ items: newItems });
    saveToStorage(newItems);
  },

  removeItem: (productId) => {
    const newItems = get().items.filter(i => i.productId !== productId);
    set({ items: newItems });
    saveToStorage(newItems);
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    const newItems = get().items.map(i =>
      i.productId === productId ? { ...i, quantity } : i
    );
    set({ items: newItems });
    saveToStorage(newItems);
  },

  clearCart: () => {
    set({ items: [] });
    localStorage.removeItem(STORAGE_KEY);
  },

  total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));