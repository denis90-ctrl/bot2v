const mongoose = require('mongoose');

// Схема для вложений
const attachmentSchema = new mongoose.Schema({
  fileId: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  fromBot: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  messageType: {
    type: String,
    enum: ['text', 'photo', 'document', 'voice', 'video'],
    default: 'text'
  },
  replyTo: {
    type: String,
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  attachments: [attachmentSchema]
}, {
  timestamps: true
});

// Индексы для оптимизации производительности
messageSchema.index({ telegramId: 1, timestamp: -1 }); // Основной индекс для поиска сообщений пользователя
messageSchema.index({ telegramId: 1, messageId: 1 }); // Для уникальности сообщений
messageSchema.index({ timestamp: -1 }); // Для общих запросов по времени
messageSchema.index({ fromBot: 1, timestamp: -1 }); // Для фильтрации сообщений бота
messageSchema.index({ messageType: 1, timestamp: -1 }); // Для фильтрации по типу сообщений

module.exports = mongoose.model('Message', messageSchema); 