import React, { useState } from "react";
import { categories } from "./data";
import products from "./data/products";
import ProductCard from "./components/ProductCard";
import { useCart } from "./context/CartContext";
import "./App.css";
import { AiOutlineInfoCircle, AiOutlineQuestionCircle, AiOutlineCamera } from 'react-icons/ai';
import { FaHandshake } from 'react-icons/fa';
import { CgProfile } from 'react-icons/cg';
import { useEffect } from "react";
import { BsMoon, BsSun } from 'react-icons/bs';

function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      className="fixed top-3 right-3 z-50 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-yellow-300 shadow hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      onClick={() => setDark((v) => !v)}
      aria-label="Переключить тему"
    >
      {dark ? <BsSun className="text-xl" /> : <BsMoon className="text-xl" />}
    </button>
  );
}

function BottomNav({ page, setPage }) {
  const navItems = [
    { key: 'about', label: 'О нас', icon: AiOutlineInfoCircle },
    { key: 'help', label: 'Помощь', icon: AiOutlineQuestionCircle },
    { key: 'photo', label: 'Ловец по фото', icon: AiOutlineCamera },
    { key: 'partners', label: 'Партнёрам', icon: FaHandshake },
    { key: 'profile', label: 'Профиль', icon: CgProfile },
  ];
  return (
    <nav className="fixed left-0 right-0 bottom-0 h-20 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-around items-center z-50 shadow-md">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.key === page;
        return (
          <button
            key={item.key}
            className="flex flex-col items-center focus:outline-none group bg-none border-none"
            onClick={() => setPage(item.key)}
          >
            <span className={`flex items-center justify-center w-12 h-12 rounded-full mb-1 transition text-3xl ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-400 bg-gray-100 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
              <Icon />
            </span>
            <span className={`text-xs text-center leading-tight ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500 group-hover:text-blue-600'}`}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function CartPage({ onBack }) {
  const { cartItems, totalPrice, increase, decrease, remove } = useCart();

  // Группируем товары по id для подсчёта количества
  const grouped = cartItems.reduce((acc, item) => {
    const found = acc.find((g) => g.id === item.id);
    if (found) {
      found.count += 1;
    } else {
      acc.push({ ...item, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div className="p-4 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <button onClick={onBack} className="mb-4 text-blue-600 hover:underline">&larr; Назад к каталогу</button>
      <h2 className="text-xl font-bold mb-4">Корзина</h2>
      {grouped.length === 0 ? (
        <p className="text-gray-500">Корзина пуста</p>
      ) : (
        <ul className="mb-4 space-y-3">
          {grouped.map((item) => (
            <li key={item.id} className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow p-3 gap-4">
              <img src={item.image} alt={item.name} className="w-14 h-14 object-contain rounded bg-gray-100 dark:bg-gray-700" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</div>
                <div className="text-gray-500 dark:text-gray-300 text-sm">{item.price} ₽</div>
              </div>
              <div className="flex flex-col items-end min-w-[80px] gap-1">
                <div className="flex items-center gap-1">
                  <button onClick={() => decrease(item.id)} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600">−</button>
                  <span className="text-sm text-gray-700 dark:text-gray-200 w-6 text-center">{item.count}</span>
                  <button onClick={() => increase(item.id)} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600">+</button>
                </div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">{item.price * item.count} ₽</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 font-bold text-lg">
        Итого: {totalPrice} ₽
      </div>
    </div>
  );
}

function CatalogPage({ onCart }) {
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [inStock, setInStock] = useState(false);

  // Для примера: считаем, что товары с чётным id есть в наличии
  const isInStock = (product) => product.id % 2 === 0;

  const handleCategoryChange = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev, cat]
    );
  };

  const handleReset = () => {
    setSearch("");
    setSelectedCategories([]);
    setPriceFrom("");
    setPriceTo("");
    setInStock(false);
  };

  let filteredProducts = products
    .filter((p) =>
      selectedCategories.length === 0 || selectedCategories.includes(p.category)
    )
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => (priceFrom ? p.price >= Number(priceFrom) : true))
    .filter((p) => (priceTo ? p.price <= Number(priceTo) : true))
    .filter((p) => (inStock ? isInStock(p) : true));

  return (
    <div className="p-4 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Каталог товаров</h1>
        <button onClick={onCart} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition mr-16">Корзина</button>
      </div>
      <input
        type="text"
        placeholder="Поиск"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <div className="flex flex-wrap gap-3 mb-3">
        {categories.filter(c => c !== "Все").map(cat => (
          <label key={cat} className="flex items-center gap-1 text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer text-gray-900 dark:text-gray-100">
            <input
              type="checkbox"
              checked={selectedCategories.includes(cat)}
              onChange={() => handleCategoryChange(cat)}
              className="accent-blue-600"
            />
            {cat}
          </label>
        ))}
        <button onClick={handleReset} className="ml-2 text-blue-600 hover:underline">Сбросить фильтры</button>
      </div>
      <div className="flex gap-3 mb-3">
        <input
          type="number"
          placeholder="Цена от"
          value={priceFrom}
          onChange={e => setPriceFrom(e.target.value)}
          className="w-24 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          placeholder="Цена до"
          value={priceTo}
          onChange={e => setPriceTo(e.target.value)}
          className="w-24 px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={inStock}
            onChange={() => setInStock(v => !v)}
            className="accent-blue-600"
          />
          В наличии
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 card-list">
        {filteredProducts.map((product) => (
          <ProductCard product={product} key={product.id} />
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем доступность Telegram WebApp
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    
    if (user) {
      setProfile({
        telegram: {
          username: user.username || 'пользователь',
          avatar: user.photo_url,
        },
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь',
        language: user.language_code || 'ru',
        id: user.id || 'неизвестно',
        cards: [],
        wallets: [],
        orders: [],
      });
    } else {
      // Fallback если Telegram WebApp недоступен
      setProfile({
        telegram: {
          username: 'demo_user',
          avatar: null,
        },
        name: 'Демо пользователь',
        language: 'ru',
        id: 'demo',
        cards: [],
        wallets: [],
        orders: [],
      });
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="p-4">Загрузка профиля...</div>;
  if (!profile) return <div className="p-4">Ошибка загрузки профиля</div>;

  return (
    <div className="p-4 pb-20 min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        {profile.telegram.avatar ? (
          <img src={profile.telegram.avatar} alt="avatar" className="w-16 h-16 rounded-full bg-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl text-gray-500">
            {profile.name[0] || '@'}
          </div>
        )}
        <div>
          <div className="font-bold text-lg">@{profile.telegram.username}</div>
          <div className="text-gray-500 text-sm">{profile.name}</div>
          <div className="text-gray-400 text-xs">ID: {profile.id}</div>
          <div className="text-gray-400 text-xs">Язык: {profile.language}</div>
        </div>
      </div>
      {/* Остальные секции профиля (карты, кошельки, заказы) можно подключить к API или оставить мок-данными */}
    </div>
  );
}

function App() {
  const [page, setPage] = useState("catalog");
  return <>
    <ThemeToggle />
    {page === "cart"
      ? <CartPage onBack={() => setPage("catalog")} />
      : page === "profile"
        ? <ProfilePage />
        : <CatalogPage onCart={() => setPage("cart")} />}
    <BottomNav page={page} setPage={setPage} />
  </>;
}

export default App;
