import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import './index.css';
import { register as registerServiceWorker } from './serviceWorkerRegistration';

// Инициализация Telegram Web App
let tg = null;

// Проверяем доступность Telegram Web App
if (window.Telegram?.WebApp) {
  tg = window.Telegram.WebApp;
} else {
  // Fallback для случая, когда Telegram API недоступен
  tg = {
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
  // Инициализируем Telegram Web App с проверками
  if (tg && typeof tg.ready === 'function') {
    try {
      tg.ready();
    } catch (error) {
      console.warn('Telegram WebApp ready() failed:', error);
    }
  }

  // Настраиваем для мобильного отображения с проверками
  if (tg && typeof tg.expand === 'function') {
    try {
      tg.expand();
    } catch (error) {
      console.warn('Telegram WebApp expand() failed:', error);
    }
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

// Запускаем инициализацию после загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    // Регистрируем service worker с отладочной информацией
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log('Service Worker registered successfully:', registration);
      },
      onUpdate: (registration) => {
        console.log('Service Worker updated:', registration);
      }
    });
  });
} else {
  initializeApp();
  // Регистрируем service worker с отладочной информацией
  registerServiceWorker({
    onSuccess: (registration) => {
      console.log('Service Worker registered successfully:', registration);
    },
    onUpdate: (registration) => {
      console.log('Service Worker updated:', registration);
    }
  });
}
