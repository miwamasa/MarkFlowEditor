import React, { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Auto close after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 300); // Wait for animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const getToastStyles = () => {
    const base = "transform transition-all duration-300 ease-in-out";
    const visible = isVisible 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    switch (type) {
      case 'success':
        return `${base} ${visible} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${base} ${visible} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${base} ${visible} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${base} ${visible} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${base} ${visible} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  };

  return (
    <div className={`${getToastStyles()} max-w-sm w-full border rounded-lg shadow-lg p-4 mb-3`}>
      <div className="flex items-start">
        <div className="mr-3 text-lg">{getIcon()}</div>
        <div className="flex-1">
          <div className="font-medium text-sm">{title}</div>
          {message && (
            <div className="mt-1 text-sm opacity-90">{message}</div>
          )}
        </div>
        <button
          onClick={() => onClose(id)}
          className="ml-3 text-xl opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = crypto.randomUUID();
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: removeToast
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <div className="space-y-2">
          {toasts.map(toast => (
            <div key={toast.id} className="pointer-events-auto">
              <Toast {...toast} />
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};