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

// Р‘РµР·РѕРїР°СЃРЅРѕСЃС‚СЊ Рё РїСЂРѕРёР·РІРѕРґРёС‚РµР»СЊРЅРѕСЃС‚СЊ
app.use(helmet());
app.use(compression()); // РЎР¶Р°С‚РёРµ РѕС‚РІРµС‚РѕРІ

// CORS СЃ РѕРїС‚РёРјРёР·Р°С†РёРµР№
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting РґР»СЏ Р·Р°С‰РёС‚С‹ РѕС‚ DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 РјРёРЅСѓС‚
  max: 1000, // РјР°РєСЃРёРјСѓРј 1000 Р·Р°РїСЂРѕСЃРѕРІ СЃ РѕРґРЅРѕРіРѕ IP
  message: 'РЎР»РёС€РєРѕРј РјРЅРѕРіРѕ Р·Р°РїСЂРѕСЃРѕРІ СЃ СЌС‚РѕРіРѕ IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// РџР°СЂСЃРёРЅРі С‚РµР»Р° Р·Р°РїСЂРѕСЃР° СЃ РѕРїС‚РёРјРёР·Р°С†РёРµР№
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

// РџРѕРґРєР»СЋС‡РµРЅРёРµ Рє MongoDB СЃ РѕРїС‚РёРјРёР·Р°С†РёРµР№
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50, // РњР°РєСЃРёРјР°Р»СЊРЅС‹Р№ СЂР°Р·РјРµСЂ РїСѓР»Р° СЃРѕРµРґРёРЅРµРЅРёР№
  minPoolSize: 10, // РњРёРЅРёРјР°Р»СЊРЅС‹Р№ СЂР°Р·РјРµСЂ РїСѓР»Р° СЃРѕРµРґРёРЅРµРЅРёР№
  serverSelectionTimeoutMS: 10000, // РЈРІРµР»РёС‡РёРІР°РµРј С‚Р°Р№РјР°СѓС‚
  socketTimeoutMS: 45000, // РўР°Р№РјР°СѓС‚ СЃРѕРєРµС‚Р°
  bufferCommands: true, // Р’РєР»СЋС‡Р°РµРј Р±СѓС„РµСЂРёР·Р°С†РёСЋ РєРѕРјР°РЅРґ РґР»СЏ СЃС‚Р°Р±РёР»СЊРЅРѕСЃС‚Рё
  // РќР°СЃС‚СЂРѕР№РєРё SSL РґР»СЏ MongoDB Atlas
  ssl: true,
  sslValidate: false, // РћС‚РєР»СЋС‡Р°РµРј РІР°Р»РёРґР°С†РёСЋ SSL РґР»СЏ С‚РµСЃС‚РёСЂРѕРІР°РЅРёСЏ
  retryWrites: true,
  w: 'majority'
};

// Р¤СѓРЅРєС†РёСЏ РёРЅРёС†РёР°Р»РёР·Р°С†РёРё РїСЂРёР»РѕР¶РµРЅРёСЏ
function registerRoutes() {
  app.use('/api', apiRoutes);

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

  app.use((error, req, res, next) => {
    console.error('Ошибка сервера:', error);

    if (process.env.NODE_ENV == 'development') {
      res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: error.message,
        stack: error.stack
      });
    } else {
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
  });
}

async function initializeApp() {
  registerRoutes();

  app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
  });

  try {
    await mongoose.connect(process.env.MONGODB_URI, mongoOptions);
    console.log('Подключение к MongoDB установлено');
    const poolSize = mongoose.connection.pool?.size || 'неизвестно';
    console.log(`Пул соединений: ${poolSize} активных соединений`);
  } catch (error) {
    console.error('Ошибка подключения к MongoDB (сервер продолжит работу):', error);
  }
}initializeApp(); 
