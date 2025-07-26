import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { CartProvider } from "./context/CartContext";
import './index.css';

// Безопасно инициализируем tg
const tg = window.Telegram?.WebApp || {
  initDataUnsafe: {},
  ready: () => {},
};

tg.ready();

ReactDOM.render(
  <React.StrictMode>
    <CartProvider>
      <App tg={tg} />
    </CartProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
