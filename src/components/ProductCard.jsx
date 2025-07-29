import React, { memo, useCallback } from "react";

const ProductCard = memo(({ product, onAddToCart }) => {
  const handleAddToCart = useCallback(() => {
    onAddToCart(product);
  }, [onAddToCart, product]);

  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-lg border border-[#2A2A2A] overflow-hidden hover:shadow-xl hover:shadow-[#C084FC]/10 transition-all duration-300 group">
      {/* Верхняя секция - Изображение товара */}
      <div className="aspect-square bg-white flex items-center justify-center p-6 group-hover:bg-gray-50 transition-all duration-300">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
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
      
      {/* Нижняя секция - Название, цена и кнопка */}
      <div className="p-4 space-y-3">
        {/* Название товара */}
        <h3 className="font-bold text-lg text-white group-hover:text-[#C084FC] transition-colors duration-300">
          {product.name}
        </h3>
        
        {/* Цена и кнопка в одной строке */}
        <div className="flex items-center justify-between">
          <span className="text-[#C084FC] font-bold text-xl">
            {product.price} ₽
          </span>
          <button
            onClick={handleAddToCart}
            className="bg-[#C084FC] text-white py-2.5 px-4 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-md shadow-[#C084FC]/30 hover:shadow-lg hover:shadow-[#C084FC]/40 text-sm"
          >
            В КОРЗИНУ
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard; 