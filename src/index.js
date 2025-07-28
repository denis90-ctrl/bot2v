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

// Функция инициализации приложения
function initializeApp() {
  // Инициализируем Telegram Web App
  if (tg.ready) {
    tg.ready();
  }

  // Настраиваем для мобильного отображения
  if (tg.expand) {
    tg.expand();
  }

  // Рендерим приложение
  ReactDOM.render(
    <React.StrictMode>
      <CartProvider>
        <App tg={tg} />
      </CartProvider>
    </React.StrictMode>,
    document.getElementById("root")
  );
}

// Ждём загрузки DOM и Telegram
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM уже загружен
  initializeApp();
}

// Дополнительная проверка для Telegram
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
}
