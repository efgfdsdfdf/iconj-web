import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number; // This is the dynamically calculated price per unit
  basePrice: number; // The original single-unit price
  quantity: number;
  image: string;
  moq?: number;
  pricingTiers?: any[];
  width?: number;
  height?: number;
  motorType?: string;
  fabric?: string;
  configuration?: any;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
}

const calculateTieredPrice = (basePrice: number, quantity: number, tiers?: any[]) => {
  if (!tiers || tiers.length === 0) return basePrice;
  const sortedTiers = [...tiers].sort((a, b) => b.minQty - a.minQty);
  for (const tier of sortedTiers) {
    if (quantity >= tier.minQty) {
      return tier.price;
    }
  }
  return basePrice;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existingItem = state.items.find(i => i.id === item.id);
        
        if (existingItem) {
          const newQuantity = existingItem.quantity + item.quantity;
          const newPrice = calculateTieredPrice(existingItem.basePrice, newQuantity, existingItem.pricingTiers);
          return {
            items: state.items.map(i => 
              i.id === item.id ? { ...i, quantity: newQuantity, price: newPrice } : i
            )
          };
        }
        
        // For new items, ensure we set the basePrice
        const basePrice = item.basePrice || item.price;
        const initialQuantity = Math.max(item.quantity, item.moq || 1);
        const newPrice = calculateTieredPrice(basePrice, initialQuantity, item.pricingTiers);
        
        return { items: [...state.items, { ...item, basePrice, price: newPrice, quantity: initialQuantity }] };
      }),
      removeItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),
      updateQuantity: (id, quantity) => set((state) => ({
        items: state.items.map(i => {
          if (i.id === id) {
            const minQty = i.moq || 1;
            const newQuantity = Math.max(minQty, quantity);
            const newPrice = calculateTieredPrice(i.basePrice, newQuantity, i.pricingTiers);
            return { ...i, quantity: newQuantity, price: newPrice };
          }
          return i;
        })
      })),
      clearCart: () => set({ items: [] }),
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: "iconj-cart-storage", // stores cart in localStorage automatically
    }
  )
);
