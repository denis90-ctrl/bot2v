import React, { useEffect, useRef } from 'react';

// Компонент для мониторинга производительности
export const PerformanceMonitor = ({ children }) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current++;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    console.log(`🔄 Render #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    lastRenderTime.current = currentTime;
  });

  return <>{children}</>;
};

// Хук для измерения времени выполнения функций
export const usePerformanceTimer = (name) => {
  const startTime = useRef(null);

  const startTimer = () => {
    startTime.current = performance.now();
  };

  const endTimer = () => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      startTime.current = null;
      return duration;
    }
    return 0;
  };

  return { startTimer, endTimer };
};

// Хук для измерения размера данных
export const useDataSize = (data) => {
  useEffect(() => {
    if (data) {
      const size = new Blob([JSON.stringify(data)]).size;
      console.log(`📊 Data size: ${(size / 1024).toFixed(2)}KB`);
    }
  }, [data]);
};

// Компонент для отображения метрик производительности
export const PerformanceMetrics = ({ users, messages }) => {
  const userCount = users?.length || 0;
  const messageCount = messages?.length || 0;
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs z-50">
      <div className="space-y-1">
        <div>👥 Users: {userCount}</div>
        <div>💬 Messages: {messageCount}</div>
        <div>📊 Total: {userCount + messageCount} items</div>
      </div>
    </div>
  );
}; 