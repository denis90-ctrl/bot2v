require('dotenv').config({ path: './config.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

// Безопасность и производительность
app.use(helmet());
app.use(compression()); // Сжатие ответов

// CORS с оптимизацией
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting для защиты от DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов с одного IP
  message: 'Слишком много запросов с этого IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Парсинг тела запроса с оптимизацией
app.use(bodyParser.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Подключение к MongoDB с оптимизацией
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50, // Максимальный размер пула соединений
  minPoolSize: 10, // Минимальный размер пула соединений
  serverSelectionTimeoutMS: 10000, // Увеличиваем таймаут
  socketTimeoutMS: 45000, // Таймаут сокета
  bufferCommands: true, // Включаем буферизацию команд для стабильности
  // Настройки SSL для MongoDB Atlas
  ssl: true,
  sslValidate: false, // Отключаем валидацию SSL для тестирования
  retryWrites: true,
  w: 'majority'
};

// Функция инициализации приложения
async function initializeApp() {
  try {
    // Подключаемся к MongoDB
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('✅ Подключение к MongoDB установлено');
    
    // Безопасная проверка размера пула соединений
    const poolSize = mongoose.connection.pool?.size || 'неизвестно';
    console.log(`📊 Пул соединений: ${poolSize} активных соединений`);

    // Инициализируем Telegram сервис ПОСЛЕ подключения к БД
    const telegramService = require('./services/telegramService');

    // API роуты
    app.use('/api', apiRoutes);

    // Health check с детальной информацией
    app.get('/health', (req, res) => {
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        mongoPoolSize: mongoose.connection.pool?.size || 0
      };
      
      res.json(health);
    });

    // Обработка ошибок с детализацией
    app.use((error, req, res, next) => {
      console.error('Ошибка сервера:', error);
      
      // Логируем детали ошибки для отладки
      if (process.env.NODE_ENV === 'development') {
        res.status(500).json({ 
          error: 'Внутренняя ошибка сервера',
          message: error.message,
          stack: error.stack
        });
      } else {
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
    });

    // 404 handler
    app.use((req, res) => {
      res.status(404).json({ error: 'Маршрут не найден' });
    });

    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📡 API доступен по адресу: http://localhost:${PORT}/api`);
      console.log(`🔗 Webhook URL: http://localhost:${PORT}/api/webhook`);
      console.log(`💾 Память процесса: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    });

  } catch (error) {
    console.error('❌ Ошибка инициализации приложения:', error);
    process.exit(1);
  }
}

// Мониторинг соединений MongoDB
mongoose.connection.on('connected', () => {
  console.log('🔄 MongoDB подключен');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Ошибка MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB отключен');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Получен сигнал SIGINT, закрываем соединения...');
  await mongoose.connection.close();
  process.exit(0);
});

// Запускаем инициализацию
initializeApp(); 