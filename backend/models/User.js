const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    default: null
  },
  firstName: {
    type: String,
    default: null
  },
  lastName: {
    type: String,
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Индексы для оптимизации производительности
userSchema.index({ isActive: 1, lastMessageAt: -1 }); // Для списка активных пользователей
userSchema.index({ telegramId: 1 }); // Для быстрого поиска по telegramId
userSchema.index({ username: 1 }); // Для поиска по username

module.exports = mongoose.model('User', userSchema); 