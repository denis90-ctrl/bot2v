import React from 'react';

const UserStatus = ({ isOnline, lastSeen }) => {
  if (isOnline) {
    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
        <span className="text-xs text-purple-400">онлайн</span>
      </div>
    );
  }

  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    let statusText = '';
    if (diffInMinutes < 1) {
      statusText = 'только что';
    } else if (diffInMinutes < 60) {
      statusText = `${diffInMinutes} мин назад`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      statusText = `${hours} ч назад`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      statusText = `${days} дн назад`;
    }

    return (
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span className="text-xs text-gray-500">{statusText}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-xs text-gray-500">давно</span>
    </div>
  );
};

export default UserStatus; 