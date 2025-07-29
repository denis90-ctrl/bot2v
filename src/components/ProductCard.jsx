import React, { memo, useCallback } from "react";

const ProductCard = memo(({ product, onAddToCart }) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
  }, [onAddToCart, product]);

  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-lg border border-[#2A2A2A] overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-[#C084FC]/10 transition-all duration-300 group">
      {/* Верхняя секция - Изображение товара */}
      <div className="aspect-square bg-white flex items-center justify-center p-4 group-hover:bg-gray-50 transition-all duration-300">
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
        <div className="hidden text-[#A3A3A3] text-base text-center items-center justify-center">
          Нет изображения
        </div>
      </div>
      {/* Контент: название и цена */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 pt-4 pb-2">
        <h3 className="font-bold text-lg text-white text-center mb-2 group-hover:text-[#C084FC] transition-colors duration-300">
          {product.name}
        </h3>
        <span className="text-[#C084FC] font-bold text-xl text-center mb-4">
          {product.price} ₽
        </span>
      </div>
      {/* Кнопка внизу */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          className="w-full h-10 bg-[#C084FC] text-white rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-md shadow-[#C084FC]/30 hover:shadow-lg hover:shadow-[#C084FC]/40 text-base"
          style={{ minHeight: 36, maxHeight: 40 }}
        >
          В корзину
        </button>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard; 