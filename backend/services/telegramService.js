const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/User');
const Message = require('../models/Message');

class TelegramService {
  constructor() {
    console.log('🔧 Инициализация Telegram бота...');
    console.log('🔑 Токен бота:', process.env.TELEGRAM_BOT_TOKEN ? 'Найден' : 'НЕ НАЙДЕН');
    
    // Кэш для пользователей
    this.userCache = new Map();
    this.CACHE_TTL = 10 * 60 * 1000; // 10 минут
    
    try {
      // Webhook-режим: без polling, обновления приходят через /api/webhook
      this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { 
        polling: false
      });
      
      // Обработчик входящих сообщений с оптимизацией
      this.bot.on('message', async (message) => {
        try {
          console.log('📨 Получено сообщение:', message.text?.substring(0, 50) + '...');
          await this.saveIncomingMessage({ message });
        } catch (error) {
          console.error('❌ Ошибка обработки сообщения:', error);
        }
      });

      // Обработчик ошибок
      this.bot.on('error', (error) => {
        console.error('❌ Ошибка Telegram бота:', error);
      });

      console.log('✅ Telegram бот инициализирован');
    } catch (error) {
      console.error('❌ Ошибка инициализации Telegram бота:', error);
    }
  }

  // Кэширование пользователей
  async getCachedUser(telegramId) {
    const cached = this.userCache.get(telegramId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.user;
    }
    
    const user = await User.findOne({ telegramId }).lean();
    if (user) {
      this.userCache.set(telegramId, { user, timestamp: Date.now() });
    }
    return user;
  }

  // Сохранение входящего сообщения с оптимизацией
  // Обработка update для webhook-режима
  processUpdate(update) {
    try {
      if (!update) return;
      if (this.bot && typeof this.bot.processUpdate === 'function') {
        this.bot.processUpdate(update);
      } else {
        this.saveIncomingMessage(update).catch((err) =>
          console.error('Ошибка сохранения update:', err)
        );
      }
    } catch (error) {
      console.error('Ошибка processUpdate:', error);
    }
  }
  async saveIncomingMessage(update) {
    try {
      const { message } = update;
      if (!message) return;

      const telegramId = message.from.id.toString();
      const messageId = message.message_id.toString();

      // Проверяем кэш пользователя
      let user = await this.getCachedUser(telegramId);
      
      if (!user) {
        // Сохраняем или обновляем пользователя
        user = await User.findOneAndUpdate(
          { telegramId },
          {
            telegramId,
            username: message.from.username,
            firstName: message.from.first_name,
            lastName: message.from.last_name,
            lastMessageAt: new Date(),
            isActive: true
          },
          { upsert: true, new: true, lean: true }
        );
        
        // Обновляем кэш
        this.userCache.set(telegramId, { user, timestamp: Date.now() });
      } else {
        // Обновляем lastMessageAt в фоне
        User.updateOne(
          { telegramId },
          { lastMessageAt: new Date() }
        ).catch(err => console.error('Ошибка обновления lastMessageAt:', err));
      }

      // Определяем тип сообщения и извлекаем данные
      let messageType = 'text';
      let text = message.text || '';
      let attachments = [];

      if (message.photo && message.photo.length > 0) {
        messageType = 'photo';
        const photo = message.photo[message.photo.length - 1];
        attachments.push({
          fileId: photo.file_id,
          filename: `photo_${messageId}.jpg`,
          size: photo.file_size,
          type: 'photo',
          mimeType: 'image/jpeg'
        });
        text = message.caption || text;
      } else if (message.document) {
        messageType = 'document';
        attachments.push({
          fileId: message.document.file_id,
          filename: message.document.file_name || `document_${messageId}`,
          size: message.document.file_size,
          type: 'document',
          mimeType: message.document.mime_type
        });
        text = message.caption || text;
      } else if (message.video) {
        messageType = 'video';
        attachments.push({
          fileId: message.video.file_id,
          filename: message.video.file_name || `video_${messageId}.mp4`,
          size: message.video.file_size,
          type: 'video',
          mimeType: message.video.mime_type
        });
        text = message.caption || text;
      } else if (message.audio) {
        messageType = 'voice';
        attachments.push({
          fileId: message.audio.file_id,
          filename: message.audio.file_name || `audio_${messageId}.mp3`,
          size: message.audio.file_size,
          type: 'voice',
          mimeType: message.audio.mime_type
        });
        text = message.caption || text;
      }

      // Сохраняем сообщение с оптимизацией
      const messageDoc = new Message({
        telegramId,
        messageId,
        text,
        fromBot: false,
        timestamp: new Date(message.date * 1000),
        messageType,
        attachments
      });

      await messageDoc.save();

      console.log(`✅ Сообщение от ${telegramId} сохранено (ID: ${messageId})`);
    } catch (error) {
      console.error('❌ Ошибка сохранения входящего сообщения:', error);
      // Не выбрасываем ошибку, чтобы не прерывать обработку других сообщений
    }
  }

  // Отправка сообщения пользователю с оптимизацией
  async sendMessage(telegramId, text, options = {}) {
    try {
      const message = await this.bot.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        ...options
      });

      // Сохраняем отправленное сообщение в фоне
      Message.create({
        telegramId,
        messageId: message.message_id.toString(),
        text,
        fromBot: true,
        timestamp: new Date(),
        messageType: 'text'
      }).catch(err => console.error('Ошибка сохранения отправленного сообщения:', err));

      return message;
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      throw error;
    }
  }

  // Отправка файла пользователю с оптимизацией
  async sendFile(telegramId, file, caption = '') {
    try {
      // Добавляем информацию о файле
      file.name = file.originalname;
      file.type = file.mimetype;
      
      let message;
      
      if (file.type.startsWith('image/')) {
        message = await this.bot.sendPhoto(telegramId, file.buffer, {
          caption,
          parse_mode: 'HTML'
        });
      } else if (file.type === 'application/pdf') {
        message = await this.bot.sendDocument(telegramId, file.buffer, {
          caption,
          parse_mode: 'HTML'
        });
      } else if (file.type.startsWith('video/')) {
        message = await this.bot.sendVideo(telegramId, file.buffer, {
          caption,
          parse_mode: 'HTML'
        });
      } else if (file.type.startsWith('audio/')) {
        message = await this.bot.sendAudio(telegramId, file.buffer, {
          caption,
          parse_mode: 'HTML'
        });
      } else {
        message = await this.bot.sendDocument(telegramId, file.buffer, {
          caption,
          parse_mode: 'HTML'
        });
      }

      let fileId = null;
      if (message.photo && message.photo.length > 0) {
        fileId = message.photo[0].file_id;
      } else if (message.document) {
        fileId = message.document.file_id;
      } else if (message.video) {
        fileId = message.video.file_id;
      } else if (message.audio) {
        fileId = message.audio.file_id;
      }

      const messageData = {
        telegramId,
        messageId: message.message_id.toString(),
        text: caption || `Файл: ${file.name}`,
        fromBot: true,
        timestamp: new Date(),
        messageType: this.getFileType(file.type),
        attachments: []
      };

      if (fileId && typeof fileId === 'string' && fileId.trim()) {
        const attachment = {
          fileId: fileId.trim(),
          filename: file.name || 'unknown',
          size: file.size || 0,
          type: this.getFileType(file.type),
          mimeType: file.type || 'application/octet-stream'
        };
        messageData.attachments = [attachment];
      }

      // Сохраняем в фоне
      Message.create(messageData).catch(err => 
        console.error('Ошибка сохранения отправленного файла:', err)
      );

      return messageData;
    } catch (error) {
      console.error('❌ Ошибка отправки файла:', error);
      throw error;
    }
  }

  // Определение типа файла для сохранения в БД
  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'photo';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'voice';
    if (mimeType === 'application/pdf') return 'document';
    return 'document';
  }

  // Получение информации о пользователе с кэшированием
  async getUserInfo(telegramId) {
    try {
      // Сначала проверяем кэш
      const cachedUser = await this.getCachedUser(telegramId);
      if (cachedUser) {
        return cachedUser;
      }

      // Если нет в кэше, получаем из Telegram API
      const chat = await this.bot.getChat(telegramId);
      return chat;
    } catch (error) {
      console.error('❌ Ошибка получения информации о пользователе:', error);
      return null;
    }
  }

  // Редактирование сообщения в Telegram
  async editMessage(telegramId, messageId, newText, options = {}) {
    try {
      const result = await this.bot.editMessageText(newText, {
        chat_id: telegramId,
        message_id: messageId,
        parse_mode: 'HTML',
        ...options
      });
      console.log(`✅ Сообщение ${messageId} отредактировано в Telegram`);
      return result;
    } catch (error) {
      console.error('❌ Ошибка редактирования сообщения в Telegram:', error);
      throw error;
    }
  }

  // Удаление сообщения в Telegram
  async deleteMessage(telegramId, messageId) {
    try {
      const result = await this.bot.deleteMessage(telegramId, messageId);
      console.log(`✅ Сообщение ${messageId} удалено из Telegram`);
      return result;
    } catch (error) {
      console.error('❌ Ошибка удаления сообщения из Telegram:', error);
      throw error;
    }
  }

  // Получение информации о файле из Telegram
  async getFile(fileId) {
    try {
      const fileInfo = await this.bot.getFile(fileId);
      return fileInfo;
    } catch (error) {
      console.error('❌ Ошибка получения информации о файле:', error);
      return null;
    }
  }

  // Получение потока файла из Telegram
  async getFileStream(fileId) {
    try {
      const fileInfo = await this.bot.getFile(fileId);
      if (!fileInfo || !fileInfo.file_path) {
        throw new Error('Файл не найден');
      }
      
      const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`;
      
      const axios = require('axios');
      const response = await axios.get(fileUrl, {
        responseType: 'stream',
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Ошибка получения потока файла:', error);
      throw error;
    }
  }

  // Метод для очистки кэша
  clearCache() {
    this.userCache.clear();
    console.log('🧹 Кэш пользователей очищен');
  }

  // Метод для получения статистики
  getStats() {
    return {
      cacheSize: this.userCache.size,
      botStatus: this.bot ? 'active' : 'inactive',
      memoryUsage: process.memoryUsage()
    };
  }
}

module.exports = new TelegramService(); 
