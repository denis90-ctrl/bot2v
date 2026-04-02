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
    <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#2A2A2A] px-6 py-3 backdrop-blur-lg">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === page;
          return (
            <button
              key={item.key}
              onClick={() => onPageChange(item.key)}
              className={`flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? "bg-[#EF4444] text-white scale-110 shadow-lg shadow-[#EF4444]/40"
                  : "text-[#A3A3A3] hover:text-white hover:bg-[#2A2A2A]"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "text-white" : ""}`} />
              <span className={`text-xs mt-1 font-semibold ${isActive ? "font-bold" : ""}`}>
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
              className="bg-[#EF4444] text-white py-5 px-10 rounded-2xl font-bold hover:bg-[#DC2626] transition-all duration-300 shadow-lg shadow-[#EF4444]/40 text-lg"
            >
              Перейти к покупкам
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedItems.map((item) => (
              <div key={item.id} className="bg-[#1A1A1A] rounded-2xl shadow-lg p-6 border border-[#2A2A2A] hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="w-20 h-20 bg-[#2A2A2A] rounded-2xl flex items-center justify-center">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
                    ) : (
                      <div className="text-[#A3A3A3] text-sm text-center">Нет изображения</div>
                    )}
                  </div>
                  <div className="w-full sm:flex-1">
                    <div className="font-bold text-xl text-white mb-2">{item.name}</div>
                    <div className="text-[#EF4444] font-bold text-2xl">{item.price} ₽</div>
                  </div>
                  <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4">
                    <button
                      onClick={() => decrease(item.id)}
                      className="w-12 h-12 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-all duration-300 shadow-md text-xl font-bold"
                    >
                      −
                    </button>
                    <span className="w-12 text-center font-bold text-xl">{item.quantity}</span>
                    <button
                      onClick={() => increase(item.id)}
                      className="w-12 h-12 bg-[#EF4444] text-white rounded-xl hover:bg-[#DC2626] transition-all duration-300 shadow-md shadow-[#EF4444]/30 text-xl font-bold"
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
                <span className="text-[#EF4444]">{totalSum} ₽</span>
              </div>
              <button
                onClick={() => onPageChange("checkout")}
                className="w-full bg-[#EF4444] text-white py-5 rounded-2xl font-bold hover:bg-[#DC2626] transition-all duration-300 shadow-lg shadow-[#EF4444]/40 text-xl"
              >
                Оформить заказ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Отдельный компонент для оформления заказа
function CheckoutPage({ onPageChange }) {
  const { cartItems, clearCart } = useCart();
  const totalSum = useMemo(() => cartItems.reduce((sum, item) => sum + item.price, 0), [cartItems]);

  const showNotice = (message) => {
    try {
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(message);
        return;
      }
    } catch (error) {
      // fallback to browser alert below
    }
    alert(message);
  };

  const notifyOrder = async () => {
    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        showNotice("Оформление доступно только внутри Telegram.");
        return;
      }
      const payload = {
        user: {
          id: user?.id || '—',
          username: user?.username || '',
          name: `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || '—'
        },
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        })),
        total: totalSum,
        initData
      };

      const apiBase = process.env.REACT_APP_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/notify-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const responseText = await response.text();
      if (!response.ok) {
        const message = `notify-order: ${response.status} ${response.statusText || ''}\n${responseText || ''}`;
        showNotice(message);
      }
    } catch (error) {
      console.error('Ошибка уведомления о заказе:', error);
      const message = `notify-order failed: ${error?.message || error}`;
      showNotice(message);
    }
  };
  const handleSubmit = () => {
    if (!cartItems.length) {
      showNotice("Корзина пуста");
      return;
    }
    notifyOrder();
    clearCart();
    showNotice("Заказ оформлен! Мы свяжемся с вами.");
    onPageChange("catalog");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-center font-['Geist']">Оформление заказа</h1>
        <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-6 border border-[#2A2A2A] mb-6">
          <div className="text-lg text-[#A3A3A3] mb-3">Сумма заказа</div>
          <div className="text-3xl font-bold text-[#EF4444]">{totalSum} ₽</div>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-[#EF4444] text-white py-5 rounded-2xl font-bold hover:bg-[#DC2626] transition-all duration-300 shadow-lg shadow-[#EF4444]/40 text-xl"
        >
          Подтвердить заказ
        </button>
        <button
          onClick={() => onPageChange("cart")}
          className="w-full mt-4 bg-[#2A2A2A] text-[#A3A3A3] py-4 rounded-2xl font-bold hover:bg-[#3A3A3A] hover:text-white transition-all duration-300 border border-[#3A3A3A]"
        >
          Назад в корзину
        </button>
      </div>
    </div>
  );
}

// Отдельный компонент для каталога
function CatalogPage({ onPageChange }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [activeTab, setActiveTab] = useState("sport");
  const [showFilters, setShowFilters] = useState(false);
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [inStock, setInStock] = useState(false);
  const { addToCart } = useCart();

  const categories = useMemo(() => [
    { id: "all", name: "Все" },
    { id: "info", name: "Инфо" },
    { id: "physical", name: "Физика" },
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

  const lessons = useMemo(() => ([
    {
      id: "TpDQjjPUaiI",
      title: "Lesson 1"
    },
    {
      id: "yr0J3_4paC4",
      title: "Lesson 2"
    },
    {
      id: "yVaBd26Zwx0",
      title: "Lesson 3"
    }
  ]), []);

  React.useEffect(() => {
    if (!showOverlay) return;
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowOverlay(false);
          onPageChange("catalog");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showOverlay, onPageChange]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-24">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-10">
          <div className="text-center text-sm font-semibold tracking-[0.3em] text-white/80 mb-6">
            ADAEV SHOP
          </div>
          
          {/* Search */}
          <div className="mb-8">
            <div className="relative w-full max-w-[66%] mx-auto">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={isSearchFocused ? "" : "Search"}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-12 pr-5 py-2.5 rounded-2xl bg-[#1A1A1A] text-white placeholder-[#A3A3A3] border border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#EF4444] focus:border-[#EF4444] transition-all duration-300 text-base"
              />
            </div>
          </div>

          <div className="mb-8 flex justify-center">
            <button
              onClick={() => {
                setShowOverlay(true);
              }}
              className="bg-[#EF4444] text-white py-3 px-6 rounded-2xl font-bold hover:bg-[#DC2626] transition-all duration-300 shadow-lg shadow-[#EF4444]/40 text-base"
            >
              Получить эксклюзивный доступ
            </button>
          </div>

          <div className="mb-10">
            <div className="rounded-2xl overflow-hidden border border-[#2A2A2A] shadow-lg shadow-black/40 bg-[#1A1A1A]">
              <div className="w-full aspect-video">
                <iframe
                  title="Intro Video"
                  src="https://www.youtube.com/embed/tS1gyNLZGrQ"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="mb-8 flex justify-center gap-3">
            {["sport", "lessons", "history"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-2xl font-bold transition-all duration-300 text-base ${
                  activeTab === tab
                    ? "bg-[#EF4444] text-white shadow-lg shadow-[#EF4444]/40"
                    : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white hover:bg-[#2A2A2A]"
                }`}
              >
                {tab === "sport" ? "Sport" : tab === "history" ? "History" : "Lessons"}
              </button>
            ))}
          </div>
        </div>

        {showOverlay && (
          <div className="fixed inset-0 z-[100] bg-black text-white flex items-center justify-center">
            <div className="px-8 text-center max-w-md">
              <div className="text-lg font-semibold mb-6">
                муха делает около 1000 взмахов за 5 секунд, как ты думаешь - много ли ты успел за прошедшую жизнь?
              </div>
              <div className="text-4xl font-bold">{countdown}</div>
            </div>
          </div>
        )}

        {/* Categories скрыты для общего доступа */}

        {activeTab === "sport" && (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        )}

        {activeTab === "history" && (
          <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-6 border border-[#2A2A2A] text-[#A3A3A3] text-base">
            Скоро...
          </div>
        )}

        {activeTab === "lessons" && (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="rounded-2xl overflow-hidden border border-[#2A2A2A] shadow-lg shadow-black/40 bg-[#1A1A1A]">
                <div className="w-full aspect-video">
                  <iframe
                    title={lesson.title}
                    src={`https://www.youtube.com/embed/${lesson.id}`}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters Modal скрыт для общего доступа */}
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
            <h2 className="text-2xl font-bold mb-4 text-[#EF4444] font-['Geist']">Привязанные карты</h2>
            <div className="text-[#A3A3A3] text-lg">Пока нет привязанных карт</div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#EF4444] font-['Geist']">Криптокошельки</h2>
            <div className="text-[#A3A3A3] text-lg">Пока нет привязанных кошельков</div>
          </div>

          <div className="bg-[#1A1A1A] rounded-2xl shadow-lg p-8 border border-[#2A2A2A]">
            <h2 className="text-2xl font-bold mb-4 text-[#EF4444] font-['Geist']">История заказов</h2>
            <div className="text-[#A3A3A3] text-lg">Пока нет заказов</div>
          </div>
        </div>

        <div className="mt-10 text-center text-sm text-[#6B6B6B]">
          Property of Denis D. jointly with Sulim A.
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
        
        // Устанавливаем тему приложения
        window.Telegram.WebApp.setThemeParams({
          bg_color: '#0E0E0E',
          text_color: '#FFFFFF',
          hint_color: '#A3A3A3',
          link_color: '#EF4444',
          button_color: '#EF4444',
          button_text_color: '#FFFFFF',
          secondary_bg_color: '#1A1A1A'
        });
        
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
          <div className="text-2xl font-bold mb-4 text-[#EF4444]">Ошибка загрузки</div>
          <div className="text-[#A3A3A3] mb-6">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#EF4444] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#DC2626] transition-all duration-300"
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
      {page === "checkout" && <CheckoutPage onPageChange={handlePageChange} />}
      {page === "profile" && <ProfilePage />}
      
      <BottomNav page={page} onPageChange={handlePageChange} />
    </div>
  );
}

const products = [
  {
    id: 1,
    name: "Подписка 1 месяц",
    price: 199,
    category: "info",
    image: require("./assets/headphones.png"),
  },
  {
    id: 2,
    name: "Подписка 12 месяцев",
    price: null,
    category: "info",
    image: require("./assets/jacket.png"),
  },
  {
    id: 3,
    name: "Шорты",
    price: null,
    category: "physical",
    image: require("./assets/tshirt.png"),
  },
  {
    id: 4,
    name: "Рашгард",
    price: null,
    category: "physical",
    image: require("./assets/headphones.png"),
  },
  {
    id: 5,
    name: "Леггинсы",
    price: null,
    category: "physical",
    image: require("./assets/bracelet.png"),
  },
  {
    id: 6,
    name: "Полный комплект",
    price: null,
    category: "physical",
    image: require("./assets/jacket.png"),
  },
];

export default App;


