import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const ADMIN_KEY = process.env.REACT_APP_ADMIN_API_KEY;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000, // Увеличиваем таймаут для стабильности
  headers: {
    'Content-Type': 'application/json',
    ...(ADMIN_KEY ? { 'X-Admin-Key': ADMIN_KEY } : {})
  },
});

// Интерцептор для логирования запросов
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ответов
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const apiService = {
  // Получение списка пользователей
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  // Получение сообщений пользователя
  getMessages: async (telegramId, page = 1, limit = 50) => {
    const response = await api.get(`/messages/${telegramId}`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Отправка сообщения
  sendMessage: async (telegramId, text) => {
    const response = await api.post('/send-message', {
      telegramId,
      text
    });
    return response.data;
  },

  // Отправка файла
  sendFile: async (telegramId, file, caption = '') => {
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
    });
    return response.data;
  },

  // Получение информации о пользователе
  getUserInfo: async (telegramId) => {
    const response = await api.get(`/user/${telegramId}`);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Редактирование сообщения
  editMessage: async (messageId, newText) => {
    const response = await api.put(`/messages/${messageId}`, {
      text: newText
    });
    return response.data;
  },

  // Удаление сообщения
  deleteMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  }
};

export default api; 
