import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const ADMIN_KEY = process.env.REACT_APP_ADMIN_API_KEY;

// Быстрый API клиент с короткими таймаутами
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5 секунд таймаут
  headers: {
    'Content-Type': 'application/json',
    ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {})
  },
});

// Упрощенный интерцептор для быстрой отладки
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Быстрая обработка ответов
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Timeout - сервер не отвечает');
    } else {
      console.error('❌ Response Error:', error.response?.status || error.message);
    }
    return Promise.reject(error);
  }
);

export const apiServiceFast = {
  // Быстрая проверка здоровья сервера
  healthCheck: async () => {
    try {
      const response = await api.get('/health', { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error.message);
      return { status: 'error', message: error.message };
    }
  },

  // Получение пользователей с кэшированием
  getUsers: async () => {
    try {
      const response = await api.get('/users', { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('Failed to get users:', error.message);
      return { users: [], total: 0 };
    }
  },

  // Получение сообщений с пагинацией
  getMessages: async (telegramId, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/messages/${telegramId}`, {
        params: { page, limit },
        timeout: 8000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get messages:', error.message);
      return { messages: [], total: 0 };
    }
  },

  // Отправка сообщения
  sendMessage: async (telegramId, text) => {
    try {
      const response = await api.post('/send-message', {
        telegramId,
        text
      }, { timeout: 10000 });
      return response.data;
    } catch (error) {
      console.error('Failed to send message:', error.message);
      throw error;
    }
  },

  // Отправка файла
  sendFile: async (telegramId, file, caption = '') => {
    try {
      const formData = new FormData();
      formData.append('telegramId', telegramId);
      formData.append('file', file);
      if (caption) {
        formData.append('caption', caption);
      }

      const response = await api.post('/send-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {})
        },
        timeout: 15000
      });
      return response.data;
    } catch (error) {
      console.error('Failed to send file:', error.message);
      throw error;
    }
  },

  // Получение информации о пользователе
  getUserInfo: async (telegramId) => {
    try {
      const response = await api.get(`/user/${telegramId}`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      console.error('Failed to get user info:', error.message);
      return null;
    }
  },

  // Редактирование сообщения
  editMessage: async (messageId, newText) => {
    try {
      const response = await api.put(`/messages/${messageId}`, {
        text: newText
      }, { timeout: 8000 });
      return response.data;
    } catch (error) {
      console.error('Failed to edit message:', error.message);
      throw error;
    }
  },

  // Удаление сообщения
  deleteMessage: async (messageId) => {
    try {
      const response = await api.delete(`/messages/${messageId}`, { timeout: 8000 });
      return response.data;
    } catch (error) {
      console.error('Failed to delete message:', error.message);
      throw error;
    }
  }
};

export default api; 
