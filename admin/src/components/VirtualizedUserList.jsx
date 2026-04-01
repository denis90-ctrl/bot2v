import React, { memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { User } from 'lucide-react';
import UserStatus from './UserStatus';

// Мемоизированная карточка пользователя
const UserCard = memo(({ user, isSelected, onSelect }) => {
  const formatLastMessage = (date) => {
    if (!date) return 'Нет сообщений';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(messageDate, 'HH:mm', { locale: ru });
    } else if (diffInHours < 168) {
      return format(messageDate, 'EEEE', { locale: ru });
    } else {
      return format(messageDate, 'dd.MM.yyyy', { locale: ru });
    }
  };

  const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.username) {
      return `@${user.username}`;
    } else {
      return `ID: ${user.telegramId}`;
    }
  };

  return (
    <div
      onClick={() => onSelect(user)}
      className={`bg-cyan-900/30 rounded-lg border-2 cursor-pointer user-card transition-all duration-200 ${
        isSelected 
          ? 'selected border-cyan-400 bg-cyan-800/40 shadow-cyan-400/20' 
          : 'border-cyan-700 hover:border-cyan-600'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(user);
        }
      }}
      aria-label={`Выбрать пользователя ${getUserDisplayName(user)}`}
    >
      <div className="p-4">
        {/* Заголовок карточки */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isSelected ? 'bg-cyan-500' : 'bg-cyan-700'
            }`}>
              <User size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {getUserDisplayName(user)}
              </h3>
              <UserStatus 
                isOnline={user.isOnline} 
                lastSeen={user.lastSeen} 
              />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
              {formatLastMessage(user.lastMessageAt)}
            </span>
          </div>
        </div>

        {/* Информация о пользователе */}
        <div className="space-y-2">
          {user.username && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Username:</span>
              <span className="text-xs text-cyan-300 font-medium">
                @{user.username}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Telegram ID:</span>
            <span className="text-xs text-gray-300 font-mono">
              {user.telegramId}
            </span>
          </div>
          
          {(user.firstName || user.lastName) && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Имя:</span>
              <span className="text-xs text-gray-300">
                {user.firstName || ''} {user.lastName || ''}
              </span>
            </div>
          )}
          
          {user.lastMessageAt && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Последнее сообщение:</span>
              <span className="text-xs text-gray-300">
                {formatLastMessage(user.lastMessageAt)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

UserCard.displayName = 'UserCard';

// Компонент строки для виртуализации
const UserRow = memo(({ index, style, data }) => {
  const { users, selectedUser, onUserSelect } = data;
  const user = users[index];
  
  return (
    <div style={style} className="px-3 py-1">
      <UserCard
        user={user}
        isSelected={selectedUser?.telegramId === user.telegramId}
        onSelect={onUserSelect}
      />
    </div>
  );
});

UserRow.displayName = 'UserRow';

// Основной компонент виртуализированного списка
const VirtualizedUserList = ({ users, selectedUser, onUserSelect, loading, height = 600 }) => {
  const itemSize = 180; // Высота карточки пользователя
  
  const itemData = useCallback(() => ({
    users,
    selectedUser,
    onUserSelect
  }), [users, selectedUser, onUserSelect]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
          <User size={24} className="text-gray-500" />
        </div>
        <p className="text-base font-medium mb-1">Нет пользователей</p>
        <p className="text-sm text-gray-500 text-center">Пользователи появятся после отправки сообщений боту</p>
      </div>
    );
  }

  return (
    <List
      height={height}
      itemCount={users.length}
      itemSize={itemSize}
      itemData={itemData()}
      overscanCount={3}
      className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
    >
      {UserRow}
    </List>
  );
};

export default memo(VirtualizedUserList); 