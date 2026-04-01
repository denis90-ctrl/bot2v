import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiServiceFast } from '../services/api-fast';

export const useUsersFast = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Фильтрованные пользователи с мемоизацией
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const username = user.username?.toLowerCase() || '';
      const firstName = user.firstName?.toLowerCase() || '';
      const lastName = user.lastName?.toLowerCase() || '';
      const telegramId = user.telegramId?.toString() || '';
      
      return username.includes(query) || 
             firstName.includes(query) || 
             lastName.includes(query) || 
             telegramId.includes(query);
    });
  }, [users, searchQuery]);

  // Быстрая загрузка пользователей
  const loadUsers = useCallback(async (force = false) => {
    try {
      // Проверяем кеш (2 минуты для быстрого режима)
      const now = Date.now();
      const cacheAge = 2 * 60 * 1000;
      
      if (!force && now - lastFetch < cacheAge && users.length > 0) {
        return;
      }

      setLoading(true);
      setError(null);
      
      const usersData = await apiServiceFast.getUsers();
      
      setUsers(usersData.users || usersData || []);
      setLastFetch(now);
      
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [lastFetch, users.length]);

  // Обновление конкретного пользователя
  const updateUser = useCallback((telegramId, updates) => {
    setUsers(prev => 
      prev.map(user => 
        user.telegramId === telegramId 
          ? { ...user, ...updates }
          : user
      )
    );
  }, []);

  // Debounced поиск
  const debouncedSearch = useCallback((query) => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(query);
    }, 200); // Уменьшаем задержку для быстрого режима

    return () => clearTimeout(timeoutId);
  }, []);

  // Автоматическое обновление
  useEffect(() => {
    loadUsers();
    
    const interval = setInterval(() => {
      loadUsers();
    }, 15000); // 15 секунд для быстрого режима

    return () => clearInterval(interval);
  }, [loadUsers]);

  return {
    users: filteredUsers,
    loading,
    error,
    loadUsers,
    updateUser,
    setSearchQuery: debouncedSearch,
    searchQuery
  };
}; 