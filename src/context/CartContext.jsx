import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => [...prev, product]);
  }, []);

  const increase = useCallback((id) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        return [...prev, item];
      }
      return prev;
    });
  }, []);

  const decrease = useCallback((id) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx !== -1) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  }, []);

  const remove = useCallback((id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const totalPrice = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.price, 0), 
    [cartItems]
  );

  const cartValue = useMemo(() => ({
    cartItems,
    addToCart,
    increase,
    decrease,
    remove,
    totalPrice
  }), [cartItems, addToCart, increase, decrease, remove, totalPrice]);

  return (
    <CartContext.Provider value={cartValue}>
      {children}
    </CartContext.Provider>
  );
} 