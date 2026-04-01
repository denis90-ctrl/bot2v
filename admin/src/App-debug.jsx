import React, { useState, useEffect } from 'react';
import { apiServiceFast } from './services/api-fast';
import { Bot } from 'lucide-react';

function AppDebug() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        console.log('🔄 Загружаем пользователей...');
        const data = await apiServiceFast.getUsers();
        console.log('✅ Получены пользователи:', data);
        setUsers(data.users || data || []);
      } catch (err) {
        console.error('❌ Ошибка загрузки:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Заголовок */}
      <header className="bg-gray-800 px-4 py-3 shadow-sm border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">INTURU Admin (DEBUG)</h1>
            <p className="text-xs text-gray-300">Отладка загрузки пользователей</p>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="text-white">🔄 Загрузка пользователей...</div>
        ) : error ? (
          <div className="text-red-400">❌ Ошибка: {error}</div>
        ) : (
          <div>
            <h2 className="text-white text-lg mb-4">
              Пользователи ({users.length}):
            </h2>
            <div className="space-y-2">
              {users.map((user, index) => (
                <div key={user._id || index} className="bg-gray-800 p-3 rounded text-white">
                  <div>ID: {user.telegramId}</div>
                  <div>Имя: {user.firstName || 'Нет имени'}</div>
                  <div>Username: {user.username || 'Нет username'}</div>
                  <div>Активен: {user.isActive ? 'Да' : 'Нет'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppDebug; 