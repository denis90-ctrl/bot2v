require('dotenv').config({ path: './config.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api-simple');

const app = express();
const PORT = process.env.PORT || 3001;

// Базовые настройки безопасности
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Content-Length']
}));

// Упрощенный парсинг
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

// Упрощенные настройки MongoDB для быстрой загрузки
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 5, // Уменьшаем пул для быстрой загрузки
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000, // Уменьшаем таймаут
  socketTimeoutMS: 30000,
  bufferCommands: true,
  ssl: true,
  sslValidate: false,
  retryWrites: true,
  w: 'majority'
};

// Функция быстрой инициализации
async function initializeAppFast() {
  try {
    console.log('🚀 Быстрый запуск сервера...');
    
    // Подключаемся к MongoDB с таймаутом
    const connectPromise = mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB timeout')), 10000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('✅ MongoDB подключен (быстрый режим)');

    // API роуты
    app.use('/api', apiRoutes);

    // Простой health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
      });
    });

    // Простая обработка ошибок
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
      console.log(`⚡ Сервер запущен на порту ${PORT} (быстрый режим)`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
      console.log(`💾 Память: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    });

  } catch (error) {
    console.error('❌ Ошибка запуска:', error.message);
    // Запускаем сервер даже без MongoDB для тестирования
    app.use('/api', apiRoutes);
    app.get('/health', (req, res) => res.json({ status: 'OK', mode: 'no-db' }));
    app.listen(PORT, () => {
      console.log(`⚠️ Сервер запущен без БД на порту ${PORT}`);
    });
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Завершение работы...');
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error('Ошибка закрытия MongoDB:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Получен SIGTERM, завершение работы...');
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error('Ошибка закрытия MongoDB:', error);
  }
  process.exit(0);
});

initializeAppFast(); 