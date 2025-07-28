import React, { useState } from "react";
import { useCart } from "./context/CartContext";
import ProductCard from "./components/ProductCard";
import { BsMoon, BsSun, BsHouse, BsSearch, BsCart, BsPerson, BsFilter } from "react-icons/bs";

function App() {
  const [page, setPage] = useState("catalog");
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || "dark";
  });
  const { cartItems, addToCart, remove, increase, decrease } = useCart();

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navItems = [
    { key: "catalog", icon: BsHouse, label: "Главная" },
    { key: "cart", icon: BsCart, label: "Корзина" },
    { key: "profile", icon: BsPerson, label: "Профиль" },
  ];

  function BottomNav() {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#0D0D0D] border-t border-[#1A1A1A] px-4 py-3 backdrop-blur-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === page;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-[#C084FC] text-white scale-110 shadow-lg shadow-[#C084FC]/30"
                    : "text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "text-white" : ""}`} />
                <span className={`text-xs mt-1 font-medium ${isActive ? "font-bold" : ""}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function CartPage() {
    const groupedItems = cartItems.reduce((acc, item) => {
      const existing = acc.find((group) => group.id === item.id);
      if (existing) {
        existing.quantity += 1;
        existing.total += item.price;
      } else {
        acc.push({ ...item, quantity: 1, total: item.price });
      }
      return acc;
    }, []);

    const totalSum = groupedItems.reduce((sum, item) => sum + item.total, 0);

    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white pb-20">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-8 text-center font-['Space_Grotesk']">Корзина</h1>
          
          {groupedItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-[#A3A3A3] text-xl mb-6">Корзина пуста</div>
              <button
                onClick={() => setPage("catalog")}
                className="bg-[#C084FC] text-white py-4 px-8 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/30"
              >
                Перейти к покупкам
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedItems.map((item) => (
                <div key={item.id} className="bg-[#1A1A1A] rounded-xl shadow-lg p-6 border border-[#2A2A2A] hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#2A2A2A] rounded-xl flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="text-[#A3A3A3] text-xs text-center">Нет изображения</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-lg text-white">{item.name}</div>
                      <div className="text-[#C084FC] font-bold text-xl">{item.price} ₽</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decrease(item.id)}
                        className="w-10 h-10 bg-[#2A2A2A] text-white rounded-xl hover:bg-[#3A3A3A] transition-all duration-300 shadow-md"
                      >
                        −
                      </button>
                      <span className="w-10 text-center font-bold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => increase(item.id)}
                        className="w-10 h-10 bg-[#C084FC] text-white rounded-xl hover:bg-[#b26ef0] transition-all duration-300 shadow-md shadow-[#C084FC]/30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="bg-[#1A1A1A] rounded-xl shadow-lg p-6 border border-[#2A2A2A]">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span className="text-white">Итого:</span>
                  <span className="text-[#C084FC]">{totalSum} ₽</span>
                </div>
                <button className="w-full mt-6 bg-[#C084FC] text-white py-4 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/30">
                  Оформить заказ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  function CatalogPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [priceFrom, setPriceFrom] = useState("");
    const [priceTo, setPriceTo] = useState("");
    const [inStock, setInStock] = useState(false);
    const categories = [
      { id: "all", name: "Все" },
      { id: "electronics", name: "Электроника" },
      { id: "clothing", name: "Одежда" },
      { id: "accessories", name: "Аксессуары" },
    ];

    const filteredProducts = products.filter(product => {
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false;
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (priceFrom && product.price < Number(priceFrom)) return false;
      if (priceTo && product.price > Number(priceTo)) return false;
      if (inStock && product.id % 2 !== 0) return false;
      return true;
    });

    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white pb-20">
        <div className="max-w-2xl mx-auto p-4">
          {/* Верхняя панель */}
          <div className="flex items-center justify-between mb-8 gap-3">
            <h1 className="text-3xl font-bold flex-shrink-0 font-['Space_Grotesk']">Каталог</h1>
            <div className="flex-1 flex justify-center">
              <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full max-w-xs px-4 py-3 rounded-xl bg-[#1A1A1A] text-white placeholder-[#A3A3A3] border border-[#2A2A2A] focus:outline-none focus:ring-2 focus:ring-[#C084FC] focus:border-[#C084FC] transition-all duration-300"
              />
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 bg-[#1A1A1A] hover:bg-[#C084FC] text-white px-4 py-3 rounded-xl font-bold border border-[#2A2A2A] transition-all duration-300 shadow-md"
            >
              <BsFilter className="w-5 h-5" />
              <span>Фильтры</span>
            </button>
            <button
              onClick={() => setPage("cart")}
              className="bg-[#C084FC] text-white py-3 px-4 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/30 ml-2"
            >
              Корзина ({cartItems.length})
            </button>
          </div>

          {/* Категории */}
          <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === category.id
                      ? "bg-[#C084FC] text-white shadow-lg shadow-[#C084FC]/30"
                      : "bg-[#1A1A1A] text-[#A3A3A3] border border-[#2A2A2A] hover:text-white hover:bg-[#2A2A2A]"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Товары */}
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
            ))}
          </div>
        </div>

        {/* Модальное меню фильтров */}
        {showFilters && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowFilters(false)}>
            <div className="w-full max-w-md bg-[#1A1A1A] rounded-t-2xl p-6 shadow-2xl border-t-4 border-[#C084FC] animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <div className="text-2xl font-bold font-['Space_Grotesk']">Фильтры</div>
                <button onClick={() => setShowFilters(false)} className="text-[#A3A3A3] hover:text-white text-2xl transition-colors">×</button>
              </div>
              <div className="mb-6">
                <label className="block text-[#A3A3A3] mb-3 font-medium">Категория</label>
                <div className="flex gap-2 flex-wrap">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all duration-300 ${
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
              <div className="mb-6 flex gap-3">
                <div>
                  <label className="block text-[#A3A3A3] mb-2 font-medium">Цена от</label>
                  <input
                    type="number"
                    value={priceFrom}
                    onChange={e => setPriceFrom(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl bg-[#2A2A2A] text-white border border-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#C084FC] transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-[#A3A3A3] mb-2 font-medium">до</label>
                  <input
                    type="number"
                    value={priceTo}
                    onChange={e => setPriceTo(e.target.value)}
                    className="w-28 px-3 py-2 rounded-xl bg-[#2A2A2A] text-white border border-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#C084FC] transition-all duration-300"
                  />
                </div>
              </div>
              <div className="mb-6">
                <label className="inline-flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={() => setInStock(v => !v)}
                    className="accent-[#C084FC] w-5 h-5"
                  />
                  <span className="text-[#A3A3A3] font-medium">Только в наличии</span>
                </label>
              </div>
              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-[#C084FC] text-white py-4 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-lg shadow-[#C084FC]/30"
              >
                Применить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

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
          <div className="text-2xl font-bold mb-3 font-['Space_Grotesk']">Загрузка профиля...</div>
          <div className="text-[#A3A3A3]">Пожалуйста, подождите</div>
        </div>
      </div>
    );
    
    if (!profile) return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-3 text-red-400 font-['Space_Grotesk']">Ошибка загрузки профиля</div>
          <div className="text-[#A3A3A3]">Попробуйте обновить страницу</div>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white pb-20">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-3xl font-bold mb-8 text-center font-['Space_Grotesk']">Профиль</h1>
          
          <div className="bg-[#1A1A1A] rounded-xl shadow-lg p-6 border border-[#2A2A2A] mb-6">
            <div className="flex items-center gap-4">
              {profile.telegram.avatar ? (
                <img src={profile.telegram.avatar} alt="avatar" className="w-16 h-16 rounded-xl bg-[#2A2A2A]" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-2xl text-[#A3A3A3]">
                  {profile.name[0] || '@'}
                </div>
              )}
              <div>
                <div className="font-bold text-xl text-white">@{profile.telegram.username}</div>
                <div className="text-[#A3A3A3]">{profile.name}</div>
                <div className="text-[#A3A3A3] text-sm">ID: {profile.id}</div>
                <div className="text-[#A3A3A3] text-sm">Язык: {profile.language}</div>
              </div>
            </div>
          </div>

          {/* Секции для карт, кошельков, заказов */}
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-xl shadow-lg p-6 border border-[#2A2A2A]">
              <h2 className="text-xl font-bold mb-4 text-[#C084FC] font-['Space_Grotesk']">Привязанные карты</h2>
              <div className="text-[#A3A3A3]">Пока нет привязанных карт</div>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl shadow-lg p-6 border border-[#2A2A2A]">
              <h2 className="text-xl font-bold mb-4 text-[#C084FC] font-['Space_Grotesk']">Криптокошельки</h2>
              <div className="text-[#A3A3A3]">Пока нет привязанных кошельков</div>
            </div>

            <div className="bg-[#1A1A1A] rounded-xl shadow-lg p-6 border border-[#2A2A2A]">
              <h2 className="text-xl font-bold mb-4 text-[#C084FC] font-['Space_Grotesk']">История заказов</h2>
              <div className="text-[#A3A3A3]">Пока нет заказов</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0D0D0D] text-white min-h-screen">
      {page === "catalog" && <CatalogPage />}
      {page === "cart" && <CartPage />}
      {page === "profile" && <ProfilePage />}
      
      <BottomNav />
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
