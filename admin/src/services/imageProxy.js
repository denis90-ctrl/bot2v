// Прокси для загрузки изображений с обходом CORS
export const loadImageAsBase64 = async (fileId) => {
  try {
    console.log(`🔄 Загружаем изображение: ${fileId}`);
    
    const response = await fetch(`http://localhost:3001/api/file/${fileId}`, {
      method: 'GET',
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        console.log(`✅ Изображение загружено как base64: ${fileId}`);
        resolve(reader.result);
      };
      reader.onerror = () => {
        console.error(`❌ Ошибка чтения изображения: ${fileId}`);
        reject(new Error('Ошибка чтения файла'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`❌ Ошибка загрузки изображения ${fileId}:`, error);
    throw error;
  }
};

// Кэш для изображений
const imageCache = new Map();

export const getCachedImage = async (fileId) => {
  if (imageCache.has(fileId)) {
    return imageCache.get(fileId);
  }
  
  try {
    const base64 = await loadImageAsBase64(fileId);
    imageCache.set(fileId, base64);
    return base64;
  } catch (error) {
    console.error(`❌ Не удалось загрузить изображение ${fileId}:`, error);
    return null;
  }
}; 