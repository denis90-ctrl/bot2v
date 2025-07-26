import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (product) => {
    setCartItems((prev) => [...prev, product]);
  };

  const increase = (id) => {
    const item = cartItems.find((i) => i.id === id);
    if (item) setCartItems((prev) => [...prev, item]);
  };

  const decrease = (id) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx !== -1) {
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      }
      return prev;
    });
  };

  const remove = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, increase, decrease, remove, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
} 