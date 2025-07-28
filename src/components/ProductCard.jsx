import React from "react";

function ProductCard({ product, onAddToCart }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl shadow-lg border border-[#2A2A2A] overflow-hidden hover:shadow-xl hover:shadow-[#C084FC]/10 transition-all duration-300 group">
      {/* Image Container */}
      <div className="aspect-square bg-[#2A2A2A] flex items-center justify-center p-6 group-hover:bg-[#3A3A3A] transition-all duration-300">
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
      
      {/* Content */}
      <div className="p-6">
        <h3 className="font-bold text-xl text-white mb-4 group-hover:text-[#C084FC] transition-colors duration-300 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-center justify-between">
          <span className="text-[#C084FC] font-bold text-2xl">{product.price} ₽</span>
          <button
            onClick={() => onAddToCart(product)}
            className="bg-[#C084FC] text-white py-3 px-6 rounded-xl font-bold hover:bg-[#b26ef0] transition-all duration-300 shadow-md shadow-[#C084FC]/30 hover:shadow-lg hover:shadow-[#C084FC]/40 text-lg"
          >
            В корзину
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard; 