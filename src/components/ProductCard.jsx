import React, { memo, useCallback, useState } from "react";

const ProductCard = memo(({ product, onAddToCart }) => {
  const [isInCart, setIsInCart] = useState(false);

  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
    setIsInCart(true);
    
    // Сброс состояния через 2 секунды для возможности повторного добавления
    setTimeout(() => {
      setIsInCart(false);
    }, 2000);
  }, [onAddToCart, product]);

  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-lg border border-[#2A2A2A] overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-[#EF4444]/10 transition-all duration-300 group">
      {/* Верхняя секция - Изображение товара */}
      <div className="aspect-square bg-white flex items-center justify-center p-3 group-hover:bg-gray-50 transition-all duration-300">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-auto h-auto max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300"
            style={{ 
              maxWidth: '80%', 
              maxHeight: '80%',
              objectPosition: 'center'
            }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div className="hidden text-[#A3A3A3] text-sm text-center items-center justify-center">
          Нет изображения
        </div>
      </div>
      {/* Контент: название и цена */}
      <div className="flex-1 flex flex-col items-center justify-start px-3 pt-2 pb-2">
        <h3 className="font-bold text-base text-white text-center mb-1 group-hover:text-[#EF4444] transition-colors duration-300">
          {product.name}
        </h3>
        <span className="text-[#EF4444] font-bold text-lg text-center mb-2">
          {product.price} ₽
        </span>
      </div>
      {/* Кнопка внизу */}
      <div className="px-3 pb-3">
        <button
          onClick={handleAddToCart}
          className={`w-full h-8 rounded-lg font-bold transition-all duration-300 text-sm ${
            isInCart
              ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
              : 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-md shadow-[#EF4444]/30 hover:shadow-lg hover:shadow-[#EF4444]/40'
          }`}
        >
          {isInCart ? 'В корзине' : 'В корзину'}
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard; 
