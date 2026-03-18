import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

// Функция для получения ID пользователя
const getUserId = () => {
  try {
    // Пытаемся получить ID из Telegram WebApp
    if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
      return window.Telegram.WebApp.initDataUnsafe.user.id;
    }
    // Если нет Telegram, используем fallback
    return 'demo';
  } catch (error) {
    return 'demo';
  }
};

// Функция для получения ключа корзины
const getCartKey = () => {
  const userId = getUserId();
  return `cart_${userId}`;
};

// Функция для загрузки корзины из localStorage
const loadCartFromStorage = () => {
  try {
    const cartKey = getCartKey();
    const savedCart = localStorage.getItem(cartKey);
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    console.error('Ошибка загрузки корзины:', error);
    return [];
  }
};

// Функция для сохранения корзины в localStorage
const saveCartToStorage = (cartItems) => {
  try {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
  } catch (error) {
    console.error('Ошибка сохранения корзины:', error);
  }
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Загружаем корзину из localStorage при инициализации
  useEffect(() => {
    const savedCart = loadCartFromStorage();
    setCartItems(savedCart);
  }, []);

  // Сохраняем корзину в localStorage при каждом изменении
  useEffect(() => {
    let handle;
    const save = () => saveCartToStorage(cartItems);

    if (typeof window.requestIdleCallback === 'function') {
      handle = window.requestIdleCallback(save, { timeout: 2000 });
    } else {
      handle = setTimeout(save, 0);
    }

    return () => {
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(handle);
      } else {
        clearTimeout(handle);
      }
    };
  }, [cartItems]);

  const addToCart = useCallback((product) => {
    setCartItems((prev) => {
      const newCart = [...prev, product];
      return newCart;
    });
  }, []);

  const increase = useCallback((id) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        const newCart = [...prev, item];
        return newCart;
      }
      return prev;
    });
  }, []);

  const decrease = useCallback((id) => {
    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx !== -1) {
        const newCart = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
        return newCart;
      }
      return prev;
    });
  }, []);

  const remove = useCallback((id) => {
    setCartItems((prev) => {
      const newCart = prev.filter((item) => item.id !== id);
      return newCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
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
    clearCart,
    totalPrice
  }), [cartItems, addToCart, increase, decrease, remove, clearCart, totalPrice]);

  return (
    <CartContext.Provider value={cartValue}>
      {children}
    </CartContext.Provider>
  );
} 
