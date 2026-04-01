import React from 'react';
import { User } from 'lucide-react';

const SimpleUserList = ({ users, selectedUser, onUserSelect, loading }) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Загрузка пользователей...</div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Нет пользователей</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-white text-lg mb-4">Пользователи ({users.length})</h3>
      {users.map((user, index) => (
        <div
          key={user._id || index}
          onClick={() => onUserSelect(user)}
          className={`p-3 rounded cursor-pointer transition-all ${
            selectedUser?.telegramId === user.telegramId
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-300" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{getUserDisplayName(user)}</div>
              <div className="text-sm text-gray-400">
                ID: {user.telegramId}
              </div>
              {user.username && (
                <div className="text-sm text-blue-400">
                  @{user.username}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimpleUserList; 