require('dotenv').config({ path: './config.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Базовые настройки CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length']
}));

// Парсинг
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Простой health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
    mode: 'debug'
  });
});

// Тестовые API endpoints
app.get('/api/users', (req, res) => {
  res.json({
    users: [
      {
        _id: 'test1',
        telegramId: '1129306177',
        firstName: 'Денис',
        username: 'Denis_Buziness',
        lastMessageAt: new Date().toISOString(),
        isActive: true
      },
      {
        _id: 'test2',
        telegramId: '902862855',
        firstName: 'Ksenia',
        username: 'ksenia_arhipoval',
        lastMessageAt: new Date().toISOString(),
        isActive: true
      }
    ],
    total: 2,
    page: 1,
    pages: 1,
    hasMore: false
  });
});

app.get('/api/messages/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  res.json({
    messages: [
      {
        _id: 'msg1',
        telegramId,
        messageId: '123',
        text: 'Тестовое сообщение',
        fromBot: true,
        timestamp: new Date().toISOString(),
        messageType: 'text'
      },
      {
        _id: 'msg2',
        telegramId,
        messageId: '124',
        text: 'Еще одно сообщение',
        fromBot: false,
        timestamp: new Date().toISOString(),
        messageType: 'text'
      }
    ],
    total: 2,
    page: 1,
    pages: 1,
    hasMore: false
  });
});

app.post('/api/send-message', (req, res) => {
  const { telegramId, text } = req.body;
  res.json({
    success: true,
    message: {
      _id: `msg_${Date.now()}`,
      telegramId,
      text,
      fromBot: false,
      timestamp: new Date().toISOString()
    }
  });
});

// Тестовый endpoint для файлов
app.get('/api/file/:fileId', (req, res) => {
  const { fileId } = req.params;
  console.log(`📁 Запрос файла: ${fileId}`);
  
  // Возвращаем тестовое изображение
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
  
  // Простой тестовый JPEG (1x1 пиксель)
  const testImage = Buffer.from('/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A', 'base64');
  res.send(testImage);
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Ошибка:', error.message);
  res.status(500).json({ error: 'Ошибка сервера' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Не найдено' });
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`🔧 Debug сервер запущен на порту ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`💾 Память: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Завершение работы...');
  process.exit(0);
}); 