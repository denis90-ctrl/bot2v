import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import './index.css';

// Инициализация Telegram Web App
let tg;
try {
  // Пытаемся использовать официальный SDK
  const { WebApp } = require('@twa-dev/sdk');
  tg = WebApp;
} catch (error) {
  // Fallback для случая, когда SDK недоступен
  tg = window.Telegram?.WebApp || {
    initDataUnsafe: {},
    ready: () => {},
    expand: () => {},
    close: () => {},
    MainButton: {
      show: () => {},
      hide: () => {},
      setText: () => {},
      onClick: () => {},
    },
    BackButton: {
      show: () => {},
      hide: () => {},
      onClick: () => {},
    },
  };
}

// Инициализируем Telegram Web App
if (tg.ready) {
  tg.ready();
}

// Настраиваем для мобильного отображения
if (tg.expand) {
  tg.expand();
}

ReactDOM.render(
  <React.StrictMode>
    <CartProvider>
      <App tg={tg} />
    </CartProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
