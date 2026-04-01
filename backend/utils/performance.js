const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');

class PerformanceMonitor {
  constructor() {
    this.stats = {
      startTime: Date.now(),
      requests: 0,
      errors: 0,
      avgResponseTime: 0
    };
  }

  // Получение статистики базы данных
  async getDatabaseStats() {
    try {
      const [userStats, messageStats, connectionStats] = await Promise.all([
        User.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
              avgLastMessageAt: { $avg: { $toDate: '$lastMessageAt' } }
            }
          }
        ]),
        Message.aggregate([
          {
            $group: {
              _id: null,
              totalMessages: { $sum: 1 },
              botMessages: { $sum: { $cond: ['$fromBot', 1, 0] } },
              userMessages: { $sum: { $cond: ['$fromBot', 0, 1] } },
              avgMessageLength: { $avg: { $strLenCP: '$text' } }
            }
          }
        ]),
        this.getConnectionStats()
      ]);

      return {
        users: userStats[0] || { totalUsers: 0, activeUsers: 0, avgLastMessageAt: null },
        messages: messageStats[0] || { totalMessages: 0, botMessages: 0, userMessages: 0, avgMessageLength: 0 },
        connections: connectionStats
      };
    } catch (error) {
      console.error('Ошибка получения статистики БД:', error);
      return null;
    }
  }

  // Получение статистики соединений
  getConnectionStats() {
    const connection = mongoose.connection;
    return {
      readyState: connection.readyState,
      poolSize: connection.pool?.size || 0,
      maxPoolSize: connection.pool?.maxSize || 0,
      availableConnections: connection.pool?.available || 0
    };
  }

  // Получение статистики системы
  getSystemStats() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      uptime: {
        seconds: Math.floor(uptime),
        minutes: Math.floor(uptime / 60),
        hours: Math.floor(uptime / 3600)
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memUsage.external / 1024 / 1024) + 'MB'
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    };
  }

  // Получение статистики производительности
  getPerformanceStats() {
    return {
      ...this.stats,
      avgResponseTime: this.stats.requests > 0 ? this.stats.avgResponseTime / this.stats.requests : 0
    };
  }

  // Обновление статистики запросов
  updateRequestStats(responseTime, isError = false) {
    this.stats.requests++;
    if (isError) this.stats.errors++;
    this.stats.avgResponseTime += responseTime;
  }

  // Получение полной статистики
  async getFullStats() {
    const [dbStats, systemStats, perfStats] = await Promise.all([
      this.getDatabaseStats(),
      Promise.resolve(this.getSystemStats()),
      Promise.resolve(this.getPerformanceStats())
    ]);

    return {
      timestamp: new Date().toISOString(),
      database: dbStats,
      system: systemStats,
      performance: perfStats
    };
  }

  // Проверка здоровья системы
  async healthCheck() {
    try {
      const dbStats = await this.getDatabaseStats();
      const systemStats = this.getSystemStats();
      
      const health = {
        status: 'healthy',
        checks: {
          database: dbStats ? 'connected' : 'disconnected',
          memory: systemStats.memory.heapUsed < 500 ? 'ok' : 'warning', // Предупреждение если больше 500MB
          uptime: systemStats.uptime.hours < 24 ? 'ok' : 'warning' // Предупреждение если работает больше 24 часов
        }
      };

      // Проверяем критические условия
      if (!dbStats) {
        health.status = 'unhealthy';
        health.checks.database = 'error';
      }

      if (systemStats.memory.heapUsed > 1000) { // Критично если больше 1GB
        health.status = 'unhealthy';
        health.checks.memory = 'critical';
      }

      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Очистка старых данных (для оптимизации)
  async cleanupOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Удаляем неактивных пользователей старше 30 дней
      const inactiveUsers = await User.deleteMany({
        isActive: false,
        lastMessageAt: { $lt: thirtyDaysAgo }
      });

      // Удаляем старые сообщения (опционально, можно настроить)
      // const oldMessages = await Message.deleteMany({
      //   timestamp: { $lt: thirtyDaysAgo }
      // });

      return {
        deletedUsers: inactiveUsers.deletedCount,
        // deletedMessages: oldMessages.deletedCount
      };
    } catch (error) {
      console.error('Ошибка очистки данных:', error);
      return { error: error.message };
    }
  }
}

module.exports = new PerformanceMonitor(); 