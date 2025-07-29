import React, { useState, useMemo, useCallback } from "react";
import { useCart } from "./context/CartContext";
import ProductCard from "./components/ProductCard";
import { BsHouse, BsCart, BsPerson, BsFilter } from "react-icons/bs";

// Отдельный компонент для навигации
function BottomNav({ page, onPageChange }) {
  const navItems = useMemo(() => [
    { key: "catalog", icon: BsHouse, label: "Главная" },
    { key: "cart", icon: BsCart, label: "Корзина" },
    { key: "profile", icon: BsPerson, label: "Профиль" },
  ], []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-6 py-4 backdrop-blur-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === page;
          return (
            <button
              key={item.key}
              onClick={() => onPageChange(item.key)}
              className={`flex flex-col items-center py-3 px-6 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-[#C084FC] text-white scale-110 shadow-lg shadow-[#C084FC]/40"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
              }`}
            >
              <Icon className={`w-8 h-8 ${isActive ? "text-white" : ""}`} />
              <span className={`text-sm mt-2 font-semibold ${isActive ? "font-bold" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Отдельный компонент для корзины
function CartPage({ onPageChange }) {
  const { cartItems, increase, decrease } = useCart();

  const groupedItems = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const existing = acc.find((group) => group.id === item.id);
      if (existing) {
        existing.quantity += 1;
        existing.total += item.price;
      } else {
        acc.push({ ...item, quantity: 1, total: item.price });
      }
      return acc;
    }, []);
  }, [cartItems]);

  const totalSum = useMemo(() => 
    groupedItems.reduce((sum, item) => sum + item.total, 0), 
    [groupedItems]
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-10 text-center font-['Geist']">Корзина</h1>
        
        {groupedItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-[#A3A3A3] text-2xl mb-8 font-medium">Корзина пуста</div>
            <button
              onClick={() => onPageChange("catalog")}
              className="bg-[#C084FC] text-white py-5 px-10 rounded-2xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/40 text-lg"
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((item) => (
              <div key={item.id} className="bg-[#1A1A1A] rounded-2xl shadow-lg p-6 border border-[#2A2A2A] hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[#2A2A2A] rounded-2xl flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="text-[#A3A3A3] text-sm text-center">Нет изображения</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-xl text-white mb-2">{item.name}</div>
                    <div className="text-[#C084FC] font-bold text-2xl">{item.price} ₽</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => decrease(item.id)}
                      className="w-12 h-12 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-all duration-300 shadow-md text-xl font-bold"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-xl">{item.quantity}</span>
                    <button
                      onClick={() => increase(item.id)}
                      className="w-12 h-12 bg-[#C084FC] text-white rounded-xl hover:bg-[#b26ef0] transition-all duration-300 shadow-md shadow-[#C084FC]/30 text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
              <div className="flex justify-between items-center text-3xl font-bold mb-6">
                <span className="text-white">Итого:</span>
                <span className="text-[#C084FC]">{totalSum} ₽</span>
              </div>
              <button className="w-full bg-[#C084FC] text-white py-5 rounded-2xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/40 text-xl">
                Оформить заказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Отдельный компонент для каталога
function CatalogPage({ onPageChange }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [inStock, setInStock] = useState(false);
  const { addToCart } = useCart();

  const categories = useMemo(() => [
    { id: "all", name: "Все" },
    { id: "electronics", name: "Электроника" },
    { id: "clothing", name: "Одежда" },
    { id: "accessories", name: "Аксессуары" },
  ], []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (priceFrom && product.price < Number(priceFrom)) return false;
      if (priceTo && product.price > Number(priceTo)) return false;
      if (inStock && product.id % 2 !== 0) return false;
      return true;
    });
  }, [selectedCategory, search, priceFrom, priceTo, inStock]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-8 font-['Geist']">INTURU</h1>
          
          {/* Search */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Поиск товаров..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-[#1A1A1A] text-white placeholder-[#A3A3A3] border border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#C084FC] focus:border-[#C084FC] transition-all duration-300 text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-10">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="w-12 h-12 bg-[#1A1A1A] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white hover:bg-[#2A2A2A] rounded-2xl flex items-center justify-center transition-all duration-300"
            >
              <BsFilter className="w-6 h-6" />
            </button>
            
            {/* Category Buttons */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-8 py-4 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 text-lg ${
                  selectedCategory === category.id
                    ? "bg-[#C084FC] text-white shadow-lg shadow-[#C084FC]/40"
                    : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white hover:bg-[#2A2A2A]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
          ))}
        </div>

        {/* Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
            <div className="w-full max-w-md bg-[#1A1A1A] rounded-t-3xl p-8 shadow-2xl border-t-4 border-[#C084FC] animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-8">
                <div className="text-3xl font-bold font-['Geist']">Фильтры</div>
                <button onClick={() => setShowFilters(false)} className="text-[#A3A3A3] hover:text-white text-3xl transition-colors">×</button>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[#A3A3A3] mb-4 font-semibold text-lg">Категория</label>
                  <div className="flex gap-3 flex-wrap">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
                          selectedCategory === category.id
                            ? "bg-[#C084FC] text-white shadow-md shadow-[#C084FC]/30"
                            : "bg-[#2A2A2A] text-[#A3A3A3] border border-[#3A3A3A] hover:text-white"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[#A3A3A3] mb-3 font-semibold">Цена от</label>
                    <input
                      type="number"
                      value={priceFrom}
                      onChange={e => setPriceFrom(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#2A2A2A] text-white border border-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#C084FC] transition-all duration-300"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[#A3A3A3] mb-3 font-semibold">до</label>
                    <input
                      type="number"
                      value={priceTo}
                      onChange={e => setPriceTo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#2A2A2A] text-white border border-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#C084FC] transition-all duration-300"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="inline-flex items-center gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={() => setInStock(v => !v)}
                      className="accent-[#C084FC] w-6 h-6"
                    />
                    <span className="text-[#A3A3A3] font-semibold text-lg">Только в наличии</span>
                  </label>
                </div>
                
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full bg-[#C084FC] text-white py-5 rounded-2xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/40 text-xl"
                >
                  Применить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Отдельный компонент для профиля
function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
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

  if (loading) return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold mb-4 font-['Geist']">Загрузка профиля...</div>
        <div className="text-[#A3A3A3] text-lg">Пожалуйста, подождите</div>
      </div>
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-3xl font-bold mb-4 text-red-400 font-['Geist']">Ошибка загрузки профиля</div>
        <div className="text-[#A3A3A3] text-lg">Попробуйте обновить страницу</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-10 text-center font-['Geist']">Профиль</h1>
        
        <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A] mb-8">
          <div className="flex items-center gap-6">
            {profile.telegram.avatar ? (
              <img src={profile.telegram.avatar} alt="avatar" className="w-20 h-20 rounded-2xl bg-[#2A2A2A]" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#2A2A2A] flex items-center justify-center text-3xl text-[#A3A3A3]">
                {profile.name[0] || '@'}
              </div>
            )}
            <div>
              <div className="font-bold text-2xl text-white mb-2">@{profile.telegram.username}</div>
              <div className="text-[#A3A3A3] text-lg mb-1">{profile.name}</div>
              <div className="text-[#A3A3A3] text-sm">ID: {profile.id}</div>
              <div className="text-[#A3A3A3] text-sm">Язык: {profile.language}</div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#C084FC] font-['Geist']">Привязанные карты</h2>
            <div className="text-[#A3A3A3] text-lg">Пока нет привязанных карт</div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#C084FC] font-['Geist']">Криптокошельки</h2>
            <div className="text-[#A3A3A3] text-lg">Пока нет привязанных кошельков</div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#C084FC] font-['Geist']">История заказов</h2>
            <div className="text-[#A3A3A3] text-lg">Пока нет заказов</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState("catalog");
  const [error, setError] = useState(null);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Настройка внешнего вида Telegram Mini App
  React.useEffect(() => {
    if (window.Telegram?.WebApp) {
      try {
        // Устанавливаем цвет заголовка
        window.Telegram.WebApp.setHeaderColor('#0D0D0D');
        
        // Устанавливаем цвет фона страницы
        window.Telegram.WebApp.setBackgroundColor('#0E0E0E');
        
        // Расширяем приложение на весь экран
        window.Telegram.WebApp.expand();
        
        console.log('Telegram WebApp appearance configured');
      } catch (error) {
        console.warn('Failed to configure Telegram WebApp appearance:', error);
      }
    }
  }, []);

  // Обработка ошибок
  React.useEffect(() => {
    const handleError = (error) => {
      console.error('App error:', error);
      setError(error.message);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      handleError(new Error(event.reason));
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Если есть ошибка, показываем её
  if (error) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4 text-[#C084FC]">Ошибка загрузки</div>
          <div className="text-[#A3A3A3] mb-6">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#C084FC] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0E0E0E] text-white min-h-screen">
      {page === "catalog" && <CatalogPage onPageChange={handlePageChange} />}
      {page === "cart" && <CartPage onPageChange={handlePageChange} />}
      {page === "profile" && <ProfilePage />}
      
      <BottomNav page={page} onPageChange={handlePageChange} />
    </div>
  );
}

const products = [
  {
    id: 1,
    name: "Футболка",
    price: 1500,
    category: "clothing",
    image: require("./assets/tshirt.png"),
  },
  {
    id: 2,
    name: "Наушники",
    price: 2500,
    category: "electronics",
    image: require("./assets/headphones.png"),
  },
  {
    id: 3,
    name: "Браслет",
    price: 800,
    category: "accessories",
    image: require("./assets/bracelet.png"),
  },
  {
    id: 4,
    name: "Куртка",
    price: 3500,
    category: "clothing",
    image: require("./assets/jacket.png"),
  },
];

export default App;
