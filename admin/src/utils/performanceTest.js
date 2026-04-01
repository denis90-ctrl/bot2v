// Генератор тестовых пользователей
export const generateTestUsers = (count = 100, realUserId = '5785609102') => {
  const users = [];
  
  for (let i = 0; i < count; i++) {
    users.push({
      telegramId: realUserId, // Используем переданный реальный ID
      username: `user${i}`,
      firstName: `User${i}`,
      lastName: `Test${i}`,
      isOnline: Math.random() > 0.7,
      lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lastMessageAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  
  return users;
};

// Генератор тестовых сообщений
export const generateTestMessages = (count = 500, realUserId = '5785609102') => {
  const messages = [];
  
  for (let i = 0; i < count; i++) {
    messages.push({
      _id: `msg_${i}`,
      telegramId: realUserId, // Используем переданный реальный ID
      text: `Тестовое сообщение ${i} с длинным текстом для проверки производительности рендеринга сообщений в чате`,
      fromBot: Math.random() > 0.5,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      messageType: 'text',
      isEdited: Math.random() > 0.9,
      editedAt: Math.random() > 0.9 ? new Date().toISOString() : null
    });
  }
  
  return messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

// Функция для измерения времени выполнения
export const measurePerformance = (name, fn) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
};

// Функция для тестирования фильтрации
export const testFiltering = (users, query) => {
  return measurePerformance('Filtering', () => {
    const queryLower = query.toLowerCase();
    return users.filter(user => {
      const username = user.username?.toLowerCase() || '';
      const firstName = user.firstName?.toLowerCase() || '';
      const lastName = user.lastName?.toLowerCase() || '';
      const telegramId = user.telegramId?.toString() || '';
      
      return username.includes(queryLower) || 
             firstName.includes(queryLower) || 
             lastName.includes(queryLower) || 
             telegramId.includes(queryLower);
    });
  });
};

// Функция для тестирования сортировки
export const testSorting = (messages) => {
  return measurePerformance('Sorting', () => {
    return [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  });
};

// Функция для анализа производительности
export const analyzePerformance = (users, messages) => {
  console.log('📊 Performance Analysis:');
  console.log(`👥 Users: ${users.length}`);
  console.log(`💬 Messages: ${messages.length}`);
  console.log(`📦 Total items: ${users.length + messages.length}`);
  
  const userSize = new Blob([JSON.stringify(users)]).size;
  const messageSize = new Blob([JSON.stringify(messages)]).size;
  
  console.log(`📏 User data size: ${(userSize / 1024).toFixed(2)}KB`);
  console.log(`📏 Message data size: ${(messageSize / 1024).toFixed(2)}KB`);
  console.log(`📏 Total data size: ${((userSize + messageSize) / 1024).toFixed(2)}KB`);
  
  // Тестируем фильтрацию
  testFiltering(users, 'test');
  
  // Тестируем сортировку
  testSorting(messages);
}; 