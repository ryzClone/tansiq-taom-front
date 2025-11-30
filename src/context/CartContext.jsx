// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [map, setMap] = useState(() => {
    try {
      const raw = localStorage.getItem("cart_v1");
      return raw ? new Map(JSON.parse(raw)) : new Map();
    } catch {
      return new Map();
    }
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      const arr = Array.from(map.entries());
      localStorage.setItem("cart_v1", JSON.stringify(arr));
    } catch {}
  }, [map]);

  // Helpers
  const add = (item, qty = 1) => {
    // item: { key, foodName, price, ... }
    setMap(prev => {
      const n = new Map(prev);
      const ex = n.get(item.key);
      const nextQty = (ex?.qty || 0) + qty;
      n.set(item.key, { ...item, qty: nextQty });
      return n;
    });
  };

  const remove = (key, qty = 1) => {
    setMap(prev => {
      const n = new Map(prev);
      const ex = n.get(key);
      if (!ex) return n;
      const nextQty = ex.qty - qty;
      if (nextQty > 0) n.set(key, { ...ex, qty: nextQty });
      else n.delete(key);
      return n;
    });
  };

  const del = (key) => {
    setMap(prev => {
      const n = new Map(prev);
      n.delete(key);
      return n;
    });
  };

  const clear = () => setMap(new Map());

  const items = useMemo(() => Array.from(map.values()), [map]);
  const count = useMemo(() => items.reduce((s, it) => s + (it.qty || 0), 0), [items]);
  const total = useMemo(() => items.reduce((s, it) => s + (it.price || 0) * (it.qty || 0), 0), [items]);

  const value = { items, count, total, add, remove, del, clear };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart() CartProvider ichida chaqirilishi kerak");
  }
  return ctx;
}
