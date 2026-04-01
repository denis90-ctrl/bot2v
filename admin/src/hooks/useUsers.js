import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import { usePerformanceTimer } from '../components/PerformanceMonitor';

export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Кеш для пользователей
  const usersCache = useMemo(() => new Map(), []);
  
  // Таймер для производительности
  const { startTimer, endTimer } = usePerformanceTimer('loadUsers');

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

  // Загрузка пользователей с кешированием
  const loadUsers = useCallback(async (force = false) => {
    try {
      startTimer();
      
      // Проверяем кеш (5 минут)
      const now = Date.now();
      const cacheAge = 5 * 60 * 1000;
      
      if (!force && now - lastFetch < cacheAge && users.length > 0) {
        endTimer();
        return;
      }

      setLoading(true);
      setError(null);
      
      const usersData = await apiService.getUsers();
      
      // Обновляем кеш
      usersData.forEach(user => {
        usersCache.set(user.telegramId, user);
      });
      
      setUsers(usersData);
      setLastFetch(now);
      
      endTimer();
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
      setError('Ошибка загрузки пользователей');
      endTimer();
    } finally {
      setLoading(false);
    }
  }, [lastFetch, users.length, usersCache]);

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
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  // Автоматическое обновление
  useEffect(() => {
    loadUsers();
    
    const interval = setInterval(() => {
      loadUsers();
    }, 30000); // 30 секунд

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