import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);

  const handleAddToCart = () => {
    addToCart(product);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow hover:shadow-lg transition-shadow flex flex-col items-center p-4">
      <div className="w-full h-32 flex items-center justify-center mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-32 object-cover object-center"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-sm">Нет изображения</span>
        )}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 text-center line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{product.price} ₽</p>
      <button
        onClick={handleAddToCart}
        className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
      >
        В корзину
      </button>
    </div>
  );
}

export default ProductCard; 